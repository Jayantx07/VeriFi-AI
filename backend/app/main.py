from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.core.neo4j_connector import neo4j_connector
from app.api.v1.sensors import router as sensors_router
from app.api.v1.verification import router as verification_router
from app.api.v1.passkey import router as passkey_router
from app.api.v1.audit import router as audit_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: neo4j connector initialization is handled automatically
    yield
    # Shutdown: clean up resources
    neo4j_connector.close()

app = FastAPI(
    title="VeriFi AI — Transaction-Authorization Gateway",
    description="Multimodal Fraud Interception Layer correlating communication sensors with ERP payments via Neo4j Graph Lineage and FIDO2 Passkeys",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under /api/v1
app.include_router(sensors_router, prefix="/api/v1")
app.include_router(verification_router, prefix="/api/v1")
app.include_router(passkey_router, prefix="/api/v1")
app.include_router(audit_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "neo4j_connected": neo4j_connector.is_connected,
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
