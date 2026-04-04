# Free Render Setup Guide

This guide shows how to host the project on the free plan with this setup:

- Frontend on Render Static Site
- Backend on Render Web Service
- AI service on Render Web Service
- MongoDB on Mongo Atlas Free Tier

Project folder:

- `C:\Users\Shubh\Downloads\kavachforwork_render_ready`

Use this Blueprint file:

- `render.yaml`

Do not use this file for the free plan:

- `render.full.yaml`

That file is for a paid setup because it uses a private Mongo service on Render.

## 1. Create Mongo Atlas Free Database

1. Go to `https://www.mongodb.com/atlas/database`
2. Sign in or create an account.
3. Create a free cluster.
4. Create a database user.
5. Add your IP or use temporary open access while testing.
6. Open `Connect` -> `Drivers`.
7. Copy the Mongo connection string.
8. Replace the username and password in the URI with your real values.

Your URI will look like this:

```text
mongodb+srv://USERNAME:PASSWORD@cluster-name.mongodb.net/kavachforwork?retryWrites=true&w=majority
```

Save this value. You will use it as `MONGODB_URI` in Render.

## 2. Push This Folder To GitHub

Open PowerShell and run:

```powershell
cd C:\Users\Shubh\Downloads\kavachforwork_render_ready
git remote add origin <your-github-repo-url>
git push -u origin main
```

If the remote already exists, use:

```powershell
git remote set-url origin <your-github-repo-url>
git push -u origin main
```

## 3. Deploy On Render

1. Go to `https://dashboard.render.com/`
2. Click `New` -> `Blueprint`
3. Connect your GitHub account if needed.
4. Select your repository.
5. Render will detect `render.yaml`
6. Continue with the Blueprint setup.

Render will create:

- `kavachforwork-web`
- `kavachforwork-api`
- `kavachforwork-ai`

## 4. Fill In Environment Variables

During the first Blueprint setup, enter these values when Render asks:

- `MONGODB_URI`
  Use your Mongo Atlas URI
- `WEATHERSTACK_API_KEY`
  Required for live weather APIs
- `ADMIN_PASSWORD`
  Create a strong password
- `DEMO_PASSWORD`
  Create a demo password if you want seeded demo users

Optional:

- `ANTHROPIC_API_KEY`
  Only needed if you want the chatbot API
- `RAZORPAY_KEY_ID`
  Only needed if you want Razorpay features
- `RAZORPAY_KEY_SECRET`
  Only needed if you want Razorpay features

Render will generate this automatically:

- `JWT_SECRET`

Render already wires these automatically inside `render.yaml`:

- `CLIENT_URL`
- `AI_SERVICE_URL`
- `VITE_API_URL`
- `VITE_SOCKET_URL`

## 5. Wait For Deploy To Finish

When deploy finishes, you will get public URLs for:

- frontend
- backend
- AI service

The frontend URL is the main one you will open in the browser.

## 6. Seed Demo Data

Render does not automatically run the seed script.

After the database and API are ready, run this locally from your machine:

```powershell
cd C:\Users\Shubh\Downloads\kavachforwork_render_ready\server
$env:MONGODB_URI="<your-mongodb-atlas-uri>"
$env:ADMIN_EMAIL="admin@kavachforwork.in"
$env:ADMIN_PASSWORD="<your-admin-password>"
$env:DEMO_PASSWORD="<your-demo-password>"
npm install
node seed.js
```

This creates demo data such as admin and worker accounts.

## 7. Test The App

Check these after deployment:

1. Open the frontend URL
2. Register a user
3. Test login
4. Test admin login
5. Submit a claim
6. Open the AI health URL:

```text
https://your-ai-service.onrender.com/health
```

7. Open the backend health URL:

```text
https://your-api-service.onrender.com/health
```

## 8. Important Free Plan Notes

- Render free web services sleep after inactivity, so the first request can be slow.
- MongoDB is not hosted on Render in this free setup.
- `ai/weather_Oracle.joblib` is not included in this folder, so keep:

```text
AI_WEATHER_ORACLE_ENABLED=false
```

- If you want everything on Render, that is a paid setup.

## 9. Files You Need

Main deployment files:

- `render.yaml`
- `DEPLOY_RENDER.md`
- `FREE_RENDER_SETUP.md`

## 10. If Deployment Fails

Check these first:

1. `MONGODB_URI` is correct
2. Mongo Atlas user/password are correct
3. Mongo Atlas network access is allowed
4. Render services finished building successfully
5. The API and AI health endpoints return `ok`

## Official Docs

- `https://render.com/docs/free`
- `https://render.com/docs/blueprint-spec`
- `https://render.com/docs/private-services`
- `https://www.mongodb.com/docs/atlas/`
