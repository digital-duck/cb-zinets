import asyncio
import re
import sys
from pathlib import Path

from api.config import settings

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(_REPO_ROOT / "scripts"))
from catalog_lib import update_catalog  # noqa: E402
from cb_paths import pdf_rel, variant_html_dir, variant_pdf_dir  # noqa: E402

_HTML2PDF = _REPO_ROOT / "scripts" / "html2pdf.js"

# ── Print-HTML aggregation ────────────────────────────────────────────────────
# Books are thin (single-character concepts are TOC links to standalone pages,
# only the phrase capstone + payoff are inline), so the PDF path re-aggregates
# content into one static document:
#   1. Contents — the TOC as the first section
#   2..n. each concept page's <main>, in TOC order (single-character pages
#         first by construction, then any non-single-char concept pages)
#   last. capstone + payoff sections, inlined in the book itself
# All <script> tags and the interactive char-tools widget are stripped —
# print rendering is static, so no HanziWriter/speech code ever runs.

_TOC_LINK_RE = re.compile(r'<li[^>]*><a href="([^"]+)">(.*?)</a></li>', re.S)
_MAIN_RE = re.compile(r'<main>(.*?)</main>', re.S)
_SCRIPT_RE = re.compile(r'<script\b.*?</script>', re.S)
_CHAR_TOOLS_SPAN_RE = re.compile(r'<span class="char-tools">.*?</button></span>', re.S)
_CHAR_TOOLS_STYLE_RE = re.compile(r'<style>\.char-tools\{.*?</style>', re.S)
_TITLE_RE = re.compile(r'<h1 class="book-title">(.*?)</h1>', re.S)

_PRINT_CSS = """
body { font-family: Georgia, 'Noto Serif CJK SC', serif; color: #1a1a1a;
       line-height: 1.65; font-size: 12pt; margin: 0; }
h1 { font-size: 1.6rem; color: #1e3a5f; }
h2 { font-size: 1.25rem; color: #1e3a5f; margin-top: 0; }
section.pdf-section { page-break-before: always; padding-top: 8mm; }
section.pdf-toc { page-break-before: avoid; }
ol.pdf-toc-list { font-size: 1.05rem; line-height: 2; }
.pdf-cover { text-align: center; padding-top: 60mm; }
.pdf-cover .pdf-domain { font-size: 2.2rem; color: #1e3a5f; margin: 0; }
.pdf-cover .pdf-sub { color: #6b7280; margin-top: 8mm; }
img { max-width: 100%; }
"""


def _strip_interactive(html: str) -> str:
    """Remove scripts and the stroke-order/pronounce widget from a fragment."""
    html = _SCRIPT_RE.sub('', html)
    html = _CHAR_TOOLS_SPAN_RE.sub('', html)
    html = _CHAR_TOOLS_STYLE_RE.sub('', html)
    return html


def _concept_main(concept_file: Path) -> str | None:
    """Inner <main> of a concept page, stripped for print; None if unreadable."""
    try:
        raw = concept_file.read_text(encoding="utf-8")
    except OSError:
        return None
    m = _MAIN_RE.search(raw)
    return _strip_interactive(m.group(1).strip()) if m else None


_SECTION_OPEN_RE = re.compile(r'<section id="([^"]+)">')
_SECTION_TOKEN_RE = re.compile(r'<section\b|</section>')


def _book_sections(book: str) -> dict[str, str]:
    """id → inner content for the book's top-level sections.

    Balance-aware: inline sections embed concept-page fragments that contain
    nested <section> wrappers, so a non-greedy regex would truncate them.
    """
    out = {}
    for m in _SECTION_OPEN_RE.finditer(book):
        depth = 1
        pos = m.end()
        while depth:
            t = _SECTION_TOKEN_RE.search(book, pos)
            if not t:
                pos = len(book)
                break
            depth += 1 if t.group(0) != '</section>' else -1
            pos = t.end()
        inner_end = pos - len('</section>') if depth == 0 else pos
        out[m.group(1)] = book[m.end():inner_end].strip()
    return out


