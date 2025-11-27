# Deployment Guide

This guide will help you deploy your Medical Diagnosis Assistant.

## Prerequisite: GitHub Repository
Your code must be on GitHub.

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Final polish for submission"
   ```
2. **Push to GitHub:**
   ```bash
   git push origin main
   ```
   *(If you haven't linked a repo yet, create one on GitHub and follow the instructions to push)*

## Part 1: Deploy Backend (Render)
We will use Render (free tier) to host the Python backend.

1. **Sign up/Login** to [render.com](https://render.com).
2. Click **"New +"** -> **"Web Service"**.
3. Connect your GitHub repository.
4. **Configure the service:**
   - **Name:** `medassist-backend` (or similar)
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `cd backend && gunicorn app:app`
   - **Root Directory:** `.` (or leave empty)
5. **Environment Variables:**
   - Add `GEMINI_API_KEY`: Your Google Gemini API Key.
6. Click **"Create Web Service"**.
7. **Wait for deployment.** Once live, copy the URL (e.g., `https://medassist-backend.onrender.com`).

## Part 2: Update Frontend
Now that the backend is live, point the frontend to it.

1. Open `frontend/app.js`.
2. Find line 2:
   ```javascript
   const API_BASE_URL = 'http://localhost:5000/api';
   ```
3. Change it to your Render URL:
   ```javascript
   const API_BASE_URL = 'https://your-backend-url.onrender.com/api';
   ```
4. **Commit and push** this change to GitHub.

## Part 3: Deploy Frontend (Vercel)
We will use Vercel for the frontend.

1. **Sign up/Login** to [vercel.com](https://vercel.com).
2. Click **"Add New..."** -> **"Project"**.
3. Import your GitHub repository.
4. **Configure Project:**
   - **Framework Preset:** Other (or Vite if you used it, but this is vanilla JS)
   - **Root Directory:** `frontend` (Click "Edit" and select the `frontend` folder)
5. Click **"Deploy"**.
6. Once done, you will get a **Live URL** (e.g., `https://medassist-frontend.vercel.app`).

> [!IMPORTANT]
> **Database Note:** On Render's free tier, the SQLite database file will reset every time the server restarts. 
