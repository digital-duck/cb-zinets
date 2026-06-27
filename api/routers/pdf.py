from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from api.services.pdf_svc import generate_pdf

router = APIRouter()


@router.get("/api/pdf")
async def pdf(domain: str, target: str, level: str = "intro", language: str = "en"):
    result = await generate_pdf(domain, target, level, language)
    if result["ok"]:
        return JSONResponse({"file": result["file"]})
    raise HTTPException(status_code=500, detail=result["error"])
