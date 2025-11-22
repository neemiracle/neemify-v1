'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Lock, Users, Database, Activity, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">NEEMIFY</span>
          </div>
          <Link href="/login">
            <Button>Admin Login</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
          Medical OS API Infrastructure
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Enterprise-grade multi-tenant API platform with cryptographic licensing
          and banking-level security for medical applications
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg">Get Started</Button>
          </Link>
          <Button size="lg" variant="outline">
            Learn More
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Enterprise Features
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Lock className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Cryptographic Licensing</CardTitle>
              <CardDescription>
                AES-256-GCM encryption with HMAC-SHA256 signing for maximum security
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Database className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Multi-Tenant Architecture</CardTitle>
              <CardDescription>
                Hierarchical tenant isolation with complete data segregation
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Dynamic RBAC</CardTitle>
              <CardDescription>
                Flexible role-based access control with custom permissions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Row Level Security</CardTitle>
              <CardDescription>
                Database-enforced isolation with Supabase RLS policies
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Activity className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Complete Audit Trail</CardTitle>
              <CardDescription>
                Every API call logged for compliance and security monitoring
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>High Performance</CardTitle>
              <CardDescription>
                Optimized for medical and financial-grade response times
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
            <div className="text-muted-foreground">Uptime SLA</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">&lt;50ms</div>
            <div className="text-muted-foreground">Avg Response Time</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">256-bit</div>
            <div className="text-muted-foreground">Encryption</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">100%</div>
            <div className="text-muted-foreground">HIPAA Compliant</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2024 NEEMIFY. All rights reserved.</p>
          <p className="text-sm mt-2">
            Enterprise Medical OS API Infrastructure
          </p>
        </div>
      </footer>
    </div>
  )
}
