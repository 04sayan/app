# Hatbajar MVP - Complete Documentation

## 🎉 Application Overview

**Hatbajar** is a mobile-first web application for a local fresh chicken and eggs business. The MVP includes a customer app and admin panel with complete order management functionality.

---

## 🚀 Features Implemented

### **Customer App**
✅ Mobile OTP Login (Mock - accepts any 6-digit OTP)  
✅ Pincode Check Before Browsing  
✅ Service Unavailability Message with Request System  
✅ Home Page with:
  - Banner
  - Category Cards (Chicken, Eggs, Fish - Coming Soon)
  - Featured Products
  - Trust Section

✅ Product Browsing:
  - Category-wise filtering
  - Product cards with images, price, stock status
  - Add to cart functionality

✅ Product Detail Page:
  - Multiple images support (up to 5)
  - Full description
  - Variant selection (weight for chicken, pack size for eggs)
  - Quantity selector
  - Add to cart

✅ Shopping Cart:
  - View all items
  - Update quantities
  - Remove items
  - Minimum order value validation (₹99)

✅ Checkout Process:
  - Contact details collection
  - Address management (up to 5 addresses)
  - Live location capture using Expo Location
  - Delivery slot selection
  - Payment method selection (COD & UPI - mocked)
  - Order summary

✅ Order Management:
  - Order placement with generated Order ID (OD + last4phone + 4random)
  - Order history
  - Order status tracking (Pending → Accepted → Preparing → Out for Delivery → Delivered)
  - Order cancellation (before Preparing or within 5 minutes)

✅ Profile Management:
  - View profile
  - Access to order history
  - Logout functionality

### **Admin Panel**
✅ Admin Login (username: admin, password: hatbajar2025)  
✅ Order Management:
  - View all orders
  - Filter by status
  - Update order status
  - View customer details
  - View order items

✅ Product Management (via API):
  - Create/Update/Delete products
  - Manage images (base64)
  - Update stock status
  - Set featured products

✅ Pincode Management (via API):
  - Add/Remove serviceable pincodes
  - Enable/Disable pincodes
  - View pincode requests from users

✅ Coupon Management (via API):
  - Create coupons (percentage/fixed discount)
  - Set expiry dates
  - Usage limits

✅ Delivery Slot Management (via API)

---

## 🛠️ Technical Stack

### **Frontend**
- **Framework**: Expo (React Native) - Mobile-first web app
- **Routing**: Expo Router (file-based routing)
- **State Management**: Zustand
- **Storage**: AsyncStorage
- **HTTP Client**: Axios
- **Location**: Expo Location API
- **UI Components**: React Native core components
- **Icons**: Expo Vector Icons

### **Backend**
- **Framework**: FastAPI (Python)
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: Mock OTP system
- **Payment**: Mock payment (COD & UPI)

### **Database Collections**
- `customers` - Customer data
- `addresses` - Delivery addresses (max 5 per customer)
- `products` - Products with variants
- `orders` - Order details with status tracking
- `coupons` - Discount coupons
- `pincodes` - Serviceable pincodes
- `pincodeRequests` - User requests for new areas
- `deliverySlots` - Delivery time slots

---

## 📡 API Endpoints

### **Authentication**
- `POST /api/auth/send-otp` - Send OTP (mock)
- `POST /api/auth/verify-otp` - Verify OTP (accepts any 6-digit)
- `GET /api/auth/customer/{phone}` - Get customer
- `PUT /api/auth/customer/{phone}` - Update customer name

### **Products**
- `GET /api/products` - List all products (filters: category, featured, inStock)
- `GET /api/products/{id}` - Get product details
- `POST /api/products` - Create product [Admin]
- `PUT /api/products/{id}` - Update product [Admin]
- `DELETE /api/products/{id}` - Delete product [Admin]

### **Orders**
- `POST /api/orders` - Place order
- `GET /api/orders/customer/{phone}` - Get customer orders
- `GET /api/orders/{orderId}` - Get order details
- `PUT /api/orders/{orderId}/cancel` - Cancel order
- `GET /api/orders` - Get all orders [Admin]
- `PUT /api/orders/{orderId}/status` - Update status [Admin]

### **Addresses**
- `GET /api/addresses/customer/{phone}` - Get customer addresses
- `POST /api/addresses` - Create address
- `PUT /api/addresses/{id}` - Update address
- `DELETE /api/addresses/{id}` - Delete address

### **Pincodes**
- `GET /api/pincodes/check/{pincode}` - Check serviceability
- `POST /api/pincodes/request` - Request service in area
- `GET /api/pincodes` - Get all pincodes [Admin]
- `POST /api/pincodes` - Add pincode [Admin]
- `PUT /api/pincodes/{id}` - Update pincode status [Admin]

### **Coupons**
- `POST /api/coupons/validate` - Validate coupon
- `GET /api/coupons` - Get all coupons [Admin]
- `POST /api/coupons` - Create coupon [Admin]
- `PUT /api/coupons/{id}` - Update coupon [Admin]

### **Delivery Slots**
- `GET /api/slots` - Get active slots
- `POST /api/slots` - Create slot [Admin]
- `PUT /api/slots/{id}` - Update slot [Admin]

### **Admin**
- `POST /api/admin/login` - Admin login
- `GET /api/admin/customers` - Get all customers with details
- `GET /api/admin/pincode-requests` - Get pincode requests

