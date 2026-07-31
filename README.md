# BizOps — Business Operations Dashboard

A production-grade B2B SaaS platform for managing customers, projects, invoices, tasks, sales
pipeline, and team operations from one dashboard. Built as a portfolio-grade demonstration of
full-stack architecture, not a tutorial project.

**Stack:** Django 6 + DRF · PostgreSQL · React 19 + Vite · TypeScript · Tailwind CSS v4 · JWT Auth · Docker

## Why this exists

Most portfolio SaaS projects stop at "CRUD with auth." This one is built around the decisions that
actually separate a hobby project from something an engineering team would recognize as
production-shaped:

- **Multi-tenancy from day one** — every business object is scoped to an `Organization`, and it's
  enforced at the queryset level, not just the UI. Tested explicitly (see
  `backend/customers/tests.py::test_cannot_access_other_org_customer_detail`).
- **RBAC as composable permission classes**, not `if user.is_admin` scattered through views.
- **A repeatable module pattern.** The Customers module (backend app + frontend feature) is the
  reference implementation every other module (Projects, Invoices, Tasks...) follows exactly —
  same serializer split, same viewset shape, same audit-logging hook, same frontend
  api/list-page/form-modal structure.
- **Audit logging that can't be forgotten** — centralized through one `log_action()` helper called
  from `perform_create/update/destroy`, rather than ad hoc logging per view.

## Project structure

```
bizops-saas/
├── backend/
│   ├── config/settings/{base,dev,prod}.py   # env-driven, split by environment
│   ├── accounts/     # Organization, custom User (RBAC roles), JWT auth endpoints
│   ├── customers/    # reference CRUD module — copy this pattern for new domains
│   ├── audit/        # append-only audit log + middleware-based actor tracking
│   ├── dashboard/     # aggregated KPI + activity-feed endpoints
│   └── common/       # shared base models, pagination, permissions, exception handling
├── frontend/
│   └── src/
│       ├── api/            # axios client with auto token-refresh
│       ├── store/          # zustand auth store
│       ├── components/ui/  # reusable primitives (Button, Input, Modal, Table, KPICard...)
│       ├── components/layout/  # Sidebar, Topbar, AppLayout
│       └── features/       # one folder per domain (auth, customers, dashboard, ...)
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Running locally

### Option A — Docker (one command)
```bash
docker compose up
```
Backend: http://localhost:8000/api/docs/ · Frontend: http://localhost:5173

### Option B — manual
```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # defaults to sqlite if DATABASE_URL is unset
python manage.py migrate
python manage.py runserver

# Frontend (separate terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Testing

```bash
# Backend
cd backend && pytest --cov=.

# Frontend
cd frontend && npm run test
```

CI runs both suites, a Django migration-drift check, and a production frontend build on every
push — see `.github/workflows/ci.yml`.

## API documentation

Interactive Swagger UI at `/api/docs/` (ReDoc at `/api/redoc/`), generated automatically from the
DRF viewsets via drf-spectacular — no hand-maintained API docs to go stale.

## Deployment

- **Backend → Render/Railway**: `render.yaml` provisions a managed Postgres instance and a web
  service; `Dockerfile` works for either platform.
- **Frontend → Vercel**: `vercel.json` handles SPA routing rewrites and security headers.

## Status / roadmap

| Module | Backend | Frontend |
|---|---|---|
| Auth + RBAC | ✅ | ✅ |
| Customers | ✅ | ✅ |
| Dashboard / KPIs | ✅ | ✅ |
| Audit log | ✅ (API) | 🔜 (UI) |
| Projects | 🔜 | 🔜 |
| Invoices | 🔜 | 🔜 |
| Tasks | 🔜 | 🔜 |
| Sales Pipeline | 🔜 | 🔜 |
| Notifications | 🔜 | 🔜 |
| API Integrations | 🔜 | 🔜 |

Each 🔜 module follows the exact pattern established by Customers — a new Django app with
`models.py` (extend `OrganizationScopedModel`), list/detail serializers, a `ModelViewSet` with
`perform_create/update/destroy` audit hooks, plus a matching `features/<module>/` folder on the
frontend (`api.ts`, list page, form modal).
