# Quick Start - NEEMIFY Web Dashboard

## Installation

```bash
# Navigate to web directory
cd /Users/buddha/Developer/code/v1/neemify/web

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at **http://localhost:3001**

## Fixes Applied

✅ **Fixed SSR hydration issues** - Added proper client-side checks
✅ **Fixed Zustand persist** - Updated to use createJSONStorage for SSR compatibility
✅ **Created .env.local** - API URL configured to http://localhost:3000/api
✅ **Added mounted state** - Prevents hydration mismatches
✅ **Safe fallbacks** - All user data has null checks

## Troubleshooting

### If you see "Cannot find module" errors:

```bash
cd /Users/buddha/Developer/code/v1/neemify/web
rm -rf node_modules package-lock.json
npm install
```

### If you see "localStorage is not defined":

This is now fixed! The auth store handles SSR properly.

### If you see hydration warnings:

The dashboard layout now uses a `mounted` state to prevent mismatches.

## Login Credentials

- Email: `admin@neemify.com`
- Password: (from your backend `.env` file - SUPER_USER_PASSWORD)

## Backend Must Be Running

Make sure the backend API is running on port 3000:

```bash
# In the main neemify directory
npm run dev
```
