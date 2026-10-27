# Test script to verify reportlab custom page template with double borders and page numbers
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        # Draw double border on every page
        w, h = A4
        # Outer border
        self.setStrokeColor(colors.HexColor('#1E293B'))
        self.setLineWidth(1.5)
        self.rect(20, 20, w - 40, h - 40)
        # Inner border
        self.setLineWidth(0.6)
        self.rect(23, 23, w - 46, h - 46)

        # Header and Footer (pages > 1)
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor('#475569'))
            self.drawString(35, h - 35, "EASWARI ENGINEERING COLLEGE | DEPARTMENT OF CSE")
            self.drawRightString(w - 35, h - 35, "SIGNMITRA - FINAL REVIEW REPORT")
            self.setStrokeColor(colors.HexColor('#CBD5E1'))
            self.setLineWidth(0.5)
            self.line(35, h - 38, w - 35, h - 38)

            # Footer
            self.line(35, 38, w - 35, 38)
            self.setFont("Helvetica", 9)
            self.setFillColor(colors.HexColor('#1E293B'))
            
            # Page numbering logic:
            # Pages 1 to 5: no page numbers printed
            # Pages 6 to 9: Roman numerals i, ii, iii, iv
            # Pages 10 to 33: Arabic numbers 1 to 24
            if self._pageNumber in [6, 7, 8, 9]:
                roman = ["i", "ii", "iii", "iv"][self._pageNumber - 6]
                self.drawCentredString(w / 2.0, 26, roman)
            elif self._pageNumber >= 10:
                arabic = str(self._pageNumber - 9)
                self.drawCentredString(w / 2.0, 26, arabic)

        self.restoreState()

print("Canvas class defined successfully")

