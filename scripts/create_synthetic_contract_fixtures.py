"""Generate reproducible, fictional PDF fixtures for LegalMind text/OCR evaluation."""

from __future__ import annotations

from pathlib import Path

from arabic_reshaper import reshape
from bidi.algorithm import get_display
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output" / "pdf"
GROUND_TRUTH_DIR = ROOT / "docs" / "evaluation" / "ground-truth"
TEMP_DIR = ROOT / "tmp" / "pdfs"
FONT_REGULAR = Path("C:/Windows/Fonts/arial.ttf")
FONT_BOLD = Path("C:/Windows/Fonts/arialbd.ttf")
PAGE_WIDTH, PAGE_HEIGHT = A4
IMAGE_WIDTH, IMAGE_HEIGHT = 2480, 3508

ENGLISH_PAGE_ONE = [
    ("title", "FREELANCE SERVICES AGREEMENT"),
    ("notice", "SYNTHETIC TEST FIXTURE - NOT A LEGAL TEMPLATE"),
    ("heading", "Sample details"),
    ("body", "Agreement date: 16 November 2026"),
    ("body", "Client: Cedar Example Company (fictional)"),
    ("body", "Freelancer: Noor Example (fictional)"),
    ("body", "Project: Three product illustrations delivered as PNG and SVG files by 30 November 2026."),
    ("heading", "1. Fee and milestones"),
    ("body", "The total fee is EGP 24,500. The client will pay 50% when work begins and 50% after the final deliverables are accepted."),
]

ENGLISH_PAGE_TWO = [
    ("title", "FREELANCE SERVICES AGREEMENT"),
    ("notice", "SYNTHETIC OCR PAGE - NOT A LEGAL TEMPLATE"),
    ("heading", "2. Review and payment"),
    ("body", "The client will review each delivery within 5 business days. The remaining invoice is due within 14 calendar days after acceptance."),
    ("heading", "3. Work ownership"),
    ("body", "Ownership of the final illustrations transfers to the client after full payment. The freelancer keeps ownership of tools and materials created before this project."),
    ("heading", "4. Ending the project"),
    ("body", "Either party may end the project by written notice. The client will pay for completed milestones and approved work completed up to the end date."),
    ("heading", "5. Liability limit"),
    ("body", "The parties propose a total liability limit of EGP 24,500. This sample wording is fictional and has not been reviewed for any jurisdiction."),
    ("notice", "END OF SYNTHETIC SAMPLE - NO REAL PARTIES OR LEGAL CLAIMS"),
]

ARABIC_PAGE_ONE = [
    ("title", "اتفاقية خدمات مستقلة"),
    ("notice", "نموذج صناعي للاختبار - ليس نموذجا قانونيا"),
    ("heading", "بيانات الاتفاق"),
    ("body", "تاريخ الاتفاق: 16 نوفمبر 2026"),
    ("body", "العميل: شركة سيدار المثال (جهة خيالية)"),
    ("body", "المستقل: نور المثال (شخصية خيالية)"),
    ("body", "المشروع: إعداد 3 رسومات توضيحية للمنتجات وتسليمها بصيغتي PNG و SVG في موعد أقصاه 30 نوفمبر 2026."),
    ("heading", "1. الأتعاب ومراحل العمل"),
    ("body", "إجمالي الأتعاب 24,500 جنيه مصري. يدفع العميل 50% عند بدء العمل و50% بعد قبول الملفات النهائية."),
]

