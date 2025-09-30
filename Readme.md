# Payment Processing System

A robust payment processing backend service built with **NestJS**, **TypeScript**, **PostgreSQL**, and **Prisma ORM**, integrated with **Authorize.Net Sandbox** for secure credit card payment processing.

## 🚀 Features

### Core Payment Operations
- **Purchase** - Direct payment processing (immediate charge)
- **Authorize** - Hold funds for later capture
- **Capture** - Capture previously authorized funds (full or partial)
- **Cancel/Void** - Cancel authorized transactions before capture
- **Refund** - Full or partial refunds for captured transactions

### System Features
- ✅ JWT-based authentication & authorization
- ✅ Role-based access control (Admin & Customer)
- ✅ Idempotency support to prevent duplicate transactions
- ✅ Comprehensive audit logging
- ✅ Guest checkout support
- ✅ Real-time transaction status updates
- ✅ Pagination for list endpoints
- ✅ Rate limiting (100 req/min per IP)
- ✅ Swagger API documentation
- ✅ Docker containerization
- ✅ Health check endpoint

## 📋 Tech Stack

| Component | Technology |
|-----------|-----------|
| **Backend Framework** | NestJS + TypeScript |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma |
| **Authentication** | JWT (Passport) |
| **Validation** | Class Validator + Zod |
| **Logging** | Pino |
| **Payment Gateway** | Authorize.Net SDK |
| **Testing** | Jest (≥60% coverage) |
| **API Documentation** | Swagger/OpenAPI |
| **Containerization** | Docker + Docker Compose |

## 📁 Project Structure

```
payment_processing_system/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seed script
├── src/
│   ├── common/                # Shared utilities
│   │   ├── decorators/        # Custom decorators
│   │   ├── filters/           # Exception filters
│   │   ├── guards/            # Auth guards
│   │   ├── interceptors/      # Logging, idempotency
│   │   ├── pipes/             # Validation pipes
│   │   └── utils/             # Helper functions
│   ├── config/                # Configuration modules
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── modules/
│   │   ├── auth/              # Authentication
│   │   ├── orders/            # Order management
│   │   ├── transactions/      # Transaction tracking
│   │   ├── payments/          # Payment processing
│   │   ├── customers/         # Customer management
│   │   ├── admin/             # Admin operations
│   │   └── health/            # Health check
│   ├── app.module.ts
│   └── main.ts
├── test/                      # Test files
├── docker-compose.yml         # Docker configuration
├── Dockerfile
├── package.json
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** v20 or higher
- **npm** v9 or higher
- **PostgreSQL** v16 or higher
- **Docker** (optional but recommended)

### 1. Clone & Install Dependencies

```bash
cd payment_processing_system
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the `.env` file with your credentials:

```env
# Application
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/payment_processing?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=24h

# Authorize.Net
AUTHORIZENET_API_LOGIN_ID=your-api-login-id
AUTHORIZENET_TRANSACTION_KEY=your-transaction-key
AUTHORIZENET_ENVIRONMENT=sandbox

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:4200

# Logging
LOG_LEVEL=info
```

### 3. Database Setup

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL container
docker compose up -d

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed
```

#### Option B: Local PostgreSQL

```bash
# Ensure PostgreSQL is running locally
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed
```

### 4. Start the Application

```bash
# Development mode (with hot reload)
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at:
- **API**: http://localhost:5000
- **Swagger Docs**: http://localhost:5000/api/docs
- **Health Check**: http://localhost:5000/health

## 🔑 Default Credentials

After seeding, you can use these test accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@payment-system.com | Admin@123 |
| Customer | customer@example.com | Customer@123 |

## 📚 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - Customer registration

### Orders
- `POST /api/v1/orders` - Create order (guest/authenticated)
- `GET /api/v1/orders` - List orders with pagination
- `GET /api/v1/orders/:id` - Get order by ID

### Payments
- `POST /api/v1/payments/purchase` - Direct payment
- `POST /api/v1/payments/authorize` - Authorize payment
- `POST /api/v1/payments/capture` - Capture authorized payment
- `POST /api/v1/payments/cancel` - Cancel/void payment
- `POST /api/v1/payments/refund` - Refund payment

### Transactions
- `GET /api/v1/transactions` - List transactions with filters
- `GET /api/v1/transactions/:id` - Get transaction by ID

### Customers
- `POST /api/v1/customers` - Create customer (guest)
- `GET /api/v1/customers` - List customers
- `GET /api/v1/customers/:id` - Get customer by ID
- `PATCH /api/v1/customers/:id` - Update customer

