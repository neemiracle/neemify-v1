/**
 * Generate architecture diagrams for documentation
 * This script creates PlantUML diagrams for the NEEMIFY architecture
 */

const fs = require('fs');
const path = require('path');

const diagramsDir = path.join(__dirname, '..', 'docs', 'diagrams');

// Create diagrams directory if it doesn't exist
if (!fs.existsSync(diagramsDir)) {
  fs.mkdirSync(diagramsDir, { recursive: true });
}

// Entity Relationship Diagram
const erDiagram = `@startuml neemify-er-diagram
!theme plain

entity "Company" as company {
  * id : UUID <<PK>>
  --
  * name : VARCHAR
  * domain : VARCHAR <<UK>>
  * license_key : TEXT <<UK>>
  * license_status : VARCHAR
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}

entity "Tenant" as tenant {
  * id : UUID <<PK>>
  --
  * parent_company_id : UUID <<FK>>
  * name : VARCHAR
  subdomain : VARCHAR
  settings : JSONB
  is_active : BOOLEAN
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}

entity "User" as user {
  * id : UUID <<PK>>
  --
  * email : VARCHAR <<UK>>
  * full_name : VARCHAR
  * password_hash : TEXT
  * company_id : UUID <<FK>>
  tenant_id : UUID <<FK>>
  is_super_user : BOOLEAN
  is_org_admin : BOOLEAN
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
  last_login : TIMESTAMP
}

entity "License" as license {
  * id : UUID <<PK>>
  --
  * company_id : UUID <<FK>>
  * license_key : TEXT <<UK>>
  * status : VARCHAR
  * features : JSONB
  * signature : TEXT
  issued_at : TIMESTAMP
  expires_at : TIMESTAMP
  revoked_at : TIMESTAMP
}

entity "Role" as role {
  * id : UUID <<PK>>
  --
  * company_id : UUID <<FK>>
  * name : VARCHAR
  description : TEXT
  created_at : TIMESTAMP
  updated_at : TIMESTAMP
}

entity "Permission" as permission {
  * id : UUID <<PK>>
  --
  * name : VARCHAR <<UK>>
  * resource : VARCHAR
  * action : VARCHAR
  description : TEXT
  created_at : TIMESTAMP
}

entity "UserRole" as user_role {
  * user_id : UUID <<FK>>
  * role_id : UUID <<FK>>
  --
  assigned_at : TIMESTAMP
  assigned_by : UUID <<FK>>
}

entity "RolePermission" as role_permission {
  * role_id : UUID <<FK>>
  * permission_id : UUID <<FK>>
}

entity "AuditLog" as audit {
  * id : UUID <<PK>>
  --
  user_id : UUID <<FK>>
  * company_id : UUID <<FK>>
  tenant_id : UUID <<FK>>
  * action : VARCHAR
  * resource : VARCHAR
  resource_id : UUID
  changes : JSONB
  ip_address : INET
  user_agent : TEXT
  timestamp : TIMESTAMP
}

entity "ApiUsage" as api_usage {
  * id : UUID <<PK>>
  --
  * company_id : UUID <<FK>>
  tenant_id : UUID <<FK>>
  * user_id : UUID <<FK>>
  * endpoint : VARCHAR
  * method : VARCHAR
  * response_status : INTEGER
  * response_time_ms : INTEGER
  timestamp : TIMESTAMP
}

company ||--o{ tenant : "has many"
company ||--o{ user : "has many"
company ||--|| license : "has one"
company ||--o{ role : "has many"
tenant ||--o{ user : "has many"

user }o--o{ role : "has many"
role }o--o{ permission : "has many"

user ||--o{ user_role : "assigned to"
role ||--o{ user_role : "contains"
role ||--o{ role_permission : "contains"
permission ||--o{ role_permission : "granted by"

company ||--o{ audit : "tracks"
company ||--o{ api_usage : "tracks"

@enduml
`;

// Sequence Diagram - Authentication Flow
const authSequence = `@startuml neemify-auth-flow
!theme plain

actor User
participant "API Gateway" as API
participant "Auth Service" as Auth
participant "License Service" as License
participant "RBAC Service" as RBAC
database "Supabase" as DB

User -> API: POST /api/auth/login\\n{email, password}
activate API

API -> Auth: login(email, password)
activate Auth

Auth -> DB: Query user by email
activate DB
DB --> Auth: User record
deactivate DB

Auth -> Auth: Verify password\\n(bcrypt compare)

Auth -> RBAC: Get user permissions
activate RBAC
RBAC -> DB: Query roles & permissions
activate DB
DB --> RBAC: Permissions list
deactivate DB
RBAC --> Auth: Permissions
deactivate RBAC

Auth -> DB: Get company
activate DB
DB --> Auth: Company record
deactivate DB

Auth -> License: Validate license
activate License
License -> License: Decrypt & verify signature
License -> License: Check expiration
License -> DB: Check license status
activate DB
DB --> License: License record
deactivate DB
License --> Auth: License valid
deactivate License

Auth -> Auth: Generate JWT token
Auth --> API: {token, user}
deactivate Auth

API --> User: 200 OK\\n{token, user}
deactivate API

@enduml
`;

