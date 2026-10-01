# Deploying OceanEmbed to Google Cloud Run

The app ships as **one container**: FastAPI serves the API under `/api/v1/*` and the
built React frontend at `/`. No separate frontend hosting or CORS setup is needed.

## 1. One-time setup

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

## 2. Model checkpoint

`artifacts/checkpoints/best_model.pt` is **not in git** (see `.gitignore`). Choose one:

- **Bake it into the image:** put `best_model.pt` in `artifacts/checkpoints/` before deploying.
  It is copied in by the Dockerfile.
- **Load it from Cloud Storage** (recommended, so retraining doesn't need a rebuild):
  ```bash
  gcloud storage buckets create gs://YOUR_BUCKET --location=asia-south1
  gcloud storage cp artifacts/checkpoints/best_model.pt gs://YOUR_BUCKET/best_model.pt
  ```
  Then pass `MODEL_CHECKPOINT=gs://YOUR_BUCKET/best_model.pt` at deploy time (step 3).
  The Cloud Run service account needs `roles/storage.objectViewer` on the bucket.

Without a checkpoint the service still starts; `/api/v1/health` reports the error and the
frontend falls back to its built-in demo data.

## 3. Deploy

From the repository root:

```bash
gcloud run deploy oceanembed \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --memory 2Gi --cpu 2 \
  --timeout 300 \
  --set-env-vars MODEL_CHECKPOINT=gs://YOUR_BUCKET/best_model.pt
```

Drop `--set-env-vars` if the checkpoint is baked into the image. Cloud Build builds the
`Dockerfile` remotely, so Docker isn't needed on your machine. `.gcloudignore` keeps
training data, docs and slides out of the upload.

## 4. Verify

```bash
URL=$(gcloud run services describe oceanembed --region asia-south1 --format='value(status.url)')
curl $URL/api/v1/health
```
Open `$URL` in a browser for the dashboard.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8080` | Set by Cloud Run automatically |
| `MODEL_CHECKPOINT` | `artifacts/checkpoints/best_model.pt` | Local path or `gs://` URI |
| `NORM_STATS_PATH` | `artifacts/norm_stats.npz` | Local path or `gs://` URI |
| `TEST_SAMPLES_DIR` | `data/samples/test` | Input window used for demo inference |
| `CORS_ORIGINS` | `*` | Comma-separated origins; only matters if the UI is hosted elsewhere |

## Local test of the production image

```bash
docker compose up --build     # http://localhost:8080
```

## Notes

- The model's decoder is large, so inference runs on CPU with ~2 GiB RAM. If you see
  out-of-memory restarts, raise `--memory` to `4Gi`.
- Startup runs one inference pass to cache the prediction volume. The first request
  after a cold start can take ~10–30 s. Add `--min-instances 1` to avoid cold starts
  during a demo (this has an ongoing cost).
