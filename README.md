# Todo Frontend + Cypress Scoring Suite (React + MUI)

This package includes:
- React + MUI frontend (same UI as the reference frontend)
- Cypress E2E tests with a points-based score summary

## Run frontend only (local dev)

1) Start your backend on **http://localhost:3087**
2) Configure `.env`:

```
VITE_API_BASE_URL=http://localhost:3087
```

3) Run:

```
npm install
npm run dev
```

Open http://localhost:5173

## Run Cypress locally (against local frontend)

Terminal A:
```
npm run dev
```

Terminal B:
```
# backend must be running on 3087
CYPRESS_API_BASE_URL=http://localhost:3087 npm run cy:run
```

## Run frontend + Cypress in Docker (recommended for scoring)

This compose file runs:
- Postgres
- Backend container (swap the image via BACKEND_IMAGE)
- Frontend container
- Cypress container (runs tests and outputs score)

```
BACKEND_IMAGE=todo-api-example docker compose -f docker-compose.e2e.yml up --build --exit-code-from cypress
```

### Where to find the score
After the run:
- console output shows a per-category summary
- `cypress/results/score.json` contains the machine-readable result

## Using the provided example backend image

If you downloaded the example backend zip separately, build it as a Docker image:

```
docker build -t todo-api-example .
```

(from inside the backend folder)

Then run E2E compose from this folder:

```
BACKEND_IMAGE=todo-api-example docker compose -f docker-compose.e2e.yml up --build --exit-code-from cypress
```
