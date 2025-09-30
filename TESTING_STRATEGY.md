# Testing Strategy

## Overview

This document outlines the comprehensive testing strategy for the Payment Processing System to ensure reliability, security, and correctness of all payment operations.

---

## Testing Objectives

1. **Ensure Code Quality**: Achieve ≥60% test coverage across the codebase
2. **Verify Payment Flows**: Test all payment operations (Purchase, Authorize, Capture, Cancel, Refund)
3. **Validate Security**: Ensure authentication, authorization, and audit logging work correctly
4. **Prevent Regressions**: Catch bugs early through automated testing
5. **Document Behavior**: Tests serve as living documentation

---

## Testing Pyramid

```
                    ┌─────────────┐
                    │     E2E     │  ~10% (Integration tests)
                    │    Tests    │
                    └─────────────┘
                  ┌─────────────────┐
                  │  Integration    │  ~20% (Module interactions)
                  │     Tests       │
                  └─────────────────┘
              ┌───────────────────────┐
              │     Unit Tests        │  ~70% (Individual components)
              │  (Services, Utils)    │
              └───────────────────────┘
```

---

## 1. Unit Testing Strategy

### Scope
Test individual components in isolation with mocked dependencies.

### Target Coverage: ≥60%

### Components to Test

#### 1.1 Services
**Priority: High**

- **AuthService** (`src/modules/auth/auth.service.ts`)
  - ✅ User validation with correct credentials
  - ✅ User validation with incorrect credentials
  - ✅ Login success flow
  - ✅ Login failure (invalid credentials)
  - ✅ Registration success
  - ✅ Registration failure (duplicate user)
  - Token generation and validation

- **PaymentsService** (`src/modules/payments/payments.service.ts`)
  - Purchase flow with valid order
  - Purchase flow with invalid order
  - Authorize flow
  - Capture flow (full and partial)
  - Cancel flow
  - Refund flow (full and partial)
  - Idempotency key handling
  - Error handling and retry logic

- **AuthorizeNetService** (`src/modules/payments/authorizenet.service.ts`)
  - Successful credit card charge
  - Failed credit card charge (declined)
  - Authorization only
  - Capture previous transaction
  - Void transaction
  - Refund transaction
  - Gateway error handling
  - Network timeout handling

- **OrdersService** (`src/modules/orders/orders.service.ts`)
  - Create order with valid data
  - Create order with invalid data
  - Find all orders with pagination
  - Find order by ID (exists)
  - Find order by ID (not found)
  - Update order status

- **TransactionsService** (`src/modules/transactions/transactions.service.ts`)
  - Find all transactions with filters
  - Find transaction by ID
  - Find transactions by order ID
  - Handle parent-child transaction relationships

- **CustomersService** (`src/modules/customers/customers.service.ts`)
  - Create customer
  - Find customer by ID
  - Update customer information
  - Find customer by email

#### 1.2 Controllers
**Priority: Medium**

Test request handling, validation, and response formatting:
- Request validation (invalid inputs)
- Authentication guard behavior
- Role guard behavior
- Response structure
- Error responses

#### 1.3 Guards
**Priority: High**

- **JwtAuthGuard**
  - Allow access with valid token
  - Deny access with invalid token
  - Allow public routes
  - Deny protected routes without token

- **RolesGuard**
  - Allow access with correct role
  - Deny access with wrong role
  - Allow routes without role requirements

#### 1.4 Interceptors
**Priority: High**

- **IdempotencyInterceptor**
  - Allow first request with idempotency key
  - Block duplicate requests
  - Allow requests without idempotency key

- **AuditLogInterceptor**
  - Create audit log for successful requests
  - Create audit log for failed requests
  - Include user information
  - Include request/response data

#### 1.5 Utilities
**Priority: Medium**

- **Pagination Utils**
  - Correct skip/take calculation
  - Handle invalid page numbers
  - Handle invalid limits
  - Create pagination metadata

---

## 2. Integration Testing Strategy

### Scope
Test interactions between multiple components with a test database.

### Components to Test

