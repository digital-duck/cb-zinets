from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import generate, domains, settings, pdf, compare


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="concept-book API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router)
app.include_router(domains.router)
app.include_router(settings.router)
app.include_router(pdf.router)
app.include_router(compare.router)
