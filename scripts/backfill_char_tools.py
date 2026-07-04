#!/usr/bin/env python3
"""Backfill the stroke-order + pronounce widget into existing concept pages.

Patches every canonical single-character page under public/concepts/ with the
same char-tools widget that spl/tools.py:write_concept_html() now emits for
new pages: an inline stroke-canvas + 🔊 button inside <h1 class="book-title">,
plus the backing style/script block kept inside <main> so build_book_index's
<main>-only extraction carries it into combined book pages.

The HTML comes from _char_tools_span()/_char_tools_block() in spl/tools.py —
the real generator, not a copy — so backfilled pages stay in sync with freshly
generated ones. Domain-side concept files are symlinks to these canonicals and
need no separate pass.

Idempotent: pages already containing char-tools are skipped. Pages whose
concept isn't exactly one CJK ideograph are skipped, matching the generator's
_is_single_cjk() gate. Use --dry-run to preview counts without writing.
"""
import importlib.util
import sys
import types
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONCEPTS_DIR = ROOT / "public" / "concepts"


def load_generator_tools():
    """Load spl/tools.py by path, stubbing the SPL framework's spl_tool
    decorator so the script runs outside the spl123 conda env."""
    if "spl.tools" not in sys.modules:
        pkg = types.ModuleType("spl")
        mod = types.ModuleType("spl.tools")
        setattr(mod, "spl_tool", lambda f: f)
        setattr(pkg, "tools", mod)
        sys.modules["spl"] = pkg
        sys.modules["spl.tools"] = mod
    spec = importlib.util.spec_from_file_location(
        "cb_generator_tools", ROOT / "spl" / "tools.py"
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def patch_page(text: str, char: str, tools) -> tuple[str | None, str]:
    """Return (patched_text, status). patched_text is None when skipped."""
    if "char-tools" in text:
        return None, "already-patched"
    head = f'<h1 class="book-title">'
    i = text.find(head)
    if i == -1:
        return None, "no-book-title-h1"
    j = text.find("</h1>", i)
    if j == -1:
        return None, "no-book-title-h1"
    if "</main>" not in text:
        return None, "no-main"
    text = text[:j] + tools._char_tools_span(char) + text[j:]
    text = text.replace("</main>", tools._char_tools_block(char) + "\n  </main>", 1)
    return text, "patched"


def main():
    dry_run = "--dry-run" in sys.argv
    tools = load_generator_tools()

    counts: dict[str, int] = {}
    problems: list[tuple[Path, str]] = []
    for page in sorted(CONCEPTS_DIR.rglob("concept_*.html")):
        if page.is_symlink():
            continue
        char = page.stem[len("concept_"):]
        if not tools._is_single_cjk(char):
            counts["skipped-not-single-cjk"] = counts.get("skipped-not-single-cjk", 0) + 1
            continue
        patched, status = patch_page(page.read_text(encoding="utf-8"), char, tools)
        counts[status] = counts.get(status, 0) + 1
        if status not in ("patched", "already-patched"):
            problems.append((page, status))
        elif patched and not dry_run:
            page.write_text(patched, encoding="utf-8")

    mode = "DRY RUN — no files written" if dry_run else "done"
    print(f"Backfill char-tools ({mode}):")
    for status, n in sorted(counts.items()):
        print(f"  {status}: {n}")
    for page, status in problems:
        print(f"  !! {status}: {page.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
