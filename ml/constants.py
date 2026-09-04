"""OceanEmbed constants and shared configuration."""

import numpy as np

# Standard depths (meters)
STANDARD_DEPTHS = np.array([0, 5, 10, 20, 30, 50, 75, 100, 125, 150, 200, 300, 500, 700, 1000], dtype=np.float32)
NUM_DEPTHS = len(STANDARD_DEPTHS)

# Depth band indices for evaluation
SURFACE_INDICES = list(range(0, 6))       # 0–50m: indices 0-5
THERMOCLINE_INDICES = list(range(6, 12))  # 75–300m: indices 6-11
DEEP_INDICES = list(range(12, 15))        # 500–1000m: indices 12-14

# Input variables
INPUT_VARIABLES = ['sst', 'sss', 'ssh', 'current_u', 'current_v', 'wind_u', 'wind_v']
NUM_INPUT_CHANNELS = len(INPUT_VARIABLES)

# Target domain
DOMAIN = {
    'lat_min': 5.0,
    'lat_max': 30.0,
    'lon_min': 45.0,
    'lon_max': 105.0,
    'resolution': 0.25,
}

# Grid dimensions (full domain)
GRID_HEIGHT = 101   # lat points: (30 - 5) / 0.25 + 1
GRID_WIDTH = 241    # lon points: (105 - 45) / 0.25 + 1

# Development subset (Bay of Bengal)
DEV_DOMAIN = {
    'lat_min': 5.0,
    'lat_max': 20.0,
    'lon_min': 80.0,
    'lon_max': 95.0,
    'resolution': 0.25,
}

DEV_GRID_HEIGHT = 61   # (20 - 5) / 0.25 + 1
DEV_GRID_WIDTH = 61    # (95 - 80) / 0.25 + 1

# Physical bounds for sanity checks
TEMPERATURE_RANGE = (-2.0, 35.0)  # °C
SALINITY_RANGE = (0.0, 42.0)      # PSU
SSH_RANGE = (-3.0, 3.0)           # meters

# Default temporal window
DEFAULT_TEMPORAL_WINDOW = 7

# Default embedding dimension
DEFAULT_EMBEDDING_DIM = 128
