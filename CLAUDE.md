# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # nodemon src/index.js (runs pending ROOT migrations + seeds on boot)
npm start            # node src/index.js
npm run migrate      # migrate root DB, then every tenant DB listed in root TenantsName
npm run migration:create -- <root|tenant> <name>   # scaffold src/migrations/<type>/<timestamp>.<name>.js
```

There is no test suite, linter, or build step. Environment variables are listed in `.env.sample` (PostgreSQL connection, `TOKEN_SECRET`/`TOKEN_EXPIRY`, `CORS_ORIGIN`, `SALTROUNDS`, `SESSION_SECRET`); `SUPER_ADMIN_EMAIL` is also read at runtime.

## Architecture

Express 5 + Sequelize 6 + PostgreSQL, ES modules. Multi-tenant ERP/WMS (procurement, inventory, production, sales, inter-company trade). `docs/DATABASE_ERD.md` has the full ER diagrams.

### Database-per-tenant

- **Root DB** is always named `mywms`. It holds the tenant registry (`TenantsName`, `Tenant` — one row per user email, mapping it to a tenant DB) and all **cross-company** documents: RFQ → RfqQuotation → BlanketOrder → BpoIndent, `Connection` (buyer/vendor tenant pair), `ProductMapping`, `IntercompanyRequisition`. Models under `src/models/main/` are mostly root models.
- **Tenant DBs** are named `tenant_<email-local-part>` and created at company signup (`src/middlewares/tenantRegister.middleware.js` → `generateDatabase`). They hold everything operational.
- `src/models/index.model.js` decides which models exist in which DB (`defineRootModels` vs `defineTenantModels`); some (`Role`, `Permission`, `User`, `BusinessNodeType`) exist in both. All associations live in `src/models/association.js`, split into root and tenant functions. A model added to a model file is invisible until it is registered in the right `define*Models` function and given associations there.
- Connections come from `src/db/tenantMenager.service.js`: `rootDB()` (singleton) and `getTenantConnection(dbName)` (LRU cache, 100 tenants / 1h TTL).

### Schema changes

Schema is managed **only** by Umzug migrations (`src/migrations/root/` and `src/migrations/tenant/`), never `sequelize.sync()`. A schema change means editing the model definition **and** adding a migration of the matching type (use `npm run migration:create`; follow the existing transaction-wrapped `up`/`down` template). The server auto-migrates only the root DB on boot; tenant DBs are migrated by `npm run migrate`, or at creation for new tenants. Seed data (roles, permissions, business node types, states/districts) lives in `public/dataset.js` and is inserted by `src/helper/seeder.js` only into empty tables.

### Request pipeline

Middleware order matters and is attached inconsistently, so check before adding routes:

1. `defineUserScope` — if the `x-tenant-id` header is missing, resolves the tenant from `req.body.email` via the root `Tenant` table (used at login). `SUPER_ADMIN_EMAIL` maps to the root DB.
2. `defineDbObject` — sets `req.dbObject` (Sequelize instance) and `req.dbModels` for the tenant in `x-tenant-id` (`mywms` → root).
3. `verifyJWT` — validates the token *and* requires it to equal the `accessToken` stored on the user (single active session). Sets `req.user`, `req.isAdmin`, `req.role`, and `req.activeNode` (only when the user belongs to exactly one business node, otherwise `null`).
4. `verifyPermission("<resource>:<action>")` — permission strings come from `public/dataset.js`. Owners, `req.isAdmin`, and any role with `is_default: true` bypass the check.

`src/routes/index.route.js` mounts a set of routers **before** its global `router.use(defineUserScope, defineDbObject)`; those routers attach the scope/DB middleware themselves. Multipart routes must run multer (`upload` / `uploadMemory` from `multer.middleware.js`) *before* `defineUserScope`, because the email/body isn't parsed until then. Uploaded files go to `public/user/<tenant>/` and are served at `/assets`.

### Controller conventions

- Handlers are `asyncHandler`-wrapped, use models from `req.dbModels`, and return `{ success, code, message, data?, meta? }`; list endpoints paginate with `page`/`limit` query params and return `meta: { totalItems, totalPages, currentPage, limit }`.
- Writes use a transaction from `req.dbObject.transaction()`, with explicit `rollback()` before every early return.
- Root-DB data is reached from tenant-scoped controllers by calling `rootDB()` directly, not through `req.dbModels`. `src/controllers/central/` holds the controllers whose primary data is in the root DB.
- `getUserContext(req)` (`src/utils/getUserContext.js`) returns the user with roles, permissions, active node, and assigned store.
- Document numbers come from `generateNo` / `generateBatch` in `src/helper/generate.js`.

### Business structure inside a tenant

A tenant is organised as a tree of `BusinessNode`s (warehouses, manufacturing units, partners; typed by `BusinessNodeType` codes like `L-102`, ordered per tenant by `TenantBusinessFlow`). Users are linked to nodes via `NodeUser` (with `isNodeAdmin`, `department`, `store_id`). Stores are `ManufacturingUnit` rows (rm / fg / production). Stock is tracked in `Batch` records and movements in `NodeStockLedger` / `NodeStockLedgerItem`.

### Cross-tenant flows

When one company sells to another, a single request writes to **several databases**. For example, creating an outward in the seller tenant (`outward.controller.js`) calls `src/services/createGrn.service.js` / `createInvoice.service.js`, which open the buyer tenant via `getTenantConnection(connection.buyer_tenant)` and create a GRN there. `updateOutwardFromInward.service.js` goes the other way. Each DB has its own transaction and there is no distributed commit, so commit order matters when changing these flows. Product IDs are translated between tenants through the root `ProductMapping`, keyed by `connection_id`.

### Other pieces

- `src/download/` — PDF (EJS templates in `src/download/templates/` rendered via Puppeteer, `src/utils/pdf.service.js`) and Excel (exceljs) exports, mounted at `/api/download`.
- `src/jobs/` — node-cron jobs started after the server listens (currently RFQ expiry, daily at midnight, logging to `./cron.log`).
