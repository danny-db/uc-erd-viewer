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
- [Databricks CLI](https://docs.databricks.com/dev-tools/cli/install.html) installed and configured

## Deploy to Databricks

### Step 1: Clone and configure

```bash
git clone https://github.com/danny-db/uc-erd-viewer.git
cd uc-erd-viewer
```

### Step 2: Configure your warehouse ID

Edit `app.yaml` and replace `REPLACE_WITH_YOUR_WAREHOUSE_ID` with your SQL Warehouse ID:

```yaml
env:
  - name: DATABRICKS_WAREHOUSE_ID
    value: "your-actual-warehouse-id-here"
```

You can find your warehouse ID in the Databricks UI under **SQL Warehouses** > select your warehouse > **Connection details**.

### Step 3: Create the app

```bash
databricks apps create uc-erd-viewer --no-wait
```

Wait for the app compute to start (takes ~1 minute):

```bash
# Check status until state is ACTIVE
databricks apps get uc-erd-viewer | grep state
```

### Step 4: Upload and deploy

```bash
# Upload source code to workspace
databricks sync . /Users/<your-email>/apps/uc-erd-viewer --watch=false \
  --exclude node_modules --exclude .git --exclude frontend/node_modules --exclude __pycache__

# Deploy the app
databricks apps deploy uc-erd-viewer \
  --source-code-path /Workspace/Users/<your-email>/apps/uc-erd-viewer
```

Replace `<your-email>` with your Databricks login email (e.g., `jane.smith@company.com`).

Wait for the deployment to complete:

```bash
# Check until state is SUCCEEDED
databricks apps get uc-erd-viewer | grep -A2 active_deployment
```

### Step 5: Grant permissions to the app's service principal

Every Databricks App automatically gets its own **service principal (SP)**. You must grant this SP access to any catalog/schema you want to visualize.

**Find the SP's application ID:**

```bash
databricks apps get uc-erd-viewer | grep service_principal_client_id
```

This returns a UUID like `3748b70b-4202-41d1-a9cc-88dab739078f`. Copy it.

**Grant access** by running these SQL statements in a SQL editor or notebook:

```sql
-- Replace <sp-app-id> with the UUID from above
-- Replace <catalog> with each catalog you want the app to access

-- Required: catalog-level access
GRANT USE_CATALOG ON CATALOG <catalog> TO `<sp-app-id>`;
GRANT BROWSE ON CATALOG <catalog> TO `<sp-app-id>`;

-- Required: schema-level access (for each schema you want to visualize)
GRANT USE_SCHEMA ON SCHEMA <catalog>.<schema> TO `<sp-app-id>`;
GRANT SELECT ON SCHEMA <catalog>.<schema> TO `<sp-app-id>`;
```

**Shortcut — grant access to ALL schemas in a catalog at once:**

```sql
GRANT USE_CATALOG ON CATALOG <catalog> TO `<sp-app-id>`;
GRANT BROWSE ON CATALOG <catalog> TO `<sp-app-id>`;
GRANT USE_SCHEMA ON CATALOG <catalog> TO `<sp-app-id>`;
GRANT SELECT ON CATALOG <catalog> TO `<sp-app-id>`;
```

> **Note:** The SP also needs **CAN_USE** permission on the SQL Warehouse. This is typically already granted to the `users` group by default. If not, a workspace admin can add it under **SQL Warehouses** > your warehouse > **Permissions**.

### Step 6: Open the app

Find your app URL:

```bash
databricks apps get uc-erd-viewer | grep url
```

Open the URL in your browser. Select a catalog and schema, click **Generate ERD**, and explore your data model.

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

Constraints in Databricks are **informational only** — they are not enforced but are used for query optimization, documentation, and tools like this ERD viewer.

## Updating the App

After making code changes, re-sync and redeploy:

```bash
databricks sync . /Users/<your-email>/apps/uc-erd-viewer --watch=false \
  --exclude node_modules --exclude .git --exclude frontend/node_modules --exclude __pycache__

databricks apps deploy uc-erd-viewer \
  --source-code-path /Workspace/Users/<your-email>/apps/uc-erd-viewer
```

The app automatically rebuilds the frontend on startup when code changes are detected.

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

- **Backend**: FastAPI queries `information_schema` views (`table_constraints`, `key_column_usage`, `referential_constraints`, `constraint_column_usage`) to extract PK/FK metadata
- **Frontend**: React Flow renders interactive node-edge diagrams with dagre auto-layout
- **Auth**: `WorkspaceClient()` auto-authenticates as the Databricks App's service principal

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