ARABIC_PAGE_TWO = [
    ("title", "اتفاقية خدمات مستقلة"),
    ("notice", "صفحة ممسوحة ضوئيا للاختبار - ليس نموذجا قانونيا"),
    ("heading", "2. المراجعة والسداد"),
    ("body", "يراجع العميل كل تسليم خلال 5 أيام عمل. تسدد الفاتورة المتبقية خلال 14 يوما تقويميا من تاريخ القبول."),
    ("heading", "3. ملكية العمل"),
    ("body", "تنتقل ملكية الرسومات النهائية إلى العميل بعد سداد كامل الأتعاب. ويحتفظ المستقل بملكية الأدوات والمواد التي أنشأها قبل هذا المشروع."),
    ("heading", "4. إنهاء المشروع"),
    ("body", "يجوز لأي طرف إنهاء المشروع بإخطار كتابي. يدفع العميل قيمة المراحل المكتملة والعمل المعتمد حتى تاريخ الإنهاء."),
    ("heading", "5. حد المسؤولية"),
    ("body", "يقترح الطرفان حدا إجماليا للمسؤولية مقداره 24,500 جنيه مصري. هذه الصياغة خيالية ولم تراجع وفق قوانين أي اختصاص قضائي."),
    ("notice", "نهاية النموذج الصناعي - لا توجد أطراف حقيقية أو ادعاءات قانونية"),
]


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont("Arial", str(FONT_REGULAR)))
    pdfmetrics.registerFont(TTFont("Arial-Bold", str(FONT_BOLD)))


def draw_searchable_page(pdf: canvas.Canvas, blocks: list[tuple[str, str]], page_number: int) -> None:
    margin = 52
    y = PAGE_HEIGHT - 56
    pdf.setFillColor(colors.HexColor("#184d40"))
    pdf.rect(0, PAGE_HEIGHT - 12, PAGE_WIDTH, 12, fill=1, stroke=0)
    for kind, text in blocks:
        if kind == "title":
            pdf.setFont("Arial-Bold", 18)
            pdf.setFillColor(colors.HexColor("#233b32"))
            leading, gap = 27, 12
        elif kind == "notice":
            pdf.setFont("Arial-Bold", 7)
            pdf.setFillColor(colors.HexColor("#9a6d2a"))
            leading, gap = 14, 11
        elif kind == "heading":
            pdf.setFont("Arial-Bold", 11)
            pdf.setFillColor(colors.HexColor("#285a46"))
            leading, gap = 17, 4
        else:
            pdf.setFont("Arial", 9.5)
            pdf.setFillColor(colors.HexColor("#33423a"))
            leading, gap = 15, 8

        words = text.split()
        lines: list[str] = []
        line = ""
        for word in words:
            candidate = f"{line} {word}".strip()
            if pdfmetrics.stringWidth(candidate, pdf._fontname, pdf._fontsize) > PAGE_WIDTH - 2 * margin and line:
                lines.append(line)
                line = word
            else:
                line = candidate
        if line:
            lines.append(line)
        for line in lines:
            pdf.drawString(margin, y, line)
            y -= leading
        y -= gap

    pdf.setStrokeColor(colors.HexColor("#dce5de"))
    pdf.line(margin, 36, PAGE_WIDTH - margin, 36)
    pdf.setFont("Arial", 7)
    pdf.setFillColor(colors.HexColor("#829087"))
    pdf.drawString(margin, 23, "FICTIONAL DEVELOPMENT FIXTURE - NOT LEGAL ADVICE")
    pdf.drawRightString(PAGE_WIDTH - margin, 23, f"Page {page_number}")
    pdf.showPage()


def visual_text(text: str, arabic: bool) -> str:
    return get_display(reshape(text)) if arabic else text


def wrap_for_image(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int, arabic: bool) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        rendered = visual_text(candidate, arabic)
        if draw.textbbox((0, 0), rendered, font=font)[2] > max_width and current:
            lines.append(current)
            current = word
        else:
            current = candidate
    if current:
        lines.append(current)
    return lines


