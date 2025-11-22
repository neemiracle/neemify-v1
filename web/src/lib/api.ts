import axios, { AxiosInstance, AxiosError } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      const token = this.getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.clearToken()
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }

  public setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    }
  }

  public clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
    }
  }

  // ========== Auth endpoints ==========
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password })
    return response.data
  }

  async signup(data: {
    email: string
    password: string
    fullName: string
    companyName?: string
    createNewCompany?: boolean
  }) {
    const response = await this.client.post('/auth/signup', data)
    return response.data
  }

  // ========== Tenant endpoints ==========
  async getTenants() {
    const response = await this.client.get('/tenants')
    return response.data
  }

  async getTenant(id: string) {
    const response = await this.client.get(`/tenants/${id}`)
    return response.data
  }

  async createTenant(data: {
    name: string
    subdomain?: string
    settings?: any
  }) {
    const response = await this.client.post('/tenants', data)
    return response.data
  }

  async updateTenant(id: string, data: any) {
    const response = await this.client.patch(`/tenants/${id}`, data)
    return response.data
  }

  async deleteTenant(id: string) {
    const response = await this.client.delete(`/tenants/${id}`)
    return response.data
  }

  async getTenantStats(id: string) {
    const response = await this.client.get(`/tenants/${id}/stats`)
    return response.data
  }

  // ========== Dashboard Stats ==========
  async getDashboardStats() {
    const response = await this.client.get('/dashboard/stats')
    return response.data
  }

  // ========== Health check ==========
  async healthCheck() {
    const response = await this.client.get('/health')
    return response.data
  }

  // ========== Company endpoints ==========
  async getCompanies() {
    const response = await this.client.get('/companies')
    return response.data
  }

  async getCompany(id: string) {
    const response = await this.client.get(`/companies/${id}`)
    return response.data
  }

  async createCompany(data: {
    name: string
    domain: string
    features?: any
    expiresInDays?: number
  }) {
    const response = await this.client.post('/companies', data)
    return response.data
  }

  async updateCompany(id: string, data: any) {
    const response = await this.client.patch(`/companies/${id}`, data)
    return response.data
  }

  async getCompanyVerificationInfo(id: string) {
    const response = await this.client.get(`/companies/${id}/verification-info`)
    return response.data
  }

  async verifyCompanyDomain(id: string) {
    const response = await this.client.post(`/companies/${id}/verify-domain`)
    return response.data
  }

  async blockCompany(id: string, reason: string) {
    const response = await this.client.post(`/companies/${id}/block`, { reason })
    return response.data
  }

  async unblockCompany(id: string) {
    const response = await this.client.post(`/companies/${id}/unblock`)
    return response.data
  }

  async deleteCompany(id: string) {
    const response = await this.client.delete(`/companies/${id}`)
    return response.data
  }

  async getCompanyStats(id: string) {
    const response = await this.client.get(`/companies/${id}/stats`)
    return response.data
  }

  async getCompanyUsers(id: string) {
    const response = await this.client.get(`/companies/${id}/users`)
    return response.data
  }

  // ========== User endpoints ==========
  async getUsers(params?: { companyId?: string; tenantId?: string }) {
    const response = await this.client.get('/users', { params })
    return response.data
  }

  async getUser(id: string) {
    const response = await this.client.get(`/users/${id}`)
    return response.data
  }

  async createUser(data: {
    email: string
    password: string
    fullName: string
    tenantId?: string
    isOrgAdmin?: boolean
  }) {
    const response = await this.client.post('/users', data)
    return response.data
  }

  async updateUser(id: string, data: any) {
    const response = await this.client.patch(`/users/${id}`, data)
    return response.data
  }

  async deleteUser(id: string) {
    const response = await this.client.delete(`/users/${id}`)
    return response.data
  }

  async getUserRoles(id: string) {
    const response = await this.client.get(`/users/${id}/roles`)
    return response.data
  }

  async assignRole(userId: string, roleId: string) {
    const response = await this.client.post(`/users/${userId}/roles`, { roleId })
    return response.data
  }

  async removeRole(userId: string, roleId: string) {
    const response = await this.client.delete(`/users/${userId}/roles/${roleId}`)
    return response.data
  }

  // ========== License endpoints ==========
  async getLicenses() {
    const response = await this.client.get('/licenses')
    return response.data
  }

  async getLicense(id: string) {
    const response = await this.client.get(`/licenses/${id}`)
    return response.data
  }

  async createLicense(data: {
    companyId: string
    companyName: string
    features: string[]
    expiresInDays?: number
  }) {
    const response = await this.client.post('/licenses', data)
    return response.data
  }

  async revokeLicense(id: string) {
    const response = await this.client.post(`/licenses/${id}/revoke`)
    return response.data
  }

  async suspendLicense(id: string) {
    const response = await this.client.post(`/licenses/${id}/suspend`)
    return response.data
  }

  async reactivateLicense(id: string) {
    const response = await this.client.post(`/licenses/${id}/reactivate`)
    return response.data
  }

  async validateLicense(id: string) {
    const response = await this.client.post(`/licenses/${id}/validate`)
    return response.data
  }

  // ========== API Usage endpoints ==========
  async getApiUsage(params?: {
    startDate?: string
    endDate?: string
    companyId?: string
    tenantId?: string
    limit?: number
  }) {
    const response = await this.client.get('/api-usage', { params })
    return response.data
  }

  async getApiUsageStats(params?: {
    companyId?: string
    tenantId?: string
  }) {
    const response = await this.client.get('/api-usage/stats', { params })
    return response.data
  }

  async getApiUsageByEndpoint() {
    const response = await this.client.get('/api-usage/by-endpoint')
    return response.data
  }

  // ========== Audit Log endpoints ==========
  async getAuditLogs(params?: {
    startDate?: string
    endDate?: string
    companyId?: string
    tenantId?: string
    userId?: string
    action?: string
    limit?: number
  }) {
    const response = await this.client.get('/audit-logs', { params })
    return response.data
  }

  async getAuditLog(id: string) {
    const response = await this.client.get(`/audit-logs/${id}`)
    return response.data
  }

  async getAuditLogsByUser(userId: string, limit?: number) {
    const response = await this.client.get(`/audit-logs/by-user/${userId}`, {
      params: { limit }
    })
    return response.data
  }

  async getAuditLogsByCompany(companyId: string, limit?: number) {
    const response = await this.client.get(`/audit-logs/by-company/${companyId}`, {
      params: { limit }
    })
    return response.data
  }

  async getAuditLogsByAction(action: string, limit?: number) {
    const response = await this.client.get(`/audit-logs/by-action/${action}`, {
      params: { limit }
    })
    return response.data
  }

  // ========== Dashboard endpoints ==========
  async getRecentActivity(limit?: number) {
    const response = await this.client.get('/dashboard/recent-activity', {
      params: { limit }
    })
    return response.data
  }
}

export const api = new ApiClient()
