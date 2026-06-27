from fastapi import APIRouter, HTTPException
from api.services.catalog_svc import get_catalog

router = APIRouter()


@router.get("/api/domains")
def domains():
    return get_catalog()


@router.get("/api/domains/{domain_id}/status")
def domain_status(domain_id: str):
    catalog = get_catalog()
    domain = next((d for d in catalog if d["id"] == domain_id), None)
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    return {"id": domain_id, "has_book": domain.get("has_book", False)}
