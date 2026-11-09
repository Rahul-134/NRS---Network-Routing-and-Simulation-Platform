from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import simulations, topologies
from app.config import MAX_BODY_BYTES, cors_origins, is_production

docs = None if is_production() else "/docs"

app = FastAPI(
    title="NRS",
    docs_url=docs,
    redoc_url=None,
    openapi_url="/openapi.json" if docs else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


@app.middleware("http")
async def protect(request: Request, call_next):
    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > MAX_BODY_BYTES:
        return JSONResponse({"detail": "Request body is too large"}, status_code=413)
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "no-store"
    response.headers["Referrer-Policy"] = "no-referrer"
    return response


app.include_router(simulations.router)
app.include_router(topologies.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
