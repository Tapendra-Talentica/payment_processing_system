# Payment Processing Flow Guide

This document explains the complete flow of how orders and payments work in the system, with step-by-step API calls.

---

## 🔄 Complete Payment Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Payment Processing Flow                         │
└─────────────────────────────────────────────────────────────────────────┘

1. CREATE CUSTOMER (Optional - can be done beforehand)
   ↓
2. CREATE ORDER (Required - establishes what to pay for)
   ↓
3. PAYMENT PROCESSING (Choose one of the following flows)
   │
   ├─► Flow A: DIRECT PURCHASE (One-step payment)
   │   └─► purchase → COMPLETED
   │
   ├─► Flow B: AUTHORIZE + CAPTURE (Two-step payment)
   │   ├─► authorize → AUTHORIZED (funds on hold)
   │   └─► capture → CAPTURED (funds collected)
   │
   └─► Flow C: AUTHORIZE + CANCEL (Authorization without capture)
       ├─► authorize → AUTHORIZED
       └─► cancel → CANCELLED (release funds)
   
4. OPTIONAL: REFUND (After capture)
   └─► refund → REFUNDED (return funds)

5. VIEW TRANSACTION HISTORY
   └─► Get all transactions for the order
```

---

## 📋 Detailed API Call Sequence

### **Step 1: Create or Get a Customer**

Before creating an order, you need a customer. You can either:

#### Option A: Get existing customers
```bash
curl -X GET http://localhost:5000/api/v1/customers

# Response:
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "billingAddress": {...}
    }
  ]
}
```

#### Option B: Create a new customer
```bash
curl -X POST http://localhost:5000/api/v1/customers \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newcustomer@example.com",
    "name": "New Customer",
    "billingAddress": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  }'

# Response:
{
  "id": "customer-uuid-here",
  "email": "newcustomer@example.com",
  "name": "New Customer",
  ...
}
```

**⚠️ Save the customer ID - you'll need it for the next step!**

---

### **Step 2: Create an Order**

```bash
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 99.99,
    "currency": "USD",
    "metadata": {
      "description": "Product purchase",
      "items": [
        {"name": "Product A", "quantity": 1, "price": 99.99}
      ]
    }
  }'

# Response:
{
  "id": "order-uuid-here",
  "customerId": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 99.99,
  "currency": "USD",
  "status": "PENDING",
  "createdAt": "2025-09-30T12:30:00Z",
  "customer": {...},
  "transactions": []
}
```

**⚠️ Save the order ID - you'll need it for payment!**

---

### **Step 3: Process Payment**

Now choose one of three payment flows:

---

## 🎯 Flow A: Direct Purchase (Recommended for simple payments)

**Use case:** Immediate payment - authorize and capture in one step.

```bash
curl -X POST http://localhost:5000/api/v1/payments/purchase \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "orderId": "order-uuid-here",
    "amount": 99.99,
    "cardNumber": "4111111111111111",
    "expirationDate": "12/25",
    "cvv": "123",
    "billingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "USA"
    }
  }'

# Response:
{
  "id": "transaction-uuid-here",
  "orderId": "order-uuid-here",
  "amount": 99.99,
  "status": "CAPTURED",
  "gatewayTransactionId": "authorize-net-txn-id",
  "createdAt": "2025-09-30T12:35:00Z"
}
```

**✅ Payment complete! Funds are collected.**

---

## 🎯 Flow B: Authorize + Capture (Recommended for reservations)

**Use case:** Reserve funds first, capture later (e.g., hotel bookings, pre-orders).

### Step 3a: Authorize Payment

```bash
curl -X POST http://localhost:5000/api/v1/payments/authorize \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "orderId": "order-uuid-here",
    "amount": 99.99,
    "cardNumber": "4111111111111111",
    "expirationDate": "12/25",
    "cvv": "123",
    "billingAddress": {
      "firstName": "John",
      "lastName": "Doe",
      "address": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "USA"
    }
  }'

