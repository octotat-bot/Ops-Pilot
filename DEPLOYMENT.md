# 🚀 How to Host OpsPilot on Vercel

Since this is a full-stack app (Frontend + Backend), we will deploy it as **two separate projects** on Vercel: one for the frontend and one for the backend.

---

## ✅ Step 1: Set up MongoDB Atlas (Cloud Database)

Since Vercel is serverless, you cannot use a local database.

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up/login.
2. Create a **Shared Cluster** (FREE).
3. **Database Access**: Create a database user (e.g., `admin` / `password123`) and remember the password.
4. **Network Access**: Add IP Address `0.0.0.0/0` (Allow access from anywhere) so Vercel can connect.
5. **Connect**:
   - Click "Connect" → "Drivers"
   - Copy the connection string.
   - Replace `<password>` with your actual password.
   - It will look like: `mongodb+srv://admin:password@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`

---

## 🎨 Step 2: Deploy Frontend

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** → **"Project"**.
2. Import your GitHub repository: `OpsPilot`.
3. Configure the project:
   - **Project Name**: `opspilot-frontend`
   - **Framework Preset**: Vite
   - **Root Directory**: Click "Edit" and select `frontend`.
4. **Environment Variables**:
   - Key: `VITE_API_URL`
   - Value: `https://opspilot-backend.vercel.app/api/v1`
   *(Note: You won't have the backend URL yet. Put a placeholder or come back and update this later. For now, you can leave it empty or use `http://localhost:5001/api/v1` for testing, but it won't work in production until updated)*.
5. Click **"Deploy"**.

---

## 🔧 Step 3: Deploy Backend

1. Go back to Vercel Dashboard and click **"Add New..."** → **"Project"** (again).
2. Import the **SAME** GitHub repository: `OpsPilot`.
3. Configure the project:
   - **Project Name**: `opspilot-backend`
   - **Framework Preset**: Other (default)
   - **Root Directory**: Click "Edit" and select `backend`.
4. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `MONGO_URI`: (Paste your MongoDB Atlas connection string from Step 1)
   - `JWT_SECRET`: (Create a strong random password)
   - `JWT_EXPIRES_IN`: `90d`
5. Click **"Deploy"**.

---

## 🔗 Step 4: Connect Them

1. Once the **Backend** is deployed, copy its URL (e.g., `https://opspilot-backend.vercel.app`).
2. Go to your **Frontend** project in Vercel.
3. Go to **Settings** → **Environment Variables**.
4. Edit `VITE_API_URL` and set it to: `https://opspilot-backend.vercel.app/api/v1` (Make sure to add `/api/v1` at the end).
5. Go to **Deployments** tab and **Redeploy** the latest commit for changes to take effect.

---

## ⚠️ Important Limitations (Serverless)

- **First Load Delay**: The backend may take a few seconds to wake up ("cold start") if not used for a while.
- **Cron Jobs**: The background tasks (like checking SLA every minute) won't run automatically in Vercel. You would need to set up Vercel Cron or use a dedicated backend host like Render.com if that feature is critical.

---

## 🎉 Done!

Your app is now live!
- **Frontend**: https://opspilot-frontend.vercel.app
- **Backend**: https://opspilot-backend.vercel.app
