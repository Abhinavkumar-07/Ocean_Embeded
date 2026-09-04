# SETUP

## Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- Git
- CUDA 11.8+ (optional, for GPU training)

## Python Environment

```bash
cd oceanembed
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

## Frontend

```bash
cd frontend
npm install
```

## Environment Variables

```bash
cp .env.example .env
# Edit .env with your credentials and settings
```

## Copernicus Marine Account

1. Register at https://data.marine.copernicus.eu/
2. Set `CMEMS_USERNAME` and `CMEMS_PASSWORD` in `.env`
3. Run `python scripts/download_data.py --test` to verify access

## Running

### Backend
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run dev
```

### Training
```bash
python scripts/train.py --config configs/training.yaml
```

### Demo Mode
```bash
# Generate demo data
python scripts/generate_demo_data.py

# Run in demo mode
APP_MODE=demo uvicorn backend.app.main:app --reload
```

## Docker

```bash
docker-compose up --build
```

## Troubleshooting

- **CUDA not found**: Set `DEVICE=cpu` in `.env`
- **CMEMS access denied**: Verify credentials, check account activation email
- **npm install fails**: Delete `node_modules` and `package-lock.json`, retry
