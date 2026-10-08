import json
import re
import uuid
from typing import Dict, Any, List

from backend.services.ai_service import gemini_service


class RehearsalService:
    # ========================================================
    # GENERAL DOMAIN DEFINITIONS
    #
    # The initial dialogue is ONLY the opening setup.
    # It is NOT a closed list of allowed requests.
    # ========================================================

    DEFAULT_SCENARIOS = {
        "College Office": {
            "persona_name": "Academic Administrative Staff",
            "scenario_brief": (
                "You are at a college administration office practicing "
                "general academic and administrative conversations."
            ),
            "initial_dialogue": (
                "Next please. Keep your student ID card and original fee slip "
                "ready on the counter."
            ),
            "learning_objectives": [
                "Clearly state the purpose of the visit",
                "Ask for required information when needed",
                "Request written confirmation or acknowledgement when appropriate",
            ],
        },
        "Bank Branch": {
            "persona_name": "Bank Branch Staff",
            "scenario_brief": (
                "You are at a bank branch practicing general banking and "
                "customer-service conversations."
            ),
            "initial_dialogue": (
                "Please submit Form 2A along with self-attested copies of your "
                "PAN and Aadhaar."
            ),
            "learning_objectives": [
                "Clearly state the banking request",
                "Ask for important requirements in writing when needed",
                "Request acknowledgement when submitting documents",
            ],
        },
        "Hospital OPD": {
            "persona_name": "Hospital OPD Staff",
            "scenario_brief": (
                "You are at a hospital OPD practicing general patient-service "
                "conversations such as registration, appointments, reports, "
                "directions, and assistance."
            ),
            "initial_dialogue": (
                "Take this green slip to Room 104 for preliminary blood "
                "pressure check."
            ),
            "learning_objectives": [
                "Clearly communicate the required assistance",
                "Confirm the next step or location",
                "Ask staff to write down important instructions",
            ],
        },
        "Public Transit": {
            "persona_name": "Transit Staff",
            "scenario_brief": (
                "You are at a railway or public-transit help desk practicing "
                "general conversations about destinations, tickets, routes, "
                "platforms, schedules, and boarding assistance."
            ),
            "initial_dialogue": (
                "Suburban trains for Tambaram leave from Platform 3. "
                "The next fast local is at 10:45 AM."
            ),
            "learning_objectives": [
                "Clearly state the travel request",
                "Confirm travel information when needed",
                "Request boarding assistance when needed",
                "Ask staff to provide important information in writing",
            ],
        },
    }

    # ========================================================
    # INITIAL SCENARIO CONTEXT
    #
    # These are facts from the opening message only.
    # They do NOT restrict later user requests.
    # ========================================================

    SCENARIO_CONTEXT = {
        "College Office": {
            "initial_staff": (
                "Next please. Keep your student ID card and original fee slip "
                "ready on the counter."
            ),
            "facts": [
                "This is a college administration practice scenario.",
                "The opening message mentions a student ID card.",
                "The opening message mentions an original fee slip.",
                "The opening details are starting context only.",
                "The user may introduce other reasonable college "
                "administration topics during the conversation.",
                "Specific requirements not established in the conversation "
                "must not be invented as confirmed facts.",
            ],
        },
        "Bank Branch": {
            "initial_staff": (
                "Please submit Form 2A along with self-attested copies of your "
                "PAN and Aadhaar."
            ),
            "facts": [
                "This is a bank branch practice scenario.",
                "The opening message mentions Form 2A.",
                "The opening message mentions self-attested PAN and Aadhaar copies.",
                "The opening details are starting context only.",
                "The user may introduce other reasonable banking topics during "
                "the conversation.",
                "Specific requirements, account details, fees, or outcomes "
                "not established in the conversation must not be invented.",
            ],
        },
        "Hospital OPD": {
            "initial_staff": (
                "Take this green slip to Room 104 for preliminary blood "
                "pressure check."
            ),
            "facts": [
                "This is a hospital OPD practice scenario.",
                "The opening message mentions a green slip.",
                "The opening message mentions Room 104.",
                "The opening message mentions a preliminary blood pressure check.",
                "The opening details are starting context only.",
                "The user may introduce other reasonable hospital-service "
                "topics during the conversation.",
                "Specific medical, appointment, room, department, fee, or "
                "service details not established in the conversation must "
                "not be invented.",
            ],
        },
        "Public Transit": {
            "initial_staff": (
                "Suburban trains for Tambaram leave from Platform 3. "
                "The next fast local is at 10:45 AM."
            ),
            "facts": [
                "This is a railway/public-transit practice scenario.",
                "The opening message mentions Tambaram.",
                "The opening message mentions Platform 3.",
                "The opening message mentions 10:45 AM.",
                "The opening details are starting context only.",
                "The user may introduce other reasonable travel-related "
                "topics during the conversation.",
                "Specific destinations, platforms, schedules, fares, ticket "
                "availability, or service outcomes not established in the "
                "conversation must not be invented.",
            ],
        },
    }

    # ========================================================
    # HIGH-CONFIDENCE CROSS-DOMAIN SIGNALS
    #
    # These are intentionally conservative.
    #
    # IMPORTANT:
    # "ticket" alone is NEVER used because "hall ticket" is a
    # perfectly valid college-administration request.
    # ========================================================

    CROSS_SCENARIO_SIGNALS = {
        "College Office": {
            "Bank Branch": [
                "update kyc",
                "kyc update",
                "open bank account",
                "open a bank account",
                "open savings account",
                "open a savings account",
                "open current account",
                "open a current account",
                "deposit a cheque",
                "deposit a check",
                "bank statement",
                "bank branch",
                "passbook",
                "ifsc",
                "bank transfer",
            ],
            "Hospital OPD": [
                "doctor consultation",
                "doctor appointment",
                "hospital appointment",
                "see a doctor",
                "buy medicine",
                "collect medicine",
                "lab test",
                "blood test",
                "pharmacy",
                "medical treatment",
            ],
            "Public Transit": [
                "train ticket",
                "railway ticket",
                "catch a train",
                "which platform",
                "platform for",
                "railway station",
                "train station",
                "suburban train",
                "fast local",
                "boarding assistance",
            ],
        },
        "Bank Branch": {
            "College Office": [
                "exam form",
                "submit my exam form",
                "semester exam",
                "semester examination",
                "hall ticket",
                "get my transcript",
                "college transcript",
                "college office",
                "marksheet",
                "mark sheet",
                "academic certificate",
            ],
            "Hospital OPD": [
                "doctor consultation",
                "doctor appointment",
                "hospital appointment",
                "see a doctor",
                "buy medicine",
                "collect medicine",
                "lab test",
                "blood test",
                "pharmacy",
                "medical treatment",
            ],
            "Public Transit": [
                "train ticket",
                "railway ticket",
                "catch a train",
                "which platform",
                "platform for",
                "railway station",
                "train station",
                "suburban train",
                "fast local",
                "boarding assistance",
            ],
        },
        "Hospital OPD": {
            "College Office": [
                "exam form",
                "submit my exam form",
                "semester exam",
                "semester examination",
                "hall ticket",
                "get my transcript",
                "college transcript",
                "college office",
                "marksheet",
                "mark sheet",
                "academic certificate",
            ],
            "Bank Branch": [
                "update kyc",
                "kyc update",
                "open bank account",
                "open a bank account",
                "open savings account",
                "open a savings account",
                "open current account",
                "open a current account",
                "deposit a cheque",
                "deposit a check",
                "bank statement",
                "bank branch",
                "passbook",
                "ifsc",
                "bank transfer",
            ],
            "Public Transit": [
                "train ticket",
                "railway ticket",
                "catch a train",
                "which platform",
                "platform for",
                "railway station",
                "train station",
                "suburban train",
                "fast local",
                "boarding assistance",
            ],
        },
        "Public Transit": {
            "College Office": [
                "exam form",
                "submit my exam form",
                "semester exam",
                "semester examination",
                "hall ticket",
                "get my transcript",
                "college transcript",
                "college office",
                "marksheet",
                "mark sheet",
                "academic certificate",
            ],
            "Bank Branch": [
                "update kyc",
                "kyc update",
                "open bank account",
                "open a bank account",
                "open savings account",
                "open a savings account",
                "open current account",
                "open a current account",
                "deposit a cheque",
                "deposit a check",
                "bank statement",
                "bank branch",
                "passbook",
                "ifsc",
                "bank transfer",
            ],
            "Hospital OPD": [
                "doctor consultation",
                "doctor appointment",
                "hospital appointment",
                "see a doctor",
                "buy medicine",
                "collect medicine",
                "lab test",
                "blood test",
                "pharmacy",
                "medical treatment",
            ],
        },
    }

    SCENARIO_LABELS = {
        "College Office": "College Administration",
        "Bank Branch": "Bank KYC",
        "Hospital OPD": "Hospital OPD",
        "Public Transit": "Railway / Transit",
    }

    # ========================================================
    # POST-GENERATION CROSS-DOMAIN SAFETY
    #
    # Only clearly unrelated domain content is rejected.
    # Legitimate topics inside the selected domain are allowed.
    # ========================================================

    SCENARIO_FORBIDDEN_TERMS = {
        "College Office": [
            "railway platform",
            "railway station",
            "train station",
            "doctor appointment",
            "hospital room",
            "bank branch",
            "ifsc code",
            "passbook",
        ],
        "Bank Branch": [
            "railway platform",
            "railway station",
            "train station",
            "doctor appointment",
            "hospital room",
            "exam form",
            "college office",
            "semester examination",
        ],
        "Hospital OPD": [
            "railway platform",
            "railway station",
            "train station",
            "bank branch",
            "ifsc code",
            "passbook",
            "exam form",
            "college office",
        ],
        "Public Transit": [
            "bank branch",
            "kyc update",
            "ifsc code",
            "passbook",
            "exam form",
            "college office",
            "hospital room",
            "doctor appointment",
        ],
    }

    # ========================================================
    # UNSUPPORTED OPERATIONAL CLAIM DETECTION
    #
    # These patterns are checked against conversation history.
    # A concrete detail is allowed if the user/staff already
    # established it.
    # ========================================================

    CONCRETE_OPERATIONAL_PATTERNS = [
        r"\b(?:room|counter|platform)\s*#?\s*\d+\b",
        r"\bform\s+\d+[a-z]?\b",
        r"\b\d{1,2}:\d{2}\s*(?:am|pm)?\b",
        r"\b\d{1,2}\s*(?:am|pm)\b",
        r"(?:₹|rs\.?|inr|\$)\s*\d[\d,]*(?:\.\d+)?",
    ]

    # ========================================================
    # HELPERS
    # ========================================================

    def generate_scenario(
        self,
        domain: str,
        persona_type: str = "standard",
    ) -> Dict[str, Any]:

        matched = (
            self.DEFAULT_SCENARIOS.get(domain)
            or self.DEFAULT_SCENARIOS["College Office"]
        )

        scenario_id = str(uuid.uuid4())[:8]

        return {
            "scenario_id": scenario_id,
            "domain": domain,
            "persona_name": matched["persona_name"],
            "scenario_brief": matched["scenario_brief"],
            "initial_dialogue": matched["initial_dialogue"],
            "learning_objectives": matched["learning_objectives"],
            "engine": "signmitra_scenarios_db",
        }

    def _normalize_text(self, text: str) -> str:
        return " ".join(
            str(text or "").lower().strip().split()
        )

    def _contains_signal(
        self,
        normalized_text: str,
        signal: str,
    ) -> bool:

        escaped_signal = re.escape(
            signal.lower().strip()
        )

        return bool(
            re.search(
                rf"(?<!\w){escaped_signal}(?!\w)",
                normalized_text,
            )
        )

    def _detect_cross_scenario_request(
        self,
        domain: str,
        user_text: str,
    ) -> str | None:

        domain_signals = self.CROSS_SCENARIO_SIGNALS.get(
            domain,
            {},
        )

        normalized_text = self._normalize_text(
            user_text
        )

        for target_domain, signals in domain_signals.items():
            for signal in signals:
                if self._contains_signal(
                    normalized_text,
                    signal,
                ):
                    return target_domain

        return None

    def _build_known_conversation_text(
        self,
        history: List[Dict[str, str]],
        user_text: str,
        initial_staff: str,
    ) -> str:

        parts = [initial_staff, user_text]

        for turn in history or []:
            if not isinstance(turn, dict):
                continue

            text = turn.get("text")

            if isinstance(text, str) and text.strip():
                parts.append(text)

        return self._normalize_text(
            " ".join(parts)
        )

    def _operational_detail_is_known(
        self,
        matched_detail: str,
        known_text: str,
    ) -> bool:

        detail = self._normalize_text(
            matched_detail
        )

        # Direct exact match.
        if detail in known_text:
            return True

        # Numeric operational details can be phrased slightly
        # differently by the model, so compare their meaningful
        # components.

        # Money:
        if re.search(
            r"(?:₹|rs\.?|inr|\$)",
            detail,
        ):
            number_match = re.search(
                r"\d[\d,]*(?:\.\d+)?",
                detail,
            )

            if number_match:
                number = number_match.group(0).replace(
                    ",",
                    "",
                )

                if re.search(
                    rf"(?<!\d){re.escape(number)}(?!\d)",
                    known_text.replace(",", ""),
                ):
                    return True

            return False

        # Room / counter / platform:
        location_match = re.search(
            r"\b(room|counter|platform)\s*#?\s*(\d+)\b",
            detail,
        )

        if location_match:
            location = location_match.group(1)
            number = location_match.group(2)

            return bool(
                re.search(
                    rf"\b{re.escape(location)}\s*(?:number\s*)?#?\s*"
                    rf"{re.escape(number)}\b",
                    known_text,
                )
            )

        # Form number:
        form_match = re.search(
            r"\bform\s+(\d+[a-z]?)\b",
            detail,
        )

        if form_match:
            form_number = form_match.group(1)

            return bool(
                re.search(
                    rf"\bform\s+{re.escape(form_number)}\b",
                    known_text,
                )
            )

        # Time:
        time_match = re.search(
            r"\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b",
            detail,
        )

        if time_match:
            hour = time_match.group(1)
            minute = time_match.group(2)
            meridiem = time_match.group(3)

            if minute:
                time_pattern = (
                    rf"\b{re.escape(hour)}:{re.escape(minute)}"
                )
            else:
                time_pattern = (
                    rf"\b{re.escape(hour)}"
                )

            if meridiem:
                time_pattern += (
                    rf"\s*{re.escape(meridiem)}\b"
                )

            return bool(
                re.search(
                    time_pattern,
                    known_text,
                )
            )

        return False

    def _validate_concrete_operational_claims(
        self,
        domain: str,
        staff_response: str,
        history: List[Dict[str, str]],
        user_text: str,
    ) -> tuple[bool, str]:

        scenario = self.SCENARIO_CONTEXT.get(
            domain
        )

        if not scenario:
            return True, ""

        known_text = self._build_known_conversation_text(
            history=history,
            user_text=user_text,
            initial_staff=scenario["initial_staff"],
        )

        for pattern in self.CONCRETE_OPERATIONAL_PATTERNS:
            matches = re.findall(
                pattern,
                staff_response.lower(),
            )

            for match in matches:
                if isinstance(match, tuple):
                    detail = " ".join(
                        value
                        for value in match
                        if value
                    )
                else:
                    detail = match

                if not self._operational_detail_is_known(
                    detail,
                    known_text,
                ):
                    return (
                        False,
                        (
                            "Generated response introduced an "
                            f"unestablished operational detail: {detail}"
                        ),
                    )

        return True, ""

    # ========================================================
    # CROSS-DOMAIN FALLBACK
    # ========================================================

    def _cross_scenario_response(
        self,
        domain: str,
        target_domain: str,
        scenario_id: str,
        history: List[Dict[str, str]],
    ) -> Dict[str, Any]:

        current_label = self.SCENARIO_LABELS.get(
            domain,
            domain,
        )

        target_label = self.SCENARIO_LABELS.get(
            target_domain,
            target_domain,
        )

        response = (
            f"That request appears to relate to {target_label}, "
            f"while this practice is set to {current_label}. "
            f"Let's keep this rehearsal within the selected "
            f"{current_label} setting."
        )

        feedback = (
            f"Your request is understandable, but it appears to "
            f"switch to {target_label}. For this rehearsal, keep "
            f"the request within {current_label}."
        )

        rubric = [
            {
                "criterion": "Clarity of Request",
                "score": 65,
                "observation": (
                    "Your request is understandable, but it appears "
                    "to concern another practice domain."
                ),
            },
            {
                "criterion": "Polite Assertiveness",
                "score": 80,
                "observation": (
                    "The request is phrased clearly and politely."
                ),
            },
            {
                "criterion": "Practical Readiness",
                "score": 45,
                "observation": (
                    "The request does not currently demonstrate "
                    "readiness for the selected practice domain."
                ),
            },
        ]

        overall = int(
            sum(
                item["score"]
                for item in rubric
            )
            / len(rubric)
        )

        return {
            "scenario_id": scenario_id,
            "staff_response": response,
            "actionable_feedback": feedback,
            "rubric_scores": rubric,
            "overall_readiness_score": overall,
            "session_completed": False,
            "engine": "deterministic_context_guard",
        }

    # ========================================================
    # POST-GENERATION VALIDATION
    # ========================================================

    def _validate_staff_response(
        self,
        domain: str,
        staff_response: str,
        history: List[Dict[str, str]],
        user_text: str,
    ) -> tuple[bool, str]:

        if not isinstance(
            staff_response,
            str,
        ):
            return False, "Staff response is not a string."

        response = self._normalize_text(
            staff_response
        )

        if not response:
            return False, "Staff response is empty."

        # ----------------------------------------------------
        # 1. Cross-domain contamination
        # ----------------------------------------------------

        forbidden_terms = self.SCENARIO_FORBIDDEN_TERMS.get(
            domain,
            [],
        )

        for term in forbidden_terms:
            if self._contains_signal(
                response,
                term,
            ):
                return (
                    False,
                    f"Cross-scenario term detected: {term}",
                )

        # ----------------------------------------------------
        # 2. Unsupported concrete operational claims
        # ----------------------------------------------------

        operational_safe, operational_reason = (
            self._validate_concrete_operational_claims(
                domain=domain,
                staff_response=response,
                history=history,
                user_text=user_text,
            )
        )

        if not operational_safe:
            return (
                False,
                operational_reason,
            )

        # ----------------------------------------------------
        # 3. Fake real-world completion claims
        # ----------------------------------------------------

        completion_phrases = [
            "i have booked",
            "i booked",
            "i have submitted",
            "i submitted",
            "i have arranged",
            "i arranged",
            "i have notified",
            "i notified",
            "i have verified",
            "i verified",
            "i have stamped",
            "i stamped",
            "it has been confirmed",
            "your appointment is confirmed",
            "your booking is confirmed",
            "your request has been submitted",
            "your ticket has been booked",
            "your documents have been submitted",
            "your documents were submitted",
            "your appointment has been booked",
            "your appointment has been scheduled",
        ]

        for phrase in completion_phrases:
            if phrase in response:
                return (
                    False,
                    (
                        "Unsupported real-world action detected: "
                        f"{phrase}"
                    ),
                )

        # ----------------------------------------------------
        # 4. Medical safety
        # ----------------------------------------------------

        if domain == "Hospital OPD":
            medical_claim_patterns = [
                r"\byou have\b",
                r"\byou likely have\b",
                r"\byou are suffering from\b",
                r"\bthis means you have\b",
                r"\byour diagnosis is\b",
                r"\btake \w+ for\b",
            ]

            for pattern in medical_claim_patterns:
                if re.search(
                    pattern,
                    response,
                ):
                    return (
                        False,
                        "Potential medical diagnosis or treatment claim.",
                    )

        return True, ""

    # ========================================================
    # SAFE FALLBACK RESPONSE
    # ========================================================

    def _safe_staff_response(
        self,
        domain: str,
    ) -> str:

        safe_responses = {
            "College Office": (
                "I can help you rehearse that college-office conversation. "
                "That specific detail is not established in this practice "
                "simulation, so please confirm it with the actual college "
                "staff member."
            ),
            "Bank Branch": (
                "I can help you rehearse that banking conversation. "
                "That specific detail is not established in this practice "
                "simulation, so please confirm the exact information with "
                "the actual bank staff member."
            ),
            "Hospital OPD": (
                "I can help you rehearse that hospital conversation. "
                "That specific detail is not established in this practice "
                "simulation, so please confirm the next step with the actual "
                "hospital staff member."
            ),
            "Public Transit": (
                "I can help you rehearse that transit conversation. "
                "That specific travel detail is not established in this "
                "practice simulation, so please confirm it with the actual "
                "transit staff member."
            ),
        }

        return safe_responses.get(
            domain,
            (
                "That specific detail is not established in this "
                "practice simulation. Please confirm it with the "
                "actual staff member."
            ),
        )

    # ========================================================
    # MAIN EVALUATION
    # ========================================================

    async def evaluate_turn(
        self,
        scenario_id: str,
        domain: str,
        history: List[Dict[str, str]],
        user_reply: str,
    ) -> Dict[str, Any]:

        user_text = user_reply.strip()

        if not user_text:
            return {
                "scenario_id": scenario_id,
                "staff_response": (
                    "Please type your response so we can continue "
                    "the practice conversation."
                ),
                "actionable_feedback": (
                    "Try giving the staff member a clear response "
                    "or question."
                ),
                "rubric_scores": [],
                "overall_readiness_score": 0,
                "session_completed": False,
                "engine": "deterministic_rubric_evaluator",
            }

        # ----------------------------------------------------
        # Validate domain
        # ----------------------------------------------------

        if domain not in self.SCENARIO_CONTEXT:
            domain = "College Office"

        scenario = self.SCENARIO_CONTEXT[domain]

        # ====================================================
        # CROSS-DOMAIN GUARD
        #
        # This happens BEFORE Gemini.
        #
        # It blocks obvious domain switching but allows
        # different tasks inside the selected domain.
        # ====================================================

        cross_scenario_target = (
            self._detect_cross_scenario_request(
                domain=domain,
                user_text=user_text,
            )
        )

        if cross_scenario_target:
            return self._cross_scenario_response(
                domain=domain,
                target_domain=cross_scenario_target,
                scenario_id=scenario_id,
                history=history,
            )

        # ====================================================
        # GEMINI
        # ====================================================

        if gemini_service.is_configured():

            history_text = json.dumps(
                history,
                ensure_ascii=False,
                indent=2,
            )

            facts_text = "\n".join(
                f"- {fact}"
                for fact in scenario["facts"]
            )

            prompt = f"""
You are the STAFF MEMBER in a fictional SignMitra
conversation rehearsal simulation.

This is a communication-practice sandbox.
It is NOT a source of real-world operational instructions.

SELECTED DOMAIN:
{domain}

ESTABLISHED STARTING CONTEXT:
{facts_text}

INITIAL STAFF MESSAGE:
"{scenario["initial_staff"]}"

CONVERSATION HISTORY:
{history_text}

CURRENT USER MESSAGE:
"{user_text}"

YOUR ROLE:
Act as the staff member in the selected domain.

CORE PRINCIPLE:
The initial staff message is ONLY the opening situation.
It is NOT a closed list of allowed topics.

The user may introduce ANY reasonable request, question,
destination, document, purpose, service, or problem that
belongs to the selected domain.

For example:

COLLEGE:
- exam forms
- hall tickets
- transcripts
- certificates
- fee questions
- document submission
- academic records
- student-service questions

BANK:
- KYC
- address updates
- signature issues
- cheque deposits
- statements
- account services
- document requirements
- other reasonable banking requests

HOSPITAL:
- consultation registration
- appointments
- reports
- lab-token questions
- directions
- pharmacy questions
- medication pickup
- patient-service requests

TRANSIT:
- any destination
- train tickets
- routes
- platforms
- schedules
- train enquiries
- boarding assistance
- travel directions

IMPORTANT:
Do NOT reject a valid request merely because it was not
mentioned in the initial staff message.

If the user says:
"I want to buy tickets for Porur."

That is a VALID Public Transit practice request.

You should respond naturally as transit staff.

You must NOT say that Porur is invalid merely because
the opening message mentioned Tambaram.

However, you also must NOT invent a real platform,
fare, schedule, train number, ticket availability,
or other operational fact about Porur unless it was
already established in the conversation.

GENERAL DOMAIN RULES:
1. Stay within the selected domain.
2. Allow different tasks within that domain.
3. Treat information explicitly provided by the user as
   conversation context.
4. Treat facts already present in conversation history as
   established.
5. Never contradict established facts.
6. Never invent specific real-world operational facts.
7. If an exact operational detail is unknown, say that it
   is not established in this practice simulation.
8. Continue the conversation naturally instead of refusing
   a valid domain-related request.
9. Never change the user's destination, purpose, request,
   or intent.
10. Never switch the conversation into another domain.

DO NOT INVENT:
- exact fees
- exact fares
- platform numbers
- room numbers
- counter numbers
- schedules
- train numbers
- ticket availability
- appointment availability
- account status
- document requirements
- branch codes
- IFSC values
- token numbers
- service completion
- acknowledgements
- receipts
- bookings

Only use a specific operational detail if it was explicitly
established in the conversation.

If the user asks for an unknown operational detail, respond
naturally, for example:

"That specific detail isn't established in this practice
simulation. Please confirm it with the actual staff member."

REAL-WORLD ACTION RULE:
Never claim that you actually:
- booked something
- submitted something
- verified something
- stamped something
- arranged something
- notified someone
- processed something
- completed something

Do not promise that a ticket, appointment, acknowledgement,
receipt, assistance, or service outcome is guaranteed unless
that outcome was explicitly established.

MEDICAL SAFETY:
Because this is a hospital scenario:
- Never diagnose the user.
- Never claim the user has a disease or condition.
- Never prescribe treatment.
- Never provide medication instructions.
- You may simulate administrative communication with
  hospital staff.

ROLEPLAY STYLE:
- Sound like realistic staff.
- Be concise.
- Answer the user's actual request.
- Ask a clarifying question when appropriate.
- Do not repeat the opening message unnecessarily.
- Do not lecture the user about the scenario rules.
- Do not say the user is "wrong" simply because their
  request differs from the opening situation.

RUBRIC:
Evaluate the user's current message.

1. Clarity of Request (0-100)
2. Polite Assertiveness (0-100)
3. Practical Readiness (0-100)

Return ONLY valid JSON.

Required structure:
{{
    "staff_response": "...",
    "actionable_feedback": "...",
    "rubric_scores": [
        {{
            "criterion": "Clarity of Request",
            "score": 0,
            "observation": "..."
        }},
        {{
            "criterion": "Polite Assertiveness",
            "score": 0,
            "observation": "..."
        }},
        {{
            "criterion": "Practical Readiness",
            "score": 0,
            "observation": "..."
        }}
    ],
    "session_completed": false
}}
"""

            try:
                res = await gemini_service.generate_structured_json(
                    prompt
                )

                if not isinstance(res, dict):
                    raise ValueError(
                        "Gemini response is not a JSON object."
                    )

                # ------------------------------------------------
                # Normalize rubric
                # ------------------------------------------------

                scores = res.get(
                    "rubric_scores",
                    [],
                )

                valid_scores = []

                for score in scores:
                    if not isinstance(score, dict):
                        continue

                    raw_score = score.get(
                        "score",
                        0,
                    )

                    try:
                        normalized_score = max(
                            0,
                            min(
                                100,
                                int(raw_score),
                            ),
                        )
                    except (
                        TypeError,
                        ValueError,
                    ):
                        normalized_score = 0

                    criterion = score.get(
                        "criterion",
                        "",
                    )

                    observation = score.get(
                        "observation",
                        "",
                    )

                    if not isinstance(
                        criterion,
                        str,
                    ):
                        criterion = ""

                    if not isinstance(
                        observation,
                        str,
                    ):
                        observation = ""

                    valid_scores.append(
                        {
                            "criterion": criterion,
                            "score": normalized_score,
                            "observation": observation,
                        }
                    )

                if len(valid_scores) == 3:
                    avg_score = int(
                        sum(
                            item["score"]
                            for item in valid_scores
                        )
                        / 3
                    )
                else:
                    avg_score = 70

                # ------------------------------------------------
                # Staff response
                # ------------------------------------------------

                staff_response = res.get(
                    "staff_response"
                )

                if not isinstance(
                    staff_response,
                    str,
                ) or not staff_response.strip():
                    staff_response = (
                        "Please continue by telling me what you "
                        "need help with."
                    )

                staff_response = staff_response.strip()

                # ------------------------------------------------
                # Safety validation
                # ------------------------------------------------

                is_safe, validation_reason = (
                    self._validate_staff_response(
                        domain=domain,
                        staff_response=staff_response,
                        history=history,
                        user_text=user_text,
                    )
                )

                if not is_safe:
                    staff_response = (
                        self._safe_staff_response(
                            domain
                        )
                    )

                feedback = res.get(
                    "actionable_feedback"
                )

                if not isinstance(
                    feedback,
                    str,
                ) or not feedback.strip():
                    feedback = (
                        "Keep your request clear and ask staff "
                        "to provide important information in writing "
                        "when useful."
                    )

                return {
                    "scenario_id": scenario_id,
                    "staff_response": staff_response,
                    "actionable_feedback": feedback.strip(),
                    "rubric_scores": valid_scores,
                    "overall_readiness_score": avg_score,
                    "session_completed": bool(
                        res.get(
                            "session_completed",
                            False,
                        )
                    ),
                    "engine": (
                        "gemini_llm_validated"
                        if is_safe
                        else "gemini_llm_safety_fallback"
                    ),
                }

            except Exception:
                # Gemini failure falls through to deterministic mode.
                pass

        # ========================================================
        # DETERMINISTIC FALLBACK
        # ========================================================

        lower = self._normalize_text(
            user_text
        )

        clarity_score = 70
        politeness_score = 70
        readiness_score = 70

        # --------------------------------------------------------
        # Politeness
        # --------------------------------------------------------

        if any(
            phrase in lower
            for phrase in [
                "please",
                "kindly",
                "kripya",
                "thank you",
                "thanks",
            ]
        ):
            politeness_score += 20

        # --------------------------------------------------------
        # Clear communication
        # --------------------------------------------------------

        if len(user_text) > 20:
            clarity_score += 15

        if "?" in user_text:
            clarity_score += 10

        # --------------------------------------------------------
        # Practical readiness
        # Domain-neutral signals
        # --------------------------------------------------------

        readiness_terms = [
            "document",
            "form",
            "id",
            "receipt",
            "address",
            "request",
            "purpose",
            "where",
            "when",
            "which",
            "how",
            "next step",
            "confirmation",
            "acknowledgement",
            "ticket",
            "train",
            "platform",
            "destination",
            "appointment",
            "consultation",
            "report",
            "lab",
            "medicine",
            "kyc",
            "account",
            "cheque",
            "transcript",
            "certificate",
            "hall ticket",
        ]

        if any(
            term in lower
            for term in readiness_terms
        ):
            readiness_score += 20

        clarity_score = min(
            clarity_score,
            100,
        )

        politeness_score = min(
            politeness_score,
            100,
        )

        readiness_score = min(
            readiness_score,
            100,
        )

        rubric = [
            {
                "criterion": "Clarity of Request",
                "score": clarity_score,
                "observation": (
                    "Your request is clearer when you directly state "
                    "what you need or want confirmed."
                ),
            },
            {
                "criterion": "Polite Assertiveness",
                "score": politeness_score,
                "observation": (
                    "Polite wording and direct questions can make "
                    "the interaction easier to follow."
                ),
            },
            {
                "criterion": "Practical Readiness",
                "score": readiness_score,
                "observation": (
                    "Providing relevant context and asking for the "
                    "specific information you need makes your request "
                    "more actionable."
                ),
            },
        ]

        overall = int(
            (
                clarity_score
                + politeness_score
                + readiness_score
            )
            / 3
        )

        fallback_responses = {
            "College Office": (
                "Understood. Please continue with your "
                "college-office request. I can help you rehearse "
                "how to communicate it clearly and politely."
            ),
            "Bank Branch": (
                "Understood. Please continue with your banking "
                "request. I can help you rehearse how to communicate "
                "it clearly and politely."
            ),
            "Hospital OPD": (
                "Understood. Please continue with your hospital "
                "service request. I can help you rehearse how to "
                "communicate it clearly and politely."
            ),
            "Public Transit": (
                "Understood. Please continue with your travel "
                "request. I can help you rehearse how to communicate "
                "it clearly and politely."
            ),
        }

        fallback_feedback = (
            "You communicated your request. Keep important questions "
            "specific and ask staff to write down important information "
            "when needed."
        )

        return {
            "scenario_id": scenario_id,
            "staff_response": fallback_responses.get(
                domain,
                fallback_responses["College Office"],
            ),
            "actionable_feedback": fallback_feedback,
            "rubric_scores": rubric,
            "overall_readiness_score": overall,
            "session_completed": len(history) >= 6,
            "engine": "deterministic_rubric_evaluator",
        }


rehearsal_service = RehearsalService()