#!/bin/bash

echo "==========================================="
echo "   Payment Processing System - Flow Test"
echo "==========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:5000/api/v1"

# Step 1: Get customer ID
echo -e "${BLUE}Step 1: Getting customer...${NC}"
CUSTOMER_RESPONSE=$(curl -s ${BASE_URL}/customers)
CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq -r '.data[0].id')

if [ "$CUSTOMER_ID" == "null" ] || [ -z "$CUSTOMER_ID" ]; then
  echo -e "${RED}❌ Error: No customers found. Please run 'npm run seed' first.${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Customer ID: $CUSTOMER_ID${NC}"
echo ""

# Step 2: Create order
echo -e "${BLUE}Step 2: Creating order...${NC}"
ORDER_RESPONSE=$(curl -s -X POST ${BASE_URL}/orders \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"amount\": 99.99,
    \"currency\": \"USD\",
    \"metadata\": {
      \"description\": \"Test order from script\",
      \"items\": [{\"name\": \"Test Product\", \"quantity\": 1, \"price\": 99.99}]
    }
  }")

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.id')

if [ "$ORDER_ID" == "null" ] || [ -z "$ORDER_ID" ]; then
  echo -e "${RED}❌ Error: Failed to create order${NC}"
  echo "Response: $ORDER_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Order ID: $ORDER_ID${NC}"
echo ""

# Step 3: Authorize payment
echo -e "${BLUE}Step 3: Authorizing payment...${NC}"
IDEMPOTENCY_KEY=$(uuidgen)
AUTH_RESPONSE=$(curl -s -X POST ${BASE_URL}/payments/authorize \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
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

TXN_ID=$(echo $AUTH_RESPONSE | jq -r '.id')

if [ "$TXN_ID" == "null" ] || [ -z "$TXN_ID" ]; then
  echo -e "${RED}❌ Error: Failed to authorize payment${NC}"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Transaction ID: $TXN_ID${NC}"
echo -e "${GREEN}✓ Status: AUTHORIZED${NC}"
echo ""

# Step 4: Capture payment
echo -e "${BLUE}Step 4: Capturing payment...${NC}"
CAPTURE_RESPONSE=$(curl -s -X POST ${BASE_URL}/payments/capture \
  -H "Content-Type: application/json" \
  -d "{
    \"transactionId\": \"$TXN_ID\",
    \"amount\": 99.99
  }")

CAPTURE_ID=$(echo $CAPTURE_RESPONSE | jq -r '.id')

if [ "$CAPTURE_ID" == "null" ] || [ -z "$CAPTURE_ID" ]; then
  echo -e "${RED}❌ Error: Failed to capture payment${NC}"
  echo "Response: $CAPTURE_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✓ Capture Transaction ID: $CAPTURE_ID${NC}"
echo -e "${GREEN}✓ Status: CAPTURED${NC}"
echo ""

# Step 5: View transaction history
echo -e "${BLUE}Step 5: Transaction history for order...${NC}"
TRANSACTIONS=$(curl -s "${BASE_URL}/transactions?orderId=$ORDER_ID")
echo $TRANSACTIONS | jq '.'
echo ""

echo -e "${GREEN}==========================================="
echo "   ✓ Payment Flow Completed Successfully!"
echo "===========================================${NC}"
echo ""
echo "Summary:"
echo "  Customer ID:     $CUSTOMER_ID"
echo "  Order ID:        $ORDER_ID"
echo "  Auth Txn ID:     $TXN_ID"
echo "  Capture Txn ID:  $CAPTURE_ID"
echo ""
