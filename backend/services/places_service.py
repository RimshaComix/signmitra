import os
import re
import logging
from typing import Optional, List, Dict, Any
import httpx
from sqlalchemy.orm import Session

from backend.config import settings
from backend.models.directory import DirectoryModel
from backend.schemas.directory import (
    PlaceSearchResultItem,
    PlaceSearchResponse
)

logger = logging.getLogger("signmitra.places")

# Mapping of OSM/Google types to SignMitra domain categories
CATEGORY_KEYWORDS = {
    "Healthcare": ["hospital", "clinic", "doctor", "health", "pharmacy", "dentist", "medical", "opd", "dispensary"],
    "Banking": ["bank", "atm", "finance", "post_office", "credit_union", "insurance"],
    "Education": ["school", "university", "college", "library", "academy", "polytechnic", "institute"],
    "Government": ["courthouse", "local_government_office", "police", "city_hall", "collectorate", "municipality", "taluk", "rto"],
    "Transport": ["transit_station", "bus_station", "train_station", "subway_station", "railway", "airport", "metro", "terminus"]
}

def infer_category_from_text_or_types(name: str, types: List[str] = None) -> str:
    combined = (name + " " + " ".join(types or [])).lower()
    for cat, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in combined for kw in keywords):
            return cat
    return "Other"