#### 2.1 Payment Flows
- Complete purchase flow (Order → Transaction → Payment Gateway)
- Complete authorize + capture flow
- Refund flow with transaction history
- Cancel flow with status updates

#### 2.2 Database Operations
- Transaction creation with Prisma
- Order status updates
- Audit log creation
- Parent-child transaction relationships

#### 2.3 Authentication Flow
- Login → Token → Protected endpoint access
- Registration → Auto-login
- Invalid token handling

---

## 3. End-to-End (E2E) Testing Strategy

### Scope
Test complete user journeys through HTTP requests.

### Test Scenarios

#### 3.1 Guest Checkout Flow
```
1. Create customer (guest)
2. Create order
3. Make payment (purchase)
4. Verify transaction created
5. Verify order status updated
6. Verify audit log created
```

#### 3.2 Authorize & Capture Flow
```
1. Login as customer
2. Create order
3. Authorize payment
4. Verify transaction status: AUTHORIZED
5. Capture payment (partial)
6. Verify transaction status: CAPTURED
7. Verify remaining amount
```

#### 3.3 Refund Flow
```
1. Login as admin
2. Find captured transaction
3. Process partial refund
4. Verify refund transaction created
5. Verify parent transaction updated
6. Process remaining refund
7. Verify full refund status
```

#### 3.4 Admin Operations
```
1. Login as admin
2. View all transactions
3. Filter transactions by status
4. Get dashboard statistics
5. Manual refund
6. Manual cancel
```

---

## 4. Test Data Strategy

### Mock Data

#### 4.1 Test Users
```typescript
const mockAdmin = {
  email: 'admin@test.com',
  password: 'Admin@123',
  role: 'ADMIN'
};

const mockCustomer = {
  email: 'customer@test.com',
  password: 'Customer@123',
  role: 'CUSTOMER'
};
```

#### 4.2 Test Cards (Authorize.Net Sandbox)
```typescript
const testCards = {
  visa: {
    cardNumber: '4111111111111111',
    expirationDate: '12/25',
    cvv: '123'
  },
  mastercard: {
    cardNumber: '5424000000000015',
    expirationDate: '12/25',
    cvv: '123'
  },
  declined: {
    cardNumber: '4000000000000002',
    expirationDate: '12/25',
    cvv: '123'
  }
};
```

#### 4.3 Test Orders
```typescript
const mockOrder = {
  customerId: 'customer-uuid',
  amount: 99.99,
  currency: 'USD',
  status: 'PENDING'
};
```

### Test Database
- Use separate test database or in-memory database
- Reset database before each test suite
- Seed with required test data
- Clean up after tests

---

## 5. Mocking Strategy

### External Dependencies to Mock

#### 5.1 Authorize.Net SDK
```typescript
jest.mock('authorizenet', () => ({
  APIContracts: {
    MerchantAuthenticationType: jest.fn(),
    CreditCardType: jest.fn(),
    // ... other mocks
  },
  APIControllers: {
    CreateTransactionController: jest.fn(),
  }
}));
```

#### 5.2 Prisma Client
```typescript
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  order: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  transaction: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  }
};
```

#### 5.3 JWT Service
```typescript
const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn(),
};
```

---

## 6. Test Organization

### Directory Structure
```
test/
├── unit/
│   ├── auth/
│   │   ├── auth.service.spec.ts
│   │   └── jwt.strategy.spec.ts
│   ├── payments/
│   │   ├── payments.service.spec.ts
│   │   └── authorizenet.service.spec.ts
│   ├── orders/
│   │   └── orders.service.spec.ts
│   └── common/
│       ├── guards/
│       └── interceptors/
├── integration/
│   ├── payment-flows.spec.ts
│   ├── auth-flow.spec.ts
│   └── admin-operations.spec.ts
└── e2e/
    ├── guest-checkout.e2e-spec.ts
    ├── authorize-capture.e2e-spec.ts
    └── refund-flow.e2e-spec.ts
```

### Naming Conventions
- Unit tests: `*.spec.ts`
- E2E tests: `*.e2e-spec.ts`
- Test descriptions: Use descriptive "should" statements

---

## 7. Coverage Requirements

### Minimum Coverage Targets

