# 🔍 AI Image Detector

A production-ready Next.js web application that detects whether an image was **AI-generated** or captured by a **real camera** — powered by Hugging Face's Vision Transformer (ViT) inference API.

![AI Image Detector Preview](https://via.placeholder.com/900x500/050508/6366f1?text=AI+Image+Detector)

---

## ✨ Features

- 🖼️ **Drag & drop** image uploader (JPG, PNG, WebP, up to 10 MB)
- 🤖 **AI-powered detection** via Hugging Face Inference API
- 📊 **Confidence score** with animated progress bar
- ⚡ **Fast** — results in under 1 second
- 🌙 **Dark mode UI** with glassmorphism design
- 📱 **Fully responsive** (mobile + desktop)
- 🔒 **Secure** — API key never exposed to the frontend

---

## 🛠️ Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Framework | Next.js 14 (React)                |
| Backend   | Next.js API Routes (serverless)   |
| AI Model  | Hugging Face Inference API (ViT)  |
| Styling   | CSS Modules + custom design system|
| Fonts     | Syne + DM Mono (Google Fonts)     |
| Deployment| Vercel                            |

---

## 📁 Project Structure

```
ai-image-detector/
├── components/
│   ├── ImageUploader.js          # Drag-and-drop upload UI
│   ├── ImageUploader.module.css  # Uploader styles
│   ├── ResultCard.js             # Detection result display
│   └── ResultCard.module.css     # Result card styles
├── pages/
│   ├── _app.js                   # App wrapper
│   ├── _document.js              # Custom HTML document
│   ├── index.js                  # Main page
│   └── api/
│       └── detect-image.js       # 🔑 Backend API route
├── styles/
│   ├── globals.css               # Global design tokens + reset
│   └── Home.module.css           # Page-level styles
├── public/                       # Static assets
├── .env.local                    # ⚠️ Your API keys (not committed)
├── .gitignore
├── next.config.js
├── vercel.json
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ai-image-detector.git
cd ai-image-detector
```

### 2. Install dependencies

```bash
npm install
```

> This installs: `next`, `react`, `react-dropzone`, `formidable`, `framer-motion`, `lucide-react`

### 3. Get a Hugging Face API key

1. Go to [huggingface.co](https://huggingface.co) and create a free account
2. Navigate to **Settings → Access Tokens**
3. Click **New token** → give it a name → select **Read** role → **Generate**
4. Copy your token

### 4. Configure environment variables

Edit `.env.local` and paste your token:

```env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> ⚠️ **Never commit `.env.local`** — it is already in `.gitignore`

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploy to Vercel

### Option A — Vercel CLI (fastest)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (follow the prompts)
vercel

# Set your environment variable on Vercel
vercel env add HUGGINGFACE_API_KEY
# Paste your HF token when prompted

# Deploy to production
vercel --prod
```

### Option B — Vercel Dashboard (no CLI)

1. Push your code to GitHub (see below)
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Under **Environment Variables**, add:
   - **Key:** `HUGGINGFACE_API_KEY`
   - **Value:** your Hugging Face token
5. Click **Deploy**

---

## 📤 Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Stage all files
git add .

# Commit
git commit -m "feat: initial commit — AI Image Detector"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/ai-image-detector.git
git branch -M main
git push -u origin main
```

---

## 🔌 API Reference

### `POST /api/detect-image`

Accepts a multipart form upload and returns a detection result.

**Request:**

```
Content-Type: multipart/form-data
Field: image (file) — JPG, PNG, or WebP, max 10 MB
```

**Success Response (200):**

```json
{
  "prediction": "AI Generated",
  "confidence": 0.9142,
  "details": [
    { "label": "AI Generated",    "score": 0.9142 },
    { "label": "Real Photograph", "score": 0.0858 }
  ]
}
```

**Error Response:**

```json
{
  "error": "Human-readable error message"
}
```

---

## 🤖 AI Model

This app uses **[Organika/sdxl-detector](https://huggingface.co/Organika/sdxl-detector)** from Hugging Face — a Vision Transformer fine-tuned to distinguish between AI-generated (Stable Diffusion XL) images and real photographs.

To swap the model, update `HF_API_URL` in `pages/api/detect-image.js`.

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| `API key not configured` | Make sure `.env.local` has `HUGGINGFACE_API_KEY` set |
| `Model is loading (503)` | HF free-tier models cold-start — wait 20s and retry |
| `File too large` | Use an image under 10 MB |
| `Invalid file type` | Only JPG, PNG, and WebP are supported |

---

## 📄 License

MIT © 2024 — Free to use, modify, and distribute.
