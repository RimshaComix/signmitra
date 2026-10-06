import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || '';
    const category = searchParams.get('category') || '';
    const provider = searchParams.get('provider') || 'google';

    if (!query.trim()) {
      return NextResponse.json(
        { success: false, error: 'QUERY_REQUIRED', message: 'Search query cannot be empty.', results: [] },
        { status: 400 }
      );
    }

    const pythonBackendUrl = process.env.AI_BACKEND_URL || 'http://127.0.0.1:8000';

    // 1. Try forwarding to Python FastAPI backend
    try {
      const url = new URL(`${pythonBackendUrl}/api/directory/places`);
      url.searchParams.set('query', query.trim());
      if (category && category !== 'All') url.searchParams.set('category', category);
      if (provider) url.searchParams.set('provider', provider);

      const pythonRes = await fetch(url.toString(), {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000)
      });

      if (pythonRes.ok) {
        const data = await pythonRes.json();
        return NextResponse.json(data);
      }
    } catch (e) {
      // Backend unavailable; fallback to direct server-side execution
    }

    // 2. Direct server-side handling (if Python backend is not running)
    const googleKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

    if (provider === 'osm' || (!googleKey && provider !== 'google')) {
      // Direct OSM Nominatim search
      const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query.trim())}&format=json&addressdetails=1&limit=10`;
      const osmRes = await fetch(osmUrl, {
        headers: { 'User-Agent': 'SignMitra-Accessibility-Directory/1.0 (accessibility@signmitra.org)' },
        signal: AbortSignal.timeout(10000)
      });

      if (osmRes.ok) {
        const raw = await osmRes.json();
        const results = raw.map((item) => ({
          place_id: `osm-${item.osm_type || 'node'}-${item.osm_id}`,
          name: item.name || item.display_name.split(',')[0],
          formatted_address: item.display_name,
          category: category || 'Other',
          provider: 'openstreetmap_nominatim',
          latitude: item.lat ? parseFloat(item.lat) : null,
          longitude: item.lon ? parseFloat(item.lon) : null,
          known_accessibility: {
            has_data: false,
            status: 'not_reported',
            message: 'No public accessibility information was found in the sources checked. Please contact the institution to confirm.'
          }
        }));

        return NextResponse.json({
          success: true,
          provider: 'openstreetmap_nominatim',
          configured: true,
          query,
          results_count: results.length,
          results,
          message: results.length > 0 ? 'Results retrieved from OpenStreetMap Nominatim.' : 'No places found matching your query.'
        });
      }
    }

    // If Google is requested and no key configured
    if (!googleKey) {
      return NextResponse.json({
        success: false,
        provider: 'google_places',
        configured: false,
        query,
        results_count: 0,
        results: [],
        error: 'GOOGLE_PLACES_API_KEY_NOT_CONFIGURED',
        message: 'Google Places API key is not configured in server environment.',
        setup_guide: {
          provider: 'Google Places API',
          required_env_variable: 'GOOGLE_PLACES_API_KEY',
          setup_steps: [
            '1. Create a Google Cloud project at https://console.cloud.google.com/',
            '2. Enable the "Places API" (or "Places API (New)") for your project.',
            '3. Generate an API Key under APIs & Services > Credentials.',
            '4. Add GOOGLE_PLACES_API_KEY=<your_api_key> to your server .env file.'
          ],
          open_alternative: 'You can switch provider to OpenStreetMap (no key required), or use manual place entry at any time.',
          manual_entry_available: true
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'PROVIDER_ERROR', message: 'Unable to reach place search services.', results: [] },
      { status: 502 }
    );
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: err.message, results: [] },
      { status: 500 }
    );
  }
}

