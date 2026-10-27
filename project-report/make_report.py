#!/usr/bin/env python3
"""
SignMitra Final Review College Project Report Generator
Outputs:
  - project-report/SignMitra_Final_Review_Report.docx
  - project-report/SignMitra_Final_Review_Report.pdf (Exactly 33 pages matching template)

Author: Rimsha Konain C (Reg No: 310624104265)
Supervisor: Ms. Nagamani Segalla
Institution: Easwari Engineering College (Autonomous), Chennai
"""

import os
import sys
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch, cm, pt
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image as RLImage,
    Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT

REPORT_DIR = os.path.dirname(os.path.abspath(__file__))
FIG_DIR = os.path.join(REPORT_DIR, "figures")
LOGO_PATH = os.path.join(REPORT_DIR, "college_logo.png")
DOCX_PATH = os.path.join(REPORT_DIR, "SignMitra_Final_Review_Report.docx")
PDF_PATH = os.path.join(REPORT_DIR, "SignMitra_Final_Review_Report.pdf")

print("Report generator initialized.")
print(f"Figures directory: {FIG_DIR}")
print(f"Target DOCX: {DOCX_PATH}")
print(f"Target PDF: {PDF_PATH}")

