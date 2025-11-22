# NEEMIFY Medical OS API - Architecture Documentation

## Overview

NEEMIFY is a Medical OS API infrastructure designed with banking-grade security and enterprise-level multi-tenancy. The system requires cryptographically secure licenses for all API access and supports hierarchical tenant isolation.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Applications                       │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                │ HTTPS/TLS
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                       API Gateway Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Rate Limiter │  │ Auth Middleware│ │ Audit Logger│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                      Application Layer                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Authentication Service   │  License Validation Service   │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  Company Service          │  Tenant Service               │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  RBAC Service             │  User Management Service      │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                      Database Layer (Supabase)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  PostgreSQL  │  │  Row Level   │  │  Realtime    │          │
│  │   Database   │  │   Security   │  │  Subscriptions│         │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Licensing System

**Purpose**: Cryptographically secure license management using AES-256-GCM encryption and HMAC-SHA256 signing.

**Key Features**:
- License generation with encrypted payload
- Signature-based validation
- Feature flags and usage limits
- Expiration and revocation support
- Nonce-based replay attack prevention

**License Structure**:
```
License Key = [Encrypted Payload].[Signature]

Encrypted Payload = [IV].[Encrypted Data].[Auth Tag]

Payload Contents:
- Company ID
- Company Name
- License Features (max users, max tenants, API rate limits)
- Issued timestamp
- Expiration timestamp (optional)
- Unique nonce
```

### 2. Multi-Tenant Architecture

**Two-Level Hierarchy**:

1. **Company (Top-Level Tenant)**:
   - Licensed organization
   - Owns the license
   - Can create child tenants
   - Full administrative control

2. **Child Tenant**:
   - Managed by parent company
   - Isolated data and users
   - Independent billing/usage tracking
   - Separate settings and configuration

**Isolation Strategy**:
- Database-level isolation via Row Level Security (RLS)
- Application-level tenant context validation
- Separate audit logs per tenant
- Independent usage tracking

### 3. Authentication & Authorization

**Authentication Flow**:
```
1. User Login → Email/Password
2. Validate Credentials (bcrypt)
3. Fetch User Roles & Permissions
4. Validate Company License
5. Generate JWT Token
6. Return Token + User Info
```

**JWT Payload**:
```typescript
{
  userId: string
  email: string
  companyId: string
  tenantId?: string
  isSuperUser: boolean
  isOrgAdmin: boolean
  permissions: string[]
  exp: number
}
```

**Authorization Levels**:
- **Super User**: Global admin, one per system
- **Organization Admin**: Manages company, tenants, and users
- **Role-Based**: Dynamic roles with custom permissions
- **Tenant-Scoped**: Users limited to specific tenants

### 4. Dynamic RBAC (Role-Based Access Control)

**Permission Model**:
```
Permission = Resource.Action

Examples:
- user.create
- user.read
- user.update
- user.delete
- tenant.create
- license.revoke
```

**Role Structure**:
- Roles are company-specific
- Roles contain multiple permissions
- Users can have multiple roles
- Permissions are additive

**Default Roles**:
1. **Admin**: All permissions
2. **Operator**: Create, read, update (no delete)
3. **Viewer**: Read-only access

### 5. Domain-Based Signup

**Signup Flow**:
```
1. User enters email
2. Extract domain from email
3. Check if domain exists:

   IF EXISTS:
     - Show company name
     - Offer two options:
       a) Request access from org admin
       b) Create new company with same domain

   IF NOT EXISTS:
     - Create new company
     - Generate license
     - Register user as org admin
     - Create default roles
```

### 6. Audit & Compliance

**API Usage Tracking**:
- Every API call logged
- Response time measurement
- Status code tracking
- User and tenant attribution

**Audit Logs**:
- Sensitive action logging
- Change tracking
- IP address and user agent capture
- Immutable audit trail

## Security Features

### 1. Cryptographic License Protection

- **Encryption**: AES-256-GCM (authenticated encryption)
- **Signing**: HMAC-SHA256
- **Key Derivation**: SHA-256 hash of master key
- **Replay Protection**: Unique nonce per license

### 2. Password Security

- **Hashing**: bcrypt with 12 salt rounds
- **Storage**: Never store plain text passwords
- **Validation**: Timing-safe comparison

### 3. Row Level Security (RLS)

- Enforced at database level
- Company and tenant isolation
- Super user bypass capability
- Policy-based access control

### 4. Rate Limiting

- License-based limits
- Per-user tracking
- Adaptive limits based on license tier
- Stricter limits for auth endpoints

### 5. API Security

- Helmet.js for security headers
- CORS configuration
- Request size limits
- JWT token validation

## Database Schema

### Core Tables

1. **companies**: Top-level tenants with licenses
2. **tenants**: Child tenants under companies
3. **users**: System users with company/tenant association
4. **licenses**: License records with encrypted keys
5. **roles**: Dynamic roles per company
6. **permissions**: System-wide permission definitions
7. **role_permissions**: Role-permission associations
8. **user_roles**: User-role assignments
9. **api_usage**: API call tracking
10. **audit_logs**: Audit trail

### Relationships

```
Company (1) ──< (N) Tenants
Company (1) ──< (N) Users
Company (1) ──< (1) License
Company (1) ──< (N) Roles
User (N) ──< (N) Roles (Many-to-Many)
Role (N) ──< (N) Permissions (Many-to-Many)
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/request-access` - Request company access

### Tenants
- `POST /api/tenants` - Create child tenant
- `GET /api/tenants` - List tenants
- `GET /api/tenants/:id` - Get tenant details
- `PATCH /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant
- `GET /api/tenants/:id/stats` - Tenant usage stats

### Health
- `GET /api/health` - Service health check
- `GET /` - API information

## Performance Optimizations

1. **Connection Pooling**: Supabase client with connection limits
2. **Caching**: Node-cache for frequently accessed data
3. **Async Operations**: Non-blocking audit logging
4. **Indexed Queries**: Database indexes on foreign keys
5. **Rate Limiting**: Prevent resource exhaustion

## Scalability

### Horizontal Scaling
- Stateless API servers
- JWT-based authentication (no session storage)
- Database connection pooling

### Vertical Scaling
- Optimized query patterns
- Efficient RLS policies
- Indexed database columns

## Deployment Considerations

1. **Environment Variables**: All secrets in .env
2. **Database Migrations**: SQL schema file provided
3. **Super User Setup**: One-time initialization
4. **License Keys**: Secure key generation required
5. **Monitoring**: Winston logging with multiple transports

## Future Enhancements

1. **Multi-Region Support**: Geographic data distribution
2. **Advanced Analytics**: Usage dashboards
3. **Webhook System**: Event notifications
4. **API Versioning**: Support multiple API versions
5. **GraphQL Gateway**: Alternative query interface
6. **Microservices**: Service decomposition for scale
