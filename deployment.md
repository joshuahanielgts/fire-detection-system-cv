# 🚀 Agniva 2.0 - Vercel Deployment Guide

This guide provides a detailed, step-by-step tutorial on how to deploy the integrated React frontend and Flask Python backend to Vercel as a single unified project.

---

## 🏗️ Deployment Architecture

Agniva 2.0 uses Vercel's multi-runtime capability:
1. **Frontend**: Vite + React SPA (Single Page Application) is compiled to static files and served globally by the Vercel Edge Network.
2. **Backend**: Flask API is bundled into a Serverless Python Function. Requests targeting `/api/*` are automatically redirected to `api/index.py`.
3. **Hardware / Model Fallback**: Since AWS Lambda (which powers Vercel Serverless) has no access to physical webcams and imposes a 50MB (zipped) / 250MB (unzipped) package limit:
   - Deep-learning packages (`torch`, `torchvision`, `ultralytics`) are omitted from Vercel's dependencies.
   - The backend automatically detects the serverless deployment and launches **Simulated Camera Mode**, feeding a synthetic camera video stream with simulated fire/smoke boxes and populating the dashboard's live metrics and alert logs.

> [!IMPORTANT]
**Vercel Lambda Bundle Limit (Resolved)**
- Vercel Serverless Functions have a maximum size limit of 250MB unzipped. To ensure the deployment is under this limit, the root folder contains a `.vercelignore` file that ignores the React `node_modules/`, compiler build artifacts (`dist/`), temporary folders, local run scripts, and the local YOLO model weights (`yolov8n.pt`).
- This keeps the Vercel deploy package size at less than 1MB, ensuring it deploys instantly and without bundle size errors.

---

## 📋 Prerequisites

Before deploying, ensure you have:
1. A **GitHub** account.
2. A **Vercel** account (you can sign in with your GitHub account).
3. Pushed your latest code to your GitHub repository: `https://github.com/HIYA-Banerjee/Agniva2.0.git`.

---

## 🛠️ Step-by-Step Deployment (Web Dashboard)

This is the recommended method as it sets up automatic continuous deployment (CI/CD) whenever you push changes to your GitHub branch.

### Step 1: Import the Repository
1. Log in to the [Vercel Dashboard](https://vercel.com).
2. Click **Add New** ➔ **Project**.
3. Locate `Agniva2.0` in your list of GitHub repositories and click **Import**.

### Step 2: Configure Project Settings
In the configuration screen, adjust the parameters:

1. **Framework Preset**: Select **Other** (do not select Vite, since we are deploying a custom layout).
2. **Root Directory**: Keep it as `./` (the default workspace root).
3. **Build and Development Settings**:
   - Expand the dropdown.
   - **Build Command**: Set to `npm run build`
   - **Output Directory**: Set to `agniv-2.0/frontend/dist`
   - **Install Command**: Keep as default.

### Step 3: Configure Environment Variables (Optional)
If you wish to use custom keys, expand the **Environment Variables** section and add:
- `FLASK_SECRET_KEY`: A secure random string for signing cookies.
- `DEV_MODE`: Set to `true` (enables local developer mode bypass without Google credentials).
- `GOOGLE_CLIENT_ID`: (Optional) Your Google OAuth Client ID if you wish to run Google sign-in.

### Step 4: Click Deploy!
- Click the **Deploy** button.
- Vercel will install Node.js modules, run the Vite React compiler, bundle the Python Serverless Function using the dependencies in [requirements.txt](file:///d:/ex%20projects/Agniva2.0/requirements.txt), and generate your production URL.

---

## 💻 Alternative: Deploying via Vercel CLI

If you want to deploy directly from your local terminal:

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```
2. **Login to Vercel**:
   ```bash
   vercel login
   ```
3. **Initialize Deployment**:
   Run the following command at the root of the project:
   ```bash
   vercel
   ```
   - Answer the prompts:
     - Set up and deploy? **Yes**
     - Which scope? (Select your account)
     - Link to existing project? **No**
     - What name? `agniva2`
     - Which directory is code located in? `./`
     - Modify settings? **Yes**
     - Modify Build Command? **Yes** ➔ `npm run build`
     - Modify Output Directory? **Yes** ➔ `agniv-2.0/frontend/dist`
4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

## 🔍 Verifying the Deployment

Once Vercel gives you your deployment URL (e.g. `https://agniva2.vercel.app`), verify the setup:

1. Visit the URL to see the premium landing page.
2. Navigate to `/login` and type any email/password (with `DEV_MODE=true` set, it bypasses validations).
3. Access your **Protected Properties** dashboard.
4. Click **Camera Management** on a property and select **Use Backend Camera**.
   - Since it's running on Vercel, the backend will seamlessly activate the **Simulated Camera Feed** and show periodic fire/smoke bounding boxes.
   - Real-time alerts will trigger and populate the logs, validating that the API endpoints and the front-end components are fully integrated!
