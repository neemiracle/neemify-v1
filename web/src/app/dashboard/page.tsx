'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Database, Activity, TrendingUp, Shield } from 'lucide-react'

interface Stats {
  totalCompanies: number
  totalTenants: number
  totalUsers: number
  apiCallsToday: number
  activeLicenses: number
  systemHealth: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalCompanies: 0,
    totalTenants: 0,
    totalUsers: 0,
    apiCallsToday: 0,
    activeLicenses: 0,
    systemHealth: 'healthy',
  })

  useEffect(() => {
    // In a real app, fetch this from API
    // For now, using mock data
    setStats({
      totalCompanies: 12,
      totalTenants: 45,
      totalUsers: 234,
      apiCallsToday: 1543,
      activeLicenses: 12,
      systemHealth: 'healthy',
    })
  }, [])

  const statCards = [
    {
      title: 'Total Companies',
      value: stats.totalCompanies,
      description: 'Licensed organizations',
      icon: Building2,
      trend: '+2 this month',
    },
    {
      title: 'Child Tenants',
      value: stats.totalTenants,
      description: 'Active tenants',
      icon: Database,
      trend: '+8 this month',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      description: 'Across all organizations',
      icon: Users,
      trend: '+23 this week',
    },
    {
      title: 'API Calls Today',
      value: stats.apiCallsToday.toLocaleString(),
      description: 'System-wide requests',
      icon: Activity,
      trend: '+12% from yesterday',
    },
    {
      title: 'Active Licenses',
      value: stats.activeLicenses,
      description: 'Valid and not expired',
      icon: Shield,
      trend: '100% active',
    },
    {
      title: 'System Health',
      value: stats.systemHealth.toUpperCase(),
      description: 'All systems operational',
      icon: TrendingUp,
      trend: '99.9% uptime',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">System Overview</h1>
        <p className="text-muted-foreground">
          Real-time statistics and system monitoring
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <p className="text-xs text-primary mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Companies</CardTitle>
            <CardDescription>
              Latest organizations added to the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Acme Hospital', domain: 'acmehospital.com', date: '2 hours ago' },
                { name: 'Med Clinic Group', domain: 'medclinic.com', date: '5 hours ago' },
                { name: 'Health Partners', domain: 'healthpartners.com', date: '1 day ago' },
              ].map((company) => (
                <div key={company.domain} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-muted-foreground">{company.domain}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{company.date}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>License Status</CardTitle>
            <CardDescription>
              Overview of license distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="text-sm">Active</span>
                </div>
                <span className="font-bold">12</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <span className="text-sm">Expiring Soon</span>
                </div>
                <span className="font-bold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm">Expired</span>
                </div>
                <span className="font-bold">0</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-gray-500" />
                  <span className="text-sm">Suspended</span>
                </div>
                <span className="font-bold">0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>
            Current status of all system components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium">API Server</p>
                <p className="text-xs text-muted-foreground">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium">Database</p>
                <p className="text-xs text-muted-foreground">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="text-sm font-medium">License Validation</p>
                <p className="text-xs text-muted-foreground">Operational</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