class PlacesService:
    """
    Server-side Places Search Provider.
    Supports Google Places API (primary) and OpenStreetMap Nominatim (open fallback).
    Protects private credentials from client exposure.
    """

    GOOGLE_PLACES_NEW_ENDPOINT = "https://places.googleapis.com/v1/places:searchText"
    GOOGLE_PLACES_LEGACY_ENDPOINT = "https://maps.googleapis.com/maps/api/place/textsearch/json"
    OSM_NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search"

    @property
    def google_api_key(self) -> Optional[str]:
        return (
            getattr(settings, "GOOGLE_PLACES_API_KEY", None) or
            getattr(settings, "GOOGLE_MAPS_API_KEY", None) or
            os.getenv("GOOGLE_PLACES_API_KEY") or
            os.getenv("GOOGLE_MAPS_API_KEY")
        )

    def is_google_configured(self) -> bool:
        key = self.google_api_key
        return bool(key and len(key.strip()) > 5)

    def find_known_accessibility(self, db: Optional[Session], name: str, address: str = "") -> Dict[str, Any]:
        """
        Queries verified accessibility database for records matching the place name or address.
        Honestly marks status as not_reported if no source data exists.
        """
        if not db:
            return {
                "has_data": False,
                "status": "not_reported",
                "message": "No public accessibility information was found in the sources checked. Please contact the institution to confirm."
            }

        try:
            clean_name = re.sub(r'[^\w\s]', '', name).strip().lower()
            tokens = [t for t in clean_name.split() if len(t) > 3]

            query = db.query(DirectoryModel)
            records = query.all()

            for rec in records:
                rec_name = rec.name.lower()
                # Check for significant token overlap or substring match
                if rec_name in clean_name or clean_name in rec_name:
                    return {
                        "has_data": True,
                        "status": "found_in_source" if rec.verified_status == "verified" else "community_reported",
                        "verification_status": rec.verified_status,
                        "source": rec.verified_by or "SignMitra Accessibility Field Audit",
                        "wheelchair_accessible": rec.wheelchair_accessible,
                        "sign_assistance_desk": rec.sign_assistance_desk,
                        "token_display_system": rec.token_display_system,
                        "written_communication_desk": rec.written_communication_desk,
                        "notes": rec.notes or "Documented in accessibility registry.",
                        "phone": rec.contact_phone or ""
                    }
                if any(t in rec_name for t in tokens if len(tokens) >= 2):
                    return {
                        "has_data": True,
                        "status": "needs_confirmation",
                        "verification_status": rec.verified_status,
                        "source": rec.verified_by or "SignMitra Field Audit",
                        "wheelchair_accessible": rec.wheelchair_accessible,
                        "sign_assistance_desk": rec.sign_assistance_desk,
                        "token_display_system": rec.token_display_system,
                        "written_communication_desk": rec.written_communication_desk,
                        "notes": rec.notes or "Similar facility matched; confirm for this specific building/counter.",
                        "phone": rec.contact_phone or ""
                    }
        except Exception as e:
            logger.warning("Error checking known accessibility in DB: %s", str(e))

        return {
            "has_data": False,
            "status": "not_reported",
            "message": "No public accessibility information was found in the sources checked. Please contact the institution to confirm."
        }

    async def search_osm_nominatim(
        self,
        query: str,
        category: Optional[str] = None,
        db: Optional[Session] = None
    ) -> PlaceSearchResponse:
        """
        Executes search via OpenStreetMap Nominatim.
        """
        clean_query = query.strip()[:200]
        params = {
            "q": clean_query,
            "format": "json",
            "addressdetails": 1,
            "limit": 10
        }
        headers = {
            "User-Agent": "SignMitra-Accessibility-Directory/1.0 (accessibility@signmitra.org)"
        }

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.get(self.OSM_NOMINATIM_ENDPOINT, params=params, headers=headers)
                if res.status_code != 200:
                    return PlaceSearchResponse(
                        success=False,
                        provider="openstreetmap_nominatim",
                        configured=True,
                        query=clean_query,
                        results_count=0,
                        results=[],
                        error="OSM_HTTP_ERROR",
                        message=f"OpenStreetMap service responded with HTTP {res.status_code}."
                    )
                
                raw_items = res.json()
                results = []
                for item in raw_items:
                    display_name = item.get("display_name", "")
                    place_name = item.get("name") or display_name.split(",")[0]
                    osm_type = item.get("type", "")
                    osm_class = item.get("class", "")
                    inferred_cat = infer_category_from_text_or_types(place_name, [osm_type, osm_class])

                    if category and category.lower() != "all" and inferred_cat.lower() != category.lower():
                        continue

                    accessibility = self.find_known_accessibility(db, place_name, display_name)

                    results.append(
                        PlaceSearchResultItem(
                            place_id=f"osm-{item.get('osm_type', 'node')}-{item.get('osm_id', '')}",
                            name=place_name,
                            formatted_address=display_name,
                            category=inferred_cat,
                            provider="openstreetmap_nominatim",
                            latitude=float(item.get("lat", 0)) if item.get("lat") else None,
                            longitude=float(item.get("lon", 0)) if item.get("lon") else None,
                            raw_types=[osm_type, osm_class],
                            known_accessibility=accessibility
                        )
                    )

                return PlaceSearchResponse(
                    success=True,
                    provider="openstreetmap_nominatim",
                    configured=True,
                    query=clean_query,
                    results_count=len(results),
                    results=results,
                    message="Results retrieved from OpenStreetMap Nominatim." if results else "No places found matching your query."
                )

        except httpx.TimeoutException:
            return PlaceSearchResponse(
                success=False,
                provider="openstreetmap_nominatim",
                configured=True,
                query=clean_query,
                results_count=0,
                results=[],
                error="TIMEOUT",
                message="OpenStreetMap request timed out. Please check network connectivity or try again."
            )
        except Exception as e:
            return PlaceSearchResponse(
                success=False,
                provider="openstreetmap_nominatim",
                configured=True,
                query=clean_query,
                results_count=0,
                results=[],
                error="NETWORK_ERROR",
                message=f"Place search network error: {str(e)}"
            )

    async def search_google_places(
        self,
        query: str,
        category: Optional[str] = None,
        db: Optional[Session] = None
    ) -> PlaceSearchResponse:
        """
        Executes place search using configured Google Places API.
        If credentials are not configured, returns explicit unconfigured state.
        """
        clean_query = query.strip()[:200]

        if not self.is_google_configured():
            return PlaceSearchResponse(
                success=False,
                provider="google_places",
                configured=False,
                query=clean_query,
                results_count=0,
                results=[],
                error="GOOGLE_PLACES_API_KEY_NOT_CONFIGURED",
                message="Google Places API key is not configured in the server environment.",
                setup_guide={
                    "provider": "Google Places API",
                    "required_env_variable": "GOOGLE_PLACES_API_KEY",
                    "setup_steps": [
                        "1. Create a Google Cloud project at https://console.cloud.google.com/",
                        "2. Enable the 'Places API' (or 'Places API (New)') for your project.",
                        "3. Generate an API Key under APIs & Services > Credentials.",
                        "4. Add GOOGLE_PLACES_API_KEY=<your_api_key> to your server .env file."
                    ],
                    "open_alternative": "You can switch search provider to OpenStreetMap (no key required), or use manual place entry at any time.",
                    "manual_entry_available": True
                }
            )

        api_key = self.google_api_key.strip()

        # Try New Places API v1 (text search)
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.types,places.location"
        }
        payload = {"textQuery": clean_query}

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(self.GOOGLE_PLACES_NEW_ENDPOINT, headers=headers, json=payload)
                
                # If New API fails with 404 or unsupported fieldmask, attempt legacy TextSearch
                if res.status_code == 404 or res.status_code == 400:
                    legacy_params = {"query": clean_query, "key": api_key}
                    res = await client.get(self.GOOGLE_PLACES_LEGACY_ENDPOINT, params=legacy_params)
                    if res.status_code != 200:
                        err_text = res.text
                        return PlaceSearchResponse(
                            success=False,
                            provider="google_places",
                            configured=True,
                            query=clean_query,
                            results_count=0,
                            results=[],
                            error=f"GOOGLE_API_ERROR_{res.status_code}",
                            message="Google Places API returned an error. Please verify billing and enabled APIs in Google Cloud Console."
                        )
                    data = res.json()
                    raw_places = data.get("results", [])
                    results = []
                    for p in raw_places:
                        p_name = p.get("name", "")
                        p_addr = p.get("formatted_address", "")
                        p_types = p.get("types", [])
                        inferred_cat = infer_category_from_text_or_types(p_name, p_types)
                        if category and category.lower() != "all" and inferred_cat.lower() != category.lower():
                            continue
                        loc = p.get("geometry", {}).get("location", {})
                        accessibility = self.find_known_accessibility(db, p_name, p_addr)
                        results.append(
                            PlaceSearchResultItem(
                                place_id=p.get("place_id", ""),
                                name=p_name,
                                formatted_address=p_addr,
                                category=inferred_cat,
                                provider="google_places",
                                latitude=loc.get("lat"),
                                longitude=loc.get("lng"),
                                raw_types=p_types,
                                known_accessibility=accessibility
                            )
                        )
                    return PlaceSearchResponse(
                        success=True,
                        provider="google_places",
                        configured=True,
                        query=clean_query,
                        results_count=len(results),
                        results=results,
                        message="Results retrieved from Google Places API." if results else "No places found matching your query."
                    )

                if res.status_code != 200:
                    return PlaceSearchResponse(
                        success=False,
                        provider="google_places",
                        configured=True,
                        query=clean_query,
                        results_count=0,
                        results=[],
                        error=f"GOOGLE_API_ERROR_{res.status_code}",
                        message=f"Google Places API request failed ({res.status_code}). Verify your key and billing status."
                    )

                data = res.json()
                raw_places = data.get("places", [])
                results = []
                for p in raw_places:
                    disp = p.get("displayName", {})
                    p_name = disp.get("text", "") if isinstance(disp, dict) else str(disp)
                    p_addr = p.get("formattedAddress", "")
                    p_types = p.get("types", [])
                    inferred_cat = infer_category_from_text_or_types(p_name, p_types)
                    if category and category.lower() != "all" and inferred_cat.lower() != category.lower():
                        continue
                    loc = p.get("location", {})
                    accessibility = self.find_known_accessibility(db, p_name, p_addr)
                    results.append(
                        PlaceSearchResultItem(
                            place_id=p.get("id", ""),
                            name=p_name,
                            formatted_address=p_addr,
                            category=inferred_cat,
                            provider="google_places",
                            latitude=loc.get("latitude"),
                            longitude=loc.get("longitude"),
                            raw_types=p_types,
                            known_accessibility=accessibility
                        )
                    )

                return PlaceSearchResponse(
                    success=True,
                    provider="google_places",
                    configured=True,
                    query=clean_query,
                    results_count=len(results),
                    results=results,
                    message="Results retrieved from Google Places API." if results else "No places found matching your query."
                )

        except httpx.TimeoutException:
            return PlaceSearchResponse(
                success=False,
                provider="google_places",
                configured=True,
                query=clean_query,
                results_count=0,
                results=[],
                error="TIMEOUT",
                message="Google Places API request timed out."
            )
        except Exception as e:
            return PlaceSearchResponse(
                success=False,
                provider="google_places",
                configured=True,
                query=clean_query,
                results_count=0,
                results=[],
                error="NETWORK_ERROR",
                message=f"Place search network error: {str(e)}"
            )

    async def search(
        self,
        query: str,
        category: Optional[str] = None,
        provider: Optional[str] = None,
        db: Optional[Session] = None
    ) -> PlaceSearchResponse:
        """
        Main entrypoint.
        Routes to requested provider ('google' or 'osm').
        """
        chosen_provider = (provider or getattr(settings, "PLACES_PROVIDER", "google")).lower().strip()

        if chosen_provider in ("osm", "nominatim", "openstreetmap"):
            return await self.search_osm_nominatim(query, category=category, db=db)
        
        # Default is Google Places
        return await self.search_google_places(query, category=category, db=db)


places_service = PlacesService()

