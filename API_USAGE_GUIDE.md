# API Usage Guide

This guide shows you how to use the Payment Processing System API step-by-step.

## Quick Start

### 1. Get All Customers

First, you need to get a customer ID to create an order:

```bash
curl -X GET http://localhost:5000/api/v1/customers \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "data": [
    {
      "id": "customer-uuid-1",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "billingAddress": {...}
    }
  ],
  "total": 2,
  "page": 1,
  "limit": 10
}
```

### 2. Create an Order

Use a valid customer ID from step 1:

```bash
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "customer-uuid-1",
    "amount": 99.99,
    "currency": "USD",
    "metadata": {
      "description": "Test order",
      "items": [
        {"name": "Product A", "quantity": 1, "price": 99.99}
      ]
    }
  }'
```

**Response:**
```json
{
  "id": "order-uuid",
  "customerId": "customer-uuid-1",
  "amount": 99.99,
  "currency": "USD",
  "status": "PENDING",
  "customer": {...},
  "transactions": []
}
```

### 3. Make a Payment (Purchase)

Use the order ID from step 2:

```bash
curl -X POST http://localhost:5000/api/v1/payments/purchase \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-key-123" \
  -d '{
    "orderId": "order-uuid",
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
```

## Common Issues

### ❌ Error: "Invalid customerId"

**Problem:** The customer ID doesn't exist in the database.

**Solution:** 
1. Run `npm run seed` to populate the database with sample customers
2. Use the `/api/v1/customers` endpoint to get valid customer IDs

### ❌ Error: 500 on POST /api/v1/orders

**Problem:** Missing or invalid `customerId` in the request.

**Solution:**
```json
{
  "customerId": "valid-uuid-here",  // Must be a valid customer UUID
  "amount": 99.99,
  "currency": "USD"
}
```

### ❌ Error: "Unauthorized"

**Problem:** Some endpoints require JWT authentication.

**Solution:** Login first and use the token:

```bash
# Login
TOKEN=$(curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@payment-system.com", "password": "Admin@123"}' \
  | jq -r '.accessToken')

# Use token in subsequent requests
curl -X GET http://localhost:5000/api/v1/admin/transactions \
  -H "Authorization: Bearer $TOKEN"
```

## Complete Workflow Example

### Step-by-Step: Create Order and Process Payment

#### 1. Get Customers
```bash
curl http://localhost:5000/api/v1/customers | jq '.'
```

Save a customer ID from the response.

#### 2. Create Order
```bash
CUSTOMER_ID="paste-customer-id-here"

curl -X POST http://localhost:5000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"amount\": 150.00,
    \"currency\": \"USD\",
    \"metadata\": {
      \"description\": \"New product purchase\"
    }
  }" | jq '.'
```

Save the order ID from the response.

#### 3. Authorize Payment
```bash
ORDER_ID="paste-order-id-here"

curl -X POST http://localhost:5000/api/v1/payments/authorize \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d "{
    \"orderId\": \"$ORDER_ID\",
    \"amount\": 150.00,
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
  }" | jq '.'
```

Save the transaction ID from the response.

#### 4. Capture Payment
```bash
TRANSACTION_ID="paste-transaction-id-here"

curl -X POST http://localhost:5000/api/v1/payments/capture \
  -H "Content-Type: application/json" \
  -d "{
    \"transactionId\": \"$TRANSACTION_ID\",
    \"amount\": 150.00
  }" | jq '.'
```

#### 5. View Transaction History
```bash
curl "http://localhost:5000/api/v1/transactions?orderId=$ORDER_ID" | jq '.'
```

## Test Credit Cards (Authorize.Net Sandbox)

| Card Number         | Type       | Result  |
|---------------------|------------|---------|
| 4111111111111111    | Visa       | Success |
| 5424000000000015    | Mastercard | Success |
| 370000000000002     | Amex       | Success |
| 6011000000000012    | Discover   | Success |

**Expiration Date:** Any future date (e.g., 12/25)  
**CVV:** Any 3-4 digits (e.g., 123)

## Postman Collection

Import `POSTMAN_COLLECTION.json` for a pre-configured collection with:
- All endpoints
- Environment variables
- Automatic JWT token management
- Sample requests

## Need Help?

Check these files for more details:
- `README.md` - Project overview and setup
- `API-SPECIFICATION.yml` - Complete API documentation
- `Architecture.md` - System architecture and flows
- `POSTMAN_COLLECTION.json` - Importable API collection

---

**Note:** Make sure the database is seeded before testing:
```bash
npm run seed
```
