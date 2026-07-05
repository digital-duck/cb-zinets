import sys
from pathlib import Path

from api.config import settings
from pinyin_lib import load_pinyin_map, phrase_pinyin, concept_pinyin_fields

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from catalog_lib import read_catalog, update_catalog  # noqa: E402
from cb_paths import concept_rel, book_rel, variant_html_dir  # noqa: E402

_pinyin_map_cache: dict[str, str] | None = None


def _pinyin_map() -> dict[str, str]:
    global _pinyin_map_cache
    cache = _pinyin_map_cache
    if cache is None:
        cache = load_pinyin_map(settings.db_path)
        _pinyin_map_cache = cache
    return cache


def _concept_pinyin_fields(name: str) -> dict:
    return concept_pinyin_fields(name, _pinyin_map())


def get_catalog() -> list[dict]:
    return read_catalog(settings.public_domains / "catalog.json")


def upsert_domain(domain_id: str, phrase_id: str) -> None:
    """Add a minimal catalog entry for a dynamically generated phrase domain."""
    py, initials = phrase_pinyin(domain_id, _pinyin_map())

    def mutate(catalog: list[dict]) -> None:
        if any(d["id"] == domain_id for d in catalog):
            return
        catalog.append({
            "id": domain_id,
            "name": domain_id,
            "capstone": phrase_id,
            "has_book": False,
            "has_navigator": True,
            "books": [],
            "generated_concepts": [],
            "tags": ["language", "chinese"],
            "default_level": "intro",
            **({"pinyin": py, "pinyin_initials": initials} if py else {}),
        })

    update_catalog(mutate, settings.public_domains / "catalog.json")


def mark_book_generated(
    domain_id: str,
    target: str,
    level: str = "intro",
    language: str = "en",
    model: str = "gemma4",
) -> None:
    html_dir = settings.public_domains / domain_id / variant_html_dir(level, language, model)
    new_concepts = [
        {
            "name": p.stem[len("concept_"):],
            "label": p.stem[len("concept_"):].replace("_", " ").title(),
            "file": concept_rel(level, language, model, p.stem[len("concept_"):]),
            "model": model,
            **_concept_pinyin_fields(p.stem[len("concept_"):]),
        }
        for p in html_dir.glob("concept_*.html")
    ]

    def mutate(catalog: list[dict]) -> None:
        for d in catalog:
            if d["id"] != domain_id:
                continue
            books: list[dict] = d.setdefault("books", [])
            book_file = book_rel(level, language, model, target)
            # Deduplicate by (target, model) pair
            if not any(b["target"] == target and b.get("model") == model for b in books):
                books.append({"target": target, "file": book_file, "model": model})
            d["has_book"] = True
            # Preserve legacy entries (no model field) and entries from other models
            other = [c for c in d.get("generated_concepts", []) if c.get("model") != model]
            d["generated_concepts"] = sorted(
                other + new_concepts,
                key=lambda c: c["label"],
            )
            break

    update_catalog(mutate, settings.public_domains / "catalog.json")
