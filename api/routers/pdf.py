from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from api.services.pdf_svc import generate_pdf

router = APIRouter()


@router.get("/api/pdf")
async def pdf(domain: str, target: str, level: str = "intro", language: str = "en", model: str = "gemma4"):
    result = await generate_pdf(domain, target, level, language, model)
    if result["ok"]:
        return JSONResponse({"file": result["file"]})
    raise HTTPException(status_code=500, detail=result["error"])
