#!/usr/bin/env python3
"""Rebuild the References row (char-res) in existing generated pages from
config.yaml's current resources: list.

New pages get the row from spl/tools.py:_char_resources_html() at generation
time, but the row is baked into existing HTML. Run this after editing
config.yaml's resources (e.g. adding 成语, or swapping a placeholder site for
a better one) to bring every existing page in line — canonical concept pages
under public/concepts/ and the combined book pages under public/domains/ that
embed them. Domain-side concept files are symlinks and are skipped.

Idempotent and re-runnable: each char-res block is replaced wholesale with a
freshly generated one, so re-running after further config.yaml edits always
converges on the current resource list. The character for each block is
recovered from the 汉典 (zdic.net) link inside it; blocks without one are
reported and left untouched. Use --dry-run to preview counts.
"""
import re
import sys
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from backfill_char_tools import load_generator_tools  # noqa: E402

# <style>.char-res{...}</style><div class="char-res">...</div> — the div holds
# only the label span and anchors, so a non-greedy match to the first </div>
# captures exactly one row.
BLOCK_RE = re.compile(r'<style>\.char-res\{.*?</style><div class="char-res">.*?</div>', re.S)
ZDIC_RE = re.compile(r'https://www\.zdic\.net/hans/([^"]+)"')


def main():
    dry_run = "--dry-run" in sys.argv
    tools = load_generator_tools()

    counts: dict[str, int] = {}
    problems: list[str] = []

    def rebuild(match: re.Match) -> str:
        m = ZDIC_RE.search(match.group(0))
        if not m:
            counts["block-char-unrecognized"] = counts.get("block-char-unrecognized", 0) + 1
            return match.group(0)
        char = urllib.parse.unquote(m.group(1))
        counts["blocks-rebuilt"] = counts.get("blocks-rebuilt", 0) + 1
        return tools._char_resources_html(char)

    targets = sorted(ROOT.glob("public/concepts/**/concept_*.html")) + \
        sorted(ROOT.glob("public/domains/**/book_*.html"))
    for page in targets:
        if page.is_symlink():
            continue
        text = page.read_text(encoding="utf-8")
        if "char-res" not in text:
            continue
        before = counts.get("block-char-unrecognized", 0)
        new = BLOCK_RE.sub(rebuild, text)
        if counts.get("block-char-unrecognized", 0) > before:
            problems.append(str(page.relative_to(ROOT)))
        if new != text:
            counts["files-updated"] = counts.get("files-updated", 0) + 1
            if not dry_run:
                page.write_text(new, encoding="utf-8")
        else:
            counts["files-already-current"] = counts.get("files-already-current", 0) + 1

    mode = "DRY RUN — no files written" if dry_run else "done"
    print(f"Rebuild char-res References rows ({mode}):")
    for status, n in sorted(counts.items()):
        print(f"  {status}: {n}")
    for p in problems:
        print(f"  !! unrecognized block in: {p}")


if __name__ == "__main__":
    main()
