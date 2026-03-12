# Copilot Instructions for IFF Oportunidades

## Project Overview
**IFF Oportunidades** is a full-stack Next.js 15 application for managing internship cycles and job vacancy publishing at IFF Itaperuna. It digitalizes the internship formalization process with role-based access (Student, Company, Admin).

## Architecture

### Stack
- **Frontend**: React 19 + Next.js 15 (server components/actions)
- **Backend**: Next.js API Routes (same repository)
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS v4
- **Authentication**: JWT tokens (JOSE library) stored in HTTP-only cookies
- **Validation**: Zod schemas for all inputs
- **File Storage**: Local filesystem (`public/uploads/documents/`)

### Data Flow Patterns
1. **Client → API**: FormData (for file uploads) or JSON body
2. **API → Database**: Prisma client (prisma.ts singleton)
3. **Authentication**: Middleware extracts JWT from cookies, validates, and injects `x-user-id`/`x-user-role` headers
4. **File Processing**: Formidable parses multipart forms, files validated (mime type, size), saved with unique names

### Key Directories
- `src/app/api/` - API route handlers (organized by resource: internships, vacancies, documents)
- `src/lib/validations/` - Zod schemas, validation middleware, request utilities
- `src/components/` - React components (AuthGuard for route protection)
- `src/contexts/` - AuthContext (reducer pattern for auth state)
- `prisma/migrations/` - Schema evolution history (14+ migrations)

## Critical Patterns & Conventions

### API Route Structure
Every API route follows this pattern:
```typescript
// 1. Extract user from token (middleware sets headers)
const userPayload = await getUserFromToken(request);
if (!userPayload || userPayload.role !== 'EXPECTED_ROLE') {
  return createErrorResponse('Access denied', 403);
}

// 2. Validate request (FormData or JSON)
const parsed = someSchema.safeParse(data);
if (!parsed.success) return createValidationErrorResponse(parsed.error.flatten());

// 3. Execute business logic with Prisma
const result = await prisma.resource.create({...});

// 4. Return standardized response
return createSuccessResponse(result, 201); // or createErrorResponse()
```

**Exception handling**: Wrap handlers with `withErrorHandling()` middleware (logs errors, returns 500).

### Validation Pattern
- Define Zod schemas in `src/lib/validations/schemas.ts`
- Use `.refine()` for custom validations (e.g., CNPJ/matricula format checks)
- Always validate in the API layer BEFORE database operations
- Return validation errors via `createValidationErrorResponse()`

### File Upload Pattern
- FormData expected from client
- Files validated: MIME type (PDF/JPG/PNG), size (max 10MB)
- Unique filenames: `{internshipId}_{documentType}_{timestamp}.{ext}`
- Stored in `public/uploads/documents/`, served via public URL
- Use `processUploadedFile()` for parsing and validation

### Authentication Flow
1. **Login/Register** → JWT created with `{userId, role}` → stored in `auth_token` cookie (HTTP-only)
2. **Middleware** (`src/middleware.ts`): Validates all `/api/*` (except `/api/auth/`) routes, rejects on invalid token
3. **Protected Routes**: Extract user in handler via `getUserFromToken(request)`
4. **Frontend**: AuthContext (reducer) manages auth state, AuthGuard checks dashboard access

## Domain Model & Enums

### Core Entities
- **User** → Student/Company profile (one-to-one)
- **Internship** → Full lifecycle with detailed fields (address, insurance, supervisor info)
- **JobVacancy** → Job/internship postings with status workflow
- **Document** → Supports 7 types (TCE, PAE, TRE, etc.) with approval workflow

### Critical Enums
- **InternshipStatus**: IN_ANALYSIS → APPROVED → IN_PROGRESS → FINISHED (or CANCELED)
- **InternshipType**: DIRECT (manual form) vs INTEGRATOR (aggregator-provided TCE/PAE)
- **DocumentStatus**: PENDING_ANALYSIS → APPROVED (or REJECTED)
- **VacancyStatus**: PENDING_APPROVAL → APPROVED (or REJECTED/CLOSED_BY_COMPANY/CLOSED_BY_ADMIN)

### Course Enum
All Brazilian courses at IFF Itaperuna (BSI, LIC_QUIMICA, TEC_INFO_INTEGRADO, etc.) - used for eligibility filtering.

## Pending Features (See docs/what-is-pending.md)

### High Priority
1. **Admin Document Validation UI**: Admin must validate uploaded documents (insurance proof, TCE, PAE) within internship detail page
2. **Document Status Workflow**: Reject with reason or approve (generates PDF downloads for student)
3. **Semester Reports**: New form type for internships ≥ 12 months
4. **Final Report + TRE**: Additional form submission with status tracking
5. **Email Notifications**: Notify students/admins on document approval/rejection

### Implementation Notes
- All new document types should follow existing Document model (add new DocumentType enum values)
- Admin rejection flow: requires `rejectionReason` field (already in schema for some entities)
- PDF generation deferred to last phase (currently not implemented)

## Commands & Workflows

### Development
```bash
npm run dev              # Start Next.js dev server (http://localhost:3000)
npm run build            # Build for production
npm run lint             # ESLint check
```

### Database
```bash
npx prisma migrate dev   # Run migrations + regenerate client
npx prisma db seed       # Populate test data (runs prisma/seed.ts)
docker compose up -d     # Start PostgreSQL (uses .env.db)
```

### Environment
Create `.env` with: `DATABASE_URL`, `JWT_SECRET` (generate random string in prod)

## Common Mistakes to Avoid
- **Forgetting Prisma schema updates**: Always update `prisma/schema.prisma` before migration
- **Missing role checks**: Always verify user role matches expected role in API handler
- **Hardcoded paths**: Use `path.join(process.cwd(), ...)` for file operations
- **Unhandled async errors**: Use error middleware or try/catch in handlers
- **Skipping Zod validation**: Even if TypeScript types exist, validate at runtime

## Testing Notes
Jest + React Testing Library configured but minimal tests present. Focus on API route testing (mocking Prisma) and form submission flows.

## References
- Internship process: [docs/orientacoes-estágios.md](../docs/orientacoes-estágios.md)
- Requirements: [docs/rf-rnf-us.md](../docs/rf-rnf-us.md)
- Pending work: [docs/what-is-pending.md](../docs/what-is-pending.md)

## Interaction Protocol & Safety Rails

### Implementation Workflow
Before writing or modifying any code, the agent MUST follow these steps:

1.  **Analysis & Explanation**: Explain what changes are planned, why they are necessary, and how they align with the project's architecture (e.g., how it fits the existing Zod validation or Prisma schema).
2.  **Explicit Approval**: Ask for user approval. **DO NOT** output the code implementation until the user explicitly says "Proceed", "Approved", or "Go ahead".
3.  **Atomic Changes**: After approval, implement changes in a logical, step-by-step manner, ensuring that each step maintains the project's linting and type-safety standards.

### Critical Verification
- For any API change, explicitly state which **Zod Schema** will be used or modified.
- For any Database change, explain the impact on the current **Prisma Migrations**.
- For any UI change, confirm if it respects the **Tailwind CSS v4** styling and **AuthGuard** protection.