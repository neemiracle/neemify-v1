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

  // Auth endpoints
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

  // Tenant endpoints
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

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health')
    return response.data
  }
}

export const api = new ApiClient()
