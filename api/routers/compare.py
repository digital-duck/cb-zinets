from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

from api.services.compare_svc import stream_compare

router = APIRouter()


@router.get("/api/compare")
async def compare(
    domain: str,
    concept: str,
    level_a: str = "intro",
    lang_a: str = "en",
    model_a: str = "",
    level_b: str = "intro",
    lang_b: str = "en",
    model_b: str = "",
    skip_cache: bool = False,
):
    return EventSourceResponse(
        stream_compare(domain, concept, level_a, lang_a, model_a, level_b, lang_b, model_b, skip_cache)
    )
