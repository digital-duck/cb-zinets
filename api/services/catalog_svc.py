import json
from api.config import settings
from pinyin_lib import load_pinyin_map, phrase_pinyin

_CATALOG = settings.public_domains / "catalog.json"
_pinyin_map_cache: dict[str, str] | None = None


def _pinyin_map() -> dict[str, str]:
    global _pinyin_map_cache
    cache = _pinyin_map_cache
    if cache is None:
        cache = load_pinyin_map(settings.db_path)
        _pinyin_map_cache = cache
    return cache


def _concept_pinyin_fields(name: str) -> dict:
    """pinyin/pinyin_initials fields for a concept name, or {} if unmapped."""
    pinyin_map = _pinyin_map()
    if name.startswith("phrase_"):
        py, initials = phrase_pinyin(name[len("phrase_"):], pinyin_map)
        return {"pinyin": py, "pinyin_initials": initials} if py else {}
    if len(name) == 1:
        py = pinyin_map.get(name)
        return {"pinyin": py} if py else {}
    return {}


def get_catalog() -> list[dict]:
    if not _CATALOG.exists():
        return []
    return json.loads(_CATALOG.read_text())


def upsert_domain(domain_id: str, phrase_id: str) -> None:
    """Add a minimal catalog entry for a dynamically generated phrase domain."""
    catalog = get_catalog()
    if any(d["id"] == domain_id for d in catalog):
        return
    py, initials = phrase_pinyin(domain_id, _pinyin_map())
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
    _CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")


def mark_book_generated(
    domain_id: str,
    target: str,
    level: str = "intro",
    language: str = "en",
    model: str = "gemma4",
) -> None:
    catalog = get_catalog()
    variant = f"{level}.{language}"
    for d in catalog:
        if d["id"] == domain_id:
            books: list[dict] = d.setdefault("books", [])
            book_file = f"output/{variant}/{model}/html/book_{target}.html"
            # Deduplicate by (target, model) pair
            if not any(b["target"] == target and b.get("model") == model for b in books):
                books.append({"target": target, "file": book_file, "model": model})
            d["has_book"] = True

            html_dir = settings.public_domains / domain_id / "output" / variant / model / "html"
            new_concepts = [
                {
                    "name": p.stem[len("concept_"):],
                    "label": p.stem[len("concept_"):].replace("_", " ").title(),
                    "file": f"output/{variant}/{model}/html/{p.name}",
                    "model": model,
                    **_concept_pinyin_fields(p.stem[len("concept_"):]),
                }
                for p in html_dir.glob("concept_*.html")
            ]
            # Preserve legacy entries (no model field) and entries from other models
            other = [c for c in d.get("generated_concepts", []) if c.get("model") != model]
            d["generated_concepts"] = sorted(
                other + new_concepts,
                key=lambda c: c["label"],
            )
            break
    _CATALOG.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n")
