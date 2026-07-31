# School Admin Console API

PHP/MySQL backend for the Silver Hills Global school-tenant modules.  
Upload the contents of this `backend/` folder to:

`/home/u455934768/domains/macadz.com/public_html/spi`

**Base URL:** `https://spi.macadz.com`

---

## Deploy checklist

1. Upload **all** files in this folder to the `spi` document root (FTP / File Manager).  
   Do **not** skip root PHP files — the live server previously 404’d because these were missing:
   - `health.php`
   - `index.php`
   - `config.php` (or rely on `config.example.php` fallback)
   - `cors.php`
2. In phpMyAdmin, select database `u455934768_spi` and import [`schema.sql`](schema.sql) (already done if tables exist).
3. Confirm Document Root for subdomain `spi.macadz.com` points at `/public_html/spi`.
4. Hit health check: `GET https://spi.macadz.com/health.php` — expect JSON `database: "ok"`.
5. Log in: `POST https://spi.macadz.com/api/auth/login.php`

### Quick re-upload (missing files only)

If the File Manager already has `api/`, `lib/`, `cors.php` but health still 404s, upload these into `/public_html/spi/`:

- `health.php`
- `index.php`
- `config.php`
- `README.md` (optional)

### Seed credentials

| Field | Value |
|-------|--------|
| Email | `silverhills@tenant.com` |
| Password | `school2026` |
| Tenant | Silver Hills Global (`silverhills`) |

Rotate the JWT `secret` in `config.php` after first deploy.

---

## Auth

All tenant endpoints (except login, health, parent profile) require:

```http
Authorization: Bearer <jwt>
```

Login response:

```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "session": {
      "role": "school_admin",
      "email": "silverhills@tenant.com",
      "displayName": "Silver Hills Admin",
      "tenantName": "Silver Hills Global",
      "tenantId": "T-1042",
      "userId": "USR-ADMIN",
      "permissions": ["*"]
    }
  }
}
```

Every DB query is scoped with `tenant_id` from the JWT.

---

## Response envelope

Success:

```json
{ "success": true, "data": { ... } }
```

Error:

```json
{ "success": false, "error": "message" }
```

JSON field names match the React `tenant-store` types (camelCase: `cls`, `due`, `payerType`, `payeeType`, etc.).

---

## Endpoint map

### System

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health.php` | No | PHP + DB check |

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login.php` | No | `{ email, password }` → token + session |
| GET | `/api/auth/me.php` | Yes | Current session |

### Dashboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dashboard/summary.php` | Yes | Aggregates: students, staff, income, expenses, cash, outstanding, todos |
| GET/PUT | `/api/dashboard/todos.php` | Yes | Read/update `dashboardTodos` + `dashboardNote` |

### Students

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/students/list.php` | Yes | Directory (`?deleted=1` recycle bin) |
| GET | `/api/students/get.php?id=STU-001` | Yes | One student |
| POST | `/api/students/create.php` | Yes | Admit / create |
| PUT | `/api/students/update.php` | Yes | Update (`id` in body) |
| POST | `/api/students/delete.php` | Yes | Soft delete; `restore:true` / `hard:true` |

### Staff

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/staff/list.php` | Yes | Roster + attendance / salary / status |
| GET | `/api/staff/get.php?id=STF-001` | Yes | One staff |
| POST | `/api/staff/create.php` | Yes | Create |
| PUT | `/api/staff/update.php` | Yes | Update (+ optional `attendanceByMonth`) |
| POST | `/api/staff/delete.php` | Yes | Soft delete / restore / hard |

### Finance

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST/PUT/DELETE | `/api/finance/payments.php` | Yes | Fee receipts (income). `GET ?id=` or `?academicYear=` |
| GET/POST/PUT/DELETE | `/api/finance/disbursements.php` | Yes | Made payments (Salary / Vendor) |
| GET/POST/PUT/DELETE | `/api/finance/obligations.php` | Yes | Pending AP |
| GET | `/api/finance/reports.php` | Yes | P&L totals, daybook, ledger, AP |

### Settings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/PUT | `/api/settings/school.php` | Yes | `schoolDetails`, `themeSettings`, academic years |
| GET/POST/PUT/DELETE | `/api/settings/classes.php` | Yes | Class / fee tiers |
| GET/POST/PUT/DELETE | `/api/settings/departments.php` | Yes | Departments |
| GET/POST/PUT/DELETE | `/api/settings/roles.php` | Yes | Org roles |
| GET/POST/PUT/DELETE | `/api/settings/users.php` | Yes | Tenant users (passwords hashed) |
| GET/POST/PUT/DELETE | `/api/settings/fees.php` | Yes | Fee terms; `?resource=categories` for payment categories |
| GET/POST/PUT/DELETE | `/api/settings/transport.php` | Yes | Routes; `?type=vehicles` for fleet |

### Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/notifications/list.php` | Yes | `?unread=1` optional |
| POST | `/api/notifications/create.php` | Yes | Create alert |
| POST | `/api/notifications/mark-read.php` | Yes | `{ id }` or `{ all: true }` |

### Parent (public)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/parent/student.php?token=shr-…` | No | Parent share-link profile |

---

## Frontend wiring (next phase)

Point your React API client at:

```ts
const API_BASE = "https://spi.macadz.com";
```

Example login:

```ts
const res = await fetch(`${API_BASE}/api/auth/login.php`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "silverhills@tenant.com",
    password: "school2026",
  }),
});
const { data } = await res.json();
localStorage.setItem("spi_token", data.token);
```

Authenticated call:

```ts
fetch(`${API_BASE}/api/students/list.php`, {
  headers: { Authorization: `Bearer ${token}` },
});
```

CORS already allows `http://localhost:8080` and `http://localhost:8081`.

---

## Folder layout

```
backend/
  schema.sql
  config.php / config.example.php
  cors.php
  health.php
  .htaccess
  lib/          # db, auth (JWT), response, mappers, tenant helpers
  api/          # module endpoints
  uploads/      # logo / document files (URL paths, not data URLs)
```

---

## Multi-tenant model

- Single database, shared tables.
- `tenants` holds school identity; seed row = Silver Hills Global (`id=1`).
- Every scoped table has `tenant_id`; APIs never accept a client-supplied tenant id — it comes only from the JWT.
