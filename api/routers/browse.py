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
