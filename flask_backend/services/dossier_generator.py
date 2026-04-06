import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from services.tigergraph_client import get_tg_connection

def generate_dossier_pdf(person_id: str) -> io.BytesIO:
    """
    Renders a formatted formal PDF file into a memory buffer containing Target's full dossier.
    """
    conn = get_tg_connection()
    
    # Note: Using getVertices() and filtering manually if getVerticesById() fails, or just get edges directly.
    # In pyTigerGraph, we can just grab all edges directly to find what we know.
    try:
        person_nodes = conn.getVertices("Person")
        person = next((p for p in person_nodes if p["v_id"] == person_id), None)
    except Exception:
        person = None
        
    if not person:
        raise ValueError(f"Person {person_id} not found in database.")
        
    p_data = person.get("attributes", {})
    
    # Fetch 1-hop connections
    accounts, devices, associates = [], [], []
    try:
        edges = conn.getEdges("Person", person_id)
        for e in edges:
            to_id = e.get("to_id")
            etype = e.get("e_type")
            if etype == "OWNS_ACCOUNT":
                accounts.append(to_id)
            elif etype == "USES_DEVICE":
                devices.append(to_id)
            elif etype == "ASSOCIATES_WITH":
                associates.append(to_id)
    except Exception as e:
        print(f"Error fetching edges for PDF: {e}")
        
    # Begin PDF creation
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Header Bar
    c.setFillColor(colors.HexColor('#101015'))
    c.rect(0, height - 60, width, 60, fill=1)
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(40, height - 38, "PROJECT NEXUS: OFFICIAL INTELLIGENCE DOSSIER")
    
    # Rest of content is black text
    c.setFillColor(colors.black)
    
    # Mugshot Placeholder
    c.setStrokeColor(colors.gray)
    c.rect(40, height - 200, 120, 120)
    c.setFont("Helvetica", 10)
    c.setFillColor(colors.gray)
    c.drawString(65, height - 145, "[ IMG_MUGSHOT ]")
    
    c.setFillColor(colors.black)
    
    # Core Demographics Profile
    c.setFont("Helvetica-Bold", 16)
    c.drawString(180, height - 100, f"TARGET ID: {person_id}")
    
    c.setFont("Helvetica", 12)
    c.drawString(180, height - 125, f"Full Name: {p_data.get('name', 'UNKNOWN')}")
    c.drawString(180, height - 145, f"Age Profile: {p_data.get('age', 'UNKNOWN')}")
    
    # Threat Level (Color-Coded)
    risk = p_data.get('risk_score', 0)
    if risk > 75:
        c.setFillColor(colors.red)
        risk_label = "CRITICAL THREAT"
    elif risk > 40:
        c.setFillColor(colors.orange)
        risk_label = "ELEVATED THREAT"
    else:
        c.setFillColor(colors.HexColor("#00aacc"))
        risk_label = "LOW THREAT (SURVEILLANCE ONLY)"
        
    c.drawString(180, height - 165, f"Base Threat Level: {risk}/100 - {risk_label}")
    c.setFillColor(colors.black)
    
    # Draw Separator Line
    c.line(40, height - 220, width - 40, height - 220)
    
    # Assets Section
    y = height - 250
    def print_section(title, items, icon_str=">"):
        nonlocal y
        c.setFont("Helvetica-Bold", 14)
        c.drawString(40, y, title)
        y -= 20
        c.setFont("Helvetica", 11)
        
        if not items:
            c.setFillColor(colors.gray)
            c.drawString(50, y, "No associated records found in TigerGraph database.")
            c.setFillColor(colors.black)
            y -= 25
            return
            
        for item in items:
            c.drawString(50, y, f"{icon_str}  {item}")
            y -= 18
            if y < 80:
                c.showPage()
                y = height - 60
                c.setFont("Helvetica", 11)
        y -= 15
        
    print_section("FINANCIAL ASSETS (Bank Accounts / Hawala Flow Nodes)", accounts, "$")
    
    # Draw Separator Line
    c.line(40, y, width - 40, y)
    y -= 20
    
    print_section("COMMUNICATION DEVICES (IMEI / Mobile)", devices, "#")
    
    # Draw Separator Line
    c.line(40, y, width - 40, y)
    y -= 20
    
    print_section("KNOWN ASSOCIATES (1-Hop Criminal Network)", associates, "@")
    
    # Footer Stamp
    c.setFont("Helvetica-Oblique", 9)
    c.setFillColor(colors.gray)
    c.drawString(40, 30, "Report synthesized autonomously via Project Nexus Database / TigerGraph Cloud.")
    
    # Finalize
    c.save()
    buffer.seek(0)
    return buffer
