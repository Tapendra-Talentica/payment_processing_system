# Payment Processing System - Project Structure

## 📁 Complete File Structure

```
payment_processing_system/
│
├── .env.example                    # Environment variables template
├── .eslintrc.js                    # ESLint configuration
├── .gitignore                      # Git ignore rules
├── .prettierrc                     # Prettier code formatting
├── docker-compose.yml              # Docker services configuration
├── Dockerfile                      # Docker image definition
├── nest-cli.json                   # NestJS CLI configuration
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── README.md                       # Main documentation
├── PROJECT_STRUCTURE.md            # This file
│
├── prisma/
│   ├── schema.prisma              # Database schema definition
│   └── seed.ts                    # Database seeding script
│
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root application module
│   │
│   ├── config/                    # Configuration modules
│   │   ├── prisma.module.ts       # Prisma module setup
│   │   └── prisma.service.ts      # Prisma service with health check
│   │
│   ├── common/                    # Shared utilities
│   │   ├── decorators/            # Custom decorators
│   │   │   ├── public.decorator.ts        # @Public() for public routes
│   │   │   ├── roles.decorator.ts         # @Roles() for RBAC
│   │   │   └── current-user.decorator.ts  # @CurrentUser() to get user
│   │   │
│   │   ├── filters/               # Exception filters
│   │   │   └── http-exception.filter.ts   # Global HTTP exception handler
│   │   │
│   │   ├── guards/                # Authentication/Authorization guards
│   │   │   ├── jwt-auth.guard.ts          # JWT authentication guard
│   │   │   └── roles.guard.ts             # Role-based access guard
│   │   │
│   │   ├── interceptors/          # Request/Response interceptors
│   │   │   ├── idempotency.interceptor.ts # Prevent duplicate payments
│   │   │   └── audit-log.interceptor.ts   # Log all operations
│   │   │
│   │   ├── pipes/                 # Validation pipes
│   │   │   └── zod-validation.pipe.ts     # Zod schema validation
│   │   │
│   │   └── utils/                 # Helper utilities
│   │       └── pagination.util.ts         # Pagination helpers
│   │
│   └── modules/                   # Feature modules
│       │
│       ├── auth/                  # Authentication module
│       │   ├── auth.module.ts
│       │   ├── auth.service.ts
│       │   ├── auth.controller.ts
│       │   ├── auth.service.spec.ts       # Unit tests
│       │   ├── dto/
│       │   │   └── auth.dto.ts            # Login/Register DTOs
│       │   └── strategies/
│       │       ├── jwt.strategy.ts        # JWT passport strategy
│       │       └── local.strategy.ts      # Local passport strategy
│       │
│       ├── customers/             # Customer management
│       │   ├── customers.module.ts
│       │   ├── customers.service.ts
│       │   ├── customers.controller.ts
│       │   └── dto/
│       │       └── customer.dto.ts        # Customer DTOs
│       │
│       ├── orders/                # Order management
│       │   ├── orders.module.ts
│       │   ├── orders.service.ts
│       │   ├── orders.controller.ts
│       │   └── dto/
│       │       └── order.dto.ts           # Order DTOs
│       │
│       ├── transactions/          # Transaction tracking
│       │   ├── transactions.module.ts
│       │   ├── transactions.service.ts
│       │   ├── transactions.controller.ts
│       │   └── dto/
│       │       └── transaction.dto.ts     # Transaction DTOs
│       │
│       ├── payments/              # Payment processing (Authorize.Net)
│       │   ├── payments.module.ts
│       │   ├── payments.service.ts        # Payment orchestration
│       │   ├── payments.controller.ts     # Payment endpoints
│       │   ├── authorizenet.service.ts    # Authorize.Net SDK wrapper
│       │   └── dto/
│       │       └── payment.dto.ts         # Payment DTOs
│       │
│       ├── admin/                 # Admin operations
│       │   ├── admin.module.ts
│       │   ├── admin.service.ts
│       │   ├── admin.controller.ts
│       │   └── dto/
│       │       └── admin.dto.ts           # Admin DTOs
│       │
│       └── health/                # Health check
│           ├── health.module.ts
│           ├── health.controller.ts
│           └── health.controller.spec.ts  # Unit tests
│
└── test/                          # E2E tests
    └── jest-e2e.json              # E2E test configuration
```

