---
title: DR Detection Model API
emoji: 👁️
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# Diabetic Retinopathy — Model API

Flask API serving the repaired, trained 3-branch ensemble model
(`backend/2025(84%)_repaired.keras`) over HTTP, so the Next.js frontend can
call a real public URL instead of `127.0.0.1:5000`.

## Endpoints

- `GET /health` -> `{"status": "ok", "model_load_seconds": <float>}`
- `POST /predict` -> multipart/form-data, field `image` (an image file) ->
  `{"class": "No DR", "confidence": {"0": 0.99, "1": 0.00, ...}}`

## Before you deploy

1. Copy `backend/2025(84%)_repaired.keras` into this folder and rename it to
   `model.keras` (or keep the name and set `MODEL_PATH` in the Space's
   Settings -> Variables and secrets).
2. Track it with Git LFS before pushing (it's ~330MB):
   ```bash
   git lfs install
   git lfs track "*.keras"
   git add .gitattributes model.keras
   git commit -m "Add repaired DR model"
   git push
   ```
3. Watch the Space's **Logs** tab for `Model loaded successfully in Xs.` —
   should take low minutes at most on CPU, nothing like the ~25 minute loads
   seen with the original (broken) checkpoint.

## Testing once live

```bash
curl https://<your-username>-<space-name>.hf.space/health

curl -X POST -F "image=@sample_retina.jpg" \
  https://<your-username>-<space-name>.hf.space/predict
```

## Wiring the frontend to it

In the Next.js project (not this folder), set the server-only env var
(Vercel dashboard -> Settings -> Environment Variables, or `.env.local` for
local dev):

```
FLASK_API_URL=https://<your-username>-<space-name>.hf.space/predict
```

`app/api/predict/route.js` already reads this variable and proxies requests
to it — no frontend component changes needed.

## Quick/temporary alternative: ngrok

If you just want to prove this works today without setting up a Space:

1. On the machine where `backend/app.py` already runs successfully, install
   ngrok and authenticate once: `ngrok config add-authtoken <token>`
2. Start the Flask server as usual (`python app.py` from `backend/`), then in
   another terminal: `ngrok http 5000`
3. ngrok prints a public HTTPS URL, e.g. `https://a1b2c3d4.ngrok-free.app`.
4. Set `FLASK_API_URL=https://a1b2c3d4.ngrok-free.app/predict`.

Caveats: the URL changes every time you restart ngrok on the free plan, and
your PC + Flask server need to stay running the whole time anyone uses the
site. Treat this as a bridge to the Hugging Face Space, not a replacement.
