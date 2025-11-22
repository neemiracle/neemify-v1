# NEEMIFY API Examples

This document provides practical examples for using the NEEMIFY API.

## Authentication Examples

### 1. User Signup (New Company)

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acmehospital.com",
    "password": "SecurePassword123!",
    "fullName": "John Smith",
    "companyName": "ACME Hospital"
  }'
```

**Response:**
```json
{
  "message": "Company and user created successfully",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "companyId": "987fcdeb-51a2-43f7-8b4d-9c1234567890",
  "licenseKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. User Signup (Existing Domain)

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@acmehospital.com",
    "password": "AnotherPassword456!",
    "fullName": "Jane Doe"
  }'
```

**Response (Domain Exists):**
```json
{
  "domainExists": true,
  "companyName": "ACME Hospital",
  "message": "Company already exists. Request access from your admin or create a new company.",
  "adminEmail": "admin@acmehospital.com"
}
```

### 3. Login

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acmehospital.com",
    "password": "SecurePassword123!"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjNlNDU2Ny1lODliLTEyZDMtYTQ1Ni00MjY2MTQxNzQwMDAiLCJlbWFpbCI6ImFkbWluQGFjbWVob3NwaXRhbC5jb20iLCJjb21wYW55SWQiOiI5ODdmY2RlYi01MWEyLTQzZjctOGI0ZC05YzEyMzQ1Njc4OTAiLCJpc1N1cGVyVXNlciI6ZmFsc2UsImlzT3JnQWRtaW4iOnRydWUsInBlcm1pc3Npb25zIjpbInVzZXIuY3JlYXRlIiwidXNlci5yZWFkIiwidGVuYW50LmNyZWF0ZSJdLCJpYXQiOjE3MDk1MzIwMDAsImV4cCI6MTcwOTYxODQwMH0.xyz...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "admin@acmehospital.com",
    "fullName": "John Smith",
    "companyId": "987fcdeb-51a2-43f7-8b4d-9c1234567890",
    "isOrgAdmin": true,
    "isSuperUser": false
  }
}
```

## Tenant Management Examples

### 4. Create Child Tenant

**Request:**
```bash
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Downtown Clinic",
    "subdomain": "downtown",
    "settings": {
      "timezone": "America/New_York",
      "maxAppointmentsPerDay": 100
    }
  }'
```

**Response:**
```json
{
  "id": "456e7890-e89b-12d3-a456-426614174111",
  "parent_company_id": "987fcdeb-51a2-43f7-8b4d-9c1234567890",
  "name": "Downtown Clinic",
  "subdomain": "downtown",
  "settings": {
    "timezone": "America/New_York",
    "maxAppointmentsPerDay": 100
  },
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 5. List All Tenants

**Request:**
```bash
curl -X GET http://localhost:3000/api/tenants \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
[
  {
    "id": "456e7890-e89b-12d3-a456-426614174111",
    "name": "Downtown Clinic",
    "subdomain": "downtown",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z"
  },
  {
    "id": "789e0123-e89b-12d3-a456-426614174222",
    "name": "Northside Lab",
    "subdomain": "northside",
    "is_active": true,
    "created_at": "2024-01-16T14:20:00Z"
  }
]
```

### 6. Get Tenant Details

**Request:**
```bash
curl -X GET http://localhost:3000/api/tenants/456e7890-e89b-12d3-a456-426614174111 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "id": "456e7890-e89b-12d3-a456-426614174111",
  "parent_company_id": "987fcdeb-51a2-43f7-8b4d-9c1234567890",
  "name": "Downtown Clinic",
  "subdomain": "downtown",
  "settings": {
    "timezone": "America/New_York",
    "maxAppointmentsPerDay": 100
  },
  "is_active": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### 7. Update Tenant

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/tenants/456e7890-e89b-12d3-a456-426614174111 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Downtown Medical Clinic",
    "settings": {
      "timezone": "America/New_York",
      "maxAppointmentsPerDay": 150
    }
  }'
```

**Response:**
```json
{
  "message": "Tenant updated successfully"
}
```

### 8. Get Tenant Usage Statistics

**Request:**
```bash
curl -X GET http://localhost:3000/api/tenants/456e7890-e89b-12d3-a456-426614174111/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "userCount": 15,
  "apiCallsToday": 234,
  "apiCallsThisMonth": 5678
}
```

### 9. Delete Tenant

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/tenants/456e7890-e89b-12d3-a456-426614174111 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "message": "Tenant deleted successfully"
}
```

## Health Check

### 10. API Health Check

**Request:**
```bash
curl -X GET http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "NEEMIFY Medical OS API"
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Missing or invalid authorization header"
}
```

### 403 Forbidden (Insufficient Permissions)
```json
{
  "error": "Insufficient permissions",
  "required": "tenant.create"
}
```

### 403 Forbidden (Invalid License)
```json
{
  "error": "Invalid or expired license",
  "reason": "License has expired"
}
```

### 429 Rate Limit Exceeded
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retryAfter": "900"
}
```

## Common Usage Patterns

### Complete Signup Flow

```bash
# 1. Sign up new organization
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinic.com",
    "password": "SecurePass123!",
    "fullName": "Dr. Sarah Johnson",
    "companyName": "Johnson Clinic"
  }'

# Save the returned license key securely!

# 2. Login to get JWT token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clinic.com",
    "password": "SecurePass123!"
  }' | jq -r '.token')

# 3. Create child tenant
curl -X POST http://localhost:3000/api/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Main Clinic",
    "subdomain": "main"
  }'
```

### Programmatic API Usage (Node.js)

```javascript
const axios = require('axios');

const NEEMIFY_API = 'http://localhost:3000/api';
let authToken = null;

// Login
async function login(email, password) {
  const response = await axios.post(`${NEEMIFY_API}/auth/login`, {
    email,
    password
  });
  authToken = response.data.token;
  return response.data;
}

// Create authenticated request
function createAuthHeaders() {
  return {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
}

// Get all tenants
async function getTenants() {
  const response = await axios.get(
    `${NEEMIFY_API}/tenants`,
    { headers: createAuthHeaders() }
  );
  return response.data;
}

// Usage
(async () => {
  await login('admin@clinic.com', 'SecurePass123!');
  const tenants = await getTenants();
  console.log('Tenants:', tenants);
})();
```
