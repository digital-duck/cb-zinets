"""The path schema — cb_zinets' variant coordinate system, in one place.

Every generated artifact lives under a domain at:

    output/{level}.{language}/{model}/html/{kind}_{name}.html      (pages)
    output/{level}.{language}/{model}/pdf/book_{target}.pdf        (PDFs)

This module is the single Python encoding of that convention; build paths and
parse them only through it. The JavaScript twin is src/lib/paths.js — any
change here must be mirrored there (and vice versa). Adding a variant axis
(the roadmap wants axes to be configuration) means changing these two files
and nothing else.
"""
from __future__ import annotations

import re

_VARIANT_RE = re.compile(
    r'output/(?P<level>[^/.]+)\.(?P<language>[^/]+)/(?P<model>[^/]+)/html/'
    r'(?P<kind>book|concept|phrase)_(?P<name>[^/]+)\.html$'
)


def variant_html_dir(level: str, language: str, model: str) -> str:
    """Domain-relative html dir for a (level, language, model) variant."""
    return f"output/{level}.{language}/{model}/html"


def variant_pdf_dir(level: str, language: str, model: str) -> str:
    return f"output/{level}.{language}/{model}/pdf"


def book_rel(level: str, language: str, model: str, target: str) -> str:
    """Domain-relative path of a book page.

    A "phrase_X" target is already self-describing as a book-level artifact
    (see build_book_index/write_concept_html in spl/tools.py), so it skips
    the redundant "book_" prefix.
    """
    fname = target if target.startswith("phrase_") else f"book_{target}"
    return f"{variant_html_dir(level, language, model)}/{fname}.html"


def concept_rel(level: str, language: str, model: str, concept: str) -> str:
    """Domain-relative path of a concept page (symlink to its canonical)."""
    return f"{variant_html_dir(level, language, model)}/concept_{concept}.html"


def pdf_rel(level: str, language: str, model: str, target: str) -> str:
    fname = target if target.startswith("phrase_") else f"book_{target}"
    return f"{variant_pdf_dir(level, language, model)}/{fname}.pdf"


def canonical_concept_rel(level: str, language: str, model: str, concept: str) -> str:
    """Site-relative path of a canonical concept page under public/concepts/."""
    return f"concepts/{level}.{language}/{model}/concept_{concept}.html"


def parse_variant(path: str) -> dict | None:
    """Parse a domain-relative page path → {level, language, model, kind, name}.

    Returns None when the path doesn't follow the schema (legacy layouts).
    """
    m = _VARIANT_RE.search(path)
    return m.groupdict() if m else None
