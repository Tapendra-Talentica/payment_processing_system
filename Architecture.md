# 🏗️ System Architecture

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT APPLICATIONS                      │
│            (Web Frontend, Mobile Apps, Third-party)              │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY LAYER                         │
│  ┌──────────────┬────────────────┬──────────────────────────┐  │
│  │ CORS Filter  │ Rate Limiter   │  JWT Auth Guard          │  │
│  │              │ (100 req/min)  │  (Passport.js)           │  │
│  └──────────────┴────────────────┴──────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NESTJS APPLICATION                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   INTERCEPTORS                            │  │
│  │  • Idempotency Check    • Audit Logging                  │  │
│  │  • Request Logging      • Error Handling                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────┴──────────────────────────────┐  │
│  │                    CONTROLLERS                            │  │
│  │  ┌──────────┬──────────┬──────────┬──────────────────┐  │  │
│  │  │  Auth    │ Orders   │ Payments │  Transactions    │  │  │
│  │  │          │          │          │  Admin/Health    │  │  │
│  │  └────┬─────┴────┬─────┴────┬─────┴────┬────────────┘  │  │
│  └───────┼──────────┼──────────┼──────────┼───────────────┘  │
│          │          │          │          │                    │
│  ┌───────┼──────────┼──────────┼──────────┼───────────────┐  │
│  │       ▼          ▼          ▼          ▼               │  │
│  │                    SERVICES                             │  │
│  │  ┌──────────┬──────────┬──────────┬──────────────────┐ │  │
│  │  │  Auth    │ Orders   │ Payments │  Transactions    │ │  │
│  │  │ Service  │ Service  │ Service  │  Customers       │ │  │
│  │  └────┬─────┴────┬─────┴────┬─────┴────┬────────────┘ │  │
│  └───────┼──────────┼──────────┼──────────┼──────────────┘  │
│          │          │          │          │                    │
│          │          │          ▼          │                    │
│          │          │   ┌──────────────┐  │                    │
│          │          │   │ Authorize.Net│  │                    │
│          │          │   │   Service    │  │                    │
│          │          │   └──────┬───────┘  │                    │
│          │          │          │          │                    │
│          ▼          ▼          ▼          ▼                    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              PRISMA ORM (Database Layer)                 │  │
│  └──────────────────────┬───────────────────────────────────┘  │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────┐       ┌────────────────┐
        │      POSTGRESQL DATABASE        │       │ Authorize.Net  │
        │  ┌────────────────────────┐     │       │    Gateway     │
        │  │  • Users               │     │       │   (Sandbox)    │
        │  │  • Customers           │     │◄──────┤                │
        │  │  • Orders              │     │       │  Credit Card   │
        │  │  • Transactions        │     │       │  Processing    │
        │  │  • AuditLogs           │     │       └────────────────┘
        │  └────────────────────────┘     │
        └─────────────────────────────────┘
```

---

## Request Flow Diagrams

### 1. Purchase Payment Flow

```
┌────────┐                                                      ┌────────────┐
│ Client │                                                      │Authorize.  │
│        │                                                      │    Net     │
└───┬────┘                                                      └─────┬──────┘
    │                                                                 │
    │  POST /api/v1/payments/purchase                                │
    │  {orderId, cardNumber, cvv, exp}                               │
    ├─────────────────────►┌──────────────────────┐                 │
    │                       │  Payments Controller │                 │
    │                       └──────────┬───────────┘                 │
    │                                  │                              │
    │                       ┌──────────▼───────────┐                 │
    │                       │ Idempotency Check    │                 │
    │                       │ (duplicate request?) │                 │
    │                       └──────────┬───────────┘                 │
    │                                  │ No                           │
    │                       ┌──────────▼───────────┐                 │
    │                       │  Payments Service    │                 │
    │                       └──────────┬───────────┘                 │
    │                                  │                              │
    │                       ┌──────────▼───────────┐                 │
    │                       │  1. Validate Order   │                 │
    │                       │  2. Create Txn       │                 │
    │                       │     (PENDING)        │                 │
    │                       └──────────┬───────────┘                 │
    │                                  │                              │
    │                       ┌──────────▼───────────┐                 │
    │                       │ AuthorizeNet Service │                 │
    │                       └──────────┬───────────┘                 │
    │                                  │                              │
    │                                  │  chargeCreditCard()          │
    │                                  ├──────────────────────────────►
    │                                  │                              │
    │                                  │  {success, transactionId}    │
    │                                  ◄──────────────────────────────┤
    │                                  │                              │
    │                       ┌──────────▼───────────┐                 │
    │                       │  3. Update Txn       │                 │
    │                       │     (CAPTURED)       │                 │
    │                       │  4. Update Order     │                 │
    │                       │  5. Create Audit Log │                 │
    │                       └──────────┬───────────┘                 │
    │                                  │                              │
    │  {transaction, status: CAPTURED} │                             │
    ◄──────────────────────────────────┤                             │
    │                                                                 │
