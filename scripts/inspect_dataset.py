"""
Dataset Inspection Script.

Validates a downloaded NetCDF file against the Canonical Schema, checks for
missing variables/dimensions, and reports missing data (NaN) percentages.

Usage:
    python scripts/inspect_dataset.py --verify-auth
    python scripts/inspect_dataset.py data/raw/my_dataset.nc --type cmems --config glorys
"""

import argparse
import sys
import yaml
import os
import json
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.data.adapters import CMEMSAdapter, ArgoAdapter, MockSurfaceAdapter, MockSubsurfaceAdapter


def verify_authentication():
    """Verify CMEMS authentication."""
    print("Verifying CMEMS Authentication...")
    try:
        import copernicusmarine
        # This will check credentials (stored via `login` or via env vars).
        # We can test it by attempting to read a lightweight catalogue.
        print("copernicusmarine package is installed.")
        # Attempting to check if credentials are valid
        copernicusmarine.login()
        print("✅ Authentication successful. Credentials are valid.")
    except ImportError:
        print("❌ ERROR: copernicusmarine package is not installed.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        print("\nPlease run 'copernicusmarine login' or set COPERNICUSMARINE_SERVICE_USERNAME/PASSWORD.")
        sys.exit(1)


def inspect_file(filepath: str, adapter_type: str, config_name: str):
    """Load the file with the specified adapter and print an inspection report."""
    
    # Load dataset mapping configs
    config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'configs', 'datasets.yaml')
    if not os.path.exists(config_path):
        print(f"ERROR: Cannot find config file at {config_path}")
        sys.exit(1)
        
    with open(config_path, 'r') as f:
        datasets_config = yaml.safe_load(f).get('datasets', {})
        
    if config_name not in datasets_config and adapter_type not in ['mock_surface', 'mock_subsurface']:
        print(f"ERROR: Config '{config_name}' not found in datasets.yaml.")
        sys.exit(1)
        
    config = datasets_config.get(config_name, {})
    
    # Select adapter
    if adapter_type == 'cmems':
        adapter = CMEMSAdapter(config_name, config)
    elif adapter_type == 'argo':
        adapter = ArgoAdapter(config_name, config)
    elif adapter_type == 'mock_surface':
        adapter = MockSurfaceAdapter(config_name, config)
    elif adapter_type == 'mock_subsurface':
        adapter = MockSubsurfaceAdapter(config_name, config)
    else:
        print(f"ERROR: Unknown adapter type '{adapter_type}'")
        sys.exit(1)

    print(f"\n--- Loading {filepath} with {adapter.__class__.__name__} ---")
    try:
        adapter.load(filepath)
    except Exception as e:
        print(f"❌ Failed to load dataset: {e}")
        sys.exit(1)

    # 1. Normalize Coordinates & Select Variables
    print("\nApplying coordinate normalization...")
    adapter.normalize_coordinates()
    
    print("Applying variable selection mapping...")
    adapter.select_variables()

    # 2. Get Provenance
    print("\n--- Provenance Metadata ---")
    try:
        prov = adapter.get_provenance()
        print(json.dumps(prov, indent=2))
    except Exception as e:
        print(f"Warning: Failed to extract provenance: {e}")

    # 3. Quality Report
    print("\n--- Quality Report (NaN counts) ---")
    try:
        report = adapter.quality_control()
        print(report.summary())
    except Exception as e:
        print(f"Warning: Failed to generate quality report: {e}")

    # 4. Check for strict canonical coords
    ds = adapter.dataset
    expected_coords = {'lon', 'lat', 'time'}
    
    if adapter_type == 'cmems' and config_name == 'glorys':
        expected_coords.add('depth')
        
    missing_coords = expected_coords - set(ds.coords.keys())
    if missing_coords:
        print(f"\n❌ Canonical Validation FAILED. Missing canonical coordinates: {missing_coords}")
        sys.exit(1)
    else:
        print("\n✅ Canonical coordinate validation passed.")

    print("\n✅ Inspection complete.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Inspect ocean datasets.")
    parser.add_argument("filepath", nargs="?", help="Path to the NetCDF file to inspect.")
    parser.add_argument("--type", choices=['cmems', 'argo', 'mock_surface', 'mock_subsurface'], default='cmems', help="Adapter type.")
    parser.add_argument("--config", default='glorys', help="Key in configs/datasets.yaml (e.g. glorys, ostia, argo)")
    parser.add_argument("--verify-auth", action="store_true", help="Only verify CMEMS authentication.")
    
    args = parser.parse_args()
    
    if args.verify_auth:
        verify_authentication()
        if not args.filepath:
            sys.exit(0)
            
    if not args.filepath:
        parser.print_help()
        sys.exit(1)
        
    inspect_file(args.filepath, args.type, args.config)