def build_print_html(book_file: Path) -> str:
    """Aggregate a (thin or legacy fat) book into one static print document."""
    book = book_file.read_text(encoding="utf-8")
    html_dir = book_file.parent

    # <title> is "{target} — {domain}" in both current and legacy templates —
    # more reliable than the first <h1 class="book-title">, which in legacy
    # fat/thinned books can belong to an embedded concept section.
    title_tag = re.search(r'<title>(.*?)</title>', book, re.S)
    if title_tag:
        parts = title_tag.group(1).split(' — ', 1)
        title, domain = parts[0].strip(), (parts[1].strip() if len(parts) > 1 else '')
    else:
        title_m = _TITLE_RE.search(book)
        title = _strip_interactive(title_m.group(1)) if title_m else book_file.stem
        domain = ''

    # Legacy books lack a closing </nav>; the nav always precedes <main>,
    # so accept either terminator.
    nav_m = re.search(r'<nav class="toc">.*?(?:</nav>|<main>)', book, re.S)
    entries = _TOC_LINK_RE.findall(nav_m.group(0)) if nav_m else []

    inline_sections = _book_sections(book)
    toc_items = []
    sections = []
    for href, label in entries:
        label = label.strip()
        toc_items.append(f'<li>{label}</li>')
        if href.startswith('#'):
            # Inline book section (capstone / payoff / multi-glyph concept)
            body = inline_sections.get(href[1:])
            if body is not None:
                sections.append(f'<section class="pdf-section">\n{_strip_interactive(body)}\n</section>')
        else:
            # Linked concept page (single-char and any other concept files)
            body = _concept_main(html_dir / href)
            if body is None:
                body = f'<h2>{label}</h2><p>(content not available)</p>'
            else:
                # Drop the concept page's own <h1> book-title line; its
                # section heading already carries the emoji + label.
                body = re.sub(r'<h1 class="book-title">.*?</h1>', '', body, count=1, flags=re.S)
            sections.append(f'<section class="pdf-section">\n{body}\n</section>')

    toc_html = (
        '<section class="pdf-toc">\n<h2>Contents</h2>\n'
        '<ol class="pdf-toc-list">\n' + '\n'.join(toc_items) + '\n</ol>\n</section>'
    )
    cover = (
        '<div class="pdf-cover">'
        f'<h1 class="pdf-domain">{title}</h1>'
        + (f'<div class="pdf-sub">{domain}</div>' if domain and domain != title else '')
        + '</div>'
    )
    lang_m = re.search(r'<html([^>]*)>', book)
    lang_attr = lang_m.group(1) if lang_m else ' lang="en"'
    # MathJax in the head only (content scripts stay stripped): some concept
    # sections carry $$…$$ math, and html2pdf.js waits for MathJax typesetting.
    mathjax = (
        '<script>MathJax = { tex: { inlineMath: [["$","$"],["\\\\(","\\\\)"]], '
        'displayMath: [["$$","$$"],["\\\\[","\\\\]"]] } };</script>\n'
        '<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" async></script>\n'
    )
    return (
        f'<!DOCTYPE html>\n<html{lang_attr}>\n<head>\n<meta charset="utf-8">\n'
        f'<title>{title}</title>\n{mathjax}<style>{_PRINT_CSS}</style>\n</head>\n<body>\n'
        + cover + '\n' + toc_html + '\n' + '\n'.join(sections) + '\n</body>\n</html>\n'
    )


async def generate_pdf(
    domain_id: str, target: str, level: str = "intro", language: str = "en", model: str = "gemma4"
) -> dict:
    html_dir = settings.public_domains / domain_id / variant_html_dir(level, language, model)
    pdf_dir = settings.public_domains / domain_id / variant_pdf_dir(level, language, model)
    pdf_dir.mkdir(parents=True, exist_ok=True)

    html_file = html_dir / f"book_{target}.html"

    if not html_file.exists():
        # Legacy naming drift: some earlier runs wrote book files under a
        # repeated-characters-deduped target (domain 没头没脑 → book_phrase_没头脑.html).
        # If this variant has exactly one book, use it.
        candidates = sorted(html_dir.glob("book_*.html")) if html_dir.exists() else []
        if len(candidates) == 1:
            html_file = candidates[0]
            target = html_file.stem[len("book_"):]
        else:
            return {"ok": False, "error": f"HTML not found: {html_file}. Generate the book first."}

    pdf_file = pdf_dir / f"book_{target}.pdf"

    # Aggregate the thin book + its linked concept pages into one static
    # document (kept in pdf/ so browse/catalog scans of html/ never see it).
    print_file = pdf_dir / f"book_{target}_print.html"
    print_file.write_text(build_print_html(html_file), encoding="utf-8")

    cmd = ["node", str(_HTML2PDF), "--input", str(print_file), "--output", str(pdf_file)]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
    )
    stdout, _ = await proc.communicate()

    if proc.returncode != 0:
        return {"ok": False, "error": stdout.decode(errors="replace")}

    rel_path = pdf_rel(level, language, model, target)
    _mark_pdf_generated(domain_id, target, level, language, model, rel_path)
    return {"ok": True, "file": rel_path}


def _mark_pdf_generated(
    domain_id: str, target: str, level: str, language: str, model: str, rel_path: str
) -> None:
    def mutate(catalog: list[dict]) -> None:
        for d in catalog:
            if d["id"] != domain_id:
                continue
            pdfs: list[dict] = d.setdefault("pdfs", [])
            # Dedupe by file path — one entry per (target, level, language,
            # model) variant, so PDFs for all models/languages get recorded.
            if not any(p.get("file") == rel_path for p in pdfs):
                pdfs.append({
                    "target": target, "file": rel_path,
                    "level": level, "language": language, "model": model,
                })
            break

    update_catalog(mutate, settings.public_domains / "catalog.json")