## 🗄️ Database Schema Overview

### Entities

#### **User**
- System users (Admin/Customer roles)
- Fields: id, email, password (hashed), name, role, timestamps

#### **Customer**
- Guest customers with minimal info
- Fields: id, email, name, billingAddress (JSON), timestamps

#### **Order**
- Customer orders
- Fields: id, customerId, userId, amount, currency, status, metadata (JSON), timestamps
- Relations: belongs to Customer, belongs to User (optional), has many Transactions

#### **Transaction**
- Payment transactions
- Fields: id, orderId, userId, transactionId (gateway), type, status, amount, currency, maskedCardNumber, cardType, authorizationCode, gatewayResponseCode, gatewayResponseReason, idempotencyKey, parentTransactionId, metadata (JSON), timestamps
- Relations: belongs to Order, belongs to User (optional), has many child Transactions

#### **AuditLog**
- Audit trail for all operations
- Fields: id, userId, transactionId, action, details (JSON), ipAddress, userAgent, timestamp
- Relations: belongs to User (optional), belongs to Transaction (optional)

### Enums

**UserRole**: `ADMIN`, `CUSTOMER`

**OrderStatus**: `PENDING`, `AUTHORIZED`, `CAPTURED`, `CANCELLED`, `REFUNDED`, `FAILED`

**TransactionStatus**: `PENDING`, `AUTHORIZED`, `CAPTURED`, `CANCELLED`, `REFUNDED`, `PARTIAL_REFUNDED`, `FAILED`, `ERROR`

**TransactionType**: `PURCHASE`, `AUTHORIZE`, `CAPTURE`, `CANCEL`, `REFUND`

## 🔌 API Routes Summary

### Public Routes (No Auth Required)
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/orders` (guest checkout)
- `POST /api/v1/customers` (guest customer)
- `POST /api/v1/payments/purchase` (guest payment)
- `POST /api/v1/payments/authorize` (guest payment)
- `GET /health`

### Authenticated Routes (JWT Required)
- `GET /api/v1/orders`
- `GET /api/v1/orders/:id`
- `GET /api/v1/customers`
- `GET /api/v1/customers/:id`
- `PATCH /api/v1/customers/:id`
- `GET /api/v1/transactions`
- `GET /api/v1/transactions/:id`
- `POST /api/v1/payments/capture`
- `POST /api/v1/payments/cancel`
- `POST /api/v1/payments/refund`

### Admin Only Routes (JWT + Admin Role)
- `GET /api/v1/admin/transactions`
- `GET /api/v1/admin/stats`
- `POST /api/v1/admin/refund`
- `POST /api/v1/admin/cancel`

## 🔒 Security Layers

1. **JWT Authentication** - Token-based auth with Passport
2. **Role-Based Access Control** - Admin vs Customer permissions
3. **Rate Limiting** - Throttler guard (100 req/min per IP)
4. **Idempotency** - Prevent duplicate payments
5. **Audit Logging** - Track all payment operations
6. **Input Validation** - Class validators + Zod schemas
7. **CORS Configuration** - Whitelist allowed origins
8. **No Sensitive Data Storage** - PCI DSS compliant

## 📦 Key Dependencies

### Core
- `@nestjs/core` - NestJS framework
- `@nestjs/platform-express` - Express adapter
- `typescript` - TypeScript language

### Database
- `@prisma/client` - Prisma ORM client
- `prisma` - Prisma CLI

### Authentication
- `@nestjs/jwt` - JWT module
- `@nestjs/passport` - Passport integration
- `passport-jwt` - JWT strategy
- `bcrypt` - Password hashing

### Validation
- `class-validator` - DTO validation
- `class-transformer` - DTO transformation
- `zod` - Runtime type validation

### Logging
- `nestjs-pino` - Pino logger integration
- `pino` - Fast JSON logger
- `pino-pretty` - Pretty logs for dev

### Payment Gateway
- `authorizenet` - Official Authorize.Net SDK

### API Documentation
- `@nestjs/swagger` - OpenAPI/Swagger integration

### Rate Limiting
- `@nestjs/throttler` - Rate limiting

### Testing
- `jest` - Testing framework
- `@nestjs/testing` - NestJS testing utilities
- `supertest` - HTTP assertions

## 🚀 NPM Scripts

```bash
# Development
npm run start:dev          # Hot reload development server
npm run start:debug        # Debug mode with inspector

