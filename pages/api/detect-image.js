/**
 * /pages/api/detect-image.js
 * Model: umm-maybe/AI-image-detector
 */

import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

const HF_API_URL = 'https://api-inference.huggingface.co/models/umm-maybe/AI-image-detector';
const MAX_BYTES  = 10 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const TIMEOUT_MS = 30_000;

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ maxFileSize: MAX_BYTES, keepExtensions: true });
    form.parse(req, (err, _fields, files) => {
      if (err) return reject(err);
      resolve(files);
    });
  });
}

async function fetchWithTimeout(url, options, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function normaliseLabel(raw) {
  const s = (raw || '').toLowerCase();
  if (s.includes('artificial') || s.includes('fake') || s.includes('ai') || s.includes('generated')) {
    return 'AI Generated';
  }
  if (s.includes('human') || s.includes('real') || s.includes('photo') || s.includes('natural')) {
    return 'Real Photograph';
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  // ── Check API key ──
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'your_huggingface_api_token_here') {
    return res.status(500).json({ error: 'HUGGINGFACE_API_KEY is missing or not set in environment variables.' });
  }

  // ── Parse form ──
  let files;
  try {
    files = await parseForm(req);
  } catch (err) {
    return res.status(400).json({
      error: err.message?.includes('maxFileSize')
        ? 'File too large. Max 10MB.'
        : 'Failed to parse file: ' + err.message,
    });
  }

  const fileArray = files.image;
  const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

  if (!file) {
    return res.status(400).json({ error: 'No image received. Make sure field name is "image".' });
  }

  // ── Validate type ──
  const mimeType = file.mimetype || '';
  if (!ALLOWED_MIME.includes(mimeType)) {
    return res.status(400).json({ error: `Invalid file type: ${mimeType}. Use JPG, PNG, or WebP.` });
  }

  // ── Read file ──
  let imageBuffer;
  try {
    imageBuffer = fs.readFileSync(file.filepath);
  } catch (err) {
    return res.status(500).json({ error: 'Could not read file: ' + err.message });
  }

  // ── Call HF API ──
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
      return res.status(504).json({ error: 'Request timed out after 30s. Try again.' });
    }
    return res.status(502).json({ error: 'Network error calling HF API: ' + err.message });
  }

  // ── Read raw HF response body for debugging ──
  const rawBody = await hfResponse.text();

  if (!hfResponse.ok) {
    // Return the EXACT error from HF so we can see what's wrong
    return res.status(502).json({
      error: `HF API error (${hfResponse.status}): ${rawBody}`,
    });
  }

  // ── Parse JSON ──
  let hfData;
  try {
    hfData = JSON.parse(rawBody);
  } catch {
    return res.status(502).json({ error: 'Could not parse HF response: ' + rawBody });
  }

  if (!Array.isArray(hfData) || hfData.length === 0) {
    return res.status(502).json({ error: 'Unexpected HF response format: ' + rawBody });
  }

  // ── Build result ──
  const sorted     = [...hfData].sort((a, b) => b.score - a.score);
  const top        = sorted[0];
  const prediction = normaliseLabel(top.label);
  const confidence = parseFloat(top.score.toFixed(4));
  const details    = sorted.map((d) => ({
    label: normaliseLabel(d.label),
    score: parseFloat(d.score.toFixed(4)),
  }));

  return res.status(200).json({ prediction, confidence, details });
}
