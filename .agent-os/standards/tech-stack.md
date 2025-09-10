# Tech Stack

## Context

Global tech stack defaults for Agent OS projects, overridable in project-specific `.agent-os/product/tech-stack.md`.

- App Framework: Express.js (Node.js)
- Language: TypeScript 5.0+
- Primary Database: PostgreSQL 17+
- ORM: Prisma
- Frontend Framework: React 18+
- Build Tool: Vite
- Import Strategy: Node.js modules
- Package Manager: npm
- Node Version: 22 LTS
- CSS Framework: TailwindCSS 4.0+
- UI Components: Shadcn/ui
- UI Installation: Via npm packages
- UI Fixes: Custom Tailwind plugin for cursor pointer on buttons
- Font Provider: Google Fonts
- Font Loading: Self-hosted for performance
- Icons: Lucide React components
- Application Hosting: Netlify (frontend) + Railway/Render (backend)
- Hosting Region: Primary region based on user base
- Database Hosting: Supabase (PostgreSQL)
- Database Backups: Automated via Supabase
- Asset Storage: Supabase Storage
- CDN: Netlify Edge Network
- Asset Access: Public with optional private buckets
- CI/CD Platform: GitHub Actions
- CI/CD Trigger: Push to main/staging branches
- Testing Framework: Cypress (E2E) + Vitest (Unit)
- Tests: Run before deployment
- Production Environment: main branch
- Staging Environment: staging branch
