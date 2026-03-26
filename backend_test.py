#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for Hatbajar MVP
Tests all API endpoints with realistic data
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List

# Base URL from frontend environment
BASE_URL = "https://local-fresh-eggs.preview.emergentagent.com/api"

class HatbajarAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.test_results = []
        self.created_data = {
            "customers": [],
            "products": [],
            "addresses": [],
            "orders": [],
            "pincodes": [],
            "coupons": [],
            "slots": []
        }
        
    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> Dict:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        try:
            if method.upper() == "GET":
                response = self.session.get(url, params=params)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data)
            elif method.upper() == "DELETE":
                response = self.session.delete(url)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return {
                "status_code": response.status_code,
                "data": response.json() if response.content else {},
                "success": 200 <= response.status_code < 300
            }
        except requests.exceptions.RequestException as e:
            return {
                "status_code": 0,
                "data": {"error": str(e)},
                "success": False
            }
        except json.JSONDecodeError:
            return {
                "status_code": response.status_code,
                "data": {"error": "Invalid JSON response"},
                "success": False
            }

    def test_root_endpoint(self):
        """Test root API endpoint"""
        print("\n=== Testing Root Endpoint ===")
        response = self.make_request("GET", "/")
        
        if response["success"]:
            data = response["data"]
            if "message" in data and "Hatbajar" in data["message"]:
                self.log_result("Root Endpoint", True, "API is running", data)
            else:
                self.log_result("Root Endpoint", False, "Unexpected response format", data)
        else:
            self.log_result("Root Endpoint", False, f"Failed with status {response['status_code']}", response["data"])

    def test_auth_apis(self):
        """Test authentication APIs"""
        print("\n=== Testing Auth APIs ===")
        
        # Test phone numbers
        test_phones = ["9876543210", "8765432109", "7654321098"]
        
        for phone in test_phones:
            # Test send OTP
            response = self.make_request("POST", "/auth/send-otp", {"phone": phone})
            if response["success"]:
                self.log_result(f"Send OTP - {phone}", True, "OTP sent successfully")
            else:
                self.log_result(f"Send OTP - {phone}", False, f"Failed: {response['data']}")
                continue
            
            # Test verify OTP with valid 6-digit code
            response = self.make_request("POST", "/auth/verify-otp", {"phone": phone, "otp": "123456"})
            if response["success"]:
                customer_data = response["data"].get("customer", {})
                if customer_data.get("phone") == phone:
                    self.created_data["customers"].append(customer_data)
                    self.log_result(f"Verify OTP - {phone}", True, "OTP verified, customer created/retrieved")
                else:
                    self.log_result(f"Verify OTP - {phone}", False, "Customer data mismatch")
            else:
                self.log_result(f"Verify OTP - {phone}", False, f"Failed: {response['data']}")
                continue
            
            # Test invalid OTP format
            response = self.make_request("POST", "/auth/verify-otp", {"phone": phone, "otp": "12345"})
            if not response["success"] and response["status_code"] == 400:
                self.log_result(f"Invalid OTP Format - {phone}", True, "Correctly rejected invalid OTP")
            else:
                self.log_result(f"Invalid OTP Format - {phone}", False, "Should reject invalid OTP format")
            
            # Test get customer
            response = self.make_request("GET", f"/auth/customer/{phone}")
            if response["success"]:
                self.log_result(f"Get Customer - {phone}", True, "Customer retrieved successfully")
            else:
                self.log_result(f"Get Customer - {phone}", False, f"Failed: {response['data']}")
            
            # Test update customer name
            customer_names = ["Rajesh Kumar", "Priya Sharma", "Amit Singh"]
            name = customer_names[test_phones.index(phone)]
            response = self.make_request("PUT", f"/auth/customer/{phone}", name)
            if response["success"]:
                self.log_result(f"Update Customer Name - {phone}", True, f"Name updated to {name}")
            else:
                self.log_result(f"Update Customer Name - {phone}", False, f"Failed: {response['data']}")

    def test_product_apis(self):
        """Test product APIs"""
        print("\n=== Testing Product APIs ===")
        
        # Sample products with realistic data
        sample_products = [
            {
                "name": "Fresh Country Chicken",
                "category": "chicken",
                "description": "Farm-fresh country chicken, naturally raised without antibiotics. Perfect for curries and roasts.",
                "shortDescription": "Farm-fresh country chicken",
                "basePrice": 280.0,
                "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="],
                "variants": [
                    {"type": "weight", "value": "500g", "price": 140.0},
                    {"type": "weight", "value": "1kg", "price": 280.0},
                    {"type": "weight", "value": "1.5kg", "price": 420.0}
                ],
                "inStock": True,
                "isFeatured": True
            },
            {
                "name": "Farm Fresh Brown Eggs",
                "category": "eggs",
                "description": "Premium brown eggs from free-range hens. Rich in protein and nutrients.",
                "shortDescription": "Premium brown eggs",
                "basePrice": 60.0,
                "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="],
                "variants": [
                    {"type": "pack", "value": "6", "price": 60.0},
                    {"type": "pack", "value": "12", "price": 120.0},
                    {"type": "pack", "value": "30", "price": 300.0}
                ],
                "inStock": True,
                "isFeatured": True
            },
            {
                "name": "Broiler Chicken",
                "category": "chicken",
                "description": "Tender broiler chicken, perfect for quick cooking. Cleaned and ready to cook.",
                "shortDescription": "Tender broiler chicken",
                "basePrice": 220.0,
                "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="],
                "variants": [
                    {"type": "weight", "value": "750g", "price": 165.0},
                    {"type": "weight", "value": "1kg", "price": 220.0}
                ],
                "inStock": True,
                "isFeatured": False
            },
            {
                "name": "White Eggs",
                "category": "eggs",
                "description": "Fresh white eggs from healthy hens. Great for baking and cooking.",
                "shortDescription": "Fresh white eggs",
                "basePrice": 50.0,
                "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="],
                "variants": [
                    {"type": "pack", "value": "6", "price": 50.0},
                    {"type": "pack", "value": "12", "price": 100.0}
                ],
                "inStock": False,
                "isFeatured": False
            }
        ]
        
        # Create products
        for product in sample_products:
            response = self.make_request("POST", "/products", product)
            if response["success"]:
                created_product = response["data"]
                self.created_data["products"].append(created_product)
                self.log_result(f"Create Product - {product['name']}", True, f"Product created with ID: {created_product.get('_id')}")
            else:
                self.log_result(f"Create Product - {product['name']}", False, f"Failed: {response['data']}")
        
        # Test get all products
        response = self.make_request("GET", "/products")
        if response["success"]:
            products = response["data"]
            self.log_result("Get All Products", True, f"Retrieved {len(products)} products")
        else:
            self.log_result("Get All Products", False, f"Failed: {response['data']}")
        
        # Test product filters
        filter_tests = [
            {"category": "chicken"},
            {"category": "eggs"},
            {"featured": True},
            {"inStock": True},
            {"category": "chicken", "featured": True}
        ]
        
        for filters in filter_tests:
            response = self.make_request("GET", "/products", params=filters)
            if response["success"]:
                products = response["data"]
                filter_str = ", ".join([f"{k}={v}" for k, v in filters.items()])
                self.log_result(f"Filter Products - {filter_str}", True, f"Retrieved {len(products)} products")
            else:
                self.log_result(f"Filter Products - {filter_str}", False, f"Failed: {response['data']}")
        
        # Test get single product
        if self.created_data["products"]:
            product_id = self.created_data["products"][0]["_id"]
            response = self.make_request("GET", f"/products/{product_id}")
            if response["success"]:
                self.log_result("Get Single Product", True, "Product retrieved successfully")
            else:
                self.log_result("Get Single Product", False, f"Failed: {response['data']}")
            
            # Test update product
            update_data = {"basePrice": 300.0, "isFeatured": False}
            response = self.make_request("PUT", f"/products/{product_id}", update_data)
            if response["success"]:
                self.log_result("Update Product", True, "Product updated successfully")
            else:
                self.log_result("Update Product", False, f"Failed: {response['data']}")
        
        # Test invalid product ID
        response = self.make_request("GET", "/products/invalid_id")
        if not response["success"] and response["status_code"] == 400:
            self.log_result("Invalid Product ID", True, "Correctly rejected invalid ID")
        else:
            self.log_result("Invalid Product ID", False, "Should reject invalid product ID")

    def test_pincode_apis(self):
        """Test pincode APIs"""
        print("\n=== Testing Pincode APIs ===")
        
        # Create serviceable pincodes
        sample_pincodes = [
            {"pincode": "560001", "area": "MG Road", "isActive": True},
            {"pincode": "560002", "area": "Indiranagar", "isActive": True},
            {"pincode": "560003", "area": "Koramangala", "isActive": True}
        ]
        
        for pincode_data in sample_pincodes:
            response = self.make_request("POST", "/pincodes", pincode_data)
            if response["success"]:
                created_pincode = response["data"]
                self.created_data["pincodes"].append(created_pincode)
                self.log_result(f"Create Pincode - {pincode_data['pincode']}", True, f"Pincode created for {pincode_data['area']}")
            else:
                self.log_result(f"Create Pincode - {pincode_data['pincode']}", False, f"Failed: {response['data']}")
        
        # Test check serviceable pincode
        response = self.make_request("GET", "/pincodes/check/560001")
        if response["success"]:
            data = response["data"]
            if data.get("serviceable") == True:
                self.log_result("Check Serviceable Pincode", True, f"560001 is serviceable in {data.get('area')}")
            else:
                self.log_result("Check Serviceable Pincode", False, "560001 should be serviceable")
        else:
            self.log_result("Check Serviceable Pincode", False, f"Failed: {response['data']}")
        
        # Test check non-serviceable pincode
        response = self.make_request("GET", "/pincodes/check/999999")
        if response["success"]:
            data = response["data"]
            if data.get("serviceable") == False:
                self.log_result("Check Non-serviceable Pincode", True, "999999 correctly identified as non-serviceable")
            else:
                self.log_result("Check Non-serviceable Pincode", False, "999999 should be non-serviceable")
        else:
            self.log_result("Check Non-serviceable Pincode", False, f"Failed: {response['data']}")
        
        # Test pincode request for unavailable area
        if self.created_data["customers"]:
            customer_phone = self.created_data["customers"][0]["phone"]
            request_data = {"pincode": "999999", "customerPhone": customer_phone}
            response = self.make_request("POST", "/pincodes/request", request_data)
            if response["success"]:
                self.log_result("Pincode Request", True, "Request saved for unavailable pincode")
            else:
                self.log_result("Pincode Request", False, f"Failed: {response['data']}")

    def test_address_apis(self):
        """Test address APIs"""
        print("\n=== Testing Address APIs ===")
        
        if not self.created_data["customers"]:
            self.log_result("Address Tests", False, "No customers available for address testing")
            return
        
        customer_phone = self.created_data["customers"][0]["phone"]
        
        # Sample addresses
        sample_addresses = [
            {
                "customerPhone": customer_phone,
                "fullAddress": "123, Brigade Road, Near Commercial Street",
                "area": "Brigade Road",
                "landmark": "Near Cafe Coffee Day",
                "pincode": "560001",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "isDefault": True
            },
            {
                "customerPhone": customer_phone,
                "fullAddress": "456, Indiranagar 100 Feet Road",
                "area": "Indiranagar",
                "landmark": "Near Metro Station",
                "pincode": "560002",
                "latitude": 12.9719,
                "longitude": 77.6412,
                "isDefault": False
            },
            {
                "customerPhone": customer_phone,
                "fullAddress": "789, Koramangala 5th Block",
                "area": "Koramangala",
                "landmark": "Near Forum Mall",
                "pincode": "560003",
                "latitude": 12.9352,
                "longitude": 77.6245,
                "isDefault": False
            }
        ]
        
        # Create addresses
        for address in sample_addresses:
            response = self.make_request("POST", "/addresses", address)
            if response["success"]:
                created_address = response["data"]
                self.created_data["addresses"].append(created_address)
                self.log_result(f"Create Address - {address['area']}", True, f"Address created with ID: {created_address.get('_id')}")
            else:
                self.log_result(f"Create Address - {address['area']}", False, f"Failed: {response['data']}")
        
        # Test get customer addresses
        response = self.make_request("GET", f"/addresses/customer/{customer_phone}")
        if response["success"]:
            addresses = response["data"]
            self.log_result("Get Customer Addresses", True, f"Retrieved {len(addresses)} addresses")
            
            # Check default address
            default_addresses = [addr for addr in addresses if addr.get("isDefault")]
            if len(default_addresses) == 1:
                self.log_result("Default Address Logic", True, "Exactly one default address found")
            else:
                self.log_result("Default Address Logic", False, f"Found {len(default_addresses)} default addresses, should be 1")
        else:
            self.log_result("Get Customer Addresses", False, f"Failed: {response['data']}")
        
        # Test address limit (try to create 3 more addresses to exceed limit of 5)
        for i in range(3):
            excess_address = {
                "customerPhone": customer_phone,
                "fullAddress": f"Excess Address {i+1}",
                "area": f"Area {i+1}",
                "pincode": "560001",
                "isDefault": False
            }
            response = self.make_request("POST", "/addresses", excess_address)
            if i < 2:  # First 2 should succeed (total will be 5)
                if response["success"]:
                    self.log_result(f"Create Address {i+4}", True, "Address created successfully")
                else:
                    self.log_result(f"Create Address {i+4}", False, f"Failed: {response['data']}")
            else:  # 6th address should fail
                if not response["success"] and "Maximum 5 addresses" in str(response["data"]):
                    self.log_result("Address Limit Test", True, "Correctly enforced 5 address limit")
                else:
                    self.log_result("Address Limit Test", False, "Should enforce 5 address limit")
        
        # Test update address
        if self.created_data["addresses"]:
            address_id = self.created_data["addresses"][0]["_id"]
            update_data = {
                "customerPhone": customer_phone,
                "fullAddress": "Updated Address",
                "area": "Updated Area",
                "pincode": "560001",
                "isDefault": True
            }
            response = self.make_request("PUT", f"/addresses/{address_id}", update_data)
            if response["success"]:
                self.log_result("Update Address", True, "Address updated successfully")
            else:
                self.log_result("Update Address", False, f"Failed: {response['data']}")

    def test_delivery_slot_apis(self):
        """Test delivery slot APIs"""
        print("\n=== Testing Delivery Slot APIs ===")
        
        # Sample delivery slots
        sample_slots = [
            {"slotName": "Morning Slot", "startTime": "06:00", "endTime": "09:00", "isActive": True, "maxOrders": 50},
            {"slotName": "Mid Morning", "startTime": "09:00", "endTime": "12:00", "isActive": True, "maxOrders": 40},
            {"slotName": "Afternoon", "startTime": "15:00", "endTime": "18:00", "isActive": True, "maxOrders": 30}
        ]
        
        # Create delivery slots
        for slot in sample_slots:
            response = self.make_request("POST", "/slots", slot)
            if response["success"]:
                created_slot = response["data"]
                self.created_data["slots"].append(created_slot)
                self.log_result(f"Create Slot - {slot['slotName']}", True, f"Slot created: {slot['startTime']}-{slot['endTime']}")
            else:
                self.log_result(f"Create Slot - {slot['slotName']}", False, f"Failed: {response['data']}")
        
        # Test get delivery slots
        response = self.make_request("GET", "/slots")
        if response["success"]:
            slots = response["data"]
            active_slots = [slot for slot in slots if slot.get("isActive")]
            self.log_result("Get Delivery Slots", True, f"Retrieved {len(active_slots)} active slots")
        else:
            self.log_result("Get Delivery Slots", False, f"Failed: {response['data']}")

    def test_coupon_apis(self):
        """Test coupon APIs"""
        print("\n=== Testing Coupon APIs ===")
        
        # Sample coupons
        sample_coupons = [
            {
                "code": "WELCOME10",
                "discountType": "percentage",
                "discountValue": 10.0,
                "minOrderValue": 200.0,
                "maxDiscount": 50.0,
                "expiryDate": (datetime.utcnow() + timedelta(days=30)).isoformat(),
                "isActive": True,
                "usageLimit": 100,
                "usedCount": 0
            },
            {
                "code": "FLAT50",
                "discountType": "fixed",
                "discountValue": 50.0,
                "minOrderValue": 300.0,
                "expiryDate": (datetime.utcnow() + timedelta(days=15)).isoformat(),
                "isActive": True,
                "usageLimit": 50,
                "usedCount": 0
            },
            {
                "code": "EXPIRED",
                "discountType": "percentage",
                "discountValue": 20.0,
                "minOrderValue": 100.0,
                "expiryDate": (datetime.utcnow() - timedelta(days=1)).isoformat(),
                "isActive": True,
                "usageLimit": 10,
                "usedCount": 0
            }
        ]
        
        # Create coupons
        for coupon in sample_coupons:
            response = self.make_request("POST", "/coupons", coupon)
            if response["success"]:
                created_coupon = response["data"]
                self.created_data["coupons"].append(created_coupon)
                self.log_result(f"Create Coupon - {coupon['code']}", True, f"Coupon created with {coupon['discountType']} discount")
            else:
                self.log_result(f"Create Coupon - {coupon['code']}", False, f"Failed: {response['data']}")
        
        # Test coupon validation - valid percentage coupon
        response = self.make_request("POST", "/coupons/validate", {"code": "WELCOME10", "orderValue": 500.0})
        if response["success"]:
            data = response["data"]
            expected_discount = min(50.0, 500.0 * 0.10)  # 10% of 500 = 50, capped at maxDiscount
            if abs(data.get("discount", 0) - expected_discount) < 0.01:
                self.log_result("Validate Percentage Coupon", True, f"Correct discount calculated: ₹{data.get('discount')}")
            else:
                self.log_result("Validate Percentage Coupon", False, f"Incorrect discount: expected ₹{expected_discount}, got ₹{data.get('discount')}")
        else:
            self.log_result("Validate Percentage Coupon", False, f"Failed: {response['data']}")
        
        # Test coupon validation - valid fixed coupon
        response = self.make_request("POST", "/coupons/validate", {"code": "FLAT50", "orderValue": 400.0})
        if response["success"]:
            data = response["data"]
            if data.get("discount") == 50.0:
                self.log_result("Validate Fixed Coupon", True, f"Correct fixed discount: ₹{data.get('discount')}")
            else:
                self.log_result("Validate Fixed Coupon", False, f"Incorrect discount: expected ₹50, got ₹{data.get('discount')}")
        else:
            self.log_result("Validate Fixed Coupon", False, f"Failed: {response['data']}")
        
        # Test minimum order value validation
        response = self.make_request("POST", "/coupons/validate", {"code": "WELCOME10", "orderValue": 150.0})
        if not response["success"] and "Minimum order value" in str(response["data"]):
            self.log_result("Coupon Min Order Validation", True, "Correctly enforced minimum order value")
        else:
            self.log_result("Coupon Min Order Validation", False, "Should enforce minimum order value")
        
        # Test expired coupon
        response = self.make_request("POST", "/coupons/validate", {"code": "EXPIRED", "orderValue": 200.0})
        if not response["success"] and response["status_code"] == 404:
            self.log_result("Expired Coupon Validation", True, "Correctly rejected expired coupon")
        else:
            self.log_result("Expired Coupon Validation", False, "Should reject expired coupon")
        
        # Test invalid coupon
        response = self.make_request("POST", "/coupons/validate", {"code": "INVALID", "orderValue": 200.0})
        if not response["success"] and response["status_code"] == 404:
            self.log_result("Invalid Coupon Validation", True, "Correctly rejected invalid coupon")
        else:
            self.log_result("Invalid Coupon Validation", False, "Should reject invalid coupon")

    def test_order_apis(self):
        """Test order APIs"""
        print("\n=== Testing Order APIs ===")
        
        if not (self.created_data["customers"] and self.created_data["products"] and self.created_data["addresses"]):
            self.log_result("Order Tests", False, "Missing required data (customers, products, addresses)")
            return
        
        customer = self.created_data["customers"][0]
        product = self.created_data["products"][0]
        address = self.created_data["addresses"][0]
        
        # Test minimum order value validation
        low_value_order = {
            "customerPhone": customer["phone"],
            "customerName": "Rajesh Kumar",
            "items": [
                {
                    "productId": product["_id"],
                    "productName": product["name"],
                    "variant": product["variants"][0] if product["variants"] else None,
                    "quantity": 1,
                    "price": 50.0
                }
            ],
            "totalAmount": 50.0,
            "deliveryAddress": address,
            "paymentMethod": "COD",
            "deliverySlot": "Morning Slot"
        }
        
        response = self.make_request("POST", "/orders", low_value_order)
        if not response["success"] and "Minimum order value" in str(response["data"]):
            self.log_result("Minimum Order Value Validation", True, "Correctly enforced ₹99 minimum order")
        else:
            self.log_result("Minimum Order Value Validation", False, "Should enforce ₹99 minimum order")
        
        # Test valid order creation
        valid_order = {
            "customerPhone": customer["phone"],
            "customerName": "Rajesh Kumar",
            "items": [
                {
                    "productId": product["_id"],
                    "productName": product["name"],
                    "variant": product["variants"][0] if product["variants"] else None,
                    "quantity": 2,
                    "price": product["basePrice"]
                }
            ],
            "totalAmount": product["basePrice"] * 2,
            "deliveryAddress": address,
            "paymentMethod": "COD",
            "deliverySlot": "Morning Slot",
            "couponCode": "WELCOME10",
            "discount": 20.0
        }
        
        response = self.make_request("POST", "/orders", valid_order)
        if response["success"]:
            created_order = response["data"]
            self.created_data["orders"].append(created_order)
            order_id = created_order.get("orderId", "")
            
            # Validate order ID format (OD + last4phone + 4random)
            expected_prefix = f"OD{customer['phone'][-4:]}"
            if order_id.startswith(expected_prefix) and len(order_id) == 10:
                self.log_result("Create Order", True, f"Order created with ID: {order_id}")
                self.log_result("Order ID Format", True, f"Correct format: {order_id}")
            else:
                self.log_result("Create Order", True, f"Order created with ID: {order_id}")
                self.log_result("Order ID Format", False, f"Incorrect format: {order_id}, expected format: {expected_prefix}XXXX")
        else:
            self.log_result("Create Order", False, f"Failed: {response['data']}")
            return
        
        # Test get customer orders
        response = self.make_request("GET", f"/orders/customer/{customer['phone']}")
        if response["success"]:
            orders = response["data"]
            self.log_result("Get Customer Orders", True, f"Retrieved {len(orders)} orders")
        else:
            self.log_result("Get Customer Orders", False, f"Failed: {response['data']}")
        
        # Test get single order
        if self.created_data["orders"]:
            order_id = self.created_data["orders"][0]["orderId"]
            response = self.make_request("GET", f"/orders/{order_id}")
            if response["success"]:
                self.log_result("Get Single Order", True, "Order retrieved successfully")
            else:
                self.log_result("Get Single Order", False, f"Failed: {response['data']}")
            
            # Test order cancellation (should work for Pending status)
            response = self.make_request("PUT", f"/orders/{order_id}/cancel")
            if response["success"]:
                cancelled_order = response["data"]
                if cancelled_order.get("status") == "Cancelled":
                    self.log_result("Cancel Order", True, "Order cancelled successfully")
                else:
                    self.log_result("Cancel Order", False, "Order status not updated to Cancelled")
            else:
                self.log_result("Cancel Order", False, f"Failed: {response['data']}")
        
        # Create another order to test admin functions
        another_order = valid_order.copy()
        another_order["totalAmount"] = 150.0
        response = self.make_request("POST", "/orders", another_order)
        if response["success"]:
            admin_test_order = response["data"]
            self.created_data["orders"].append(admin_test_order)

    def test_admin_apis(self):
        """Test admin APIs"""
        print("\n=== Testing Admin APIs ===")
        
        # Test admin login with correct credentials
        response = self.make_request("POST", "/admin/login", {"username": "admin", "password": "hatbajar2025"})
        if response["success"]:
            data = response["data"]
            if data.get("token") and data.get("admin"):
                self.log_result("Admin Login - Valid", True, "Admin logged in successfully")
            else:
                self.log_result("Admin Login - Valid", False, "Missing token or admin data")
        else:
            self.log_result("Admin Login - Valid", False, f"Failed: {response['data']}")
        
        # Test admin login with incorrect credentials
        response = self.make_request("POST", "/admin/login", {"username": "admin", "password": "wrong"})
        if not response["success"] and response["status_code"] == 401:
            self.log_result("Admin Login - Invalid", True, "Correctly rejected invalid credentials")
        else:
            self.log_result("Admin Login - Invalid", False, "Should reject invalid credentials")
        
        # Test get all customers
        response = self.make_request("GET", "/admin/customers")
        if response["success"]:
            customers = response["data"]
            self.log_result("Get All Customers", True, f"Retrieved {len(customers)} customers with details")
            
            # Check if customer data includes addresses and order count
            if customers and "addresses" in customers[0] and "orderCount" in customers[0]:
                self.log_result("Customer Details", True, "Customer data includes addresses and order count")
            else:
                self.log_result("Customer Details", False, "Customer data missing addresses or order count")
        else:
            self.log_result("Get All Customers", False, f"Failed: {response['data']}")
        
        # Test get pincode requests
        response = self.make_request("GET", "/admin/pincode-requests")
        if response["success"]:
            requests = response["data"]
            self.log_result("Get Pincode Requests", True, f"Retrieved {len(requests)} pincode requests")
        else:
            self.log_result("Get Pincode Requests", False, f"Failed: {response['data']}")
        
        # Test order status update
        if self.created_data["orders"]:
            # Find a non-cancelled order
            active_order = None
            for order in self.created_data["orders"]:
                if order.get("status") != "Cancelled":
                    active_order = order
                    break
            
            if active_order:
                order_id = active_order["orderId"]
                response = self.make_request("PUT", f"/orders/{order_id}/status", "Accepted")
                if response["success"]:
                    updated_order = response["data"]
                    if updated_order.get("status") == "Accepted":
                        self.log_result("Update Order Status", True, "Order status updated to Accepted")
                    else:
                        self.log_result("Update Order Status", False, "Order status not updated correctly")
                else:
                    self.log_result("Update Order Status", False, f"Failed: {response['data']}")
                
                # Test invalid status
                response = self.make_request("PUT", f"/orders/{order_id}/status", "InvalidStatus")
                if not response["success"] and response["status_code"] == 400:
                    self.log_result("Invalid Order Status", True, "Correctly rejected invalid status")
                else:
                    self.log_result("Invalid Order Status", False, "Should reject invalid status")
        
        # Test get all orders (admin)
        response = self.make_request("GET", "/orders")
        if response["success"]:
            orders = response["data"]
            self.log_result("Get All Orders (Admin)", True, f"Retrieved {len(orders)} orders")
        else:
            self.log_result("Get All Orders (Admin)", False, f"Failed: {response['data']}")
        
        # Test order filtering
        response = self.make_request("GET", "/orders", params={"status": "Pending"})
        if response["success"]:
            pending_orders = response["data"]
            self.log_result("Filter Orders by Status", True, f"Retrieved {len(pending_orders)} pending orders")
        else:
            self.log_result("Filter Orders by Status", False, f"Failed: {response['data']}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Hatbajar Backend API Tests")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Run tests in logical order
        self.test_root_endpoint()
        self.test_auth_apis()
        self.test_product_apis()
        self.test_pincode_apis()
        self.test_address_apis()
        self.test_delivery_slot_apis()
        self.test_coupon_apis()
        self.test_order_apis()
        self.test_admin_apis()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r["success"]])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"❌ {result['test']}: {result['details']}")
        
        print(f"\n📈 CREATED DATA SUMMARY:")
        for key, items in self.created_data.items():
            print(f"  {key}: {len(items)} items")
        
        print("\n🎉 Testing completed!")

if __name__ == "__main__":
    tester = HatbajarAPITester()
    tester.run_all_tests()