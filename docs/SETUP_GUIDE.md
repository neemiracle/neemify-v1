# NEEMIFY Setup Guide

This guide walks you through setting up NEEMIFY from scratch.

## Prerequisites

1. **Node.js 18+**: Download from [nodejs.org](https://nodejs.org/)
2. **Supabase Account**: Sign up at [supabase.com](https://supabase.com/)
3. **Git**: For version control

## Step 1: Clone and Install

```bash
# Clone the repository (if applicable)
cd neemify

# Install dependencies
npm install
```

## Step 2: Supabase Setup

### Create a New Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com/)
2. Click "New Project"
3. Choose organization and enter project details
4. Wait for project to be provisioned

### Get API Credentials

1. Go to Project Settings → API
2. Copy the following:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Anon/Public Key**
   - **Service Role Key** (keep this secret!)

## Step 3: Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Update the following in `.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# License Encryption (generate strong 32-byte keys)
LICENSE_ENCRYPTION_KEY=your-256-bit-encryption-key-change-in-production
LICENSE_SIGNING_KEY=your-private-key-for-signing

# Super User (One-time Setup)
SUPER_USER_EMAIL=admin@neemify.com
SUPER_USER_PASSWORD=ChangeMe123!

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Generate Strong Keys

Use Node.js to generate secure keys:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this twice and use the outputs for `LICENSE_ENCRYPTION_KEY` and `LICENSE_SIGNING_KEY`.

## Step 4: Database Setup

### Run the Schema

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Click "New Query"
4. Copy the entire contents of `src/database/schema.sql`
5. Paste into the query editor
6. Click "Run"

The schema will:
- Create all tables
- Set up Row Level Security policies
- Create triggers
- Seed default permissions

### Verify Setup

Run this query to verify:

```sql
SELECT COUNT(*) FROM permissions;
-- Should return 19 (the seeded permissions)

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
-- Should show all 10 tables
```

## Step 5: Start the Application

### Development Mode

```bash
npm run dev
```

You should see:

```
============================================================
NEEMIFY Medical OS API Infrastructure
============================================================
Environment: development
Server running on port: 3000
API endpoint: http://localhost:3000/api
============================================================
Super user created successfully. Please change the password immediately.
```

### Verify Installation

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Should return:
# {
#   "status": "healthy",
#   "timestamp": "2024-01-15T10:30:00Z",
#   "service": "NEEMIFY Medical OS API"
# }
```

## Step 6: Change Super User Password

**CRITICAL**: The super user account is created with the password from `.env`. Change it immediately!

1. Login as super user:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@neemify.com",
    "password": "ChangeMe123!"
  }'
```

2. Save the returned JWT token
3. Implement password change functionality (or update directly in Supabase)

## Step 7: Create Your First Organization

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "SecurePassword123!",
    "fullName": "Your Name",
    "companyName": "Your Company"
  }'
```

Save the returned `licenseKey` - you'll need it if you ever need to restore access.

## Step 8: Testing the System

### Test Authentication

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourcompany.com",
    "password": "SecurePassword123!"
  }'
```

### Test Tenant Creation

```bash
# Use the token from login
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Test Clinic",
    "subdomain": "test"
  }'
```

## Production Deployment

### Checklist

- [ ] Change all default passwords
- [ ] Generate strong encryption keys
- [ ] Set `NODE_ENV=production`
- [ ] Configure SSL/TLS certificates
- [ ] Set up reverse proxy (nginx/Apache)
- [ ] Enable Supabase connection pooling
- [ ] Configure CORS with specific origins
- [ ] Set up monitoring (PM2, New Relic, etc.)
- [ ] Enable log rotation
- [ ] Set up automated backups
- [ ] Configure firewall rules
- [ ] Review and adjust rate limits

### Production Build

```bash
# Build the application
npm run build

# Start with PM2 (recommended)
npm install -g pm2
pm2 start dist/index.js --name neemify-api

# Or use Node directly
NODE_ENV=production node dist/index.js
```

### Environment Variables (Production)

```env
NODE_ENV=production
PORT=3000
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-prod-service-key
JWT_SECRET=strong-random-secret-64-chars-minimum
LICENSE_ENCRYPTION_KEY=strong-32-byte-hex-key
LICENSE_SIGNING_KEY=strong-32-byte-hex-key
ALLOWED_ORIGINS=https://your-frontend.com,https://admin.your-frontend.com
```

## Troubleshooting

### Super User Already Exists

If you see "Super user already exists", the system is working correctly. You can only have one super user.

### Database Connection Errors

- Verify `SUPABASE_URL` is correct
- Check that `SUPABASE_SERVICE_ROLE_KEY` is the Service Role key, not the Anon key
- Ensure Supabase project is running

### License Validation Errors

- Verify `LICENSE_ENCRYPTION_KEY` and `LICENSE_SIGNING_KEY` haven't changed
- Check that the license isn't expired
- Ensure company exists in database

### Rate Limiting Issues

- Adjust `RATE_LIMIT_MAX_REQUESTS` in `.env`
- Check license features for API rate limit override

## Next Steps

1. Read `docs/architecture.md` for system design
2. Review `docs/API_EXAMPLES.md` for usage examples
3. Set up monitoring and alerting
4. Configure backup strategy
5. Implement additional routes as needed

## Support

For issues:
1. Check `logs/error.log` and `logs/combined.log`
2. Review Supabase logs in dashboard
3. Enable debug logging: `LOG_LEVEL=debug`
