# NEEMIFY - Medical OS API Infrastructure

NEEMIFY is an enterprise-grade Medical OS API infrastructure with cryptographic licensing, multi-tenant architecture, and banking-level security.

## Features

- **Cryptographic Licensing**: AES-256-GCM encryption with HMAC-SHA256 signing
- **Multi-Tenant Architecture**: Hierarchical tenants (companies → child tenants)
- **Dynamic RBAC**: Flexible role-based access control
- **Domain-Based Signup**: Intelligent organization assignment
- **Audit & Compliance**: Complete API usage tracking and audit logs
- **High Performance**: Optimized for medical-grade, financial-grade systems
- **Row Level Security**: Database-level isolation with Supabase RLS
- **Web Dashboard**: Modern Next.js dashboard with dark theme

## Project Structure

```
neemify/
├── src/                    # Backend API
│   ├── services/          # Business logic (auth, licensing, RBAC, etc.)
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth, rate limiting, audit
│   ├── config/            # Configuration
│   └── database/          # Database schema
├── web/                   # Frontend Dashboard
│   ├── src/
│   │   ├── app/          # Next.js pages
│   │   ├── components/   # UI components
│   │   └── lib/          # API client, utilities
│   └── package.json
├── docs/                  # Documentation
└── package.json
```

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- PostgreSQL (via Supabase)

### Backend Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your Supabase credentials

# Run database schema in Supabase SQL editor
# File: src/database/schema.sql

# Start backend server
npm run dev
```

The API will run on http://localhost:3000

### Frontend Setup

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Start development server
npm run dev
```

The web dashboard will run on http://localhost:3001

### First Time Setup

1. The backend will create a super user on first run with credentials from `.env`
2. Login to web dashboard at http://localhost:3001/login
3. **IMPORTANT**: Change the super user password immediately

## Development Workflow

### Running Both Servers

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd web
npm run dev
```

### Build Commands

**Backend:**
```bash
npm run build      # Build TypeScript
npm test           # Run tests
npm run lint       # Check linting
npm run docs       # Generate documentation
```

**Frontend:**
```bash
cd web
npm run build      # Build Next.js app
npm run lint       # Check linting
```

## Web Dashboard

The NEEMIFY web dashboard provides:

- **Super Admin Dashboard**: System-wide overview and statistics
- **Companies Management**: View and manage all licensed organizations
- **Tenants Management**: Manage child tenants across companies
- **User Management**: User administration and role assignment
- **License Management**: Generate, validate, and revoke licenses
- **API Usage Monitoring**: Real-time API metrics and analytics
- **Audit Logs**: Complete system audit trail
- **Dark Theme**: Beautiful shadcn/ui dark theme

### Dashboard Features

**Overview Page**
- Total companies, tenants, and users
- API calls today
- Active licenses count
- System health status
- Recent activity feed

**Companies Page**
- List all licensed organizations
- View company details
- Monitor users and tenants per company
- License status tracking

**Tenants Page**
- View all child tenants
- Active/inactive status
- Tenant statistics
- Creation dates

See `web/README.md` for detailed frontend documentation.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration with domain validation
- `POST /api/auth/login` - User authentication
- `POST /api/auth/request-access` - Request access to existing company

### Tenants
- `POST /api/tenants` - Create child tenant (Org Admin only)
- `GET /api/tenants` - List all tenants
- `GET /api/tenants/:id` - Get tenant details
- `PATCH /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant
- `GET /api/tenants/:id/stats` - Get tenant usage statistics

### Health
- `GET /api/health` - API health check
- `GET /` - API information

## Architecture

### Core Components

1. **Licensing System** - Cryptographically secure license generation and validation
2. **Multi-Tenant Engine** - Hierarchical tenant isolation
3. **Authentication** - JWT-based auth with bcrypt password hashing
4. **RBAC** - Dynamic roles and permissions
5. **Audit System** - Complete API usage and action tracking
6. **Web Dashboard** - Modern Next.js frontend with real-time data

### Security Features

- AES-256-GCM encryption for licenses
- HMAC-SHA256 signing
- bcrypt password hashing (12 rounds)
- Row Level Security (RLS) in database
- Rate limiting per license tier
- Helmet.js security headers
- CORS protection
- Request size limits

### Database Schema

- **companies** - Top-level tenants with licenses
- **tenants** - Child tenants managed by companies
- **users** - System users
- **licenses** - Encrypted license records
- **roles** - Dynamic roles per company
- **permissions** - System permissions
- **user_roles** - User-role assignments
- **role_permissions** - Role-permission assignments
- **api_usage** - API call tracking
- **audit_logs** - Audit trail

## Environment Variables

### Backend (.env)

```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Server
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=24h

# License Encryption
LICENSE_ENCRYPTION_KEY=
LICENSE_SIGNING_KEY=

# Super User (one-time setup)
SUPER_USER_EMAIL=admin@neemify.com
SUPER_USER_PASSWORD=ChangeMe123!

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend (web/.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Production Deployment

### Backend

```bash
# Build
npm run build

# Start
npm start

# Or use PM2
pm2 start dist/index.js --name neemify-api
```

### Frontend

```bash
cd web

# Build
npm run build

# Start
npm start
```

### Production Checklist

- [ ] Change all default passwords and secrets
- [ ] Set strong LICENSE_ENCRYPTION_KEY and LICENSE_SIGNING_KEY
- [ ] Configure CORS allowed origins
- [ ] Set up SSL/TLS certificates
- [ ] Enable database backups
- [ ] Configure monitoring and alerts
- [ ] Review and adjust rate limits
- [ ] Set up log aggregation
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Set up domain and DNS

## Documentation

- `README.md` - This file (project overview)
- `web/README.md` - Frontend documentation
- `docs/architecture.md` - Detailed architecture guide
- `docs/API_EXAMPLES.md` - API usage examples
- `docs/SETUP_GUIDE.md` - Step-by-step setup guide
- `CLAUDE.md` - Guide for future Claude Code sessions

## Development Scripts

### Backend
```bash
npm run dev          # Development server
npm run build        # Build TypeScript
npm start            # Production server
npm test             # Run tests
npm run lint         # Lint code
npm run docs         # Generate Doxygen docs
```

### Frontend
```bash
cd web
npm run dev          # Development server (port 3001)
npm run build        # Build for production
npm start            # Production server
npm run lint         # Lint code
```

## Testing

```bash
# Backend tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm test -- --coverage
```

## License

PROPRIETARY - All rights reserved

## Support

For issues and support, contact your NEEMIFY administrator.
