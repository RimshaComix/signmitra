import uuid
from typing import Dict, Any, List
from backend.services.ai_service import gemini_service

class RehearsalService:
    DEFAULT_SCENARIOS = {
        "Bank Counter": {
            "persona_name": "Senior Bank Clerk (Counter 3)",
            "scenario_brief": "You are at a busy public sector bank to submit a KYC update form and link your Aadhaar card.",
            "initial_dialogue": "Next in line, please! Show me your account number and passbook. What service do you need today?",
            "learning_objectives": [
                "Clearly state you communicate in writing or via large text",
                "Present account number and ID proof promptly",
                "Request written acknowledgement or stamp on submission"
            ]
        },
        "Hospital OPD": {
            "persona_name": "OPD Registration Desk Officer",
            "scenario_brief": "You are at the hospital reception to register for an ENT doctor consultation.",
            "initial_dialogue": "Registration closes at 12. Have you made an online appointment or is this a walk-in visit?",
            "learning_objectives": [
                "Indicate you are Deaf and request room/counter guidance in writing",
                "Confirm token number and consultation room",
                "Confirm if fee receipt is required before entering"
            ]
        },
        "College Office": {
            "persona_name": "Academic Administrative Superintendent",
            "scenario_brief": "You are submitting an application form for semester fee concession.",
            "initial_dialogue": "Yes? Keep your papers ready. Is this the original caste certificate or a photocopy?",
            "learning_objectives": [
                "Present your application card with clear purpose",
                "Clarify exact missing documents or deadline if raised",
                "Ensure you receive a dated stamped acknowledgement"
            ]
        }
    }

    def generate_scenario(self, domain: str, persona_type: str = "standard") -> Dict[str, Any]:
        matched = self.DEFAULT_SCENARIOS.get(domain) or self.DEFAULT_SCENARIOS["College Office"]
        scenario_id = str(uuid.uuid4())[:8]

        return {
            "scenario_id": scenario_id,
            "domain": domain,
            "persona_name": matched["persona_name"],
            "scenario_brief": matched["scenario_brief"],
            "initial_dialogue": matched["initial_dialogue"],
            "learning_objectives": matched["learning_objectives"],
            "engine": "signmitra_scenarios_db"
        }

    async def evaluate_turn(
        self, 
        scenario_id: str, 
        domain: str, 
        history: List[Dict[str, str]], 
        user_reply: str
    ) -> Dict[str, Any]:
        """
        Evaluates the user's reply against objective communication criteria.
        """
        user_text = user_reply.strip()

        if gemini_service.is_configured():
            prompt = (
                f"You are a communication coach for Deaf individuals interacting with Indian public counters.\n"
                f"Domain: {domain}\n"
                f"Conversation history:\n{history}\n"
                f"User's reply:\n\"{user_text}\"\n\n"
                f"Evaluate the reply using a transparent 3-criteria rubric:\n"
                f"1. Clarity of Request (0-100)\n"
                f"2. Polite Assertiveness & Accommodations (0-100)\n"
                f"3. Practical Readiness / Document Awareness (0-100)\n\n"
                f"Provide realistic next dialogue from the staff member, constructive feedback, and whether the interaction is completed.\n"
                f"Return JSON format:\n"
                f'{{\n'
                f'  "staff_response": "...",\n'
                f'  "actionable_feedback": "...",\n'
                f'  "rubric_scores": [\n'
                f'    {{"criterion": "Clarity of Request", "score": 85, "observation": "..."}},\n'
                f'    {{"criterion": "Polite Assertiveness", "score": 90, "observation": "..."}},\n'
                f'    {{"criterion": "Practical Readiness", "score": 80, "observation": "..."}}\n'
                f'  ],\n'
                f'  "session_completed": false\n'
                f'}}'
            )
            res = await gemini_service.generate_structured_json(prompt)
            scores = res.get("rubric_scores", [])
            avg_score = int(sum(s.get("score", 70) for s in scores) / max(len(scores), 1))
            return {
                "scenario_id": scenario_id,
                "staff_response": res.get("staff_response", "Please submit your documents at Counter 2."),
                "actionable_feedback": res.get("actionable_feedback", "Great job communicating your request clearly!"),
                "rubric_scores": scores,
                "overall_readiness_score": avg_score,
                "session_completed": res.get("session_completed", False),
                "engine": "gemini_llm"
            }

        # Deterministic Rubric Evaluation Fallback
        lower = user_text.lower()
        clarity_score = 70
        politeness_score = 70
        readiness_score = 70

        # Assess politeness
        if any(w in lower for w in ["please", "kindly", "kripya", "thank you", "thanks"]):
            politeness_score += 20
        if "writing" in lower or "write" in lower or "card" in lower or "deaf" in lower:
            politeness_score += 10

        # Assess clarity
        if len(user_text) > 20:
            clarity_score += 15
        if "?" in user_text:
            clarity_score += 10

        # Assess readiness
        if any(w in lower for w in ["form", "id", "document", "aadhaar", "passbook", "receipt", "copy"]):
            readiness_score += 25

        rubric = [
            {
                "criterion": "Clarity of Request",
                "score": min(clarity_score, 100),
                "observation": "Clear phrasing. Stating your requirement in writing helps staff respond accurately."
            },
            {
                "criterion": "Polite Assertiveness",
                "score": min(politeness_score, 100),
                "observation": "Good tone. Reminding staff politely to write down responses prevents misunderstandings."
            },
            {
                "criterion": "Practical Readiness",
                "score": min(readiness_score, 100),
                "observation": "Document preparation mentioned. Having IDs and forms organized expedites counter visits."
            }
        ]
        overall = int((clarity_score + politeness_score + readiness_score) / 3)

        return {
            "scenario_id": scenario_id,
            "staff_response": "Thank you for the written note. Please place the documents on the desk and sign here.",
            "actionable_feedback": "You clearly communicated your needs. Next, remember to request a stamped acknowledgement copy.",
            "rubric_scores": rubric,
            "overall_readiness_score": overall,
            "session_completed": len(history) >= 4,
            "engine": "deterministic_rubric_evaluator"
        }

rehearsal_service = RehearsalService()
