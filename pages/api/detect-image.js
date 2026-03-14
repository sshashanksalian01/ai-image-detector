/**
 * /pages/api/detect-image.js
 *
 * Backend API route that:
 * 1. Receives a multipart form upload
 * 2. Validates the file (type + size)
 * 3. Sends the binary image to Hugging Face Inference API
 * 4. Parses and normalises the model response
 * 5. Returns { prediction, confidence, details } JSON
 *
 * Model used: Ateeqq/ai-vs-human-image-detector
 * (A fine-tuned SigLIP classifier: labels are "ai" / "human")
 */

import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// ── Tell Next.js we handle the body ourselves ──────────────────────────────
export const config = { api: { bodyParser: false } };

// ── Constants ──────────────────────────────────────────────────────────────
const HF_API_URL =
  'https://api-inference.huggingface.co/models/Ateeqq/ai-vs-human-image-detector';
const MAX_BYTES    = 10 * 1024 * 1024;          // 10 MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const TIMEOUT_MS   = 30_000;                    // 30 s

// ── Helper: parse multipart form ──────────────────────────────────────────
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      maxFileSize: MAX_BYTES,
      keepExtensions: true,
    });
    form.parse(req, (err, _fields, files) => {
      if (err) return reject(err);
      resolve(files);
    });
  });
}

// ── Helper: abort-able fetch with timeout ─────────────────────────────────
async function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ── Helper: normalise HF label → friendly string ─────────────────────────
function normaliseLabel(raw) {
  const s = (raw || '').toLowerCase();
  if (s.includes('artificial') || s.includes('fake') || s.includes('ai') || s.includes('generated') || s.includes('sdxl') || s.includes('stable')) {
    return 'AI Generated';
  }
  if (s.includes('human') || s.includes('real') || s.includes('photo') || s.includes('natural')) {
    return 'Real Photograph';
  }
  // Fallback: capitalise raw label
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// ── Main handler ──────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey || apiKey === 'your_huggingface_api_token_here') {
    return res.status(500).json({
      error: 'Hugging Face API key is not configured. Add HUGGINGFACE_API_KEY to .env.local.',
    });
  }

  // 1. Parse uploaded file ─────────────────────────────────────────────────
  let files;
  try {
    files = await parseForm(req);
  } catch (err) {
    const msg = err.message?.includes('maxFileSize')
      ? 'File is too large. Maximum allowed size is 10 MB.'
      : 'Failed to parse uploaded file.';
    return res.status(400).json({ error: msg });
  }

  const fileArray = files.image;
  const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

  if (!file) {
    return res.status(400).json({ error: 'No image file received. Field name must be "image".' });
  }

  // 2. Validate MIME type ───────────────────────────────────────────────────
  const mimeType = file.mimetype || '';
  if (!ALLOWED_MIME.includes(mimeType)) {
    return res.status(400).json({
      error: `Unsupported file type "${mimeType}". Please upload a JPG, PNG, or WebP image.`,
    });
  }

  // 3. Read binary buffer ───────────────────────────────────────────────────
  let imageBuffer;
  try {
    imageBuffer = fs.readFileSync(file.filepath);
  } catch {
    return res.status(500).json({ error: 'Failed to read uploaded file from disk.' });
  }

  // 4. Call Hugging Face Inference API ─────────────────────────────────────
  let hfResponse;
  try {
    hfResponse = await fetchWithTimeout(
      HF_API_URL,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': mimeType,
        },
        body: imageBuffer,
      },
      TIMEOUT_MS
    );
  } catch (err) {
    if (err.name === 'AbortError') {
      return res.status(504).json({ error: 'Request to AI model timed out. Please try again.' });
    }
    return res.status(502).json({ error: 'Failed to reach Hugging Face API. Check your network.' });
  }

  // 5. Parse HF response ───────────────────────────────────────────────────
  if (!hfResponse.ok) {
    let body = {};
    try { body = await hfResponse.json(); } catch {}
    const msg =
      hfResponse.status === 401
        ? 'Invalid Hugging Face API key.'
        : hfResponse.status === 503
        ? 'AI model is loading. Please wait ~20 seconds and try again.'
        : body.error || `Hugging Face API error (${hfResponse.status}).`;
    return res.status(hfResponse.status === 503 ? 503 : 502).json({ error: msg });
  }

  let hfData;
  try {
    hfData = await hfResponse.json();
  } catch {
    return res.status(502).json({ error: 'Could not parse response from AI model.' });
  }

  // HF image-classification returns an array of { label, score }
  // e.g. [{ label: 'artificial', score: 0.91 }, { label: 'human', score: 0.09 }]
  if (!Array.isArray(hfData) || hfData.length === 0) {
    return res.status(502).json({ error: 'Unexpected response format from AI model.' });
  }

  // Sort descending by score
  const sorted = [...hfData].sort((a, b) => b.score - a.score);
  const top    = sorted[0];

  const prediction  = normaliseLabel(top.label);
  const confidence  = parseFloat(top.score.toFixed(4));
  const details     = sorted.map((d) => ({
    label: normaliseLabel(d.label),
    score: parseFloat(d.score.toFixed(4)),
  }));

  // 6. Return result ────────────────────────────────────────────────────────
  return res.status(200).json({ prediction, confidence, details });
}
