from fastapi import FastAPI
from app.database import engine

app = FastAPI(
    title="Product Warranty Claim Processing Platform API",
    version="1.0.0"
)
@app.on_event("startup")
def startup():
    try:
        connection = engine.connect()
        print("✅ Database connected successfully!")
        connection.close()
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
@app.get("/")
def root():
    return {
        "message": "Welcome to Product Warranty Claim Processing Platform API"
    }
    