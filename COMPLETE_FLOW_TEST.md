# ✅ Complete Payment Flow Test Guide

The payment integration is now **fully implemented**! Here's how to test it.

---

## 🎯 Quick Test Sequence

### 1. Get Customer ID
```bash
curl -X GET http://localhost:5000/api/v1/customers | jq '.data[0].id'
```

Copy the customer ID from the response.

---

### 2. Create Order
```bash
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "PASTE-CUSTOMER-ID-HERE",
    "amount": 99.99,
    "currency": "USD"
  }' | jq '.'
```

Copy the `id` field from the response (this is your order ID).

---

### 3. Process Payment (Choose One Flow)

#### Option A: Direct Purchase (One-step payment)
```bash
curl -X POST http://localhost:5000/api/v1/payments/purchase \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "orderId": "PASTE-ORDER-ID-HERE",
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
  }' | jq '.'
```

#### Option B: Authorize + Capture (Two-step payment)

**Step 3a: Authorize**
```bash
curl -X POST http://localhost:5000/api/v1/payments/authorize \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "orderId": "PASTE-ORDER-ID-HERE",
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
  }' | jq '.'
```

Copy the transaction `id` from the response.

**Step 3b: Capture**
```bash
curl -X POST http://localhost:5000/api/v1/payments/capture \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "PASTE-TRANSACTION-ID-HERE",
    "amount": 99.99
  }' | jq '.'
```

---

### 4. View Transactions
```bash
# View all transactions for an order
curl -X GET "http://localhost:5000/api/v1/transactions?orderId=PASTE-ORDER-ID-HERE" | jq '.'

# View all transactions
curl -X GET http://localhost:5000/api/v1/transactions | jq '.'

# View specific transaction
curl -X GET http://localhost:5000/api/v1/transactions/PASTE-TRANSACTION-ID-HERE | jq '.'
```

---

### 5. View Order with Transactions
```bash
curl -X GET http://localhost:5000/api/v1/orders/PASTE-ORDER-ID-HERE | jq '.'
```

This will show the order with all related transactions!

---

## 🚀 Automated Test Script

Run this complete flow automatically:

```bash
#!/bin/bash

echo "=========================================="
echo "  Complete Payment Flow Test"
echo "=========================================="

# 1. Get customer
echo -e "\n1. Getting customer..."
CUSTOMER_ID=$(curl -s http://localhost:5000/api/v1/customers | jq -r '.data[0].id')
echo "Customer ID: $CUSTOMER_ID"

# 2. Create order
echo -e "\n2. Creating order..."
ORDER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d "{\"customerId\": \"$CUSTOMER_ID\", \"amount\": 99.99}")
ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.id')
echo "Order ID: $ORDER_ID"

# 3. Process purchase
echo -e "\n3. Processing purchase..."
PURCHASE_RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/payments/purchase \
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
  }")

TRANSACTION_ID=$(echo $PURCHASE_RESPONSE | jq -r '.id')
echo "Transaction ID: $TRANSACTION_ID"

# 4. View transaction
echo -e "\n4. Transaction details:"
echo $PURCHASE_RESPONSE | jq '.'

# 5. View order with transactions
echo -e "\n5. Order with transactions:"
curl -s http://localhost:5000/api/v1/orders/$ORDER_ID | jq '.'

echo -e "\n=========================================="
echo "  ✓ Test Complete!"
echo "=========================================="
```

Save as `test-complete-flow.sh`, make executable (`chmod +x test-complete-flow.sh`), and run!

---

## 🧪 Test Credit Cards

| Card Number         | Type       | Result  |
|---------------------|------------|---------|
| 4111111111111111    | Visa       | Success |
| 5424000000000015    | Mastercard | Success |
| 370000000000002     | Amex       | Success |
| 6011000000000012    | Discover   | Success |

**Expiration:** Any future date (e.g., `12/25`)  
**CVV:** Any 3-4 digits (e.g., `123`)

---

## ✅ What's Implemented

- ✅ **Purchase Flow** - Direct charge (auth + capture in one step)
- ✅ **Authorize Flow** - Hold funds
- ✅ **Capture Flow** - Collect held funds (supports partial captures)
- ✅ **Cancel Flow** - Void authorization
- ✅ **Refund Flow** - Return funds (supports partial refunds)
- ✅ **Transaction Recording** - All transactions saved to database
- ✅ **Order Status Updates** - Automatic status updates based on transactions
- ✅ **Idempotency** - Prevents duplicate payments
- ✅ **Error Handling** - Failed transactions also recorded
- ✅ **Audit Logging** - All operations logged
- ✅ **Real Authorize.Net Integration** - Using official SDK

---

## 📊 Database Records

After running a payment, you'll see:

1. **Transaction Record** - In the `Transaction` table with:
   - Gateway transaction ID
   - Card last 4 digits
   - Card type (VISA, MASTERCARD, etc.)
   - Status (CAPTURED, AUTHORIZED, etc.)
   - Gateway response

2. **Order Status** - Updated to:
   - `PENDING` → `AUTHORIZED` → `CAPTURED` → `REFUNDED`

3. **Audit Log** - In the `AuditLog` table (via interceptor)

---

## 🔍 Verify Everything Works

```bash
# Check transactions table
curl http://localhost:5000/api/v1/transactions | jq '.data | length'

# Check orders with transactions
curl http://localhost:5000/api/v1/orders | jq '.data[] | {id, status, transactions: .transactions | length}'
```

---

## 💡 Tips

1. **Use unique idempotency keys** for each payment attempt
2. **Test failed payments** by using invalid card numbers
3. **Test partial captures** by capturing less than authorized amount
4. **Test partial refunds** by refunding less than captured amount
5. **Check logs** in your terminal to see the flow

---

## 🎉 You Can Now

- ✅ Create orders
- ✅ Process payments
- ✅ View transactions
- ✅ See complete payment history
- ✅ Test all payment flows
- ✅ Integrate with frontends
- ✅ Handle real credit card payments (sandbox)

---

**Your payment processing system is fully operational!** 🚀
