# Deploying LabasApp to the Web 🚀

Your app is built with **Next.js 16 (App Router)** and includes dynamic Node.js serverless API routes (`/api/tts` for Lithuanian neural voice and `/api/tutor` for the AI conversation partner), along with **Firebase Authentication** and **Cloud Firestore**.

---

## Option 1: Vercel (Recommended — Free & 1-Click Setup)

Vercel is the creators and native hosting platform for Next.js. It requires zero server management, provides free SSL certificates, and handles edge/serverless API routes automatically.

### Step 1: Push Your Code to GitHub
If you haven't pushed this folder to GitHub yet, run:
```bash
git add .
git commit -m "Complete Sėkmės Lithuanian Learning Platform"
git remote add origin https://github.com/YOUR_USERNAME/sekmes-lithuanian.git
git branch -M main
git push -u origin main
```

### Step 2: Import Project in Vercel
1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **"Add New..."** &rarr; **"Project"**.
3. Select your repository (`sekmes-lithuanian`) and click **Import**.

### Step 3: Add Environment Variables in Vercel
In the **Environment Variables** section during import, add the following keys from your `.env.local`:

| Variable Name | Value |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyA-nzjId5zB-KNRJSq2kt_2AbdMoo3fKqU` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `sekmes.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `sekmes` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `sekmes.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `844007390724` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:844007390724:web:92b1857ffff33a3c11ff51` |
| `GEMINI_API_KEY` *(Optional)* | *(Your Gemini API key if using custom model generation)* |

### Step 4: Click Deploy!
- Click **Deploy**. Within 60 seconds, your site is live with a permanent public URL (e.g. `https://sekmes-lithuanian.vercel.app`).

### Step 5: Authorize Your Domain in Firebase
1. Open [Firebase Console](https://console.firebase.google.com/project/sekmes/authentication).
2. Go to **Authentication** &rarr; **Settings** &rarr; **Authorized domains**.
3. Click **Add domain** and enter your Vercel domain (e.g. `sekmes-lithuanian.vercel.app`).
4. Now you and your learners can sign in and sync progress from any phone, tablet, or laptop worldwide!

---

## Option 2: Deploy directly from your Terminal with Vercel CLI

If you prefer deploying straight from your PowerShell terminal without pushing to GitHub first:
```bash
npx vercel
```
- It will prompt you to log in to Vercel in your browser.
- Select your project name.
- It will build and upload your project directly to a live URL!