| Component Type | Target Coverage |
|----------------|----------------|
| **Services** | ≥70% |
| **Controllers** | ≥60% |
| **Guards** | ≥80% |
| **Interceptors** | ≥70% |
| **Utilities** | ≥80% |
| **Overall** | ≥60% |

### Coverage Exclusions
- Configuration files
- Main.ts (bootstrap file)
- DTO classes (simple data structures)
- Prisma generated files

---

## 8. Test Execution

### Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test -- auth.service.spec.ts
```

### CI/CD Integration
- Run tests on every commit
- Block merge if coverage drops below 60%
- Generate coverage reports
- Store test results

---

## 9. Error Scenarios to Test

### Payment Errors
- Card declined
- Insufficient funds
- Invalid card number
- Expired card
- Invalid CVV
- Network timeout
- Gateway error

### Business Logic Errors
- Order not found
- Transaction not found
- Invalid amount (negative, zero)
- Capture amount exceeds authorized amount
- Refund amount exceeds captured amount
- Duplicate idempotency key
- Invalid transaction state

### Authentication Errors
- Invalid credentials
- Expired token
- Missing token
- Invalid token
- Insufficient permissions

### Validation Errors
- Missing required fields
- Invalid email format
- Password too short
- Invalid card number format
- Invalid expiration date format

---

## 10. Performance Testing (Optional)

### Load Testing
- Concurrent payment requests
- Database query performance
- API response times

### Stress Testing
- Maximum concurrent users
- Rate limit behavior
- Database connection pool limits

---

## 11. Security Testing

### Test Cases
- SQL injection attempts
- XSS attacks in input fields
- JWT token manipulation
- Rate limit bypass attempts
- Unauthorized endpoint access
- Role escalation attempts

---

## 12. Testing Best Practices

### General Principles
1. **Arrange-Act-Assert (AAA)** pattern
2. **One assertion per test** (when possible)
3. **Descriptive test names** (what is being tested and expected outcome)
4. **Independent tests** (no dependencies between tests)
5. **Fast execution** (mock external services)

### Example Test Structure
```typescript
describe('PaymentsService', () => {
  let service: PaymentsService;
  let authorizeNetService: AuthorizeNetService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    // Arrange: Setup test module
    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: AuthorizeNetService, useValue: mockAuthorizeNet },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  describe('purchase', () => {
    it('should process successful purchase and update order status', async () => {
      // Arrange
      const purchaseDto = { /* ... */ };
      mockAuthorizeNet.chargeCreditCard.mockResolvedValue({ success: true });

      // Act
      const result = await service.purchase(purchaseDto);

      // Assert
      expect(result.status).toBe('CAPTURED');
      expect(mockPrisma.transaction.create).toHaveBeenCalled();
      expect(mockPrisma.order.update).toHaveBeenCalled();
    });

    it('should handle declined payment and mark transaction as FAILED', async () => {
      // Arrange
      mockAuthorizeNet.chargeCreditCard.mockRejectedValue(
        new Error('Card declined')
      );

      // Act & Assert
      await expect(service.purchase(purchaseDto)).rejects.toThrow();
      expect(result.status).toBe('FAILED');
    });
  });
});
```

---

## 13. Continuous Improvement

### Code Review Checklist
- [ ] All new code has corresponding tests
- [ ] Tests follow naming conventions
- [ ] Mocks are used appropriately
- [ ] Coverage meets minimum threshold
- [ ] Tests are independent and deterministic

### Regular Activities
- Review and update test cases monthly
- Refactor tests when refactoring code
- Add tests for bug fixes
- Update test data as needed

---

## Summary

This testing strategy ensures:
✅ **Comprehensive Coverage** - ≥60% code coverage  
✅ **Quality Assurance** - All critical paths tested  
✅ **Security** - Authentication and authorization validated  
✅ **Reliability** - Payment flows thoroughly tested  
✅ **Maintainability** - Well-organized, readable tests  
✅ **Confidence** - Safe to deploy with automated validation  

The strategy balances thoroughness with practicality, focusing on high-risk areas (payment processing, security) while maintaining reasonable test execution times.
