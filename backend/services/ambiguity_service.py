import re
from typing import List, Tuple

from backend.schemas.recovery import AmbiguityItem, FactItem


class AmbiguityService:
    """
    Deterministic linguistic analyzer and provenance tracker for
    institutional communication.

    Responsibilities:
    - Extract explicit locations
    - Extract explicit documents
    - Extract explicit deadlines/date-time expressions
    - Extract required actions
    - Detect ambiguous locations
    - Detect unspecified documents
    - Detect missing/relative deadlines
    - Generate clarification questions
    """

    # ============================================================
    # RELATIVE / VAGUE TIME
    # ============================================================

    RELATIVE_TIME_PATTERNS = [
        (
            r"\btomorrow\s+morning\b",
            "Relative time expression: does not specify an exact calendar date or specific counter opening hours.",
        ),
        (
            r"\btomorrow\s+afternoon\b",
            "Relative time expression: does not specify an exact calendar date or specific office hours.",
        ),
        (
            r"\btomorrow\b",
            "Relative date: depends on the current day and lacks an explicit calendar date.",
        ),
        (
            r"\bnext\s+week\b",
            "Vague time window: does not give an exact date, day, or submission cutoff.",
        ),
        (
            r"\bin\s+a\s+few\s+days\b",
            "Vague timeframe: does not specify an exact deadline date.",
        ),
        (
            r"\blater\b",
            "Indefinite time: does not clarify whether this means today or another date.",
        ),
        (
            r"\bsoon\b",
            "Indefinite duration: no exact date or time is provided.",
        ),
        (
            r"\bafter\s+lunch\b",
            "Ambiguous timing: lunch hours vary across offices.",
        ),
    ]

    # ============================================================
    # AMBIGUOUS LOCATION
    # ============================================================

    VAGUE_LOCATION_PATTERNS = [
        (
            r"\bthere\b",
            "Vague location pronoun: counter, room, or building is not specified.",
        ),
        (
            r"\bupstairs\b",
            "Incomplete location: exact floor or room number is missing.",
        ),
        (
            r"\bdownstairs\b",
            "Incomplete location: exact floor or room number is missing.",
        ),
        (
            r"\bother\s+building\b",
            "Vague location: building name or block is not specified.",
        ),
        (
            r"\bnext\s+door\b",
            "Vague location: specific room or counter number is missing.",
        ),
        (
            r"\bthe\s+office\b",
            "Ambiguous location: the specific office, room, building, or counter is not identified.",
        ),
        (
            r"\bthe\s+counter\b",
            "Ambiguous location: the specific counter number or name is not identified.",
        ),
        (
            r"\bthe\s+room\b",
            "Ambiguous location: the specific room number or name is not identified.",
        ),
        (
            r"\bthe\s+desk\b",
            "Ambiguous location: the specific desk or counter is not identified.",
        ),
        (
            r"\bthe\s+window\b",
            "Ambiguous location: the specific service window is not identified.",
        ),
        (
            r"\bthe\s+department\b",
            "Ambiguous location: the specific department or office is not identified.",
        ),
        (
            r"\bthe\s+building\b",
            "Ambiguous location: the specific building or block is not identified.",
        ),
    ]

    # ============================================================
    # UNSPECIFIED DOCUMENTS
    # ============================================================

    UNSPECIFIED_DOCUMENT_PATTERNS = [
        (
            r"\bthe\s+required\s+documents?\b",
            "The phrase refers to required documents without naming which documents are needed.",
        ),
        (
            r"\bthe\s+required\s+papers?\b",
            "The phrase refers to required papers without naming them.",
        ),
        (
            r"\bthe\s+necessary\s+documents?\b",
            "The phrase refers to necessary documents without naming them.",
        ),
        (
            r"\bthe\s+relevant\s+documents?\b",
            "The phrase refers to relevant documents without identifying which ones.",
        ),
        (
            r"\bthe\s+documents?\b",
            "The phrase refers to documents without identifying which documents are required.",
        ),
        (
            r"\bthe\s+paperwork\b",
            "The phrase refers to paperwork without identifying which documents or forms are required.",
        ),
        (
            r"\brequired\s+documents?\b",
            "The phrase refers to required documents without naming which documents are needed.",
        ),
        (
            r"\brequired\s+papers?\b",
            "The phrase refers to required papers without naming them.",
        ),
        (
            r"\bnecessary\s+documents?\b",
            "The phrase refers to necessary documents without naming them.",
        ),
        (
            r"\brelevant\s+documents?\b",
            "The phrase refers to relevant documents without identifying which ones.",
        ),
    ]

    # ============================================================
    # MISSING DEADLINE EXPRESSIONS
    # ============================================================

    MISSING_DEADLINE_PATTERNS = [
        (
            r"\bbefore\s+the\s+deadline\b",
            "The instruction refers to a deadline but does not state the actual date or time.",
        ),
        (
            r"\bby\s+the\s+deadline\b",
            "The instruction refers to a deadline but does not state the actual date or time.",
        ),
        (
            r"\bwithin\s+the\s+deadline\b",
            "The instruction refers to a deadline but does not state the actual date or time.",
        ),
        (
            r"\bbefore\s+submission\b",
            "The instruction refers to submission timing but does not state the exact deadline.",
        ),
        (
            r"\bby\s+submission\b",
            "The instruction refers to submission timing but does not state the exact deadline.",
        ),
    ]

    # ============================================================
    # EXPLICIT LOCATION EXTRACTION
    # ============================================================

    LOCATION_EXTRACTION_PATTERNS = [
        # Specific service points
        r"\b(Counter\s+\d+[A-Z]?)\b",
        r"\b(Room\s+\d+[A-Z]?)\b",
        r"\b(Window\s+\d+[A-Z]?)\b",
        r"\b(Desk\s+\d+[A-Z]?)\b",
        r"\b(Floor\s+\d+[A-Z]?)\b",
        r"\b(Block\s+[A-Z0-9]+)\b",

        # Named institutional offices
        r"\b((?:Registrar|Accounts|Admission|Admissions|Examination|"
        r"Exams|Student Affairs|Administration|Administrative|"
        r"Scholarship|Library|Placement|Finance|Dean|Principal)"
        r"(?:'s)?\s+Office)\b",
    ]

    # ============================================================
    # EXPLICIT DOCUMENT EXTRACTION
    # ============================================================

    # Intentionally avoid a generic "certificate" pattern.
    # Otherwise:
    #
    #   migration certificate application
    #
    # would incorrectly produce:
    #
    #   certificate
    #
    # Only explicitly identifiable document phrases are extracted.

    DOCUMENT_EXTRACTION_PATTERNS = [
        # More specific forms first
        r"\b(original\s+Aadhaar\s+card)\b",
        r"\b(Aadhaar\s+card)\b",

        r"\b(original\s+student\s+ID(?:\s+card)?)\b",
        r"\b(student\s+ID(?:\s+card)?)\b",

        r"\b(original\s+college\s+ID(?:\s+card)?)\b",
        r"\b(college\s+ID(?:\s+card)?)\b",

        r"\b(original\s+PAN\s+card)\b",
        r"\b(PAN\s+card)\b",

        r"\b(passport)\b",

        r"\b(application\s+form)\b",

        r"\b(original\s+fee\s+receipt)\b",
        r"\b(fee\s+receipt)\b",

        r"\b(marksheet)\b",
        r"\b(mark\s*sheet)\b",

        r"\b(photocopy)\b",
        r"\b(xerox)\b",

        r"\b(original\s+documents?)\b",
    ]

    # ============================================================
    # EXPLICIT DEADLINE / DATE-TIME EXTRACTION
    # ============================================================

    DEADLINE_PATTERNS = [
        # 2:30 PM
        r"\b\d{1,2}:\d{2}\s*(?:AM|PM)\b",

        # 2 PM
        r"\b\d{1,2}\s*(?:AM|PM)\b",

        # October 12 / October 12th
        r"\b(?:January|February|March|April|May|June|July|August|"
        r"September|October|November|December)"
        r"\s+\d{1,2}(?:st|nd|rd|th)?\b",

        # Oct 12 / Oct 12th
        r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)"
        r"\s+\d{1,2}(?:st|nd|rd|th)?\b",

        # 12/10/2026 or 12-10-2026
        r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",

        # by Friday / before Friday / on Friday
        r"\b(?:before|by|on)\s+"
        r"(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b",

        # Friday at 2 PM
        r"\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)"
        r"\s+at\s+\d{1,2}(?::\d{2})?\s*(?:AM|PM)\b",
    ]

    # ============================================================
    # ACTION EXTRACTION
    # ============================================================

    ACTION_PATTERN = (
        r"\b("
        r"submit|hand\s+in|bring|take|visit|pay|fill|collect|"
        r"return|report|contact|provide|carry|"
        r"register|apply|complete|upload"
        r")\b[^.!?]*"
    )

    # ============================================================
    # MAIN ANALYZER
    # ============================================================

    def analyze_text(
        self,
        text: str,
    ) -> Tuple[
        List[FactItem],
        List[AmbiguityItem],
        List[str],
        List[str],
    ]:

        facts: List[FactItem] = []
        gaps: List[AmbiguityItem] = []
        relative_dates: List[str] = []
        clarifications: List[str] = []

        if not text or not text.strip():
            return facts, gaps, relative_dates, clarifications

        lower_text = text.lower()

        # --------------------------------------------------------
        # Helper: add gap without duplicates
        # --------------------------------------------------------

        def add_gap(
            category: str,
            quote: str,
            issue: str,
            suggested_action: str,
        ):
            normalized_quote = quote.lower().strip()

            for existing in gaps:
                existing_quote = existing.quote.lower().strip()

                # Exact duplicate
                if (
                    existing.category.lower() == category.lower()
                    and existing_quote == normalized_quote
                ):
                    return

                # Overlapping document ambiguity phrases
                if (
                    category == "document_unspecified"
                    and existing.category.lower() == category.lower()
                ):
                    if (
                        normalized_quote in existing_quote
                        or existing_quote in normalized_quote
                    ):
                        if len(normalized_quote) > len(existing_quote):
                            existing.quote = quote
                            existing.issue = issue
                            existing.suggested_action = suggested_action
                        return

            gaps.append(
                AmbiguityItem(
                    category=category,
                    quote=quote,
                    issue=issue,
                    suggested_action=suggested_action,
                )
            )

        # ========================================================
        # 1. RELATIVE / VAGUE TIME
        # ========================================================

        for pattern, explanation in self.RELATIVE_TIME_PATTERNS:
            for match in re.finditer(pattern, lower_text):
                quote = text[match.start():match.end()]

                add_gap(
                    category="relative_time",
                    quote=quote,
                    issue=explanation,
                    suggested_action=(
                        f"Ask for the exact calendar date and time "
                        f"corresponding to '{quote}'."
                    ),
                )

                if quote.lower() not in {
                    x.lower() for x in relative_dates
                }:
                    relative_dates.append(quote)

                clarifications.append(
                    "Could you please confirm the exact calendar date and time?"
                )

        # ========================================================
        # 2. AMBIGUOUS LOCATIONS
        # ========================================================

        for pattern, explanation in self.VAGUE_LOCATION_PATTERNS:
            for match in re.finditer(pattern, lower_text):
                quote = text[match.start():match.end()]

                add_gap(
                    category="vague_location",
                    quote=quote,
                    issue=explanation,
                    suggested_action=(
                        "Ask staff to write down the exact "
                        "room number, counter number, desk, "
                        "or building."
                    ),
                )

                clarifications.append(
                    "Could you please write down the exact room number or counter I should visit?"
                )

        # ========================================================
        # 3. EXPLICIT DOCUMENTS
        # ========================================================

        document_matches = []

        for pattern in self.DOCUMENT_EXTRACTION_PATTERNS:
            for match in re.finditer(
                pattern,
                text,
                re.IGNORECASE,
            ):
                value = re.sub(
                    r"\s+",
                    " ",
                    match.group(1).strip(),
                )

                document_matches.append(
                    {
                        "value": value,
                        "start": match.start(1),
                        "end": match.end(1),
                    }
                )

        # --------------------------------------------------------
        # Remove overlapping document matches.
        #
        # Example:
        #   original Aadhaar card
        #
        # contains:
        #   Aadhaar card
        #
        # Keep only the longer/more specific match.
        # --------------------------------------------------------

        document_matches.sort(
            key=lambda item: (
                -(item["end"] - item["start"]),
                item["start"],
            )
        )

        accepted_documents = []

        for candidate in document_matches:
            overlaps = False

            for existing in accepted_documents:
                if (
                    candidate["start"] < existing["end"]
                    and candidate["end"] > existing["start"]
                ):
                    overlaps = True
                    break

            if not overlaps:
                accepted_documents.append(candidate)

        accepted_documents.sort(
            key=lambda item: item["start"]
        )

        for item in accepted_documents:
            facts.append(
                FactItem(
                    field="Required Document",
                    value=item["value"],
                    provenance="AI-extracted",
                    status="Unresolved",
                )
            )

        # ========================================================
        # 4. UNSPECIFIED DOCUMENTS
        # ========================================================

        for pattern, explanation in self.UNSPECIFIED_DOCUMENT_PATTERNS:
            for match in re.finditer(
                pattern,
                lower_text,
            ):
                quote = text[match.start():match.end()]

                add_gap(
                    category="document_unspecified",
                    quote=quote,
                    issue=explanation,
                    suggested_action=(
                        "Ask staff to write down the names "
                        "of every document or form required."
                    ),
                )

                clarifications.append(
                    "Which specific documents or forms do I need to bring?"
                )

        # ========================================================
        # 5. MISSING DEADLINES
        # ========================================================

        for pattern, explanation in self.MISSING_DEADLINE_PATTERNS:
            for match in re.finditer(
                pattern,
                lower_text,
            ):
                quote = text[match.start():match.end()]

                add_gap(
                    category="deadline_missing",
                    quote=quote,
                    issue=explanation,
                    suggested_action=(
                        "Ask staff to write down the exact "
                        "deadline date and time."
                    ),
                )

                clarifications.append(
                    "Could you please write down the exact deadline date and time?"
                )

        # ========================================================
        # 6. EXPLICIT LOCATIONS
        # ========================================================

        found_locations = set()

        for pattern in self.LOCATION_EXTRACTION_PATTERNS:
            for match in re.finditer(
                pattern,
                text,
                re.IGNORECASE,
            ):
                value = re.sub(
                    r"\s+",
                    " ",
                    match.group(1).strip(),
                )

                key = value.lower()

                if key not in found_locations:
                    found_locations.add(key)

                    facts.append(
                        FactItem(
                            field="Location/Counter",
                            value=value,
                            provenance="AI-extracted",
                            status="Unresolved",
                        )
                    )

        # ========================================================
        # 7. EXPLICIT DEADLINES / DATES / TIMES
        # ========================================================

        deadline_values = []

        for pattern in self.DEADLINE_PATTERNS:
            for match in re.finditer(
                pattern,
                text,
                re.IGNORECASE,
            ):
                value = match.group(0).strip()

                if value.lower() not in {
                    x.lower() for x in deadline_values
                }:
                    deadline_values.append(value)

        if deadline_values:
            combined_deadline = self._extract_deadline_phrase(text)

            if combined_deadline:
                facts.append(
                    FactItem(
                        field="Deadline/Time",
                        value=combined_deadline,
                        provenance="AI-extracted",
                        status="Unresolved",
                    )
                )

        # ========================================================
        # 8. ACTION EXTRACTION
        # ========================================================

        action_match = re.search(
            self.ACTION_PATTERN,
            text,
            re.IGNORECASE,
        )

        if action_match:
            action_text = action_match.group(0).strip()

            facts.append(
                FactItem(
                    field="Action Required",
                    value=action_text,
                    provenance="AI-extracted",
                    status="Unresolved",
                )
            )

        # ========================================================
        # 9. DEDUPLICATE CLARIFICATIONS
        # ========================================================

        unique_clarifications = list(
            dict.fromkeys(clarifications)
        )

        return (
            facts,
            gaps,
            relative_dates,
            unique_clarifications,
        )

    # ============================================================
    # DEADLINE PHRASE EXTRACTION
    # ============================================================

    def _extract_deadline_phrase(
        self,
        text: str,
    ) -> str:

        patterns = [
            # ----------------------------------------------------
            # Full:
            # by 4 PM on Friday, October 9, 2026
            # before 2:30 PM on Thursday, October 9, 2026
            # ----------------------------------------------------
            r"\b(?:before|by|at)\s+"
            r"\d{1,2}(?::\d{2})?\s*(?:AM|PM)"
            r"(?:\s+on\s+"
            r"(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)"
            r"(?:,\s*"
            r"(?:January|February|March|April|May|June|July|August|"
            r"September|October|November|December)"
            r"\s+\d{1,2}(?:st|nd|rd|th)?"
            r"(?:,\s*\d{4})?"
            r")?"
            r")?",

            # ----------------------------------------------------
            # by Friday, October 9, 2026
            # ----------------------------------------------------
            r"\b(?:before|by|on)\s+"
            r"(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)"
            r"(?:,\s*"
            r"(?:January|February|March|April|May|June|July|August|"
            r"September|October|November|December)"
            r"\s+\d{1,2}(?:st|nd|rd|th)?"
            r"(?:,\s*\d{4})?"
            r")?",

            # ----------------------------------------------------
            # October 9, 2026
            # ----------------------------------------------------
            r"\b(?:January|February|March|April|May|June|July|August|"
            r"September|October|November|December)"
            r"\s+\d{1,2}(?:st|nd|rd|th)?"
            r"(?:,\s*\d{4})?\b",

            # ----------------------------------------------------
            # Oct 9, 2026
            # ----------------------------------------------------
            r"\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)"
            r"\s+\d{1,2}(?:st|nd|rd|th)?"
            r"(?:,\s*\d{4})?\b",

            # ----------------------------------------------------
            # 12/10/2026
            # ----------------------------------------------------
            r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",

            # ----------------------------------------------------
            # 2:30 PM on Thursday
            # ----------------------------------------------------
            r"\b\d{1,2}(?::\d{2})?\s*(?:AM|PM)"
            r"\s+on\s+"
            r"(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)"
            r"(?:,\s*"
            r"(?:January|February|March|April|May|June|July|August|"
            r"September|October|November|December)"
            r"\s+\d{1,2}(?:st|nd|rd|th)?"
            r"(?:,\s*\d{4})?"
            r")?",

            # ----------------------------------------------------
            # Thursday at 2:30 PM
            # ----------------------------------------------------
            r"\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)"
            r"\s+at\s+"
            r"\d{1,2}(?::\d{2})?\s*(?:AM|PM)\b",

            # ----------------------------------------------------
            # on Thursday
            # ----------------------------------------------------
            r"\bon\s+"
            r"(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b",

            # ----------------------------------------------------
            # 2:30 PM
            # ----------------------------------------------------
            r"\b\d{1,2}(?::\d{2})?\s*(?:AM|PM)\b",
        ]

        for pattern in patterns:
            match = re.search(
                pattern,
                text,
                re.IGNORECASE,
            )

            if match:
                return match.group(0).strip()

        # Fallback
        for pattern in self.DEADLINE_PATTERNS:
            match = re.search(
                pattern,
                text,
                re.IGNORECASE,
            )

            if match:
                return match.group(0).strip()

        return ""


ambiguity_service = AmbiguityService()