import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def seed_data():
    print("Starting to seed data...")
    
    # Clear existing data
    await db.products.delete_many({})
    await db.pincodes.delete_many({})
    await db.deliverySlots.delete_many({})
    await db.coupons.delete_many({})
    
    # Add Products
    products = [
        {
            "name": "Fresh Chicken Breast",
            "category": "chicken",
            "description": "Premium quality chicken breast, freshly cut and cleaned. Perfect for grilling, baking, or curry. Rich in protein and low in fat.",
            "shortDescription": "Fresh, boneless chicken breast",
            "basePrice": 280,
            "images": [],
            "variants": [
                {"type": "weight", "value": "250g", "price": 140},
                {"type": "weight", "value": "500g", "price": 280},
                {"type": "weight", "value": "750g", "price": 410},
                {"type": "weight", "value": "1kg", "price": 550}
            ],
            "inStock": True,
            "isFeatured": True
        },
        {
            "name": "Country Chicken",
            "category": "chicken",
            "description": "Farm-fresh country chicken, naturally raised without antibiotics. Rich flavor and perfect for traditional recipes.",
            "shortDescription": "Organic country chicken",
            "basePrice": 350,
            "images": [],
            "variants": [
                {"type": "weight", "value": "500g", "price": 350},
                {"type": "weight", "value": "750g", "price": 520},
                {"type": "weight", "value": "1kg", "price": 690}
            ],
            "inStock": True,
            "isFeatured": True
        },
        {
            "name": "Chicken Drumsticks",
            "category": "chicken",
            "description": "Juicy chicken drumsticks, perfect for grilling, frying, or making soups. Kids favorite!",
            "shortDescription": "Fresh chicken drumsticks",
            "basePrice": 220,
            "images": [],
            "variants": [
                {"type": "weight", "value": "500g", "price": 220},
                {"type": "weight", "value": "1kg", "price": 430}
            ],
            "inStock": True,
            "isFeatured": False
        },
        {
            "name": "Brown Eggs",
            "category": "eggs",
            "description": "Farm-fresh brown eggs from free-range hens. Rich in protein, vitamins, and minerals. Perfect for breakfast or baking.",
            "shortDescription": "Fresh brown eggs",
            "basePrice": 72,
            "images": [],
            "variants": [
                {"type": "pack", "value": "6 eggs", "price": 72},
                {"type": "pack", "value": "12 eggs", "price": 140},
                {"type": "pack", "value": "30 eggs (tray)", "price": 340}
            ],
            "inStock": True,
            "isFeatured": True
        },
        {
            "name": "White Eggs",
            "category": "eggs",
            "description": "Fresh white eggs from healthy hens. High-quality protein source for your daily nutrition.",
            "shortDescription": "Fresh white eggs",
            "basePrice": 60,
            "images": [],
            "variants": [
                {"type": "pack", "value": "6 eggs", "price": 60},
                {"type": "pack", "value": "12 eggs", "price": 115},
                {"type": "pack", "value": "30 eggs (tray)", "price": 280}
            ],
            "inStock": True,
            "isFeatured": False
        }
    ]
    
    result = await db.products.insert_many(products)
    print(f"Added {len(result.inserted_ids)} products")
    
    # Add Pincodes
    pincodes = [
        {"pincode": "560001", "area": "Bangalore Central", "isActive": True},
        {"pincode": "560002", "area": "Bangalore City", "isActive": True},
        {"pincode": "560003", "area": "Bangalore Cantonment", "isActive": True},
        {"pincode": "560004", "area": "Malleshwaram", "isActive": True},
        {"pincode": "560005", "area": "Rajajinagar", "isActive": True},
        {"pincode": "110001", "area": "Delhi Central", "isActive": True},
        {"pincode": "400001", "area": "Mumbai Fort", "isActive": True},
    ]
    
    result = await db.pincodes.insert_many(pincodes)
    print(f"Added {len(result.inserted_ids)} pincodes")
    
    # Add Delivery Slots
    slots = [
        {"slotName": "6 AM - 9 AM", "startTime": "06:00", "endTime": "09:00", "isActive": True, "maxOrders": 50},
        {"slotName": "9 AM - 12 PM", "startTime": "09:00", "endTime": "12:00", "isActive": True, "maxOrders": 50},
        {"slotName": "12 PM - 3 PM", "startTime": "12:00", "endTime": "15:00", "isActive": True, "maxOrders": 50},
        {"slotName": "3 PM - 6 PM", "startTime": "15:00", "endTime": "18:00", "isActive": True, "maxOrders": 50},
        {"slotName": "6 PM - 9 PM", "startTime": "18:00", "endTime": "21:00", "isActive": True, "maxOrders": 50},
    ]
    
    result = await db.deliverySlots.insert_many(slots)
    print(f"Added {len(result.inserted_ids)} delivery slots")
    
    # Add Coupons
    from datetime import datetime, timedelta
    
    coupons = [
        {
            "code": "WELCOME10",
            "discountType": "percentage",
            "discountValue": 10,
            "minOrderValue": 199,
            "maxDiscount": 100,
            "expiryDate": datetime.utcnow() + timedelta(days=30),
            "isActive": True,
            "usageLimit": 1000,
            "usedCount": 0
        },
        {
            "code": "FLAT50",
            "discountType": "fixed",
            "discountValue": 50,
            "minOrderValue": 299,
            "maxDiscount": None,
            "expiryDate": datetime.utcnow() + timedelta(days=15),
            "isActive": True,
            "usageLimit": 500,
            "usedCount": 0
        }
    ]
    
    result = await db.coupons.insert_many(coupons)
    print(f"Added {len(result.inserted_ids)} coupons")
    
    print("\n✅ Seed data completed successfully!")
    print("\nTest Credentials:")
    print("- Customer: Any 10-digit phone + any 6-digit OTP")
    print("- Admin: admin / hatbajar2025")
    print("\nServiceable Pincodes: 560001-560005, 110001, 400001")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