```

### 2. Authorize + Capture Flow

```
STEP 1: AUTHORIZE
┌────────┐                                                      ┌────────────┐
│ Client │                                                      │Authorize.  │
│        │                                                      │    Net     │
└───┬────┘                                                      └─────┬──────┘
    │                                                                 │
    │  POST /api/v1/payments/authorize                               │
    ├──────────►┌──────────────────┐                                 │
    │           │  Authorize Funds │                                 │
    │           └────────┬─────────┘                                 │
    │                    │                                            │
    │                    │  authorizeCreditCard()                     │
    │                    ├────────────────────────────────────────────►
    │                    │                                            │
    │                    │  {transactionId: "123456"}                 │
    │                    ◄────────────────────────────────────────────┤
    │                    │                                            │
    │           ┌────────▼─────────┐                                 │
    │           │ Save Transaction │                                 │
    │           │ status: AUTHORIZED│                                │
    │           │ txnId: "123456"  │                                 │
    │           └────────┬─────────┘                                 │
    │                    │                                            │
    ◄────────────────────┤                                            │
    │                                                                 │
    │                                                                 │
    │  [Later...]                                                     │
    │                                                                 │
STEP 2: CAPTURE                                                      │
    │                                                                 │
    │  POST /api/v1/payments/capture                                 │
    │  {transactionId: "internal-uuid"}                              │
    ├──────────►┌──────────────────┐                                 │
    │           │  Capture Service │                                 │
    │           └────────┬─────────┘                                 │
    │                    │                                            │
    │           ┌────────▼─────────┐                                 │
    │           │ Find Transaction │                                 │
    │           │ (status: AUTH)   │                                 │
    │           │ Get Gateway TxnId│                                 │
    │           └────────┬─────────┘                                 │
    │                    │                                            │
    │                    │  capturePrevious("123456")                 │
    │                    ├────────────────────────────────────────────►
    │                    │                                            │
    │                    │  {success: true}                           │
    │                    ◄────────────────────────────────────────────┤
    │                    │                                            │
    │           ┌────────▼─────────┐                                 │
    │           │ Create Child Txn │                                 │
    │           │ status: CAPTURED │                                 │
    │           │ Update Order     │                                 │
    │           └────────┬─────────┘                                 │
    │                    │                                            │
    ◄────────────────────┤                                            │
    │                                                                 │
