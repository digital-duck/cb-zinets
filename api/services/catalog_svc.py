import json
from api.config import settings

_CATALOG = settings.public_domains / "catalog.json"


def get_catalog() -> list[dict]:
    return json.loads(_CATALOG.read_text())


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
