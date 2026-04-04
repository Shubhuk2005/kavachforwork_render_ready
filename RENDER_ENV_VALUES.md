# Render Env Values

Use this file when Render asks for environment variables.

## Paste these in Render

Backend service:

- `MONGODB_URI`
  Use your Mongo Atlas connection string
- `WEATHERSTACK_API_KEY`
  Use your WeatherStack key
- `ADMIN_PASSWORD`
  Use your admin password
- `DEMO_PASSWORD`
  Use any demo password you want

Optional backend values:

- `ANTHROPIC_API_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

## Already set by `render.yaml`

Do not manually set these unless you are overriding the default on purpose:

- `NODE_ENV=production`
- `JWT_EXPIRES_IN=7d`
- `OPENAQ_BASE_URL=https://api.openaq.org/v2`
- `AI_WEATHER_ORACLE_ENABLED=false`
- `ADMIN_EMAIL=admin@kavachforwork.in`

## Auto-wired by Render

Do not manually paste these in the dashboard for the free setup:

- `AI_SERVICE_URL`
- `CLIENT_URL`
- `VITE_API_URL`
- `VITE_SOCKET_URL`
- `PORT`

## Values from your old local `.env` that are wrong for Render

- `NODE_ENV=development`
  Wrong for Render production. Use `production`.
- `AI_SERVICE_URL=http://localhost:8000`
  Wrong on Render. The Blueprint sets this automatically to your AI service URL.
- `AI_WEATHER_ORACLE_ENABLED=true`
  Wrong for this repo copy because `weather_Oracle.joblib` is not included.
- `PORT=5000`
  Render provides `PORT` automatically.

## Not needed for the current Render deploy

These are not required by the current deployed code path:

- `OPENWEATHER_API_KEY`

## Important

Do not commit real secrets into the repo.

If you already pasted real secrets into chat or into a committed file, rotate them after deployment:

- MongoDB password
- JWT secret
- WeatherStack API key
- Razorpay secret