// Sequence Diagram - Signup Flow
const signupSequence = `@startuml neemify-signup-flow
!theme plain

actor User
participant "API Gateway" as API
participant "Company Service" as Company
participant "Auth Service" as Auth
participant "License Service" as License
participant "RBAC Service" as RBAC
database "Supabase" as DB

User -> API: POST /api/auth/signup\\n{email, password, fullName}
activate API

API -> Company: Validate domain(email)
activate Company

Company -> DB: Query company by domain
activate DB
DB --> Company: Existing company or null
deactivate DB

alt Domain exists
    Company --> API: {exists: true, company}
    API --> User: Domain exists\\nRequest access or create new?
    User -> API: Create new company
end

Company -> Company: Extract domain from email

Company -> License: Generate license
activate License
License -> License: Create encrypted payload
License -> License: Sign with HMAC
License -> DB: Store license
activate DB
DB --> License: License stored
deactivate DB
License --> Company: License key
deactivate License

Company -> DB: Create company record
activate DB
DB --> Company: Company created
deactivate DB

Company --> API: {company, licenseKey}
deactivate Company

API -> Auth: Register user as org admin
activate Auth
Auth -> Auth: Hash password (bcrypt)
Auth -> DB: Create user
activate DB
DB --> Auth: User created
deactivate DB
Auth --> API: {userId}
deactivate Auth

API -> RBAC: Create default roles
activate RBAC
RBAC -> DB: Insert Admin, Operator, Viewer roles
activate DB
DB --> RBAC: Roles created
deactivate DB
RBAC --> API: Roles created
deactivate RBAC

API --> User: 201 Created\\n{userId, companyId, licenseKey}
deactivate API

@enduml
`;

// Component Diagram
const componentDiagram = `@startuml neemify-components
!theme plain

package "API Gateway Layer" {
  [Rate Limiter]
  [Auth Middleware]
  [Audit Logger]
  [CORS & Security Headers]
}

package "Application Services" {
  [Authentication Service]
  [License Service]
  [Company Service]
  [Tenant Service]
  [RBAC Service]
  [User Service]
}

package "Data Layer" {
  database "Supabase PostgreSQL" {
    [Companies Table]
    [Tenants Table]
    [Users Table]
    [Licenses Table]
    [Roles Table]
    [Permissions Table]
    [Audit Logs Table]
    [API Usage Table]
  }
  [Row Level Security]
}

package "External" {
  [Client Applications]
}

[Client Applications] --> [CORS & Security Headers]
[CORS & Security Headers] --> [Rate Limiter]
[Rate Limiter] --> [Auth Middleware]
[Auth Middleware] --> [Audit Logger]

[Audit Logger] --> [Authentication Service]
[Audit Logger] --> [Company Service]
[Audit Logger] --> [Tenant Service]

[Authentication Service] --> [RBAC Service]
[Authentication Service] --> [License Service]
[Company Service] --> [License Service]

[Authentication Service] --> [Users Table]
[Company Service] --> [Companies Table]
[Tenant Service] --> [Tenants Table]
[License Service] --> [Licenses Table]
[RBAC Service] --> [Roles Table]
[RBAC Service] --> [Permissions Table]

[Audit Logger] --> [Audit Logs Table]
[Audit Logger] --> [API Usage Table]

[Row Level Security] -up-> [Companies Table]
[Row Level Security] -up-> [Tenants Table]
[Row Level Security] -up-> [Users Table]

@enduml
`;

// Write diagram files
fs.writeFileSync(path.join(diagramsDir, 'er-diagram.puml'), erDiagram);
fs.writeFileSync(path.join(diagramsDir, 'auth-sequence.puml'), authSequence);
fs.writeFileSync(path.join(diagramsDir, 'signup-sequence.puml'), signupSequence);
fs.writeFileSync(path.join(diagramsDir, 'component-diagram.puml'), componentDiagram);

console.log('✓ Architecture diagrams generated in docs/diagrams/');
console.log('');
console.log('PlantUML files created:');
console.log('  - er-diagram.puml (Entity Relationship)');
console.log('  - auth-sequence.puml (Authentication Flow)');
console.log('  - signup-sequence.puml (Signup Flow)');
console.log('  - component-diagram.puml (System Components)');
console.log('');
console.log('To render these diagrams:');
console.log('  1. Install PlantUML: https://plantuml.com/download');
console.log('  2. Run: plantuml docs/diagrams/*.puml');
console.log('  Or use online renderer: http://www.plantuml.com/plantuml/');
