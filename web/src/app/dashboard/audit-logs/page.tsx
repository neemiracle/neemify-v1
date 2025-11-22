'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Loader2, Shield, User, Database, Key } from 'lucide-react'
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

interface AuditLog {
  id: string
  action: string
  resource_type: string
  resource_id?: string
  details: any
  timestamp: string
  ip_address?: string
  user_agent?: string
  users?: {
    id: string
    email: string
    full_name: string
  }
}

export default function AuditLogsPage() {
  const { toast } = useToast()
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const data = await api.getAuditLogs()
      setAuditLogs(data)
    } catch (error: any) {
      console.error('Failed to fetch audit logs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load audit logs. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getActionBadge = (action: string) => {
    if (action.includes('create')) {
      return <Badge variant="default" className="bg-green-500">CREATE</Badge>
    } else if (action.includes('update')) {
      return <Badge variant="default" className="bg-blue-500">UPDATE</Badge>
    } else if (action.includes('delete')) {
      return <Badge variant="destructive">DELETE</Badge>
    } else if (action.includes('login') || action.includes('auth')) {
      return <Badge variant="outline" className="border-purple-500 text-purple-500">AUTH</Badge>
    } else if (action.includes('revoke') || action.includes('suspend')) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-500">SECURITY</Badge>
    }
    return <Badge variant="secondary">{action.split('.')[0].toUpperCase()}</Badge>
  }

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'user':
        return <User className="h-4 w-4" />
      case 'company':
        return <Database className="h-4 w-4" />
      case 'license':
        return <Key className="h-4 w-4" />
      case 'tenant':
        return <Database className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading audit logs...</p>
        </div>
      </div>
    )
  }

  const actionTypes = [...new Set(auditLogs.map(log => log.action.split('.')[0]))]
  const resourceTypes = [...new Set(auditLogs.map(log => log.resource_type))]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Complete system audit trail</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Logged events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Types</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{actionTypes.length}</div>
            <p className="text-xs text-muted-foreground">Unique actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resource Types</CardTitle>
            <Database className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resourceTypes.length}</div>
            <p className="text-xs text-muted-foreground">Different resources</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Event</CardTitle>
            <FileText className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {auditLogs.length > 0 ? new Date(auditLogs[0].timestamp).toLocaleTimeString() : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Most recent</p>
          </CardContent>
        </Card>
      </div>

      {/* Audit Logs Table */}
      {auditLogs.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Audit Trail</CardTitle>
            <CardDescription>
              Complete history of system events and actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {getActionBadge(log.action)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getResourceIcon(log.resource_type)}
                        <span className="text-sm capitalize">{log.resource_type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      <div>
                        <div className="font-medium text-foreground">
                          {log.users?.full_name || 'System'}
                        </div>
                        <div className="text-xs">
                          {log.users?.email || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {log.action}
                      </code>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">
                      {log.ip_address || 'N/A'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(log.timestamp)}
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
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Audit Logs</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              No audit events have been logged yet. System activities will appear here once actions are performed.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
