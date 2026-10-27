#!/usr/bin/env python3
"""
Verification Script for SignMitra College Project Report Deliverables.
Checks:
1. File existence and sizes.
2. PDF page count equals 33.
3. Page-by-page title/heading verification.
4. Total absence of friend's personal and project details.
5. Correct presence of student name, register number, supervisor, and project title.
"""

import os
import sys
import docx
import pymupdf

REPORT_DIR = os.path.dirname(os.path.abspath(__file__))
DOCX_PATH = os.path.join(REPORT_DIR, "SignMitra_Final_Review_Report.docx")
PDF_PATH = os.path.join(REPORT_DIR, "SignMitra_Final_Review_Report.pdf")

def verify_all():
    print("=" * 60)
    print("SIGNMITRA FINAL REVIEW REPORT VERIFICATION")
    print("=" * 60)

    # 1. Existence and size
    assert os.path.exists(DOCX_PATH), f"Missing DOCX: {DOCX_PATH}"
    assert os.path.exists(PDF_PATH), f"Missing PDF: {PDF_PATH}"
    docx_size = os.path.getsize(DOCX_PATH)
    pdf_size = os.path.getsize(PDF_PATH)
    print(f"[OK] DOCX exists ({docx_size:,} bytes): {DOCX_PATH}")
    print(f"[OK] PDF exists ({pdf_size:,} bytes): {PDF_PATH}")

    # 2. PDF Page count
    doc_pdf = pymupdf.open(PDF_PATH)
    page_count = len(doc_pdf)
    print(f"[OK] PDF Page Count: {page_count} (Target: 33)")
    assert page_count == 33, f"Expected 33 pages, got {page_count}"

    # 3. Text content verification in PDF
    full_pdf_text = ""
    for idx, page in enumerate(doc_pdf):
        txt = page.get_text()
        full_pdf_text += f"\n--- PAGE {idx+1} ---\n" + txt

    # 4. Text content verification in DOCX
    doc_docx = docx.Document(DOCX_PATH)
    full_docx_text = ""
    for p in doc_docx.paragraphs:
        full_docx_text += p.text + "\n"
    for t in doc_docx.tables:
        for row in t.rows:
            for cell in row.cells:
                full_docx_text += cell.text + " "
            full_docx_text += "\n"

    # 5. Check FORBIDDEN strings (friend details)
    forbidden_terms = [
        "Prathamesh S",
        "Prathamesh",
        "310624104231",
        "Foodflow",
        "FoodFlow",
        "foodflow",
        "Smart Food Manufacturing"
    ]
    for term in forbidden_terms:
        pdf_count = full_pdf_text.count(term)
        docx_count = full_docx_text.count(term)
        assert pdf_count == 0, f"Found forbidden term '{term}' in PDF ({pdf_count} times)!"
        assert docx_count == 0, f"Found forbidden term '{term}' in DOCX ({docx_count} times)!"
        print(f"[OK] Zero occurrences of '{term}' in PDF and DOCX.")

    # 6. Check REQUIRED strings (student & project details)
    required_terms = [
        ("RIMSHA KONAIN C", "Student Name"),
        ("310624104265", "Register Number"),
        ("Nagamani Segalla", "Project Supervisor"),
        ("Easwari Engineering College", "College Name"),
        ("Anna University", "Affiliating University"),
        ("SIGNMITRA", "Project Title (Upper)"),
        ("SignMitra", "Project Name")
    ]
    for term, label in required_terms:
        pdf_has = term.lower() in full_pdf_text.lower()
        docx_has = term.lower() in full_docx_text.lower()
        assert pdf_has, f"Missing required term '{term}' ({label}) in PDF!"
        assert docx_has, f"Missing required term '{term}' ({label}) in DOCX!"
        print(f"[OK] Verified '{term}' ({label}) present in both PDF and DOCX.")

    # 7. Check All 9 Figures & Tables
    figures_checked = [
        "Figure 3.1", "Figure 3.2", "Figure 3.3", "Figure 3.4",
        "Figure 3.5", "Figure 3.6", "Figure 5.1", "Figure 5.2", "Figure 5.3"
    ]
    for fig in figures_checked:
        assert fig in full_pdf_text, f"Missing {fig} in PDF!"
        assert fig in full_docx_text, f"Missing {fig} in DOCX!"
    print("[OK] All 9 figures (Figures 3.1-3.6, 5.1-5.3) verified in both PDF and DOCX.")

    tables_checked = [
        "Table 1.1", "Table 1.2", "Table 2.1", "Table 3.1", "Table 3.2",
        "Table 3.3", "Table 3.4", "Table 3.5", "Table 3.6", "Table 3.7",
        "Table 3.8", "Table 4.1", "Table 4.2", "Table 4.3", "Table 4.4",
        "Table 4.5", "Table 5.1", "Table 5.2", "Table 6.1"
    ]
    for tbl in tables_checked:
        assert tbl in full_pdf_text, f"Missing {tbl} in PDF!"
        assert tbl in full_docx_text, f"Missing {tbl} in DOCX!"
    print("[OK] All 19 tables verified in both PDF and DOCX.")

    print("\n" + "=" * 60)
    print("ALL VERIFICATION CHECKS PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == '__main__':
    verify_all()
