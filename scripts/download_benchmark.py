import subprocess
import yaml
import os

def download_benchmark():
    with open("configs/datasets.yaml", "r") as f:
        config = yaml.safe_load(f)

    # Full Canonical Bounding Box
    lon_min, lon_max = 45.0, 105.0
    lat_min, lat_max = 5.0, 30.0

    # 7-day Benchmark Period (yields exactly 1 valid 7-day sample)
    start_date = "2018-01-01T00:00:00"
    end_date = "2018-01-07T23:59:59"

    datasets = {
        "glorys": config["datasets"]["glorys"]["dataset_id"],
        "sst": config["datasets"]["ostia"]["dataset_id"],
        "sss": config["datasets"]["sss"]["dataset_id"],
        "ssh": config["datasets"]["ssh"]["dataset_id"],
        "wind": config["datasets"]["ascat"]["dataset_id"],
        "current": config["datasets"]["globcurrent"]["dataset_id"],
    }

    out_dir = "data/benchmark"
    os.makedirs(out_dir, exist_ok=True)

    for name, dataset_id in datasets.items():
        print(f"\nDownloading Benchmark Subset: {name} ({dataset_id})")
        out_name = f"{name}_benchmark.nc"
        
        # We need depth up to 1100 for glorys
        depth_args = []
        if name == "glorys":
            depth_args = ["--minimum-depth", "0.0", "--maximum-depth", "1100.0"]

        cmd = [
            "copernicusmarine", "subset",
            "--dataset-id", dataset_id,
            "--start-datetime", start_date,
            "--end-datetime", end_date,
            "--minimum-longitude", str(lon_min),
            "--maximum-longitude", str(lon_max),
            "--minimum-latitude", str(lat_min),
            "--maximum-latitude", str(lat_max),
            "--output-directory", out_dir,
            "--output-filename", out_name,
            "--force-download"
        ] + depth_args

        print("Running:", " ".join(cmd))
        subprocess.run(cmd, check=True)
        
    print("\nBenchmark download complete!")

if __name__ == "__main__":
    download_benchmark()
