import pytest
from backend.services.ambiguity_service import ambiguity_service

def test_critical_relative_date_and_provenance():
    """
    Critical prompt requirement test:
    Input: 'Go to Counter 2. Bring your student ID. Return tomorrow morning.'
    Must:
    1. Not label details as 'User-Confirmed' (Status must be 'Unresolved').
    2. Identify 'tomorrow morning' as a relative/ambiguous time.
    3. Generate clarification for the relative time without fabricating a calendar date.
    4. Extract Counter 2 and student ID with AI-extracted provenance.
    """
    test_input = "Go to Counter 2. Bring your student ID. Return tomorrow morning."
    facts, gaps, relative_dates, clarifications = ambiguity_service.analyze_text(test_input)

    # 1. Check relative date ambiguity detection
    assert "tomorrow morning" in relative_dates, "Expected 'tomorrow morning' to be detected as a relative date."
    gap_quotes = [g.quote.lower() for g in gaps]
    assert "tomorrow morning" in gap_quotes, "Expected a gap entry quoting 'tomorrow morning'."

    # 2. Check no false confirmation
    for f in facts:
        assert f.status == "Unresolved", f"Fact '{f.field}' was incorrectly marked as {f.status} instead of Unresolved."
        assert f.provenance == "AI-extracted", f"Fact '{f.field}' should have provenance AI-extracted."

    # 3. Check extracted facts
    fact_fields = {f.field: f.value for f in facts}
    assert "Location/Counter" in fact_fields
    assert "Counter 2" in fact_fields["Location/Counter"]
    assert "Required Document" in fact_fields
    assert "student ID" in fact_fields["Required Document"]

    # 4. Check clarification questions generated
    assert len(clarifications) > 0
    assert any("date" in c.lower() or "time" in c.lower() or "open" in c.lower() for c in clarifications)

def test_vague_location_pronoun():
    test_input = "Submit your documents there before 4 PM."
    facts, gaps, relative_dates, clarifications = ambiguity_service.analyze_text(test_input)

    gap_categories = [g.category for g in gaps]
    assert "vague_location" in gap_categories
    assert any("there" in g.quote.lower() for g in gaps)
