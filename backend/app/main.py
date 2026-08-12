from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import (
    auth,
    products,
    claims,
    invoices,
    service_centers,
    analytics,
    chatbot,
)

app = FastAPI(
    title="Product Warranty Claim Processing Platform API",
    description=(
        "Backend API for the Smart Product Warranty Claim Processing Platform. "
        "Supports registration, product & warranty management, claim submission, "
        "invoice upload, service center assignment, notifications, analytics, "
        "QR verification, and a customer support chatbot."
    ),
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(claims.router)
app.include_router(invoices.router)
app.include_router(service_centers.router)
app.include_router(analytics.router)
app.include_router(chatbot.router)


@app.on_event("startup")
def startup():
    try:
        connection = engine.connect()
        print("Database connected successfully!")
        connection.close()
    except Exception as e:
        print(f"Database connection failed: {e}")


@app.get("/")
def root():
    return {
        "message": "Welcome to Product Warranty Claim Processing Platform API",
        "docs": "/docs",
        "version": "2.0.0",
    }


@app.get("/health")
def health():
    try:
        connection = engine.connect()
        connection.close()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}
    
    
    
    