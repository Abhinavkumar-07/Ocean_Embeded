import subprocess
import json
import yaml
import pandas as pd

def check_coverage():
    print("Initializing Copernicus Marine Temporal Coverage Verification...")
    
    with open("configs/datasets.yaml", "r") as f:
        config = yaml.safe_load(f)
        
    datasets = {
        "GLORYS": config["datasets"]["glorys"]["dataset_id"],
        "SST": config["datasets"]["ostia"]["dataset_id"],
        "SSS": config["datasets"]["sss"]["dataset_id"],
        "SSH": config["datasets"]["ssh"]["dataset_id"],
        "WIND": config["datasets"]["ascat"]["dataset_id"],
        "CURRENT": config["datasets"]["globcurrent"]["dataset_id"]
    }
    
    required_start = pd.to_datetime("2018-01-01T00:00:00", utc=True)
    required_end = pd.to_datetime("2022-12-31T23:59:59", utc=True)
    
    all_ok = True
    
    for name, dataset_id in datasets.items():
        print(f"\n=========================================")
        print(f"Checking {name}: {dataset_id}")
        print(f"=========================================")
        
        try:
            result = subprocess.run(
                ["copernicusmarine", "describe", "--dataset-id", dataset_id],
                capture_output=True, text=True, check=False
            )
            data = json.loads(result.stdout)
            
            # The structure is data["products"][0]["datasets"][0]["versions"][0]["parts"][0]["services"][0]["variables"][0]["coordinates"]
            # To be robust, let's just search the JSON string recursively for "coordinate_id": "time"
            def find_time_coord(d):
                if isinstance(d, dict):
                    if d.get("coordinate_id") == "time":
                        return d
                    for k, v in d.items():
                        res = find_time_coord(v)
                        if res: return res
                elif isinstance(d, list):
                    for item in d:
                        res = find_time_coord(item)
                        if res: return res
                return None
                
            time_info = find_time_coord(data)
            
            if time_info and "minimum_value" in time_info and "maximum_value" in time_info:
                # Value is usually in milliseconds since epoch or seconds since epoch
                unit = time_info.get("coordinate_unit", "")
                min_val = time_info["minimum_value"]
                max_val = time_info["maximum_value"]
                
                if "milliseconds" in unit:
                    start_dt = pd.to_datetime(min_val, unit='ms', utc=True)
                    end_dt = pd.to_datetime(max_val, unit='ms', utc=True)
                elif "seconds" in unit:
                    start_dt = pd.to_datetime(min_val, unit='s', utc=True)
                    end_dt = pd.to_datetime(max_val, unit='s', utc=True)
                else:
                    print(f"Unknown time unit: {unit}. Assuming milliseconds.")
                    start_dt = pd.to_datetime(min_val, unit='ms', utc=True)
                    end_dt = pd.to_datetime(max_val, unit='ms', utc=True)
                    
                print(f"Dataset reported start: {start_dt}")
                print(f"Dataset reported end:   {end_dt}")
                
                meets_start = start_dt <= required_start
                meets_end = end_dt >= required_end
                
                print(f"Covers 2018-01-01? {'YES' if meets_start else 'NO'} (diff: {(start_dt - required_start).days} days)")
                print(f"Covers 2022-12-31? {'YES' if meets_end else 'NO'} (diff: {(end_dt - required_end).days} days)")
                
                if not (meets_start and meets_end):
                    print(f"ERROR: {name} does NOT cover the required 2018-2022 range.")
                    all_ok = False
            else:
                print(f"Could not extract time coordinate info from JSON for {dataset_id}")
                all_ok = False
                
        except Exception as e:
            print(f"Failed to query {dataset_id}: {str(e)}")
            all_ok = False
            
    print("\n-----------------------------------------")
    if all_ok:
        print("[PASS] ALL DATASETS COVER THE 2018-2022 REQUIRED PERIOD.")
    else:
        print("[FAIL] ONE OR MORE DATASETS CANNOT SUPPORT THE 2018-2022 PERIOD.")

if __name__ == "__main__":
    check_coverage()