# Response:
{
  "id": "transaction-uuid-here",
  "orderId": "order-uuid-here",
  "amount": 99.99,
  "status": "AUTHORIZED",
  "gatewayTransactionId": "authorize-net-auth-id",
  "createdAt": "2025-09-30T12:35:00Z"
}
```

**💰 Funds are on hold but NOT collected yet.**

**⚠️ Save the transaction ID for the next step!**

### Step 3b: Capture Payment

**Capture the full amount:**
```bash
curl -X POST http://localhost:5000/api/v1/payments/capture \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "transaction-uuid-here",
    "amount": 99.99
  }'

# Response:
{
  "id": "new-transaction-uuid",
  "orderId": "order-uuid-here",
  "parentTransactionId": "transaction-uuid-here",
  "amount": 99.99,
  "status": "CAPTURED",
  "createdAt": "2025-09-30T12:40:00Z"
}
```

**OR capture partial amount:**
```bash
curl -X POST http://localhost:5000/api/v1/payments/capture \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "transaction-uuid-here",
    "amount": 50.00
  }'
```

**✅ Funds are now collected!**

---

## 🎯 Flow C: Authorize + Cancel (For cancellations before capture)

**Use case:** Customer cancels reservation before check-in.

### Step 3a: Authorize (same as Flow B)

```bash
curl -X POST http://localhost:5000/api/v1/payments/authorize \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{...}'
```

### Step 3b: Cancel Authorization

```bash
curl -X POST http://localhost:5000/api/v1/payments/cancel \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "transaction-uuid-here"
  }'

# Response:
{
  "id": "new-transaction-uuid",
  "orderId": "order-uuid-here",
  "parentTransactionId": "transaction-uuid-here",
  "status": "CANCELLED",
  "createdAt": "2025-09-30T12:45:00Z"
}
```

**✅ Authorization cancelled, funds released.**

---

## 💸 Step 4: Refund (Optional - after capture)

**Full refund:**
```bash
curl -X POST http://localhost:5000/api/v1/payments/refund \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "captured-transaction-uuid",
    "amount": 99.99,
    "reason": "Customer requested refund"
  }'
```

**Partial refund:**
```bash
curl -X POST http://localhost:5000/api/v1/payments/refund \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "captured-transaction-uuid",
    "amount": 25.00,
    "reason": "Partial return"
  }'
```

**✅ Money returned to customer.**

---

## 📊 Step 5: View Transaction History

### Get all transactions for an order:
```bash
curl -X GET "http://localhost:5000/api/v1/transactions?orderId=order-uuid-here"

# Response:
{
  "data": [
    {
      "id": "txn-1",
      "type": "AUTHORIZE",
      "status": "AUTHORIZED",
      "amount": 99.99,
      "createdAt": "..."
    },
    {
      "id": "txn-2",
      "type": "CAPTURE",
      "status": "CAPTURED",
      "amount": 99.99,
      "parentTransactionId": "txn-1",
      "createdAt": "..."
    }
  ]
}
```

### Get specific transaction:
```bash
curl -X GET http://localhost:5000/api/v1/transactions/transaction-uuid-here
```

### Get order details with transactions:
```bash
curl -X GET http://localhost:5000/api/v1/orders/order-uuid-here

# Response includes all related transactions
{
  "id": "order-uuid",
  "status": "CAPTURED",
  "transactions": [...]
}
```

---

## 🔐 Admin Operations (Requires JWT Token)

### Login as Admin:
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@payment-system.com",
    "password": "Admin@123"
  }'

# Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {...}
}
```

### View all transactions (Admin only):
```bash
TOKEN="paste-token-here"

curl -X GET http://localhost:5000/api/v1/admin/transactions \
  -H "Authorization: Bearer $TOKEN"
```

### Search transactions:
```bash
curl -X GET "http://localhost:5000/api/v1/admin/transactions?status=CAPTURED&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Manual refund (Admin only):
```bash
curl -X POST http://localhost:5000/api/v1/admin/refunds \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "transaction-uuid",
    "amount": 50.00,
    "reason": "Admin initiated refund"
  }'
