from fastapi import APIRouter
from urllib.parse import unquote

from api.config import settings

router = APIRouter()


@router.get("/api/browse/domains")
async def list_domains():
    d = settings.public_domains
    if not d.exists():
        return {"domains": []}
    return {"domains": sorted(p.name for p in d.iterdir() if p.is_dir())}


@router.get("/api/browse/concepts")
async def browse_standalone_concepts():
    """Single-character concept pages that live only under the shared
    canonical dir (public/concepts/) — e.g. --chars-batch primitives with no
    domain, or characters no domain happens to reference. One representative
    (level.lang/model) file per character, so Home's Concepts grid has
    somewhere to send a character that no domain's generated_concepts lists.

    `file` is shaped like a domain-relative path (output/{level}.{lang}/
    {model}/html/concept_{char}.html) purely so the frontend's existing
    parseVariant() regex (src/lib/paths.js) recovers level/lang/model from it
    the same way it does for real domain files — it's never fetched as-is;
    with no domain, BookPage resolves straight to the real canonical path.
    """
    root = settings.public_domains.parent / "concepts"
    by_char: dict[str, dict] = {}
    if root.exists():
        for variant_dir in sorted(p for p in root.iterdir() if p.is_dir() and "." in p.name):
            level, lang = variant_dir.name.split(".", 1)
            for model_dir in sorted(p for p in variant_dir.iterdir() if p.is_dir()):
                if model_dir.name == "default":
                    continue  # symlink alias to sonnet; skip to avoid double-counting
                for p in sorted(model_dir.glob("concept_*.html")):
                    name = p.stem[len("concept_"):]
                    if name.startswith("phrase_") or len(name) != 1 or name in by_char or ord(name) < 0x2E00:
                        continue  # skip ASCII/mangled names (e.g. "concept_?.html" generation debris)
                    by_char[name] = {
                        "char": name,
                        "file": f"output/{level}.{lang}/{model_dir.name}/html/{p.name}",
                    }
    return {"concepts": sorted(by_char.values(), key=lambda c: c["char"])}


@router.get("/api/browse/{domain}")
async def browse_domain(domain: str):
    domain = unquote(domain)
    output = settings.public_domains / domain / "output"
    books, concepts = [], []
    if output.exists():
        for p in sorted(output.rglob("book_*.html")):
            rel = str(p.relative_to(settings.public_domains / domain))
            label = p.stem[len("book_"):].replace("_", " ").strip() or p.stem
            books.append({"file": rel, "label": label})
        for p in sorted(output.rglob("concept_*.html")):
            rel = str(p.relative_to(settings.public_domains / domain))
            label = p.stem[len("concept_"):].replace("_", " ").strip() or p.stem
            concepts.append({"file": rel, "label": label})
    return {"books": books, "concepts": concepts}
