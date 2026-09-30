import re
from typing import List, Dict, Any, Tuple
from backend.schemas.recovery import AmbiguityItem, FactItem

class AmbiguityService:
    """
    Linguistic analyzer and provenance tracker for institutional communication.
    Detects relative dates, ambiguous references, and extracts facts with strict provenance.
    """

    RELATIVE_TIME_PATTERNS = [
        (r'\btomorrow\s+morning\b', "tomorrow morning", "Relative time expression: does not specify an exact calendar date or specific counter opening hours."),
        (r'\btomorrow\s+afternoon\b', "tomorrow afternoon", "Relative time expression: does not specify exact opening hours."),
        (r'\btomorrow\b', "tomorrow", "Relative date: depends on the current day and lacks explicit office timings."),
        (r'\bnext\s+week\b', "next week", "Vague time window: does not give an exact date, day, or submission cutoff."),
        (r'\bin\s+a\s+few\s+days\b', "in a few days", "Vague timeframe: does not specify an exact deadline date."),
        (r'\blater\b', "later", "Indefinite time: does not clarify whether today or another date."),
        (r'\bsoon\b', "soon", "Indefinite duration: no exact date or time provided."),
        (r'\bafter\s+lunch\b', "after lunch", "Ambiguous timing: lunch hours vary across offices."),
    ]

    VAGUE_LOCATION_PATTERNS = [
        (r'\bthere\b', "there", "Vague location pronoun: counter, room, or building not specified."),
        (r'\bupstairs\b', "upstairs", "Incomplete location: exact floor or room number missing."),
        (r'\bother\s+building\b', "other building", "Vague location: building name or block not specified."),
        (r'\bnext\s+door\b', "next door", "Vague location: specific room or counter number missing."),
    ]

    LOCATION_EXTRACTION_PATTERNS = [
        r'\b(Counter\s+\d+[A-Z]?)\b',
        r'\b(Room\s+\d+[A-Z]?)\b',
        r'\b(Window\s+\d+)\b',
        r'\b(Desk\s+\d+)\b',
        r'\b(Floor\s+\d+)\b',
        r'\b(Block\s+[A-Z0-9]+)\b',
    ]

    DOCUMENT_EXTRACTION_PATTERNS = [
        r'\b(student\s+ID)\b',
        r'\b(Aadhaar\s+card)\b',
        r'\b(PAN\s+card)\b',
        r'\b(passport)\b',
        r'\b(application\s+form)\b',
        r'\b(fee\s+receipt)\b',
        r'\b(original\s+documents?)\b',
        r'\b(photocopy|xerox)\b',
        r'\b(marksheet)\b',
        r'\b(certificate)\b',
    ]

    def analyze_text(self, text: str) -> Tuple[List[FactItem], List[AmbiguityItem], List[str], List[str]]:
        """
        Analyzes staff reply text for facts, gaps, relative dates, and generates clarification questions.
        """
        facts: List[FactItem] = []
        gaps: List[AmbiguityItem] = []
        relative_dates: List[str] = []
        clarifications: List[str] = []

        lower_text = text.lower()

        # 1. Detect relative time ambiguities
        for pattern, span, explanation in self.RELATIVE_TIME_PATTERNS:
            match = re.search(pattern, lower_text)
            if match:
                quote = text[match.start():match.end()]
                gaps.append(AmbiguityItem(
                    category="relative_time",
                    quote=quote,
                    issue=explanation,
                    suggested_action=f"Ask for the exact calendar date and operating hours corresponding to '{quote}'."
                ))
                relative_dates.append(quote)
                clarifications.append(f"Could you please confirm the exact calendar date and time window when you will be open?")

        # 2. Detect vague location ambiguities
        for pattern, span, explanation in self.VAGUE_LOCATION_PATTERNS:
            match = re.search(pattern, lower_text)
            if match:
                quote = text[match.start():match.end()]
                gaps.append(AmbiguityItem(
                    category="vague_location",
                    quote=quote,
                    issue=explanation,
                    suggested_action=f"Ask for the specific counter or room number instead of '{quote}'."
                ))
                clarifications.append("Could you please write down the exact room number or counter I should visit?")

        # 3. Extract Locations (Provenance: AI-extracted, Status: Unresolved)
        found_locations = set()
        for pat in self.LOCATION_EXTRACTION_PATTERNS:
            for m in re.finditer(pat, text, re.IGNORECASE):
                val = m.group(1)
                if val.lower() not in found_locations:
                    found_locations.add(val.lower())
                    facts.append(FactItem(
                        field="Location/Counter",
                        value=val,
                        provenance="AI-extracted",
                        status="Unresolved" # Strict provenance: must NOT be labelled User-Confirmed
                    ))

        # 4. Extract Documents (Provenance: AI-extracted, Status: Unresolved)
        found_docs = set()
        for pat in self.DOCUMENT_EXTRACTION_PATTERNS:
            for m in re.finditer(pat, text, re.IGNORECASE):
                val = m.group(1)
                if val.lower() not in found_docs:
                    found_docs.add(val.lower())
                    facts.append(FactItem(
                        field="Required Document",
                        value=val,
                        provenance="AI-extracted",
                        status="Unresolved" # Strict provenance
                    ))

        # 5. Extract Actions
        action_match = re.search(r'\b(return|submit|bring|visit|pay|fill|collect)\b[^.!?]*', text, re.IGNORECASE)
        if action_match:
            action_text = action_match.group(0).strip()
            facts.append(FactItem(
                field="Action Required",
                value=action_text,
                provenance="AI-extracted",
                status="Unresolved"
            ))

        # Ensure we offer document clarification if none explicitly identified
        if not found_docs and "missing" in lower_text:
            gaps.append(AmbiguityItem(
                category="document_missing",
                quote="missing",
                issue="The response mentions missing documents without listing which ones.",
                suggested_action="Ask staff to list the specific missing documents required."
            ))
            clarifications.append("Which specific missing documents or forms do I need to bring?")

        # Deduplicate clarifications
        unique_clarifications = list(dict.fromkeys(clarifications))

        return facts, gaps, relative_dates, unique_clarifications

ambiguity_service = AmbiguityService()
