#!/usr/bin/env python3
"""
One-off migration: inject the pinyin span (spl/tools.py's _char_tools_span)
into already-generated canonical concept pages, for models that predate the
pinyin feature.

Pure string patch — no SPL/LLM invocation, no cache dependency. Safe to
re-run (skips files that already have the pinyin span).

Usage:
    python scripts/patch_pinyin_sonnet.py [--model sonnet] [--dry-run]
"""
import argparse
import re
import sqlite3
from pathlib import Path

from cb_config import DB_PATH, ROOT as REPO_ROOT

OLD_CSS_ANCHOR = ".char-tools__hw{width:58px;height:58px;display:inline-block}"
NEW_CSS_RULE = ".char-tools__pinyin{font-size:1.3rem;font-weight:600;color:#1565c0;font-family:system-ui,sans-serif}"


def _load_pinyin_map(db_path: Path) -> dict[str, str]:
    con = sqlite3.connect(db_path)
    try:
        rows = con.execute(
            "SELECT zi, pinyin FROM zn_zi WHERE pinyin IS NOT NULL AND pinyin != ''"
        ).fetchall()
    finally:
        con.close()
    out = {}
    for zi, py in rows:
        out[zi] = re.split(r"[;/]", py)[0].strip()
    return out


def _to_diacritic(pinyin_num: str) -> str:
    """Mirrors scripts/phrase_decomposer.py::_to_diacritic (single source of
    truth for the numeric-tone → diacritic conversion; duplicated here only
    because this is a standalone one-off migration script)."""
    tone_map = {
        "a": ("ā", "á", "ǎ", "à"), "e": ("ē", "é", "ě", "è"),
        "i": ("ī", "í", "ǐ", "ì"), "o": ("ō", "ó", "ǒ", "ò"),
        "u": ("ū", "ú", "ǔ", "ù"), "ü": ("ǖ", "ǘ", "ǚ", "ǜ"),
        "v": ("ǖ", "ǘ", "ǚ", "ǜ"),
    }

    def _add_tone(syllable: str, tone: int) -> str:
        if tone < 1 or tone > 4:
            return syllable
        idx = tone - 1
        s = syllable.replace("v", "ü")
        for vowel in ("a", "e", "ou", "o", "ui", "iu", "i", "u", "ü"):
            if vowel in s:
                mark_on = vowel[0] if len(vowel) > 1 and vowel not in ("ou",) else vowel
                if mark_on in tone_map:
                    return s.replace(mark_on, tone_map[mark_on][idx], 1)
        return s

    def _convert(m: re.Match) -> str:
        return _add_tone(m.group(1), int(m.group(2)))

    return re.sub(r"([a-züA-ZÜ]+)([1-5])", _convert, pinyin_num)


def _esc(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def patch_file(path: Path, pinyin_map: dict[str, str], dry_run: bool) -> str:
    char = path.stem[len("concept_"):]
    html = path.read_text(encoding="utf-8")

    if "char-tools__pinyin" in html:
        return "already-patched"
    if OLD_CSS_ANCHOR not in html:
        return "no-char-tools"  # not a single-char concept page

    raw = pinyin_map.get(char)
    if not raw:
        return "no-pinyin-data"
    pinyin = _to_diacritic(raw)

    new_html = html.replace(OLD_CSS_ANCHOR, OLD_CSS_ANCHOR + NEW_CSS_RULE, 1)
    button_marker = f'<button class="char-tools__btn" onclick="_cbSpeak(\'{char}\')"'
    pinyin_span = f'<span class="char-tools__pinyin">{_esc(pinyin)}</span>'
    if button_marker not in new_html:
        return "button-marker-not-found"
    new_html = new_html.replace(button_marker, pinyin_span + button_marker, 1)

    if not dry_run:
        path.write_text(new_html, encoding="utf-8")
    return f"patched ({pinyin})"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="sonnet")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    pinyin_map = _load_pinyin_map(DB_PATH)
    concepts_root = REPO_ROOT / "public" / "concepts"

    counts: dict[str, int] = {}
    for f in sorted(concepts_root.glob(f"*/{args.model}/concept_*.html")):
        if f.name.startswith("concept_phrase_"):
            continue
        result = patch_file(f, pinyin_map, args.dry_run)
        key = result.split(" ")[0].split("(")[0]
        counts[key] = counts.get(key, 0) + 1
        if key not in ("patched", "already-patched"):
            print(f"  {result:20s} {f.relative_to(REPO_ROOT)}")

    print(f"\n{'DRY RUN — ' if args.dry_run else ''}Summary for model={args.model}:")
    for key, n in sorted(counts.items()):
        print(f"  {key}: {n}")


if __name__ == "__main__":
    main()
