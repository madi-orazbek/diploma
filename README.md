# Development of a Web Platform for Matching Student Freelance Projects Using Machine Learning and an AI Assistant

## Project Overview
UniWork Diploma is a full-stack multi-role platform for matching students with freelance projects. It includes student, client, and admin workflows, recommendation integration, assistant module, analytics dashboards, and MongoDB-backed APIs.

## Features
- Public pages: Home, About, Projects catalog, Project details
- Auth: Sign up / Sign in with role selection, refresh token flow, logout, profile endpoint
- Student area: dashboard, profile editor (real CRUD), recommendations, applications (withdraw), messaging
- Client area: dashboard, create project, manage projects (update status/delete), applicants (accept/reject)
- Admin area: dashboard, users, projects moderation, analytics
- Recommendation API with external ML service + fallback engine
- AI Assistant widget with `/api/assistant`
- Role-based route protection via middleware
- Centralized API response/error format

## Tech Stack
- Next.js 14 App Router + TypeScript
- Tailwind CSS
- MongoDB + Mongoose
- JWT access/refresh authentication
- Zod validation
- Recharts analytics
- Lucide-react icons

## Architecture Overview
- `app/` UI routes and API routes
- `components/` reusable UI and dashboard widgets
- `lib/` db connection, auth, recommendation, assistant services, API response helpers
- `models/` domain entities (User, Project, Application, etc.)
- `prisma/seed.ts` seed script for demo data
- `types/` shared TS types

## Environment Variables
Copy `.env.example` to `.env` and set:
- `MONGODB_URI`
- `JWT_SECRET`
- `PYTHON_RECOMMENDER_URL` (optional)
- `NEXT_PUBLIC_APP_URL`

## Setup Instructions
```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

## Run Commands
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run seed`

## Database Setup
The app uses MongoDB. If you run with Docker, do not use `localhost` from inside the app container; use the Mongo service name (for example `mongodb+srv://danel:0000@cluster0.iocfhez.mongodb.net/Diploma?appName=Cluster0`).

## API Endpoints
### Authentication
- `POST /api/auth/signup`
- `POST /api/auth/signin`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Projects
- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `GET /api/projects/:id/applications`

### Applications
- `GET /api/applications`
- `POST /api/applications`
- `PATCH /api/applications/:id` (`WITHDRAW`, `ACCEPT`, `REJECT`)

### Student
- `GET /api/student/profile`
- `PUT /api/student/profile`

### AI/ML and Admin
- `POST /api/recommend`
- `POST /api/assistant`
- `GET /api/admin/stats`
- `GET /api/test-db`

### DB Health Check
Use this endpoint to verify database connectivity:
- `GET /api/test-db`

It returns connection state, db name, and host.

## Recommendation API Integration
`/api/recommend` behavior:
1. If `PYTHON_RECOMMENDER_URL` exists and responds -> source is `ML API`.
2. Otherwise -> internal fallback similarity engine ranks projects.

Dev UI label displays recommendation source.

## Demo Credentials
All demo users use password: `password123`
- Admin: `admin@uniwork.demo`
- Student: `student1@uniwork.demo`
- Client: `client1@uniwork.demo`

## Future Improvements
- Add websocket real-time chat
- Add moderation logs, notifications, favorites, and payment gateway integration
- Add unit/integration/E2E tests and CI/CD pipeline
- Add advanced recommendation features with feature store and experiment tracking


## Runtime 500 troubleshooting
If `/api/auth/signup` and `/api/projects` both return `500`, check Mongo runtime config first.

1. Verify `/api/test-db` response.
2. Ensure `MONGODB_URI` is set in the runtime container environment (not only build-time).
3. For Atlas, use:
   `mongodb+srv://danel:0000@cluster0.iocfhez.mongodb.net/Diploma?appName=Cluster0`
4. If using Docker + local Mongo, do not use `localhost`; use service name (for example `mongo`).

## Product language policy
- All user-facing UI copy must remain **English-only**.
- New pages/components should keep labels, placeholders, statuses, errors, and empty states in English.

## Architecture docs
- See `docs/ARCHITECTURE.md` for platform architecture, RBAC, recommendation strategy, and AI assistant integration approach.
- See `prisma/schema.prisma` for migration-ready PostgreSQL relational schema.
