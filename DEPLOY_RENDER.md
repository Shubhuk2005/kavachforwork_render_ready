# Render Deployment

This folder is ready to push to GitHub and deploy on Render.

## Free plan

Use `render.yaml` for the free-plan setup.

It keeps these on Render free services:
- frontend static site
- Node API web service
- Python AI web service

MongoDB is the only part that should stay outside Render on the free plan, usually on Mongo Atlas, because Render private services are not available on the free plan.

## Which file to use

- `render.yaml`
  Use this if you want the easiest setup. It deploys:
  - frontend static site on Render
  - Node API on Render
  - Python AI service on Render
  - MongoDB from Mongo Atlas or another external Mongo URI

- `render.full.yaml`
  Use this only if you want MongoDB on Render too.
  Note:
  - it adds a private Mongo service
  - that Mongo service uses the `starter` plan because private services are not available on the free plan

## Recommended setup

1. Push this folder to GitHub.
2. In Render, create a new Blueprint from your repo.
3. Start with `render.yaml`.
4. During setup, enter values for:
   - `MONGODB_URI` from Mongo Atlas
   - `WEATHERSTACK_API_KEY`
   - `ANTHROPIC_API_KEY` if you want the chatbot API
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `ADMIN_PASSWORD`
   - `DEMO_PASSWORD`
5. Finish the Blueprint deploy.

## Optional full-Render setup

If you want MongoDB on Render too:

1. Rename `render.full.yaml` to `render.yaml` before creating the Blueprint.
2. Deploy the Blueprint.
3. Keep the generated Mongo password in Render because the API service references it automatically.

## Seed demo data after deploy

Render does not run `seed.js` automatically. After the API service is live, seed data with one of these:

- locally from this folder:
  - set `MONGODB_URI` to your production Mongo connection string
  - run `cd server && npm install && node seed.js`
- or use Render shell / one-off job if your API service plan supports it

## Important notes

- `ai/weather_Oracle.joblib` is not included in this push-ready copy, so set `AI_WEATHER_ORACLE_ENABLED=false` unless you add that file back.
- The frontend expects the API and Socket.IO URL from Render service environment variables and is already patched for that.
- The AI service is deployed as a separate Render service and the API calls it through `AI_SERVICE_URL`.
- Render free web services spin down after 15 minutes without inbound traffic, so the first request after idle can be slow.