```

### 3. Refund Flow

```
┌────────┐                                                      ┌────────────┐
│ Admin  │                                                      │Authorize.  │
│        │                                                      │    Net     │
└───┬────┘                                                      └─────┬──────┘
    │                                                                 │
    │  POST /api/v1/admin/refund                                     │
    │  {transactionId, amount: 50.00} (partial)                      │
    ├──────────►┌──────────────────┐                                 │
    │           │  Refund Service  │                                 │
    │           └────────┬─────────┘                                 │
    │                    │                                            │
    │           ┌────────▼─────────┐                                 │
    │           │ 1. Find Parent   │                                 │
    │           │    Transaction   │                                 │
    │           │    (CAPTURED)    │                                 │
    │           │ 2. Validate Amt  │                                 │
    │           │    (50 <= 100)   │                                 │
    │           └────────┬─────────┘                                 │
    │                    │                                            │
    │                    │  refundTransaction(gatewayTxn, 50)         │
    │                    ├────────────────────────────────────────────►
    │                    │                                            │
    │                    │  {success, refundTxnId}                    │
    │                    ◄────────────────────────────────────────────┤
    │                    │                                            │
    │           ┌────────▼─────────┐                                 │
    │           │ Create Child Txn │                                 │
    │           │ type: REFUND     │                                 │
    │           │ status: REFUNDED │                                 │
    │           │ amount: 50       │                                 │
    │           │ Update Parent    │                                 │
    │           │ (PARTIAL_REFUND) │                                 │
    │           └────────┬─────────┘                                 │
    │                    │                                            │
    ◄────────────────────┤                                            │
    │                                                                 │
```

---

## Module Dependency Graph

```
┌──────────────────────────────────────────────────────────────────┐
│                          APP MODULE                               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  ConfigModule (Global)                                      │  │
│  │  ThrottlerModule (Rate Limiting)                            │  │
│  │  LoggerModule (Pino)                                        │  │
│  │  PrismaModule (Global)                                      │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌───────────┬───────────┬───────────┬───────────┬──────────┐   │
│  │  Auth     │  Orders   │Transactions│ Payments  │Customers │   │
│  │  Module   │  Module   │  Module   │  Module   │  Module  │   │
│  └─────┬─────┴─────┬─────┴─────┬─────┴─────┬─────┴────┬─────┘   │
│        │           │           │           │          │           │
│        │           │           ▲           │          │           │
│        │           └───────────┼───────────┘          │           │
│        │                       │                      │           │
│        │           ┌───────────┴───────────┐          │           │
│        │           │    Admin Module       │          │           │
│        │           │  (depends on Payments │          │           │
│        │           │   & Transactions)     │          │           │
│        │           └───────────────────────┘          │           │
│        │                                               │           │
│        └───────────────────────────────────────────────┘           │
│        (Auth guards used across all protected endpoints)           │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │                      Health Module                            ││
│  └──────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: NETWORK                                            │
│  • HTTPS/TLS in production                                   │
│  • CORS restrictions                                         │
│  • Firewall rules                                            │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  Layer 2: RATE LIMITING                                      │
│  • Throttler Guard (100 req/min per IP)                     │
│  • Prevents DoS attacks                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  Layer 3: AUTHENTICATION                                     │
│  • JWT Guard (Passport)                                      │
│  • Token validation                                          │
│  • Session management                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  Layer 4: AUTHORIZATION                                      │
│  • Roles Guard (RBAC)                                        │
│  • Admin vs Customer permissions                             │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  Layer 5: INPUT VALIDATION                                   │
│  • Class Validator (DTOs)                                    │
│  • Zod Schemas                                               │
│  • Type safety                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  Layer 6: BUSINESS LOGIC                                     │
│  • Idempotency checks                                        │
│  • Transaction validations                                   │
│  • Amount validations                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  Layer 7: DATA PROTECTION                                    │
│  • No card storage (PCI DSS)                                 │
│  • Password hashing (bcrypt)                                 │
│  • Sensitive data masking                                    │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  Layer 8: AUDIT & MONITORING                                 │
│  • Audit logs (all transactions)                             │
│  • Request logging (Pino)                                    │
│  • Error tracking                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Transaction Lifecycle