def make_scanned_page(blocks: list[tuple[str, str]], output: Path, arabic: bool) -> None:
    image = Image.new("RGB", (IMAGE_WIDTH, IMAGE_HEIGHT), "white")
    draw = ImageDraw.Draw(image)
    font_body = ImageFont.truetype(str(FONT_REGULAR), 48)
    font_heading = ImageFont.truetype(str(FONT_BOLD), 54)
    font_title = ImageFont.truetype(str(FONT_BOLD), 70)
    font_notice = ImageFont.truetype(str(FONT_BOLD), 35)
    margin = 190
    max_width = IMAGE_WIDTH - margin * 2
    y = 140
    for kind, text in blocks:
        if kind == "title":
            font, fill, leading, gap = font_title, "#233b32", 105, 35
        elif kind == "notice":
            font, fill, leading, gap = font_notice, "#8c6328", 55, 36
        elif kind == "heading":
            font, fill, leading, gap = font_heading, "#285a46", 82, 13
        else:
            font, fill, leading, gap = font_body, "#33423a", 76, 27

        for line in wrap_for_image(draw, text, font, max_width, arabic):
            rendered = visual_text(line, arabic)
            x = IMAGE_WIDTH - margin if arabic else margin
            anchor = "rt" if arabic else "lt"
            draw.text((x, y), rendered, font=font, fill=fill, anchor=anchor)
            y += leading
        y += gap

    footer_y = IMAGE_HEIGHT - 145
    draw.line((margin, footer_y, IMAGE_WIDTH - margin, footer_y), fill="#dce5de", width=3)
    footer = "FICTIONAL TEST FIXTURE - NOT LEGAL ADVICE" if not arabic else "نموذج صناعي للاختبار - ليس استشارة قانونية"
    draw.text((IMAGE_WIDTH - margin, footer_y + 35), visual_text(footer, arabic), font=font_notice, fill="#829087", anchor="rt")
    if y > footer_y - 55:
        raise ValueError(f"Synthetic page text overflows: {output.name}")
    image.save(output, format="PNG", dpi=(300, 300), optimize=True)


def write_source_text(path: Path, pages: list[list[tuple[str, str]]]) -> None:
    sections = []
    for page in pages:
        sections.extend(text for _, text in page if not text.startswith("SYNTHETIC") and not text.startswith("نموذج صناعي") and not text.startswith("صفحة ممسوحة") and not text.startswith("END OF") and not text.startswith("نهاية النموذج"))
    path.write_text("\n\n".join(sections) + "\n", encoding="utf-8")


def main() -> None:
    for directory in (OUTPUT_DIR, GROUND_TRUTH_DIR, TEMP_DIR):
        directory.mkdir(parents=True, exist_ok=True)
    register_fonts()

    english_truth = GROUND_TRUTH_DIR / "freelance_contract_english.txt"
    arabic_truth = GROUND_TRUTH_DIR / "freelance_contract_arabic.txt"
    write_source_text(english_truth, [ENGLISH_PAGE_ONE, ENGLISH_PAGE_TWO])
    write_source_text(arabic_truth, [ARABIC_PAGE_ONE, ARABIC_PAGE_TWO])

    english_scan = TEMP_DIR / "english_scanned_page.png"
    arabic_scan_one = TEMP_DIR / "arabic_scanned_page_1.png"
    arabic_scan_two = TEMP_DIR / "arabic_scanned_page_2.png"
    make_scanned_page(ENGLISH_PAGE_TWO, english_scan, arabic=False)
    make_scanned_page(ARABIC_PAGE_ONE, arabic_scan_one, arabic=True)
    make_scanned_page(ARABIC_PAGE_TWO, arabic_scan_two, arabic=True)

    english_pdf = canvas.Canvas(str(OUTPUT_DIR / "synthetic_contract_english_mixed.pdf"), pagesize=A4, pageCompression=1)
    draw_searchable_page(english_pdf, ENGLISH_PAGE_ONE, 1)
    english_pdf.drawImage(str(english_scan), 0, 0, width=PAGE_WIDTH, height=PAGE_HEIGHT, preserveAspectRatio=False)
    english_pdf.showPage()
    english_pdf.save()

    arabic_pdf = canvas.Canvas(str(OUTPUT_DIR / "synthetic_contract_arabic_scanned.pdf"), pagesize=A4, pageCompression=1)
    for page_number, image in enumerate((arabic_scan_one, arabic_scan_two), start=1):
        arabic_pdf.drawImage(str(image), 0, 0, width=PAGE_WIDTH, height=PAGE_HEIGHT, preserveAspectRatio=False)
        arabic_pdf.showPage()
    arabic_pdf.save()

    for image in (english_scan, arabic_scan_one, arabic_scan_two):
        image.unlink(missing_ok=True)

    print(f"Created {OUTPUT_DIR / 'synthetic_contract_english_mixed.pdf'}")
    print(f"Created {OUTPUT_DIR / 'synthetic_contract_arabic_scanned.pdf'}")
    print(f"Ground truth: {english_truth}")
    print(f"Ground truth: {arabic_truth}")


if __name__ == "__main__":
    main()
