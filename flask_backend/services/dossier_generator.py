import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

def create_dossier_pdf(person_data: dict, network_data: str, risk_score: float) -> bytes:
    """
    Generates a formal Intelligence Dossier PDF in-memory using reportlab.
    """
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Header
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(colors.darkblue)
    c.drawString(50, height - 50, "PROJECT NEXUS - OFFICIAL INTELLIGENCE DOSSIER")
    
    c.setLineWidth(2)
    c.line(50, height - 60, width - 50, height - 60)
    
    c.setFont("Helvetica", 12)
    c.setFillColor(colors.black)
    
    # Sub-header
    c.drawString(50, height - 80, f"Subject: {person_data.get('name', 'UNKNOWN')}")
    c.drawString(50, height - 100, f"System Risk Score: {risk_score}/100")
    
    # Summary
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 140, "Network Analysis Summary")
    
    c.setFont("Helvetica", 12)
    
    # Naive word-wrap logic for the description text
    text_object = c.beginText(50, height - 160)
    text_object.setLeading(14)
    
    words = network_data.split(' ')
    line = ""
    for word in words:
        if c.stringWidth(line + word + " ", "Helvetica", 12) < (width - 100):
            line += word + " "
        else:
            text_object.textLine(line)
            line = word + " "
    if line:
        text_object.textLine(line)
        
    c.drawText(text_object)
    
    # Footer
    c.setFont("Helvetica-Oblique", 10)
    c.drawString(50, 50, "Generated automatically by Project Nexus (Aatmanirbhar AI Network System)")
    
    c.showPage()
    c.save()
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
