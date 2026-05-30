# Agniv 2.0 — AI Fire & Smoke Detection

## Deploy Frontend → Vercel
1. Connect GitHub repo to Vercel
2. Set Root Directory: (leave empty — uses vercel.json)
3. Add env var: VITE_API_URL = /api
4. Deploy → note your Vercel URL

## Deploy Backend → Render
1. New Web Service → connect repo
2. Build Command: pip install -r fire_detection_system/requirements.txt
3. Start Command: gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:$PORT web_app:app
4. Add env vars:
   - SECRET_KEY = (generate random)
   - ALLOWED_ORIGINS = https://YOUR-VERCEL-URL.vercel.app
5. Deploy → note your Render URL

## Update vercel.json
Replace `https://agniv-backend.onrender.com` with your actual Render URL.
Redeploy on Vercel.

## Login
Open the app. Enter any email address. No password. No verification. Click Sign In.

## Local Dev
Terminal 1: cd fire_detection_system && python server.py
Terminal 2: cd agniv-2.0/frontend && npm run dev
