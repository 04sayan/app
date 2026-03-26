from fastapi import FastAPI, APIRouter, HTTPException, Body
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from bson import ObjectId
import random
import string


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# ============== MODELS ==============

# Auth Models
class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

# Customer Models
class Customer(BaseModel):
    phone: str
    name: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)

# Address Models
class Address(BaseModel):
    customerId: str
    customerPhone: str
    fullAddress: str
    area: str
    landmark: Optional[str] = ""
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    isDefault: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class AddressCreate(BaseModel):
    customerPhone: str
    fullAddress: str
    area: str
    landmark: Optional[str] = ""
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    isDefault: bool = False

# Product Models
class ProductVariant(BaseModel):
    type: str  # weight or pack
    value: str  # 250g, 500g, 6, 12, etc
    price: float

class Product(BaseModel):
    name: str
    category: str  # chicken, eggs, fish
    description: str
    shortDescription: str
    basePrice: float
    images: List[str] = []  # base64 strings
    variants: List[ProductVariant] = []
    inStock: bool = True
    isFeatured: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    shortDescription: Optional[str] = None
    basePrice: Optional[float] = None
    images: Optional[List[str]] = None
    variants: Optional[List[ProductVariant]] = None
    inStock: Optional[bool] = None
    isFeatured: Optional[bool] = None

# Order Models
class OrderItem(BaseModel):
    productId: str
    productName: str
    variant: Optional[Dict[str, Any]] = None
    quantity: int
    price: float

class OrderCreate(BaseModel):
    customerPhone: str
    customerName: str
    items: List[OrderItem]
    totalAmount: float
    deliveryAddress: Dict[str, Any]
    paymentMethod: str  # COD or UPI
    deliverySlot: Optional[str] = None
    couponCode: Optional[str] = None
    discount: float = 0

class Order(BaseModel):
    orderId: str
    customerId: str
    customerPhone: str
    customerName: str
    items: List[OrderItem]
    totalAmount: float
    deliveryAddress: Dict[str, Any]
    paymentMethod: str
    paymentStatus: str = "Pending"
    status: str = "Pending"
    deliverySlot: Optional[str] = None
    couponCode: Optional[str] = None
    discount: float = 0
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    cancelledAt: Optional[datetime] = None

# Coupon Models
class Coupon(BaseModel):
    code: str
    discountType: str  # percentage or fixed
    discountValue: float
    minOrderValue: float
    maxDiscount: Optional[float] = None
    expiryDate: datetime
    isActive: bool = True
    usageLimit: int = 1000
    usedCount: int = 0

class CouponValidate(BaseModel):
    code: str
    orderValue: float

# Pincode Models
class Pincode(BaseModel):
    pincode: str
    area: str
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)

class PincodeRequest(BaseModel):
    pincode: str
    customerPhone: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)

# Delivery Slot Models
class DeliverySlot(BaseModel):
    slotName: str
    startTime: str
    endTime: str
    isActive: bool = True
    maxOrders: int = 50

# Admin Settings Models
class AdminSetting(BaseModel):
    key: str
    value: Any

# ============== AUTH APIs ==============

@api_router.post("/auth/send-otp")
async def send_otp(request: SendOTPRequest):
    """Mock OTP send - always returns success"""
    logger.info(f"OTP requested for {request.phone}")
    return {"success": True, "message": "OTP sent successfully", "phone": request.phone}