---

## 🧪 Test Data

### **Serviceable Pincodes**
- 560001 - Bangalore Central
- 560002 - Bangalore City
- 560003 - Bangalore Cantonment
- 560004 - Malleshwaram
- 560005 - Rajajinagar
- 110001 - Delhi Central
- 400001 - Mumbai Fort

### **Sample Products**
1. Fresh Chicken Breast (250g, 500g, 750g, 1kg)
2. Country Chicken (500g, 750g, 1kg)
3. Chicken Drumsticks (500g, 1kg)
4. Brown Eggs (6, 12, 30 tray)
5. White Eggs (6, 12, 30 tray)

### **Delivery Slots**
- 6 AM - 9 AM
- 9 AM - 12 PM
- 12 PM - 3 PM
- 3 PM - 6 PM
- 6 PM - 9 PM

### **Coupons**
- WELCOME10 - 10% off (max ₹100) on orders above ₹199
- FLAT50 - ₹50 off on orders above ₹299

---

## 🔐 Credentials

### **Customer Login**
- Phone: Any 10-digit number (e.g., 9876543210)
- OTP: Any 6-digit code (e.g., 123456)

### **Admin Login**
- Username: `admin`
- Password: `hatbajar2025`

---

## 📱 User Flow

### **Customer Journey**
1. **Login** → Enter phone → Enter any 6-digit OTP
2. **Pincode Check** → Enter serviceable pincode
3. **Browse** → View categories, featured products
4. **Product Detail** → Select variant, quantity
5. **Add to Cart** → Review cart items
6. **Checkout** → Enter address, select slot, choose payment
7. **Order Placed** → View order in My Orders
8. **Track Order** → Monitor status updates

### **Admin Journey**
1. **Login** → admin / hatbajar2025
2. **Dashboard** → View all orders
3. **Filter Orders** → By status
4. **Update Status** → Change order status
5. **Manage** → Products, pincodes, coupons (via API)

---

## 🎨 Design Features

- **Mobile-First**: Optimized for mobile devices
- **Tab Navigation**: Easy access to Home, Categories, Cart, Orders, Profile
- **Back Navigation**: All screens have back arrows
- **Clean UI**: Modern, premium, fast
- **Color Scheme**: Red (#e63946) primary color
- **Touch-Friendly**: Large touch targets (44-48px)
- **Icons**: Ionicons for consistent iconography

---

## 💡 Business Logic

### **Order ID Format**
`OD` + last 4 digits of phone + 4 random digits  
Example: OD32104409

### **Order Status Flow**
Pending → Accepted → Preparing → Out for Delivery → Delivered

### **Cancellation Rules**
- Can cancel before "Preparing" status
- Can cancel within 5 minutes after order placement

### **Minimum Order**
₹99 minimum order value enforced

### **Address Limit**
Maximum 5 addresses per customer

### **Payment Methods**
- Cash on Delivery (COD)
- UPI (Mock - auto success)

---

## 🚀 How to Use

### **Access the App**
- **Frontend URL**: Check your Expo preview URL
- **Backend API**: http://localhost:8001/api/

### **Test the Customer App**
1. Open the app in browser or Expo Go
2. Login with any phone number (10 digits)
3. Enter any 6-digit OTP
4. Enter a serviceable pincode (e.g., 560001)
5. Browse products and add to cart
6. Complete checkout with mock payment
7. View orders in My Orders tab

### **Test the Admin Panel**
1. Go to Profile → Admin Panel
2. Login with admin / hatbajar2025
3. View and manage orders
4. Update order statuses

---

## 📊 Database Seed Script

Run to populate sample data:
```bash
cd /app/backend && python seed_data.py
```

---

## 🔧 Future Enhancements (Not in MVP)

The following features are intentionally **not included** in this MVP:
- ❌ Real-time order tracking with maps
- ❌ Delivery partner app
- ❌ Push notifications
- ❌ Analytics dashboard
- ❌ Subscription plans
- ❌ Loyalty points
- ❌ Complex reports
- ❌ Real payment gateway integration
- ❌ Real SMS OTP service

---

## ✅ MVP Completion Status

**Backend**: ✅ Complete - All APIs functional, tested, and working  
**Frontend**: ✅ Complete - All customer screens implemented  
**Admin Panel**: ✅ Complete - Basic order management functional  
**Database**: ✅ Complete - Seeded with test data  
**Testing**: ✅ Backend fully tested (71/71 tests passed)

---

## 📝 Notes

- All images are stored as base64 strings in MongoDB
- OTP verification is mocked (accepts any 6-digit code)
- Payment is mocked (always succeeds)
- Live location capture works on devices with GPS
- Admin product/pincode/coupon management available via API
- Backend has been thoroughly tested
- Frontend ready for user testing

---

## 🎯 Success Criteria Met

✅ Mobile OTP login  
✅ Pincode check before browsing  
✅ Home page with all sections  
✅ Product browsing with variants  
✅ Shopping cart with validation  
✅ Checkout with location capture  
✅ Order tracking with status updates  
✅ Order cancellation logic  
✅ Admin panel with order management  
✅ Clean, premium, fast design  
✅ All back arrows implemented  
✅ Minimum order validation  
✅ Address management (max 5)  
✅ Payment methods (COD & UPI)  
✅ Order ID format implemented  

---

**🎉 Hatbajar MVP is ready for use!**
