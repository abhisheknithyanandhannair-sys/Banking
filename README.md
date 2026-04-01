# SME Credit Readiness Workspace

Country-aware SME credit analysis with a `shared core + local adapters` architecture.

## What It Does

- Shared core engines for ratios, cashflow, documentation, and what-if simulation
- Local adapters for Ireland, Spain, France, the Netherlands, and Germany
- Stable outputs across countries:
  - Readiness band and why explanation
  - Top blockers
  - Mitigants
  - Tailored document pack
  - Scheme pathways
  - Local artifact explanations
  - What-if band drift

## Project Structure

- `backend/` FastAPI API
- `backend/analysis/` shared-core engines and country adapters
- `frontend/` React + TypeScript + Tailwind app

## Upload Template

Use `frontend/public/sme-financial-upload-template.csv` to pre-fill the financial statement fields.

Supported upload metrics:

- `revenue`
- `cogs`
- `operating_expenses`
- `payroll_expense`
- `interest_expense`
- `tax_expense`
- `depreciation`
- `cash`
- `receivables`
- `current_assets`
- `inventory`
- `payables`
- `current_liabilities`
- `total_assets`
- `total_liabilities`
- `equity`

Country-specific context, bank-data series, documentation flags, and what-if levers are entered in the app UI.

## Run

Backend:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Netlify Deployment

The frontend can be deployed to Netlify as a static site.

Important:

- The FastAPI backend is not deployable to standard Netlify static hosting as-is.
- For a fully working app, deploy the backend separately and set `VITE_API_BASE_URL` in Netlify to that backend URL.

Suggested flow:

```bash
cd frontend
npm install
npm run build
```

Then in Netlify:

- Connect this project or deploy from the repo folder
- Use the repo-root `netlify.toml`
- Set environment variable `VITE_API_BASE_URL`
- Example: `https://your-backend-service.example.com`

The repository already includes:

- `netlify.toml` with `frontend` as the build base
- `frontend/.env.example` showing the required API variable

## Recommended Hosting: Netlify + Render

This is the simplest full deployment for the current stack:

- Netlify hosts the React frontend
- Render hosts the FastAPI backend

### 1. Deploy the backend on Render

The repository includes `render.yaml`, so you can deploy the backend as a Render web service from the repo.

Render service settings already defined:

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Health check: `/health`
- Python version pinned to `3.13.12` to avoid unsupported-wheel issues on `pydantic-core`

After deployment, copy the public Render URL, for example:

```text
https://banking-readiness-api.onrender.com
```

You can test it with:

```text
https://banking-readiness-api.onrender.com/health
```

### 2. Deploy the frontend on Netlify

In Netlify:

- Connect the Git repo
- Let Netlify use the repo-root `netlify.toml`
- Add environment variable `VITE_API_BASE_URL`
- Set it to your Render backend URL

Example:

```text
VITE_API_BASE_URL=https://banking-readiness-api.onrender.com
```

Then trigger the deploy.

### 3. Verify the live app

- Open the Netlify site
- Run an analysis
- Confirm the browser can reach the Render API
- If needed, test the backend directly at `/health`

### Notes

- CORS is currently open in the FastAPI app, which is fine for this demo deployment
- For production hardening, restrict `allow_origins` to your Netlify domain later
