import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException
from api.services.catalog_svc import get_catalog

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))
from catalog_lib import sync_catalog  # noqa: E402

router = APIRouter()


@router.get("/api/domains")
def domains():
    return get_catalog()


@router.post("/api/catalog/sync")
def catalog_sync():
    """Rebuild catalog.json (and detail files) from what exists on disk.

    Repair path for when a writer misbehaves or files are edited by hand —
    idempotent and lock-safe alongside live generation. When the catalog
    later moves into SQLite, this becomes the DB→file export with the same
    contract. Triggered by the Settings page "Sync Catalog" button.
    """
    try:
        return {"ok": True, **sync_catalog()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Catalog sync failed: {e}")


@router.get("/api/domains/{domain_id}/status")
def domain_status(domain_id: str):
    catalog = get_catalog()
    domain = next((d for d in catalog if d["id"] == domain_id), None)
    if not domain:
        raise HTTPException(status_code=404, detail="Domain not found")
    return {"id": domain_id, "has_book": domain.get("has_book", False)}