```
┌─────────────┐
│   PENDING   │  Order created, no payment yet
└──────┬──────┘
       │
       │ POST /payments/authorize
       │
       ▼
┌─────────────┐
│ AUTHORIZED  │  Funds on hold
└──────┬──────┘
       │
       ├──────► POST /payments/capture  ──────► ┌──────────┐
       │                                        │ CAPTURED │
       │                                        └──────┬───┘
       │                                               │
       │                                               │ POST /payments/refund
       │                                               │ (partial)
       │                                               ▼
       │                                        ┌──────────────────┐
       │                                        │ PARTIAL_REFUNDED │
       │                                        └──────┬───────────┘
       │                                               │
       │                                               │ POST /payments/refund
       │                                               │ (remaining)
       │                                               ▼
       │                                        ┌──────────┐
       │                                        │ REFUNDED │
       │                                        └──────────┘
       │
       └──────► POST /payments/cancel   ──────► ┌───────────┐
                                                 │ CANCELLED │
                                                 └───────────┘

Alternative Paths:
┌─────────────┐
│   PENDING   │
└──────┬──────┘
       │
       │ POST /payments/purchase (direct)
       │
       ├──────► Success  ──────► ┌──────────┐
       │                         │ CAPTURED │
       │                         └──────────┘
       │
       └──────► Declined ──────► ┌────────┐
                                  │ FAILED │
                                  └────────┘
       
       └──────► Error    ──────► ┌────────┐
                                  │ ERROR  │
                                  └────────┘
```

---

## Deployment Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     PRODUCTION ENVIRONMENT                      │
│                                                                  │
│  ┌──────────────┐        ┌──────────────┐        ┌──────────┐ │
│  │  Load        │        │  NestJS API  │        │ PostgreSQL│ │
│  │  Balancer    │───────►│  Container   │───────►│  Database │ │
│  │  (Nginx)     │        │  (Port 5000) │        │           │ │
│  └──────────────┘        └──────────────┘        └──────────┘ │
│         │                        │                      │       │
│         │                        │                      │       │
│         │                ┌───────▼───────┐             │       │
│         │                │  Pino Logger  │             │       │
│         │                │  (JSON logs)  │             │       │
│         │                └───────────────┘             │       │
│         │                        │                      │       │
│         │                ┌───────▼───────┐      ┌──────▼─────┐│
│         │                │  Monitoring   │      │   Backups  ││
│         │                │  (Grafana?)   │      │  (Daily)   ││
│         │                └───────────────┘      └────────────┘│
│         │                                                      │
│         └──────────────► External Services ◄──────────────────┘
│                          • Authorize.Net Gateway
│                          • Email Service (future)
│                          • SMS Service (future)
└────────────────────────────────────────────────────────────────┘
```

---

## Testing Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      TESTING PYRAMID                            │
│                                                                  │
│                         ┌─────────┐                             │
│                         │   E2E   │  Full payment flows          │
│                         │  Tests  │  (Supertest)                │
│                         └────┬────┘                             │
│                              │                                   │
│                    ┌─────────▼─────────┐                        │
│                    │   Integration     │  Module interactions    │
│                    │     Tests         │  (Test DB)             │
│                    └─────────┬─────────┘                        │
│                              │                                   │
│              ┌───────────────▼───────────────┐                  │
│              │         Unit Tests            │  Service logic   │
│              │   (Jest + Mocking)            │  (≥60% coverage) │
│              └───────────────────────────────┘                  │
│                                                                  │
└────────────────────────────────────────────────────────────────┘

Test Doubles:
┌──────────────────────────────────────────────────────────────┐
│  Mock Authorize.Net SDK         Mock Prisma Client           │
│  • Successful transactions      • Database operations        │
│  • Failed transactions          • Transaction queries        │
│  • Network errors               • Audit log creation         │
└──────────────────────────────────────────────────────────────┘
```

---

This architecture ensures:
✅ **Scalability** - Modular design, horizontal scaling ready  
✅ **Security** - Multiple layers of protection  
✅ **Maintainability** - Clean separation of concerns  
✅ **Testability** - Dependency injection, mockable services  
✅ **Observability** - Comprehensive logging and audit trails  
✅ **Reliability** - Error handling, retry logic, idempotency  

---

**For detailed implementation, see IMPLEMENTATION_GUIDE.md**
