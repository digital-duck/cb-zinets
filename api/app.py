import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import generate, domains, settings, pdf, compare, phrase, browse
from api.routers import tasks
from api.services.db import init_db, recover_stale_tasks
from api.services.task_worker import run_worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    n = recover_stale_tasks()
    if n:
        import logging
        logging.getLogger(__name__).warning("Recovered %d stale running task(s) → failed", n)
    worker = asyncio.create_task(run_worker())
    yield
    worker.cancel()
    try:
        await worker
    except asyncio.CancelledError:
        pass


app = FastAPI(title="concept-book API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router)
app.include_router(tasks.router)
app.include_router(domains.router)
app.include_router(settings.router)
app.include_router(pdf.router)
app.include_router(compare.router)
app.include_router(phrase.router)
app.include_router(browse.router)
