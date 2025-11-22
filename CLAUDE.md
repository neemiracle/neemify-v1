# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NEEMIFY is a Medical OS API infrastructure with enterprise-grade licensing and multi-tenant architecture. The system is designed with banking/medical-grade security and requires cryptographic licenses for all API access.

## Key Commands

### Development
```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Run production build
```

### Testing & Quality
```bash
npm test             # Run Jest test suite with coverage
npm test:watch       # Run tests in watch mode
npm run lint         # Check TypeScript/ESLint issues
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format code with Prettier
```

### Documentation
```bash
npm run docs         # Generate Doxygen docs + PlantUML diagrams
```

### Database
The database schema is in `src/database/schema.sql` and must be run manually in Supabase SQL editor. There are no automated migrations - the schema includes all tables, RLS policies, triggers, and seed data.

## Architecture Overview

### Core Design Principles

1. **Cryptographic Licensing**: Every API access requires a valid, cryptographically signed license
   - AES-256-GCM encryption with HMAC-SHA256 signing
   - Nonce-based replay attack prevention
   - Feature flags and usage limits embedded in license

2. **Two-Level Multi-Tenancy**:
   - **Companies** (top-level): Licensed organizations with full control
   - **Child Tenants**: Isolated sub-organizations managed by parent companies
   - Complete data isolation enforced at database (RLS) and application layers

3. **Super User Limitation**: Only ONE super user can exist in the system
   - Created during initial setup via `authService.initializeSuperUser()`
   - Database trigger enforces single super user constraint
   - Never auto-created after initial setup

4. **Domain-Based Signup Flow**:
   - Extract domain from email during signup
   - If domain exists → prompt user to request access OR create new company
   - If domain doesn't exist → create new company, user becomes org admin

### Service Architecture

The codebase follows a service-oriented architecture:

- **src/services/licensing.service.ts**: License encryption, validation, revocation
- **src/services/auth.service.ts**: JWT auth, password hashing, super user setup
- **src/services/company.service.ts**: Company management, domain validation
- **src/services/tenant.service.ts**: Child tenant CRUD and isolation
- **src/services/rbac.service.ts**: Dynamic roles and permissions

### Middleware Stack (Applied in Order)

1. **helmet**: Security headers
2. **cors**: Cross-origin configuration
3. **apiRateLimiter**: License-based rate limiting
4. **auditLog**: API usage tracking
5. **authenticate**: JWT validation + request context setup
6. **requirePermission / requireOrgAdmin / requireSuperUser**: Authorization checks

### Request Context

Every authenticated request has `req.context`:
```typescript
{
  user: User,              // Current user
  company: Company,        // User's company
  tenant?: Tenant,         // User's tenant (if assigned)
  license: License,        // Validated license
  permissions: Set<string> // User's effective permissions
}
```

## Database Schema Key Points

### Row Level Security (RLS)

All tables use Supabase RLS policies for tenant isolation:
- Super user bypasses all RLS checks
- Users can only see data within their company
- Org admins can manage all tenants in their company
- Regular users limited to assigned tenant

### Critical Relationships

- **Company → License**: One-to-one (every company must have a valid license)
- **Company → Tenants**: One-to-many (companies can create child tenants)
- **Company → Users**: One-to-many
- **User ↔ Roles**: Many-to-many (via user_roles)
- **Roles ↔ Permissions**: Many-to-many (via role_permissions)

### Auto-Generated Data

The schema seeds default permissions on creation:
- company.*, tenant.*, user.*, role.*, license.*, api.use, audit.read

When a new company is created, three default roles are auto-generated:
- **Admin**: All permissions
- **Operator**: Create/read/update (no delete)
- **Viewer**: Read-only

## Important Implementation Patterns

### License Validation

Every protected route validates the license:
1. Extract JWT from Authorization header
2. Fetch user and company from database
3. Call `licensingService.validateLicense(company.license_key)`
4. Check status (active/expired/revoked/suspended)
5. Verify signature and expiration timestamp

### Audit Logging

Two types of logging:
1. **API Usage** (automatic): Every request logged via `auditLog` middleware
2. **Audit Logs** (manual): Call `createAuditLogEntry()` for sensitive actions like:
   - Creating/deleting users
   - Assigning roles
   - Revoking licenses
   - Tenant creation/deletion

### Permission Checking

```typescript
// In routes: use middleware
router.post('/users', requirePermission('user.create'), ...)

// In services: check programmatically
const hasPermission = await rbacService.userHasPermission(userId, 'tenant.delete')
```

## Security Considerations

### Never Bypass These Checks

1. License validation before allowing API access
2. RLS policies for database queries
3. Password hashing with bcrypt (never store plain text)
4. JWT signature verification
5. Tenant isolation validation

### Sensitive Operations Requiring Audit Logs

- User creation/deletion
- Role assignment/removal
- License revocation
- Tenant management
- Permission changes

### Rate Limiting Strategy

Rate limits are **license-aware**:
- Default: 100 requests per 15 minutes
- License override: `license.features.api_rate_limit`
- Auth endpoints: Stricter limit (5 attempts per 15 min)

## Common Development Tasks

### Adding a New API Endpoint

1. Create route in `src/routes/*.routes.ts`
2. Apply authentication middleware: `router.use(authenticate)`
3. Add permission check: `requirePermission('resource.action')`
4. Implement handler with `req.context` access
5. Add audit logging if sensitive operation

### Adding a New Permission

1. Add to `src/database/schema.sql` seed data
2. Update default role definitions in `rbacService.createDefaultRoles()`
3. Use in routes via `requirePermission()`

### Creating a New Service

1. Create file in `src/services/*.service.ts`
2. Use class-based pattern with singleton export
3. Import `supabaseAdmin` for database access
4. Add comprehensive JSDoc comments for Doxygen
5. Export singleton: `export const myService = new MyService()`

## Testing Strategy

- Unit tests for services (crypto, auth, licensing)
- Integration tests for API endpoints
- Coverage threshold: 70% (configured in jest.config.js)
- Use Supertest for HTTP testing

## Type Safety

The codebase is strictly typed:
- No `any` types allowed (enforced by ESLint)
- All types defined in `src/types/index.ts`
- Database response types explicitly cast

## Configuration Management

All configuration in `src/config/index.ts`:
- Environment variables loaded via dotenv
- Typed config object exported
- Default values for development
- Never commit `.env` file

## Performance Notes

- Database queries are indexed (see schema.sql)
- Supabase connection pooling configured
- Audit logs written asynchronously (non-blocking)
- JWT tokens include permissions to avoid repeated DB queries
- Rate limiting prevents resource exhaustion

## Deployment Checklist

Before deploying to production:
1. Run SQL schema in Supabase
2. Set all environment variables
3. Generate strong LICENSE_ENCRYPTION_KEY (32 bytes)
4. Generate strong LICENSE_SIGNING_KEY
5. Change SUPER_USER_PASSWORD from default
6. Configure CORS allowed origins
7. Set NODE_ENV=production
8. Review rate limits
9. Test super user login
10. Verify license generation works
