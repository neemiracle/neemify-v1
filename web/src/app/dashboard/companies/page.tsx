'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Users, Database, Calendar, Shield } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

export default function CompaniesPage() {
  // Mock data - in real app, fetch from API
  const companies = [
    {
      id: '1',
      name: 'Acme Hospital',
      domain: 'acmehospital.com',
      license_status: 'active',
      user_count: 45,
      tenant_count: 8,
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      name: 'Med Clinic Group',
      domain: 'medclinic.com',
      license_status: 'active',
      user_count: 32,
      tenant_count: 5,
      created_at: '2024-01-18T14:30:00Z',
    },
    {
      id: '3',
      name: 'Health Partners',
      domain: 'healthpartners.com',
      license_status: 'active',
      user_count: 67,
      tenant_count: 12,
      created_at: '2024-01-20T09:15:00Z',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground">
            Manage all licensed organizations
          </p>
        </div>
        <Button>
          <Building2 className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.filter((c) => c.license_status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.reduce((sum, c) => sum + c.user_count, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {companies.reduce((sum, c) => sum + c.tenant_count, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Companies List */}
      <div className="grid gap-4">
        {companies.map((company) => (
          <Card key={company.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{company.name}</CardTitle>
                    <CardDescription>{company.domain}</CardDescription>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs bg-green-500/10 text-green-500 font-medium">
                  {company.license_status.toUpperCase()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{company.user_count}</p>
                    <p className="text-xs text-muted-foreground">Users</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{company.tenant_count}</p>
                    <p className="text-xs text-muted-foreground">Tenants</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {formatDateTime(company.created_at)}
                    </p>
                    <p className="text-xs text-muted-foreground">Created</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
