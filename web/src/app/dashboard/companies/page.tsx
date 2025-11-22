'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Users, Database, Shield, Loader2, ExternalLink, BarChart3, Plus, CheckCircle, XCircle, Ban, Trash2, ShieldCheck } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Company {
  id: string
  name: string
  domain: string
  industry?: string
  contact_email?: string
  domain_verified?: boolean
  verified_at?: string
  is_blocked?: boolean
  blocked_at?: string
  blocked_reason?: string
  created_at: string
  updated_at: string
}

export default function CompaniesPage() {
  const { toast } = useToast()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [blockReason, setBlockReason] = useState('')
  const [verificationInfo, setVerificationInfo] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
  })
  const [stats, setStats] = useState({
    totalCompanies: 0,
    verifiedCompanies: 0,
    blockedCompanies: 0,
    activeCompanies: 0
  })

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const data = await api.getCompanies()
      setCompanies(data)

      // Calculate stats
      setStats({
        totalCompanies: data.length,
        verifiedCompanies: data.filter((c: Company) => c.domain_verified).length,
        blockedCompanies: data.filter((c: Company) => c.is_blocked).length,
        activeCompanies: data.filter((c: Company) => !c.is_blocked).length
      })
    } catch (error: any) {
      console.error('Failed to fetch companies:', error)
      toast({
        title: 'Error',
        description: 'Failed to load companies. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.domain) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    try {
      setCreating(true)
      const result = await api.createCompany({
        name: formData.name,
        domain: formData.domain,
      })

      toast({
        title: 'Success',
        description: `Company "${formData.name}" created successfully!`,
      })

      if (result.licenseKey) {
        setTimeout(() => {
          toast({
            title: 'License Key Generated',
            description: `License: ${result.licenseKey.substring(0, 30)}...`,
            duration: 10000,
          })
        }, 1000)
      }

      setFormData({ name: '', domain: '' })
      setDialogOpen(false)
      fetchCompanies()
    } catch (error: any) {
      console.error('Failed to create company:', error)
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to create company',
        variant: 'destructive'
      })
    } finally {
      setCreating(false)
    }
  }

  const handleOpenVerifyDialog = async (company: Company) => {
    try {
      setSelectedCompany(company)
      const info = await api.getCompanyVerificationInfo(company.id)
      setVerificationInfo(info)
      setVerifyDialogOpen(true)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to get verification info',
        variant: 'destructive'
      })
    }
  }

  const handleVerifyDomain = async () => {
    if (!selectedCompany) return

    try {
      setVerifying(true)
      const result = await api.verifyCompanyDomain(selectedCompany.id)

      if (result.verified) {
        toast({
          title: 'Success',
          description: `Domain verified for ${selectedCompany.name}`,
        })
        setVerifyDialogOpen(false)
        setSelectedCompany(null)
        setVerificationInfo(null)
        fetchCompanies()
      } else {
        toast({
          title: 'Verification Failed',
          description: result.message || 'DNS TXT record not found or invalid',
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to verify domain',
        variant: 'destructive'
      })
    } finally {
      setVerifying(false)
    }
  }

  const handleBlockCompany = async () => {
    if (!selectedCompany) return

    try {
      await api.blockCompany(selectedCompany.id, blockReason)
      toast({
        title: 'Success',
        description: `${selectedCompany.name} has been blocked`,
      })
      setBlockDialogOpen(false)
      setBlockReason('')
      setSelectedCompany(null)
      fetchCompanies()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to block company',
        variant: 'destructive'
      })
    }
  }

  const handleUnblockCompany = async (company: Company) => {
    try {
      await api.unblockCompany(company.id)
      toast({
        title: 'Success',
        description: `${company.name} has been unblocked`,
      })
      fetchCompanies()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to unblock company',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return

    try {
      await api.deleteCompany(selectedCompany.id)
      toast({
        title: 'Success',
        description: `${selectedCompany.name} has been deleted`,
      })
      setDeleteDialogOpen(false)
      setSelectedCompany(null)
      fetchCompanies()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || error.response?.data?.message || 'Failed to delete company',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading companies...</p>
        </div>
      </div>
    )
  }

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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <form onSubmit={handleCreateCompany}>
              <DialogHeader>
                <DialogTitle>Add New Company</DialogTitle>
                <DialogDescription>
                  Create a new company and automatically generate a license.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Acme Corporation"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="domain">
                    Domain <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="domain"
                    placeholder="acme.com"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    The company email domain (e.g., acme.com)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Company
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">Registered organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.verifiedCompanies}</div>
            <p className="text-xs text-muted-foreground">Domain verified</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCompanies}</div>
            <p className="text-xs text-muted-foreground">Not blocked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blockedCompanies}</div>
            <p className="text-xs text-muted-foreground">Access restricted</p>
          </CardContent>
        </Card>
      </div>

      {/* Companies Table */}
      {companies.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>All Companies</CardTitle>
            <CardDescription>
              View and manage all registered organizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id} className={company.is_blocked ? 'opacity-60' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {company.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{company.domain}</Badge>
                    </TableCell>
                    <TableCell>
                      {company.is_blocked ? (
                        <Badge variant="destructive" className="gap-1">
                          <Ban className="h-3 w-3" />
                          Blocked
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-500 gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {company.domain_verified ? (
                        <Badge variant="default" className="bg-blue-500 gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Unverified
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(company.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Manage Company</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {!company.domain_verified && (
                            <DropdownMenuItem onClick={() => handleOpenVerifyDialog(company)}>
                              <ShieldCheck className="mr-2 h-4 w-4" />
                              Verify Domain
                            </DropdownMenuItem>
                          )}
                          {company.is_blocked ? (
                            <DropdownMenuItem onClick={() => handleUnblockCompany(company)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Unblock Company
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCompany(company)
                                setBlockDialogOpen(true)
                              }}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Block Company
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedCompany(company)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Company
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Companies Found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              There are currently no companies registered in the system.
              Add a new company to get started.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Company
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Block Company Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block Company</DialogTitle>
            <DialogDescription>
              This will prevent the company from accessing the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason for blocking</Label>
              <Input
                id="reason"
                placeholder="Enter reason..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBlockCompany}>
              Block Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Company Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCompany?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCompany}>
              Delete Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Domain Verification Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Verify Domain Ownership</DialogTitle>
            <DialogDescription>
              Add a DNS TXT record to verify domain ownership for {selectedCompany?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {verificationInfo && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Step 1: Add DNS TXT Record</Label>
                  <p className="text-sm text-muted-foreground">
                    Add the following TXT record to your DNS configuration:
                  </p>
                </div>

                <div className="space-y-3 rounded-md border p-4 bg-muted/50">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-muted-foreground">Record Type</Label>
                      <code className="text-sm font-mono bg-background px-2 py-1 rounded">TXT</code>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-start justify-between gap-4">
                      <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Record Name</Label>
                      <code className="text-sm font-mono bg-background px-2 py-1 rounded break-all text-right flex-1">
                        {verificationInfo.txtRecordName}
                      </code>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <div className="flex items-start justify-between gap-4">
                      <Label className="text-xs font-medium text-muted-foreground whitespace-nowrap">Record Value</Label>
                      <code className="text-sm font-mono bg-background px-2 py-1 rounded break-all text-right flex-1">
                        {verificationInfo.txtRecordValue}
                      </code>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Step 2: Wait for DNS Propagation</Label>
                  <p className="text-sm text-muted-foreground">
                    After adding the TXT record, wait 5-10 minutes for DNS changes to propagate, then click Verify Now.
                  </p>
                </div>

                <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> DNS propagation can take anywhere from a few minutes to 48 hours depending on your DNS provider.
                    If verification fails, please wait and try again.
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setVerifyDialogOpen(false)
              setSelectedCompany(null)
              setVerificationInfo(null)
            }}>
              Close
            </Button>
            <Button onClick={handleVerifyDomain} disabled={verifying}>
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Verify Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
