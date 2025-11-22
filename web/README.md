# NEEMIFY Web Dashboard

Modern, responsive dashboard for NEEMIFY Medical OS API Infrastructure built with Next.js 14, shadcn/ui, and TypeScript.

## Features

- **Dark Theme**: Beautiful dark theme using shadcn/ui components
- **Sidebar Navigation**: Intuitive sidebar-based navigation
- **Super Admin Dashboard**: Complete system overview and management
- **Real-time Statistics**: Monitor companies, tenants, users, and API usage
- **Secure Authentication**: JWT-based authentication with the NEEMIFY API
- **Responsive Design**: Works on desktop, tablet, and mobile

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **API Client**: Axios
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+
- NEEMIFY API running on http://localhost:3000

### Installation

```bash
# Navigate to web directory
cd web

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Edit .env.local if needed (default API URL is http://localhost:3000/api)
```

### Development

```bash
# Start development server
npm run dev

# The app will run on http://localhost:3001
```

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Project Structure

```
web/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home page
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   └── dashboard/
│   │       ├── layout.tsx        # Dashboard layout with sidebar
│   │       ├── page.tsx          # Dashboard overview
│   │       ├── companies/        # Companies management
│   │       └── tenants/          # Tenants management
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   └── dashboard/            # Dashboard-specific components
│   │       ├── sidebar.tsx       # Sidebar navigation
│   │       └── header.tsx        # Dashboard header
│   ├── lib/
│   │   ├── api.ts                # API client
│   │   └── utils.ts              # Utility functions
│   ├── store/
│   │   └── auth-store.ts         # Authentication state
│   └── hooks/
│       └── use-toast.ts          # Toast notifications
```

## Usage

### Login

1. Navigate to http://localhost:3001
2. Click "Admin Login"
3. Enter super admin credentials:
   - Email: `admin@neemify.com`
   - Password: (from your .env)

### Dashboard Features

**Overview**
- System-wide statistics
- Active companies and tenants
- API usage metrics
- License status

**Companies**
- View all licensed organizations
- Monitor user and tenant counts
- Manage company details

**Tenants**
- View all child tenants
- Filter by status (active/inactive)
- Tenant usage statistics

**Users** (Coming soon)
- User management
- Role assignments
- Activity tracking

**Licenses** (Coming soon)
- License generation
- Validation and revocation
- Expiration monitoring

**API Usage** (Coming soon)
- Real-time API metrics
- Usage analytics
- Rate limit monitoring

**Audit Logs** (Coming soon)
- Complete audit trail
- Action history
- Security monitoring

## Configuration

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Theme Customization

The app uses shadcn/ui dark theme by default. To customize colors, edit `src/app/globals.css`:

```css
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  /* ... other color variables */
}
```

## API Integration

The frontend communicates with the NEEMIFY API using the ApiClient in `src/lib/api.ts`:

```typescript
import { api } from '@/lib/api'

// Login
const data = await api.login(email, password)

// Fetch tenants
const tenants = await api.getTenants()

// Create tenant
const tenant = await api.createTenant({ name, subdomain })
```

## Authentication

Authentication is managed via Zustand store (`src/store/auth-store.ts`):

```typescript
import { useAuthStore } from '@/store/auth-store'

// In component
const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore()
```

The dashboard layout automatically redirects to `/login` if not authenticated.

## Adding New Pages

1. Create a new directory in `src/app/dashboard/`
2. Add a `page.tsx` file
3. Add the route to sidebar navigation in `src/components/dashboard/sidebar.tsx`

Example:

```typescript
{
  name: 'My New Page',
  href: '/dashboard/my-page',
  icon: MyIcon,
}
```

## Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

## Troubleshooting

### API Connection Issues

Ensure the NEEMIFY API is running:
```bash
# In the main neemify directory
npm run dev
```

Check the API URL in `.env.local` matches your API server.

### Build Errors

Clear cache and reinstall:
```bash
rm -rf .next node_modules
npm install
npm run build
```

## License

PROPRIETARY - All rights reserved
