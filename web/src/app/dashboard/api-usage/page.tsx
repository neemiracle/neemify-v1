'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Loader2, Clock, TrendingUp, Zap, BarChart } from 'lucide-react'
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

interface ApiUsageLog {
  id: string
  endpoint: string
  method: string
  status_code: number
  response_time_ms: number
  timestamp: string
  company_id: string
  tenant_id?: string
  user_id?: string
  users?: {
    id: string
    email: string
    full_name: string
  }
}

interface ApiUsageStats {
  totalCalls: number
  callsToday: number
  callsThisMonth: number
  avgResponseTime: number
}

export default function ApiUsagePage() {
  const { toast } = useToast()
  const [usageLogs, setUsageLogs] = useState<ApiUsageLog[]>([])
  const [stats, setStats] = useState<ApiUsageStats>({
    totalCalls: 0,
    callsToday: 0,
    callsThisMonth: 0,
    avgResponseTime: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApiUsage()
  }, [])

  const fetchApiUsage = async () => {
    try {
      setLoading(true)

      // Fetch usage logs
      const logsData = await api.getApiUsage()
      setUsageLogs(logsData)

      // Fetch usage stats
      const statsData = await api.getApiUsageStats()
      setStats(statsData)
    } catch (error: any) {
      console.error('Failed to fetch API usage:', error)
      toast({
        title: 'Error',
        description: 'Failed to load API usage data. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <Badge variant="default" className="bg-green-500">{ statusCode}</Badge>
    } else if (statusCode >= 400 && statusCode < 500) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-500">{statusCode}</Badge>
    } else if (statusCode >= 500) {
      return <Badge variant="destructive">{statusCode}</Badge>
    }
    return <Badge variant="secondary">{statusCode}</Badge>
  }

  const getMethodBadge = (method: string) => {
    const colors = {
      GET: 'bg-blue-500',
      POST: 'bg-green-500',
      PUT: 'bg-yellow-500',
      PATCH: 'bg-orange-500',
      DELETE: 'bg-red-500'
    }
    return (
      <Badge className={colors[method as keyof typeof colors] || 'bg-gray-500'}>
        {method}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading API usage data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold">API Usage</h1>
        <p className="text-muted-foreground">Monitor API calls and usage metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.callsToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls This Month</CardTitle>
            <BarChart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.callsThisMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">Average latency</p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Logs Table */}
      {usageLogs.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent API Calls</CardTitle>
            <CardDescription>
              View recent API requests and responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {getMethodBadge(log.method)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.endpoint}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(log.status_code)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {log.users?.full_name || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{log.response_time_ms}ms</span>
                      </div>
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
            <Activity className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No API Usage Data</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              No API calls have been logged yet. Usage data will appear here once API endpoints are called.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
