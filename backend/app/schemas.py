from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "customer"
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str
    
class ProductCreate(BaseModel):
    product_name: str
    product_code: str
    purchase_date: str
    warranty_period: int
    user_id: int
    
class ProductUpdate(BaseModel):
    product_name: str
    product_code: str
    purchase_date: str
    warranty_period: int
    
class WarrantyClaimCreate(BaseModel):
    product_id: int
    user_id: int
    claim_reason: str
    
class WarrantyClaimStatusUpdate(BaseModel):
    claim_status: str