```

---

## 🧪 Test Credit Cards (Authorize.Net Sandbox)

| Card Number         | Type       | Result  |
|---------------------|------------|---------|
| 4111111111111111    | Visa       | Success |
| 5424000000000015    | Mastercard | Success |
| 370000000000002     | Amex       | Success |
| 6011000000000012    | Discover   | Success |

**Expiration:** Any future date (e.g., `12/25`, `06/26`)  
**CVV:** Any 3-4 digits (e.g., `123`, `456`)

---

## 📦 Transaction States

```
PENDING → Order created, no payment yet
    ↓
AUTHORIZED → Funds on hold (can cancel or capture)
    ↓
CAPTURED → Funds collected (can refund)
    ↓
REFUNDED → Money returned

OR

AUTHORIZED → CANCELLED → Authorization voided
```

---

## 🎬 Quick Start Script

Run this script to test the entire flow:

```bash
#!/bin/bash

# 1. Get customer ID
echo "Step 1: Getting customer..."
CUSTOMER_ID=$(curl -s http://localhost:5000/api/v1/customers | jq -r '.data[0].id')
echo "Customer ID: $CUSTOMER_ID"

# 2. Create order
echo -e "\nStep 2: Creating order..."
ORDER_ID=$(curl -s -X POST http://localhost:5000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"amount\": 99.99,
    \"currency\": \"USD\"
  }" | jq -r '.id')
echo "Order ID: $ORDER_ID"

# 3. Authorize payment
echo -e "\nStep 3: Authorizing payment..."
TXN_ID=$(curl -s -X POST http://localhost:5000/api/v1/payments/authorize \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d "{
    \"orderId\": \"$ORDER_ID\",
    \"amount\": 99.99,
    \"cardNumber\": \"4111111111111111\",
    \"expirationDate\": \"12/25\",
    \"cvv\": \"123\",
    \"billingAddress\": {
      \"firstName\": \"John\",
      \"lastName\": \"Doe\",
      \"address\": \"123 Main St\",
      \"city\": \"New York\",
      \"state\": \"NY\",
      \"zip\": \"10001\",
      \"country\": \"USA\"
    }
  }" | jq -r '.id')
echo "Transaction ID: $TXN_ID"

# 4. Capture payment
echo -e "\nStep 4: Capturing payment..."
curl -s -X POST http://localhost:5000/api/v1/payments/capture \
  -H "Content-Type: application/json" \
  -d "{
    \"transactionId\": \"$TXN_ID\",
    \"amount\": 99.99
  }" | jq '.'

# 5. View transaction history
echo -e "\nStep 5: Transaction history..."
curl -s "http://localhost:5000/api/v1/transactions?orderId=$ORDER_ID" | jq '.'
```

Save this as `test-payment-flow.sh`, make it executable with `chmod +x test-payment-flow.sh`, and run it!

---

## ❓ Common Questions

### Q: Which flow should I use?
- **Purchase**: Simple one-time payments
- **Authorize + Capture**: When you need to reserve funds (hotels, rentals)
- **Authorize + Cancel**: When customer might cancel before service

### Q: Can I capture multiple times?
Yes! You can do multiple partial captures until the full authorized amount is reached.

### Q: Can I refund multiple times?
Yes! You can do multiple partial refunds until the full captured amount is refunded.

### Q: What's the idempotency key for?
Prevents duplicate payments if the request is retried (network issues, etc.). Use a unique ID for each payment attempt.

### Q: Why am I getting a 500 error?
- Check that the `customerId` exists (run `/api/v1/customers` first)
- Check that the `orderId` exists for payment operations
- Make sure the database is seeded (`npm run seed`)

---

## 📚 Related Documentation

- **README.md** - Setup and installation
- **API-SPECIFICATION.yml** - Complete API reference
- **Architecture.md** - System architecture
- **POSTMAN_COLLECTION.json** - Import into Postman for easy testing
- **API_USAGE_GUIDE.md** - Troubleshooting guide

---

**Need help?** Check the logs in your terminal or open an issue!
