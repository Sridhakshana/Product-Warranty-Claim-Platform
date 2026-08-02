from fastapi import FastAPI

app = FastAPI(
    title="Product Warranty Claim Processing Platform API",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "message": "Welcome to Product Warranty Claim Processing Platform API"
    }