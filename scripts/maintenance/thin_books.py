#!/usr/bin/env python3
"""Thin existing book_*.html pages: link single-character concepts out to
their standalone pages instead of inlining them.

Matches the new build_book_index behavior in spl/tools.py — inlined copies
duplicated each concept's stroke-order/pronounce scripts, and many HanziWriter
instances animating at once in one page corrupted the stroke animations.

For each book under public/domains/*/output/*/*/html/:
  - every top-level <section id="X"> where X is a single CJK char and a
    concept_X.html sibling exists is removed, and its TOC entry is rewritten
    from href="#X" to href="concept_X.html" (the sibling symlink resolves to
    the right level/language/model canonical);
  - phrase capstone, Payoff, and placeholder sections stay inline.

Idempotent: already-thin books have no matching sections and are untouched.
Use --dry-run to preview counts.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from backfill_char_tools import load_generator_tools  # noqa: E402

SECTION_OPEN_RE = re.compile(r'<section id="([^"]+)">')


def thin(text: str, book_dir: Path, is_single_cjk) -> tuple[str, int]:
    """Remove inlined single-CJK sections; retarget their TOC links."""
    opens = list(SECTION_OPEN_RE.finditer(text))
    if not opens:
        return text, 0
    # Top-level sections run from each <section id=...> to the next one (inner
    # <section> wrappers from concept pages carry no id); the last runs to the
    # closing </main>.
    main_end = text.rfind('</main>')
    if main_end == -1:
        main_end = len(text)
    # Two passes: all removals first (reversed, so match offsets computed on
    # the original text stay valid), TOC link rewrites after. Interleaving
    # them shifted later offsets and cut sections at the wrong boundaries.
    removed_ids = []
    out = text
    for i in reversed(range(len(opens))):
        sec_id = opens[i].group(1)
        if not (is_single_cjk(sec_id) and (book_dir / f"concept_{sec_id}.html").exists()):
            continue
        start = opens[i].start()
        end = opens[i + 1].start() if i + 1 < len(opens) else main_end
        out = out[:start] + out[end:]
        removed_ids.append(sec_id)
    for sec_id in removed_ids:
        out = out.replace(f'<a href="#{sec_id}">', f'<a href="concept_{sec_id}.html">', 1)
    return out, len(removed_ids)


def main():
    dry_run = "--dry-run" in sys.argv
    tools = load_generator_tools()

    books = updated = sections_removed = 0
    for book in sorted(ROOT.glob("public/domains/*/output/*/*/html/book_*.html")):
        if book.is_symlink():
            continue
        books += 1
        text = book.read_text(encoding="utf-8")
        new, removed = thin(text, book.parent, tools._is_single_cjk)
        if removed:
            updated += 1
            sections_removed += removed
            if not dry_run:
                book.write_text(new, encoding="utf-8")

    mode = "DRY RUN — no files written" if dry_run else "done"
    print(f"Thin books ({mode}): {books} books scanned, "
          f"{updated} thinned, {sections_removed} inlined sections converted to links")


if __name__ == "__main__":
    main()
