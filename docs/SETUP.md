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

## Copernicus Marine Account Setup

To download real ocean datasets, you must authenticate with the Copernicus Marine Environment Monitoring Service (CMEMS).
Do NOT place your password in source code or commit it to version control.

1. Create or sign into your account at [data.marine.copernicus.eu](https://data.marine.copernicus.eu/).
2. Ensure the Copernicus Marine Toolbox is installed (`pip install copernicusmarine`).
3. Run the local login command in your terminal:
   ```bash
   copernicusmarine login
   ```
   This will securely store your credentials in your local user directory.
4. Alternatively, you can use the standard environment variables:
   ```bash
   export COPERNICUSMARINE_SERVICE_USERNAME="your_username"
   export COPERNICUSMARINE_SERVICE_PASSWORD="your_password"
   ```
5. Verify authentication by running the dataset inspection script:
   ```bash
   python scripts/inspect_dataset.py --verify-auth
   ```
6. Only after verification, run the tiny Bay of Bengal dataset download.

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
