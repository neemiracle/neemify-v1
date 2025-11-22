'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  Building2,
  Users,
  Key,
  Activity,
  FileText,
  Settings,
  Shield,
  Database,
} from 'lucide-react'

const navigation = [
  {
    name: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Companies',
    href: '/dashboard/companies',
    icon: Building2,
  },
  {
    name: 'Tenants',
    href: '/dashboard/tenants',
    icon: Database,
  },
  {
    name: 'Users',
    href: '/dashboard/users',
    icon: Users,
  },
  {
    name: 'Licenses',
    href: '/dashboard/licenses',
    icon: Key,
  },
  {
    name: 'API Usage',
    href: '/dashboard/api-usage',
    icon: Activity,
  },
  {
    name: 'Audit Logs',
    href: '/dashboard/audit-logs',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Shield className="h-6 w-6 text-primary" />
        <span className="ml-2 text-xl font-bold">NEEMIFY</span>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-secondary'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground text-center">
          <p>NEEMIFY v1.0.0</p>
          <p className="mt-1">Medical OS API</p>
        </div>
      </div>
    </div>
  )
}