# Production
npm run build              # Build for production
npm run start:prod         # Start production server

# Database
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run migrations
npm run prisma:studio      # Open Prisma Studio GUI
npm run prisma:seed        # Seed database with sample data

# Testing
npm test                   # Run unit tests
npm run test:watch         # Watch mode
npm run test:cov           # Coverage report
npm run test:e2e           # E2E tests

# Code Quality
npm run lint               # Lint code
npm run format             # Format with Prettier

# Docker
npm run docker:up          # Start Docker services
npm run docker:down        # Stop Docker services
```

## 🔄 Application Flow

### 1. Purchase Flow (Direct Payment)
```
Client → POST /api/v1/payments/purchase
       ↓
  Idempotency Check
       ↓
  Create Transaction (PENDING)
       ↓
  Authorize.Net API Call
       ↓
  Update Transaction (CAPTURED/FAILED)
       ↓
  Update Order Status
       ↓
  Create Audit Log
       ↓
  Return Response
```

### 2. Authorize + Capture Flow
```
Step 1: Authorize
Client → POST /api/v1/payments/authorize
       ↓
  Create Transaction (AUTHORIZED)
       ↓
  Authorize.Net Auth Call
       ↓
  Store transactionId

Step 2: Capture
Client → POST /api/v1/payments/capture
       ↓
  Find Transaction (AUTHORIZED)
       ↓
  Authorize.Net Capture Call
       ↓
  Create Child Transaction (CAPTURED)
       ↓
  Update Order Status
```

### 3. Refund Flow
```
Client → POST /api/v1/payments/refund
       ↓
  Find Transaction (CAPTURED)
       ↓
  Validate Refund Amount
       ↓
  Authorize.Net Refund Call
       ↓
  Create Child Transaction (REFUNDED)
       ↓
  Update Parent Transaction
       ↓
  Update Order Status
```

## 🧪 Testing Strategy

### Unit Tests (≥60% coverage)
- Service layer logic
- Controller request handling
- Guard authorization logic
- Interceptor functionality
- Utility functions

### Integration Tests
- Database operations
- Module interactions
- API endpoint flows

### E2E Tests
- Complete payment flows
- Authentication flows
- Admin operations

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `PORT` | Server port | 5000 |
| `DATABASE_URL` | PostgreSQL connection | postgresql://... |
| `JWT_SECRET` | JWT signing key | (required) |
| `JWT_EXPIRATION` | Token expiration | 24h |
| `AUTHORIZENET_API_LOGIN_ID` | Authorize.Net API ID | (required) |
| `AUTHORIZENET_TRANSACTION_KEY` | Authorize.Net Key | (required) |
| `AUTHORIZENET_ENVIRONMENT` | Gateway environment | sandbox |
| `RATE_LIMIT_TTL` | Rate limit window (s) | 60 |
| `RATE_LIMIT_LIMIT` | Max requests | 100 |
| `CORS_ORIGIN` | Allowed origins | * |
| `LOG_LEVEL` | Logging level | info |

## 🎯 Next Implementation Steps

1. **Authorize.Net Integration**
   - Implement `authorizenet.service.ts` methods
   - Handle gateway responses
   - Map to internal transaction statuses

2. **Retry Logic**
   - Implement exponential backoff
   - Handle transient errors
   - Max retry attempts

3. **Enhanced Testing**
   - Mock Authorize.Net responses
   - Add integration tests
   - Achieve >60% coverage

4. **Production Readiness**
   - Environment validation
   - Monitoring & alerts
   - Performance optimization
   - Security audit

---

**This structure provides a solid foundation for a production-ready payment processing system.**
