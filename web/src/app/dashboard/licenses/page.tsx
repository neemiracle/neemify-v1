'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Key, Loader2, Shield, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface License {
  id: string
  license_key: string
  company_id: string
  status: 'active' | 'expired' | 'revoked' | 'suspended'
  issued_at: string
  expires_at?: string
  companies?: {
    id: string
    name: string
    domain: string
  }
}

export default function LicensesPage() {
  const { toast } = useToast()
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLicenses()
  }, [])

  const fetchLicenses = async () => {
    try {
      setLoading(true)
      const data = await api.getLicenses()
      setLicenses(data)
    } catch (error: any) {
      console.error('Failed to fetch licenses:', error)
      toast({
        title: 'Error',
        description: 'Failed to load licenses. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case 'expired':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        )
      case 'revoked':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Revoked
          </Badge>
        )
      case 'suspended':
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            <AlertCircle className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading licenses...</p>
        </div>
      </div>
    )
  }

  const activeLicenses = licenses.filter(l => l.status === 'active')
  const expiredLicenses = licenses.filter(l => l.status === 'expired')
  const suspendedLicenses = licenses.filter(l => l.status === 'suspended')
  const revokedLicenses = licenses.filter(l => l.status === 'revoked')

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Licenses</h1>
          <p className="text-muted-foreground">Manage cryptographic licenses</p>
        </div>
        <Button disabled>
          <Key className="mr-2 h-4 w-4" />
          Generate License
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLicenses.length}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiredLicenses.length}</div>
            <p className="text-xs text-muted-foreground">Past expiration</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suspendedLicenses.length}</div>
            <p className="text-xs text-muted-foreground">Temporarily disabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revoked</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revokedLicenses.length}</div>
            <p className="text-xs text-muted-foreground">Permanently revoked</p>
          </CardContent>
        </Card>
      </div>

      {/* Licenses Table */}
      {licenses.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Licenses</CardTitle>
            <CardDescription>
              View and manage all cryptographic licenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>License Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          {license.companies?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {license.companies?.domain}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {license.license_key.substring(0, 20)}...
                      </code>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(license.status)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(license.issued_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {license.expires_at ? formatDateTime(license.expires_at) : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {license.status === 'active' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: 'Coming Soon',
                                  description: 'License suspension will be available soon.'
                                })
                              }}
                            >
                              Suspend
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: 'Coming Soon',
                                  description: 'License revocation will be available soon.'
                                })
                              }}
                            >
                              Revoke
                            </Button>
                          </>
                        )}
                        {license.status === 'suspended' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              toast({
                                title: 'Coming Soon',
                                description: 'License reactivation will be available soon.'
                              })
                            }}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Key className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Licenses Found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              There are currently no licenses in the system.
              Generate a new license to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