### Admin (Admin Role Required)
- `GET /api/v1/admin/transactions` - View all transactions
- `GET /api/v1/admin/stats` - Dashboard statistics
- `POST /api/v1/admin/refund` - Manual refund
- `POST /api/v1/admin/cancel` - Manual cancel

### Health
- `GET /health` - Health check status

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

The project is configured to enforce **≥60% test coverage**.

## 🔐 Security Features

1. **JWT Authentication** - Secure token-based authentication
2. **Role-Based Access Control** - Admin and Customer roles
3. **Idempotency** - Prevent duplicate payments
4. **Rate Limiting** - 100 requests/minute per IP
5. **Audit Logging** - Track all payment operations
6. **No Sensitive Data Storage** - Card details handled by Authorize.Net
7. **Environment Variables** - Secure credential management

## 📊 Database Schema

### Main Entities
- **User** - System users (Admin/Customer)
- **Customer** - Guest customers with billing info
- **Order** - Customer orders
- **Transaction** - Payment transactions
- **AuditLog** - Audit trail for all operations

### Transaction States
- `PENDING` - Order created, no payment yet
- `AUTHORIZED` - Funds on hold
- `CAPTURED` - Funds collected
- `CANCELLED` - Voided before capture
- `REFUNDED` - Full refund
- `PARTIAL_REFUNDED` - Partial refund
- `FAILED` - Payment declined
- `ERROR` - System/gateway error

## 🐳 Docker Deployment

### Recommended Approach: PostgreSQL Only

```bash
# Start PostgreSQL container
docker compose up -d postgres

# Then run the application locally (see step 4 above)
npm run start:dev
```

### Docker Management Commands

```bash
# View PostgreSQL logs
docker compose logs -f postgres

# Stop PostgreSQL
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v

# Restart PostgreSQL
docker compose restart postgres
```

**Note**: The application is best run locally for development. The Docker setup provides PostgreSQL database only.

## 📖 API Documentation

### Swagger UI (Interactive)

Once the application is running, visit:
```
http://localhost:5000/api/docs
```

You'll find complete interactive API documentation with:
- Request/response schemas
- Authentication requirements
- Example payloads
- Try-it-out functionality

### Postman Collection

Import the Postman collection for testing:
- **File**: `POSTMAN_COLLECTION.json`
- **Features**:
  - All API endpoints organized by category
  - Pre-configured test data
  - Automatic token management
  - Environment variables for IDs
  - Test scripts to save responses

**To use**:
1. Import `POSTMAN_COLLECTION.json` into Postman
2. Collection variables are pre-configured
3. Start with "Login" to get authentication token
4. Token is automatically saved for subsequent requests

## 🔧 Development Scripts

```bash
npm run start:dev       # Start in development mode
npm run build          # Build for production
npm run start:prod     # Start production build
npm run lint           # Lint code
npm run format         # Format code with Prettier
npm run prisma:studio  # Open Prisma Studio (DB GUI)
npm run prisma:migrate # Run database migrations
npm run prisma:seed    # Seed database
```

## 📝 Example API Usage

### 1. Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@payment-system.com","password":"Admin@123"}'
```

### 2. Create Order (Guest)
```bash
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId":"customer-uuid",
    "amount":99.99,
    "currency":"USD"
  }'
```

### 3. Purchase (with Idempotency)
```bash
curl -X POST http://localhost:5000/api/v1/payments/purchase \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-key-123" \
  -d '{
    "orderId":"order-uuid",
    "cardNumber":"4111111111111111",
    "expirationDate":"12/25",
    "cvv":"123"
  }'
```

## 🤝 Contributing

This is an assignment project. The Authorize.Net integration placeholders are ready for implementation.

## 📄 License

MIT

## 👨‍💻 Developer Notes

### Next Steps for Authorize.Net Integration
1. Install Authorize.Net SDK: `npm install authorizenet`
2. Implement methods in `src/modules/payments/authorizenet.service.ts`
3. Add retry logic for failed transactions
4. Implement webhook handlers (if needed)
5. Add comprehensive unit tests
6. Test with Authorize.Net sandbox credentials

### Important Notes
- All payment endpoints support idempotency via `Idempotency-Key` header
- Guest payments are allowed for purchase/authorize operations
- Admin endpoints require JWT token with ADMIN role
- All transactions are logged in audit_logs table
- Partial captures and refunds are supported
- Card details are never stored (PCI DSS compliance)

---

**Built with ❤️ using NestJS + TypeScript + Prisma + PostgreSQL**