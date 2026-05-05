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

### Adding PK/FK Constraints

If your tables don't have constraints yet:

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

## Deploy to Databricks

### Option 1: Deploy from Git (Recommended)

1. Fork or clone this repo to your own GitHub account

2. In your Databricks workspace, go to **Apps** > **Create App**

3. Set the app name (e.g., `uc-erd-viewer`) and select **Deploy from Git repository**

4. Connect your GitHub repo and select the `main` branch

5. Set the environment variable in the app configuration:
   - `DATABRICKS_WAREHOUSE_ID` — your SQL Warehouse ID

6. Click **Deploy**

### Option 2: Deploy via CLI

```bash
# Clone the repo
git clone https://github.com/danny-db/uc-erd-viewer.git
cd uc-erd-viewer

# Create the app
databricks apps create uc-erd-viewer

# Upload source to workspace
databricks sync . /Users/<your-email>/apps/uc-erd-viewer --watch=false \
  --exclude node_modules --exclude .git --exclude frontend/node_modules --exclude __pycache__

# Deploy
databricks apps deploy uc-erd-viewer \
  --source-code-path /Workspace/Users/<your-email>/apps/uc-erd-viewer
```

Then set the `DATABRICKS_WAREHOUSE_ID` environment variable in the app settings.

### Option 3: Deploy with Databricks Asset Bundles (DABs)

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

## Permissions

The app runs as a **service principal** that is automatically created by Databricks Apps. You need to grant this SP access to the catalogs and schemas you want to visualize:

```sql
-- Find your app's SP application ID in the app settings page, then:
GRANT USE_CATALOG ON CATALOG <catalog_name> TO `<sp-application-id>`;
GRANT USE_SCHEMA ON SCHEMA <catalog_name>.<schema_name> TO `<sp-application-id>`;
GRANT SELECT ON SCHEMA <catalog_name>.<schema_name> TO `<sp-application-id>`;
GRANT BROWSE ON CATALOG <catalog_name> TO `<sp-application-id>`;
```

The SP also needs **CAN_USE** permission on the SQL Warehouse, which is typically granted by default to the `users` group.

## Architecture

```
Backend (FastAPI)                    Frontend (React + React Flow)
┌─────────────────────┐              ┌──────────────────────────┐
│ GET /api/catalogs   │              │ Sidebar                  │
│ GET /api/schemas    │◄────────────►│   Catalog/Schema select  │
│ GET /api/erd        │              │   Display toggles        │
│ POST /api/export/   │              │                          │
│      dbml           │              │ ERDCanvas                │
│                     │              │   TableNode (custom)     │
│ WorkspaceClient     │              │   dagre auto-layout      │
│   └─ SQL Warehouse  │              │   Export (PNG/SVG/PDF/   │
│      └─ info_schema │              │          HTML/DBML)      │
└─────────────────────┘              └──────────────────────────┘
```

- **Backend**: FastAPI queries `information_schema` tables (`table_constraints`, `key_column_usage`, `referential_constraints`, `constraint_column_usage`) to extract PK/FK metadata
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

## Rebuilding the Frontend

If you modify the frontend code:

```bash
cd frontend
npm install    # first time only
npx vite build # outputs to ../static/
```

The built frontend is served by FastAPI from the `static/` directory.

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
