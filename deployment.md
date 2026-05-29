# 🚀 Agniva 2.0 - Deployment Guide

This guide details how to deploy Agniva 2.0 with the React frontend on Vercel and the Python Flask backend on Render.

---

## 🏗️ Deployed Setup: Vercel (Frontend) + Render (Backend)

This setup ensures that the live video streaming endpoint `/api/live_detection` does not time out and operates with full YOLOv8 detection on the persistent Render backend, while Vercel serves the static React application.

### A. Deploy Backend to Render (Flask API)

1. Log in to [Render](https://render.com).
2. Click **New +** ➔ **Web Service**.
3. Link your GitHub repository (`Agniva2.0`).
4. Configure the Web Service:
   - **Name**: `agniva-backend`
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r fire_detection_system/requirements.txt`
   - **Start Command**: `python fire_detection_system/server.py`
5. Configure Environment Variables in the **Variables** tab:
   - `DEV_MODE`: `true` (enables password-based bypass without requiring Google Sign-In setup).
   - `ALLOWED_ORIGINS`: `https://your-frontend-domain.vercel.app` (your actual Vercel project domain URL, once deployed).
6. Click **Deploy Web Service**.

### B. Deploy Frontend to Vercel (React Static Site)

1. Log in to the [Vercel Dashboard](https://vercel.com).
2. Click **Add New** ➔ **Project**.
3. Import the `Agniva2.0` repository.
4. Configure Project Settings:
   - **Framework Preset**: **Vite**
   - **Root Directory**: `agniv-2.0/frontend` 
     > [!IMPORTANT]
     > You must set the **Root Directory** to `agniv-2.0/frontend` so Vercel only deploys the React frontend and does not compile or run any Python serverless backend.
   - **Build Settings** (will auto-configure for Vite):
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
5. Configure Environment Variables:
   - `VITE_API_URL`: `https://your-backend-domain.onrender.com/api` (the URL Render generated for your backend service).
6. Click **Deploy**.

---

## 🛠️ Local Development

To run the application locally on your computer:

1. Double-click the `start.bat` file in the root folder.
2. The script will:
   - Open a backend console running Flask at `http://localhost:5000`.
   - Start the Vite dev server at `http://localhost:5173`.
