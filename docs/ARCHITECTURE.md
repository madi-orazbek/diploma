# UniWork.kz Architecture (Production-Oriented)

## 1) System overview

UniWork.kz is designed as a role-based marketplace platform:

- **Students** discover orders, apply, manage portfolio, and chat with clients.
- **Clients** publish orders, review applications, invite candidates, and manage delivery status.
- **Admins** moderate users/orders and monitor platform analytics.

Current implementation is a Next.js full-stack app with route handlers and MongoDB models.  
This repository now also includes a **Prisma/PostgreSQL schema** for migration-ready architecture.

---

## 2) Architecture layers

### Frontend (Next.js 14 App Router)
- UI pages and components
- role-aware navigation
- auth forms (sign-in/sign-up unified flow)
- dashboards and domain screens
- AI assistant widget (UI + API contract)

### API layer (Next route handlers)
- authentication
- orders and applications
- profile management
- recommendations endpoint
- assistant endpoint

### Domain / service layer
- validation and business rules
- access checks by role
- recommendation scoring abstraction
- assistant response orchestration (mock now, LLM later)

### Persistence layer
- **Current**: MongoDB (Mongoose models in `/models`)
- **Target**: PostgreSQL + Prisma (`prisma/schema.prisma`)

---

## 3) RBAC model

- `STUDENT`: profile, portfolio, applications, recommendations, chat
- `CLIENT`: orders CRUD, applicant management, invitations, chat
- `ADMIN`: moderation, analytics, abuse/suspension controls

RBAC checks should stay in:
1. middleware-level route protection
2. handler/service-level authorization checks

---

## 4) Recommendation architecture (ML-ready)

Use a stable contract:

- Endpoint: `GET /api/recommendations/me`
- Response: ranked order items with `{ orderId, score, explanation }`

### Current implementation strategy
- Rule-based scoring from:
  - skill overlap
  - category affinity
  - budget fit
  - deadline fit
  - verified client boost

### Future ML upgrade path
- keep API contract unchanged
- replace internal scorer with ML adapter:
  - input: student feature vector + candidate order features
  - output: ranked order IDs + scores
- write recommendation events to `RecommendationLog`

---

## 5) AI assistant architecture (LLM-ready)

- Endpoint: `POST /api/assistant`
- Request: `{ message, context, quickAction }`
- Response: `{ text, suggestions, actions }`

### Current mode
- deterministic mock replies in service layer

### Future mode
- add LLM provider adapter (OpenAI/Anthropic/etc.)
- keep response contract and UI unchanged
- persist session/message history (`AIChatSession`, `AIMessage`)

---

## 6) Data model

See full relational model in:

- `prisma/schema.prisma`

This schema includes:
- users/roles/profiles
- orders/tags/applications/invitations
- chat/messages
- notifications/reviews/ratings
- recommendation logs
- AI chat sessions/messages

---

## 7) Deployment and reliability notes

- Use environment-based secrets (`.env`)
- Add request validation on every write endpoint
- Centralize error handling and audit logging
- Introduce background jobs for notifications/recommendation refresh as scale grows

