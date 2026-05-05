# Unity Catalog ERD Viewer

A Databricks App that generates interactive Entity Relationship Diagrams from Unity Catalog PK/FK constraints. Select a catalog and schema, and instantly visualize table relationships with export options.

![ERD Viewer](https://img.shields.io/badge/Databricks-App-FF6F00?style=flat-square)

## Features

- **Interactive ERD diagrams** — zoom, pan, drag tables using React Flow
- **Catalog/schema browser** — cascading dropdowns to navigate Unity Catalog
- **PK/FK visualization** — primary keys (amber), foreign keys (indigo), relationship lines
- **Auto-layout** — dagre-powered left-to-right or top-to-bottom layout
- **Compact mode** — toggle between full column detail and table-name-only view
- **5 export formats** — PNG, SVG, PDF, standalone HTML, DBML (dbdiagram.io compatible)
- **Table detail panel** — click any table to see columns, types, comments, and FK targets
- **Dark theme** — Databricks-inspired color palette

## Prerequisites

- A Databricks workspace with Unity Catalog enabled
- Tables with PK/FK constraints defined (informational constraints)
- A SQL Warehouse (serverless recommended)
- Node.js 18+ (for building the frontend)

## Quick Start

### Step 1: Clone and build

```bash
git clone https://github.com/danny-db/uc-erd-viewer.git
cd uc-erd-viewer

# Build the frontend (outputs to static/)
cd frontend && npm install && npx vite build && cd ..
```

### Step 2: Create and deploy the app

```bash
# Create the app in your workspace
databricks apps create uc-erd-viewer

# Upload source code to workspace
databricks sync . /Users/<your-email>/apps/uc-erd-viewer --watch=false \
  --exclude node_modules --exclude .git --exclude frontend/node_modules --exclude __pycache__

# Deploy the app
databricks apps deploy uc-erd-viewer \
  --source-code-path /Workspace/Users/<your-email>/apps/uc-erd-viewer
```

### Step 3: Set the warehouse ID

In the Databricks workspace UI, go to **Apps** > **uc-erd-viewer** > **Settings** and set:

| Variable | Value |
|----------|-------|
| `DATABRICKS_WAREHOUSE_ID` | Your SQL Warehouse ID (find it in SQL Warehouses > your warehouse > Connection Details) |

### Step 4: Grant permissions to the app service principal

Every Databricks App runs as an automatically-created **service principal (SP)**. You need to grant this SP access to the catalogs you want to visualize.

1. **Find the SP's application ID**: Go to **Apps** > **uc-erd-viewer** > **Overview**. The `service_principal_client_id` is a UUID like `3748b70b-4202-41d1-a9cc-88dab739078f`.

2. **Grant access** by running these SQL statements in a notebook or SQL editor:

```sql
-- Replace <sp-application-id> with the UUID from step 1
-- Replace <catalog_name> with each catalog you want the app to access

-- Allow the SP to see the catalog and its schemas
GRANT USE_CATALOG ON CATALOG <catalog_name> TO `<sp-application-id>`;
GRANT BROWSE ON CATALOG <catalog_name> TO `<sp-application-id>`;

-- Allow the SP to read table/column metadata in specific schemas
GRANT USE_SCHEMA ON SCHEMA <catalog_name>.<schema_name> TO `<sp-application-id>`;
GRANT SELECT ON SCHEMA <catalog_name>.<schema_name> TO `<sp-application-id>`;
```

> **Tip:** To grant access to ALL schemas in a catalog at once:
> ```sql
> GRANT USE_SCHEMA ON CATALOG <catalog_name> TO `<sp-application-id>`;
> GRANT SELECT ON CATALOG <catalog_name> TO `<sp-application-id>`;
> ```

The SP also needs **CAN_USE** permission on the SQL Warehouse. This is typically already granted to the `users` group by default.

### Step 5: Open the app

Your app URL is shown on the Apps page, e.g.:
`https://uc-erd-viewer-<workspace-id>.aws.databricksapps.com`

Select a catalog and schema, click **Generate ERD**, and explore your data model.

## Adding PK/FK Constraints

If your tables don't have constraints yet, add them with:

```sql
-- Primary Key
ALTER TABLE my_catalog.my_schema.customers
ADD CONSTRAINT customers_pk PRIMARY KEY (customer_id);

-- Foreign Key
ALTER TABLE my_catalog.my_schema.orders
ADD CONSTRAINT fk_orders_customer
FOREIGN KEY (customer_id) REFERENCES my_catalog.my_schema.customers(customer_id);
```

> Note: Databricks constraints are **informational only** — they are not enforced but are used for query optimization, documentation, and tools like this one.

## Alternative: Deploy with Databricks Asset Bundles (DABs)

Create a `databricks.yml` in the project root:

```yaml
bundle:
  name: uc-erd-viewer

targets:
  dev:
    workspace:
      host: https://<your-workspace>.cloud.databricks.com

resources:
  apps:
    uc-erd-viewer:
      name: uc-erd-viewer
      source_code_path: .
      config:
        command:
          - uvicorn
          - app:app
          - --host
          - 0.0.0.0
          - --port
          - "8000"
        env:
          - name: DATABRICKS_WAREHOUSE_ID
            value: "<your-warehouse-id>"
```

Then run:

```bash
databricks bundle deploy --target dev
```

## Architecture

```
Backend (FastAPI)                    Frontend (React + React Flow)
+-----------------------+            +----------------------------+
| GET /api/catalogs     |            | Sidebar                    |
| GET /api/schemas      |<---------->|   Catalog/Schema select    |
| GET /api/erd          |            |   Display toggles          |
| POST /api/export/dbml |            |                            |
|                       |            | ERDCanvas                  |
| WorkspaceClient       |            |   TableNode (custom)       |
|   > SQL Warehouse     |            |   dagre auto-layout        |
|     > info_schema     |            |   Export (PNG/SVG/PDF/      |
+-----------------------+            |          HTML/DBML)        |
                                     +----------------------------+
```

- **Backend**: FastAPI queries `information_schema` tables to extract PK/FK metadata
- **Frontend**: React Flow renders interactive node-edge diagrams with dagre auto-layout
- **Auth**: `WorkspaceClient()` auto-authenticates as the Databricks App service principal

## Local Development

```bash
# Backend
pip install -r requirements.txt
DATABRICKS_WAREHOUSE_ID=<wh-id> DATABRICKS_CONFIG_PROFILE=<profile> \
  python -m uvicorn app:app --reload --port 8000

# Frontend (in a separate terminal)
cd frontend
npm install
npx vite dev
```

The Vite dev server proxies `/api` requests to `localhost:8000`.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, Databricks SDK |
| Frontend | React 18, TypeScript, Vite |
| ERD Rendering | React Flow, dagre |
| Export | html-to-image, jsPDF |
| Styling | Tailwind CSS |

## License

MIT
