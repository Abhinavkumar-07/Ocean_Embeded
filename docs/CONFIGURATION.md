# CONFIGURATION

## Config Files

All experiment parameters are defined in YAML files under `configs/`.

### `configs/data.yaml`
Data pipeline configuration: regions, resolution, variables, date ranges.

### `configs/model.yaml`
Model architecture: embedding dim, encoder params, decoder params.

### `configs/training.yaml`
Training hyperparameters: LR, batch size, epochs, loss, optimizer.

### `configs/demo.yaml`
Demo mode settings: pre-computed dates, locations, display options.

## Environment Variables

See `.env.example` for supported application variables:
- `APP_MODE` — development / production / demo
- `MODEL_CHECKPOINT` — path to model weights
- `DEVICE` — cpu / cuda / cuda:0

> **Note on Data Credentials**: We use the official `copernicusmarine` toolbox. Do not hardcode credentials. Use `copernicusmarine login` locally, or export `COPERNICUSMARINE_SERVICE_USERNAME` and `COPERNICUSMARINE_SERVICE_PASSWORD`.

## Precedence

1. Environment variables override config files
2. CLI arguments override environment variables
3. Config files provide defaults
