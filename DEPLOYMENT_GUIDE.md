# Diabetic Retinopathy Detection — Deployment Guide

This guide explains how to host your website and ML model permanently for free.

---

## 🌐 PART 1 — Frontend Deployment (Vercel)

Vercel will host your Next.js website permanently for free.

1. Go to **[https://vercel.com](https://vercel.com)** and sign up/log in using your GitHub account.
2. Click **Add New...** -> **Project**.
3. Select your repository: **`diabetic-retinopathy-detection`** and click **Import**.
4. In the **Environment Variables** section, add:
   - **Name**: `FLASK_API_URL`
   - **Value**: `https://your-backend-url.com/predict` (you will get this in Part 2)
5. Click **Deploy**.
6. Once deployed, Vercel will give you a permanent URL (like `https://diabetic-retinopathy-detection.vercel.app`).

---

## 🧠 PART 2 — Backend Deployment (Render or Hugging Face)

Since ML model files (`.keras`) are large, we excluded them from GitHub. Here are the two ways to host your backend:

### Option A — Hugging Face Spaces (Recommended & Easiest ⚡)
Hugging Face allows you to upload large model files directly via the browser and runs them for free.

1. Go to **[https://huggingface.co/join](https://huggingface.co/join)** and create a free account.
2. Go to **[https://huggingface.co/new-space](https://huggingface.co/new-space)**.
3. Set the following:
   - **Space name**: `diabetic-retinopathy-backend`
   - **SDK**: **Docker**
   - **Docker template**: **Blank**
   - **Space license**: `apache-2.0`
   - Keep it **Public**
4. Click **Create Space**.
5. Go to the **Files** tab of your new Space, and click **Add file** -> **Upload files**.
6. Upload everything inside your project's **`backend`** folder, including:
   - `app.py`
   - `model.py`
   - `requirements.txt`
   - **`dr_model_working.keras`** (21MB)
   - **`dr_model_2.keras`** (36.5MB)
   - **`dr_model_3.keras`** (49.2MB)
7. Hugging Face will automatically build and start your Flask server.
8. Your permanent backend URL will be:
   `https://<your-username>-diabetic-retinopathy-backend.hf.space/predict`
   *(Update your Vercel Environment Variable with this URL!)*

---

### Option B — Render
If you want to use Render:
1. Go to **[https://render.com](https://render.com)** and sign up with GitHub.
2. Click **New** -> **Web Service**.
3. Connect your GitHub repository.
4. Set:
   - **Root Directory**: `backend`
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 2 -b 0.0.0.0:5000 app:app`
5. Since the `.keras` models are not on GitHub, you need to add a Python script or download them from a storage link (like Google Drive) when the app starts.