@api_router.post("/auth/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    """Mock OTP verification - accepts any 6-digit code"""
    if not request.otp or len(request.otp) != 6 or not request.otp.isdigit():
        raise HTTPException(status_code=400, detail="Invalid OTP format")
    
    # Check if customer exists, create if not
    customer = await db.customers.find_one({"phone": request.phone})
    if not customer:
        new_customer = Customer(phone=request.phone)
        result = await db.customers.insert_one(new_customer.dict())
        customer = await db.customers.find_one({"_id": result.inserted_id})
    
    return {
        "success": True,
        "message": "OTP verified successfully",
        "customer": serialize_doc(customer)
    }

@api_router.get("/auth/customer/{phone}")
async def get_customer(phone: str):
    """Get customer details by phone"""
    customer = await db.customers.find_one({"phone": phone})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return serialize_doc(customer)

@api_router.put("/auth/customer/{phone}")
async def update_customer(phone: str, name: str = Body(...)):
    """Update customer name"""
    result = await db.customers.update_one(
        {"phone": phone},
        {"$set": {"name": name}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"success": True, "message": "Customer updated"}

# ============== PRODUCT APIs ==============

@api_router.get("/products")
async def get_products(category: Optional[str] = None, featured: Optional[bool] = None, inStock: Optional[bool] = None):
    """Get all products with optional filters"""
    query = {}
    if category:
        query["category"] = category
    if featured is not None:
        query["isFeatured"] = featured
    if inStock is not None:
        query["inStock"] = inStock
    
    products = await db.products.find(query).to_list(1000)
    return [serialize_doc(p) for p in products]

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    """Get single product by ID"""
    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return serialize_doc(product)
    except:
        raise HTTPException(status_code=400, detail="Invalid product ID")

@api_router.post("/products")
async def create_product(product: Product):
    """Create new product [Admin]"""
    result = await db.products.insert_one(product.dict())
    created = await db.products.find_one({"_id": result.inserted_id})
    return serialize_doc(created)

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, update: ProductUpdate):
    """Update product [Admin]"""
    try:
        update_data = {k: v for k, v in update.dict().items() if v is not None}
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        result = await db.products.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        updated = await db.products.find_one({"_id": ObjectId(product_id)})
        return serialize_doc(updated)
    except HTTPException:
        raise
    except:
        raise HTTPException(status_code=400, detail="Invalid product ID")

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    """Delete product [Admin]"""
    try:
        result = await db.products.delete_one({"_id": ObjectId(product_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        return {"success": True, "message": "Product deleted"}
    except:
        raise HTTPException(status_code=400, detail="Invalid product ID")

# ============== ADDRESS APIs ==============

@api_router.get("/addresses/customer/{phone}")
async def get_customer_addresses(phone: str):
    """Get all addresses for a customer"""
    addresses = await db.addresses.find({"customerPhone": phone}).to_list(100)
    return [serialize_doc(a) for a in addresses]

@api_router.post("/addresses")
async def create_address(address: AddressCreate):
    """Create new address"""
    # Check if customer has 5 addresses already
    count = await db.addresses.count_documents({"customerPhone": address.customerPhone})
    if count >= 5:
        raise HTTPException(status_code=400, detail="Maximum 5 addresses allowed per customer")
    
    # Get customer ID
    customer = await db.customers.find_one({"phone": address.customerPhone})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # If this is set as default, unset other defaults
    if address.isDefault:
        await db.addresses.update_many(
            {"customerPhone": address.customerPhone},
            {"$set": {"isDefault": False}}
        )
    
    new_address = Address(
        customerId=str(customer["_id"]),
        **address.dict()
    )
    result = await db.addresses.insert_one(new_address.dict())
    created = await db.addresses.find_one({"_id": result.inserted_id})
    return serialize_doc(created)

@api_router.put("/addresses/{address_id}")
async def update_address(address_id: str, address: AddressCreate):
    """Update address"""
    try:
        # If setting as default, unset other defaults
        if address.isDefault:
            await db.addresses.update_many(
                {"customerPhone": address.customerPhone},
                {"$set": {"isDefault": False}}
            )
        
        # Get customer ID
        customer = await db.customers.find_one({"phone": address.customerPhone})
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        update_data = address.dict()
        update_data["customerId"] = str(customer["_id"])
        
        result = await db.addresses.update_one(
            {"_id": ObjectId(address_id)},
            {"$set": update_data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Address not found")
        
        updated = await db.addresses.find_one({"_id": ObjectId(address_id)})
        return serialize_doc(updated)
    except HTTPException:
        raise
    except:
        raise HTTPException(status_code=400, detail="Invalid address ID")

@api_router.delete("/addresses/{address_id}")
async def delete_address(address_id: str):
    """Delete address"""
    try:
        result = await db.addresses.delete_one({"_id": ObjectId(address_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Address not found")
        return {"success": True, "message": "Address deleted"}
    except:
        raise HTTPException(status_code=400, detail="Invalid address ID")

# ============== ORDER APIs ==============

def generate_order_id(phone: str) -> str:
    """Generate order ID: OD + last 4 digits of phone + 4 random digits"""
    last4_phone = phone[-4:]
    random_digits = ''.join(random.choices(string.digits, k=4))
    return f"OD{last4_phone}{random_digits}"

@api_router.post("/orders")
async def create_order(order: OrderCreate):
    """Create new order"""
    # Validate minimum order value
    if order.totalAmount < 99:
        raise HTTPException(status_code=400, detail="Minimum order value is ₹99")
    
    # Get customer
    customer = await db.customers.find_one({"phone": order.customerPhone})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Generate order ID
    order_id = generate_order_id(order.customerPhone)
    
    # Create order
    new_order = Order(
        orderId=order_id,
        customerId=str(customer["_id"]),
        **order.dict()
    )
    
    result = await db.orders.insert_one(new_order.dict())
    created = await db.orders.find_one({"_id": result.inserted_id})
    return serialize_doc(created)

@api_router.get("/orders/customer/{phone}")
async def get_customer_orders(phone: str):
    """Get all orders for a customer"""
    orders = await db.orders.find({"customerPhone": phone}).sort("createdAt", -1).to_list(1000)
    return [serialize_doc(o) for o in orders]

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get order by order ID"""
    order = await db.orders.find_one({"orderId": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return serialize_doc(order)

@api_router.put("/orders/{order_id}/cancel")
async def cancel_order(order_id: str):
    """Cancel order - only allowed before Preparing or within 5 minutes"""
    order = await db.orders.find_one({"orderId": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check if already cancelled or delivered
    if order["status"] in ["Cancelled", "Delivered"]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel {order['status'].lower()} order")
    
    # Check if in Preparing, OutForDelivery stage
    if order["status"] in ["Preparing", "OutForDelivery", "Delivered"]:
        # Check if within 5 minutes
        time_diff = (datetime.utcnow() - order["createdAt"]).total_seconds()
        if time_diff > 300:  # 5 minutes = 300 seconds
            raise HTTPException(status_code=400, detail="Cannot cancel order after 5 minutes of preparation")
    
    # Cancel order
    result = await db.orders.update_one(
        {"orderId": order_id},
        {"$set": {"status": "Cancelled", "cancelledAt": datetime.utcnow()}}
    )
    
    updated = await db.orders.find_one({"orderId": order_id})
    return serialize_doc(updated)

@api_router.get("/orders")
async def get_all_orders(status: Optional[str] = None, search: Optional[str] = None):
    """Get all orders [Admin]"""
    query = {}
    if status:
        query["status"] = status
    if search:
        query["orderId"] = {"$regex": search, "$options": "i"}
    
    orders = await db.orders.find(query).sort("createdAt", -1).to_list(1000)
    return [serialize_doc(o) for o in orders]

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str = Body(...)):
    """Update order status [Admin]"""
    valid_statuses = ["Pending", "Accepted", "Preparing", "OutForDelivery", "Delivered", "Cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.orders.update_one(
        {"orderId": order_id},
        {"$set": {"status": status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    updated = await db.orders.find_one({"orderId": order_id})
    return serialize_doc(updated)

# ============== PINCODE APIs ==============

@api_router.get("/pincodes/check/{pincode}")
async def check_pincode(pincode: str):
    """Check if pincode is serviceable"""
    pincode_doc = await db.pincodes.find_one({"pincode": pincode, "isActive": True})
    if pincode_doc:
        return {"serviceable": True, "area": pincode_doc.get("area", "")}
    return {"serviceable": False}

@api_router.post("/pincodes/request")
async def create_pincode_request(request: PincodeRequest):
    """Save pincode request for unavailable areas"""
    await db.pincodeRequests.insert_one(request.dict())
    return {"success": True, "message": "Request saved. We'll notify you when service is available."}

@api_router.get("/pincodes")
async def get_pincodes():
    """Get all pincodes [Admin]"""
    pincodes = await db.pincodes.find().to_list(1000)
    return [serialize_doc(p) for p in pincodes]

@api_router.post("/pincodes")
async def create_pincode(pincode: Pincode):
    """Add new serviceable pincode [Admin]"""
    existing = await db.pincodes.find_one({"pincode": pincode.pincode})
    if existing:
        raise HTTPException(status_code=400, detail="Pincode already exists")
    
    result = await db.pincodes.insert_one(pincode.dict())
    created = await db.pincodes.find_one({"_id": result.inserted_id})
    return serialize_doc(created)

@api_router.put("/pincodes/{pincode_id}")
async def update_pincode(pincode_id: str, isActive: bool = Body(...)):
    """Enable/disable pincode [Admin]"""
    try:
        result = await db.pincodes.update_one(
            {"_id": ObjectId(pincode_id)},
            {"$set": {"isActive": isActive}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Pincode not found")
        return {"success": True, "message": "Pincode updated"}
    except:
        raise HTTPException(status_code=400, detail="Invalid pincode ID")

# ============== COUPON APIs ==============

@api_router.post("/coupons/validate")
async def validate_coupon(request: CouponValidate):
    """Validate coupon code"""
    coupon = await db.coupons.find_one({
        "code": request.code.upper(),
        "isActive": True,
        "expiryDate": {"$gte": datetime.utcnow()}
    })
    
    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid or expired coupon")
    
    if coupon["usedCount"] >= coupon["usageLimit"]:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    
    if request.orderValue < coupon["minOrderValue"]:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order value ₹{coupon['minOrderValue']} required"
        )
    
    # Calculate discount
    if coupon["discountType"] == "percentage":
        discount = (request.orderValue * coupon["discountValue"]) / 100
        if coupon.get("maxDiscount") and discount > coupon["maxDiscount"]:
            discount = coupon["maxDiscount"]
    else:
        discount = coupon["discountValue"]
    
    return {
        "valid": True,
        "discount": discount,
        "code": coupon["code"]
    }

@api_router.get("/coupons")
async def get_coupons():
    """Get all coupons [Admin]"""
    coupons = await db.coupons.find().to_list(1000)
    return [serialize_doc(c) for c in coupons]

@api_router.post("/coupons")
async def create_coupon(coupon: Coupon):
    """Create new coupon [Admin]"""
    coupon.code = coupon.code.upper()
    existing = await db.coupons.find_one({"code": coupon.code})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    result = await db.coupons.insert_one(coupon.dict())
    created = await db.coupons.find_one({"_id": result.inserted_id})
    return serialize_doc(created)

@api_router.put("/coupons/{coupon_id}")
async def update_coupon(coupon_id: str, coupon: Coupon):
    """Update coupon [Admin]"""
    try:
        result = await db.coupons.update_one(
            {"_id": ObjectId(coupon_id)},
            {"$set": coupon.dict()}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Coupon not found")
        
        updated = await db.coupons.find_one({"_id": ObjectId(coupon_id)})
        return serialize_doc(updated)
    except HTTPException:
        raise
    except:
        raise HTTPException(status_code=400, detail="Invalid coupon ID")

# ============== DELIVERY SLOT APIs ==============

@api_router.get("/slots")
async def get_delivery_slots():
    """Get all active delivery slots"""
    slots = await db.deliverySlots.find({"isActive": True}).to_list(100)
    return [serialize_doc(s) for s in slots]

@api_router.post("/slots")
async def create_slot(slot: DeliverySlot):
    """Create delivery slot [Admin]"""
    result = await db.deliverySlots.insert_one(slot.dict())
    created = await db.deliverySlots.find_one({"_id": result.inserted_id})
    return serialize_doc(created)

@api_router.put("/slots/{slot_id}")
async def update_slot(slot_id: str, slot: DeliverySlot):
    """Update delivery slot [Admin]"""
    try:
        result = await db.deliverySlots.update_one(
            {"_id": ObjectId(slot_id)},
            {"$set": slot.dict()}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Slot not found")
        
        updated = await db.deliverySlots.find_one({"_id": ObjectId(slot_id)})
        return serialize_doc(updated)
    except HTTPException:
        raise
    except:
        raise HTTPException(status_code=400, detail="Invalid slot ID")

# ============== ADMIN APIs ==============

@api_router.post("/admin/login")
async def admin_login(username: str = Body(...), password: str = Body(...)):
    """Admin login with hardcoded credentials"""
    # Hardcoded credentials for MVP
    if username == "admin" and password == "hatbajar2025":
        return {
            "success": True,
            "token": "admin_mock_token",
            "admin": {"username": "admin", "role": "admin"}
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")

@api_router.get("/admin/customers")
async def get_all_customers():
    """Get all customers with their details [Admin]"""
    customers = await db.customers.find().to_list(1000)
    result = []
    
    for customer in customers:
        customer_data = serialize_doc(customer)
        # Get addresses
        addresses = await db.addresses.find({"customerId": str(customer["_id"])}).to_list(100)
        customer_data["addresses"] = [serialize_doc(a) for a in addresses]
        
        # Get order count
        order_count = await db.orders.count_documents({"customerId": str(customer["_id"])})
        customer_data["orderCount"] = order_count
        
        result.append(customer_data)
    
    return result

@api_router.get("/admin/settings")
async def get_admin_settings():
    """Get admin settings"""
    settings = await db.adminSettings.find().to_list(100)
    return [serialize_doc(s) for s in settings]

@api_router.put("/admin/settings")
async def update_admin_setting(key: str = Body(...), value: Any = Body(...)):
    """Update admin setting"""
    result = await db.adminSettings.update_one(
        {"key": key},
        {"$set": {"value": value}},
        upsert=True
    )
    return {"success": True, "message": "Setting updated"}

@api_router.get("/admin/pincode-requests")
async def get_pincode_requests():
    """Get all pincode requests [Admin]"""
    requests = await db.pincodeRequests.find().sort("createdAt", -1).to_list(1000)
    return [serialize_doc(r) for r in requests]

# ============== ROOT ENDPOINT ==============

@api_router.get("/")
async def root():
    return {
        "message": "Hatbajar API",
        "version": "1.0.0",
        "status": "running"
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
