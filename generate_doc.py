import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

doc = docx.Document()

# Set standard margins (1 inch)
for section in doc.sections:
    section.top_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.right_margin = Inches(1)

# Helper for shading table cells
def set_cell_shading(cell, color_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

# Title
title_p = doc.add_paragraph()
title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
title_p.paragraph_format.space_before = Pt(12)
title_p.paragraph_format.space_after = Pt(4)
run_title = title_p.add_run("CHRONICLE NEWS NETWORK")
run_title.font.name = "Arial"
run_title.font.size = Pt(24)
run_title.font.bold = True
run_title.font.color.rgb = RGBColor(15, 23, 42) # Slate 900

# Subtitle
sub_p = doc.add_paragraph()
sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
sub_p.paragraph_format.space_after = Pt(24)
run_sub = sub_p.add_run("Full-Stack Web & Android Mobile Application Project Report")
run_sub.font.name = "Arial"
run_sub.font.size = Pt(13)
run_sub.font.color.rgb = RGBColor(100, 116, 139) # Slate 500

# Info Callout Box (Table)
info_table = doc.add_table(rows=4, cols=2)
info_table.alignment = WD_TABLE_ALIGNMENT.CENTER
info_data = [
    ("Project Name:", "Chronicle News Network (Web & Android APK)"),
    ("Architecture:", "React 19 SPA + Vite + Capacitor Android Native Shell"),
    ("Deployment & Hosting:", "Web Browser (Localhost/WAMP/Cloud) & Android (Direct Google Link)"),
    ("Target Platform:", "Cross-Platform (Desktop, Tablet, Mobile Browsers & Android OS)")
]
for row_idx, (k, v) in enumerate(info_data):
    row = info_table.rows[row_idx]
    c1, c2 = row.cells[0], row.cells[1]
    c1.text = k
    c2.text = v
    c1.paragraphs[0].runs[0].font.bold = True
    c1.paragraphs[0].runs[0].font.size = Pt(10)
    c2.paragraphs[0].runs[0].font.size = Pt(10)
    set_cell_shading(c1, "F1F5F9")
    set_cell_shading(c2, "F8FAFC")
    set_cell_margins(c1, top=120, bottom=120, left=150, right=150)
    set_cell_margins(c2, top=120, bottom=120, left=150, right=150)

doc.add_paragraph().paragraph_format.space_after = Pt(12)

# Helper function for adding professional section headings
def add_section_heading(title):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(18)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(title)
    run.font.name = "Arial"
    run.font.size = Pt(15)
    run.font.bold = True
    run.font.color.rgb = RGBColor(30, 58, 138) # Deep Blue
    return p

def add_body_p(text, bold_prefix=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Arial"
        r_pre.font.size = Pt(10.5)
        r_pre.font.bold = True
    r = p.add_run(text)
    r.font.name = "Arial"
    r.font.size = Pt(10.5)
    r.font.color.rgb = RGBColor(51, 65, 85)
    return p

def add_bullet(bold_prefix, text):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    r_pre = p.add_run(bold_prefix + " ")
    r_pre.font.name = "Arial"
    r_pre.font.size = Pt(10)
    r_pre.font.bold = True
    r = p.add_run(text)
    r.font.name = "Arial"
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor(51, 65, 85)
    return p

# SECTION 1
add_section_heading("1. Project Executive Summary")
add_body_p(
    "Chronicle News Network is a modern, high-fidelity digital journalism and multimedia web application designed to deliver real-time news articles, breaking alerts, video coverage, and localized content. The platform has been engineered with dual-delivery architecture: it functions seamlessly as a responsive web application across all modern desktop/mobile browsers and as an installable standalone native Android mobile application (APK)."
)

# SECTION 2
add_section_heading("2. Core Technical Architecture")
add_bullet("Frontend Framework:", "React 19 & Vite 8 for high-performance virtual DOM rendering and sub-millisecond hot module replacement.")
add_bullet("Styling & Design System:", "Bespoke Glassmorphism design system using vanilla CSS with dark-mode aesthetic, micro-animations, and fluid responsive layouts.")
add_bullet("Local Storage & Database:", "Client-side IndexedDB service (ChronicleNewsDB) enabling full offline viewing, local article caching, and views counter.")
add_bullet("Native Mobile Shell:", "Capacitor 8 Android SDK integration, wrapping web production assets into a compiled native Android project with Java and Gradle.")
add_bullet("Cloud Compilation:", "Automated GitHub Actions CI/CD pipeline building release-ready Android debug APKs without requiring local Android Studio overhead.")
add_bullet("Cloud Distribution:", "Integrated Google Drive direct-download link parser with one-click APK download actions across navigation, mobile menu, and footer.")

# SECTION 3
add_section_heading("3. How to Run the Application on Browser")
add_body_p("The web application can be launched in two distinct ways depending on the environment:")

add_bullet("Method A — Development Server (Recommended):", "Run 'npm run dev' inside the project directory. The Vite server starts at http://localhost:5173 with active Hot Module Reloading (HMR).")
add_bullet("Method B — Apache / WAMP Server:", "Run 'npm run build' to bundle assets into the dist/ directory. With WAMP running, open http://localhost/news/dist/ in any browser. The assets use relative paths ('./') ensuring zero 404 MIME errors.")

# SECTION 4
add_section_heading("4. Android APK Generation via Cloud CI/CD")
add_body_p(
    "To deliver the application as an installable Android APK without demanding heavy local dependencies (such as Android Studio, JDK 17, and Android SDK command-line tools), a cloud CI/CD pipeline was implemented using GitHub Actions."
)
add_bullet("1. Push Code:", "Commit and push the project repository to GitHub ('git push origin main').")
add_bullet("2. Automated Build:", "The GitHub Actions workflow (.github/workflows/build-apk.yml) triggers in the cloud, installs JDK 17, compiles the React bundle, synchronizes Capacitor, and runs './gradlew assembleDebug'.")
add_bullet("3. Download Artifact:", "Upon completion (~2 minutes), the downloadable APK artifact ('ChronicleNews-v1.0.0-APK') is available directly under GitHub Actions for instant download.")

# SECTION 5
add_section_heading("5. Google Drive APK Hosting & One-Click Download Integration")
add_body_p(
    "For public distribution, the generated APK file is hosted via Google Drive or direct web server hosting, allowing any Android user to download and install the app with a single click."
)

add_bullet("Direct Link Protocol:", "When hosting on Google Drive, standard view links are transformed into instant download links using the Google user content endpoint: https://drive.google.com/uc?export=download&id=FILE_ID")
add_bullet("In-App Link Management:", "Administrators can log in to the Chronicle Admin Dashboard (credentials: admin / admin123) and paste their Google Drive link into the 'Android App (APK) Download Link' manager. The system automatically parses the file ID and saves it to local state.")
add_bullet("User Download Buttons:", "Visitors to the website are presented with a glowing 'Download APK' button in the navigation header, an expanded tile in the mobile drawer, and a direct link in the footer system menu.")

# SECTION 6
add_section_heading("6. Key Application Modules & Features")
add_bullet("1. Breaking News Ticker:", "Real-time horizontal animated broadcast ticker highlighting urgent global news.")
add_bullet("2. Categorized Feeds:", "Instant filtering across Politics, Technology, World News, Sports, Business, and Entertainment.")
add_bullet("3. Video Hub:", "Dedicated video streaming center with embedded video players, playback counters, and metadata.")
add_bullet("4. Content Management System (CMS):", "Full administrative interface enabling editors to publish, edit, or delete articles and video stories with image/video attachments.")
add_bullet("5. Offline Capabilities:", "IndexedDB persistence guarantees that loaded articles remain readable even when network connectivity is lost.")

# SECTION 7
add_section_heading("7. Conclusion")
add_body_p(
    "The Chronicle News Network project demonstrates a complete end-to-end full-stack workflow: modern frontend development in React 19, cross-platform Android packaging with Capacitor, automated cloud build engineering with GitHub Actions, and seamless public distribution via Google Drive direct links."
)

# Save document
output_path = r"c:\wamp64\www\news\Chronicle_News_Project_Report.docx"
doc.save(output_path)
print(f"Report saved to {output_path}")
