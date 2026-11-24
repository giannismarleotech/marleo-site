"""Replace historic hand-drawn logos without changing brochure body content.

Requires PyMuPDF and CairoSVG. Both wordmark variants use the same outlined
letter and icon paths; the print version changes only white lettering to ink.
"""
from pathlib import Path
import fitz
import cairosvg

ROOT = Path(__file__).resolve().parents[1]
print_logo = cairosvg.svg2png(
    bytestring=(ROOT / 'assets/marleo-document-wordmark.svg').read_bytes(),
    output_width=930, output_height=192,
)
white_logo = (ROOT / 'assets/marleo-email-wordmark.png').read_bytes()

for file in sorted((ROOT / 'docs').glob('marleo-*.pdf')):
    doc = fitz.open(file)
    before = [page.get_text()[page.get_text().find('U I T L E G'):] for page in doc]
    for page in doc:
        box = fitz.Rect(49, 35, 190, 70)
        page.add_redact_annot(box, fill=(1, 1, 1))
        page.apply_redactions(images=2, graphics=0)
        page.draw_rect(box, color=None, fill=(1, 1, 1), overlay=True)
        page.insert_image(fitz.Rect(51, 36, 192, 36 + 141 * 192 / 930), stream=print_logo)
    for index, page in enumerate(doc):
        # The original logo is the only removed text. All brochure copy remains.
        assert before[index] in page.get_text(), f'Body changed: {file}, page {index + 1}'
    temporary = file.with_suffix('.brand.pdf')
    doc.save(temporary, garbage=4, deflate=True)
    doc.close()
    temporary.replace(file)

file = ROOT / 'assets/marleo-company-profile.pdf'
doc = fitz.open(file)
for page in doc:
    # Existing profile header background, sampled from the untouched margin.
    pix = page.get_pixmap(clip=fitz.Rect(20, 20, 21, 21), alpha=False)
    background = tuple(channel / 255 for channel in pix.samples[:3])
    box = fitz.Rect(42, 23, 200, 52)
    page.add_redact_annot(box, fill=background)
    page.apply_redactions(images=2, graphics=0)
    page.draw_rect(box, color=None, fill=background, overlay=True)
    page.insert_image(fitz.Rect(44, 24, 174, 24 + 130 * 192 / 930), stream=white_logo)
temporary = file.with_suffix('.brand.pdf')
doc.save(temporary, garbage=4, deflate=True)
doc.close()
temporary.replace(file)
