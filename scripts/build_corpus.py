import time
import os
import glob
import torch
import pandas as pd
import psutil
from ml.data.adapters.real_data_adapter import RealDataAdapter

def benchmark_corpus_generation():
    print("Initializing Corpus Generation Benchmark...")
    
    benchmark_paths = {
        "sst": "data/benchmark/sst_benchmark.nc",
        "sss": "data/benchmark/sss_benchmark.nc",
        "ssh": "data/benchmark/ssh_benchmark.nc",
        "wind": "data/benchmark/wind_benchmark.nc",
        "current": "data/benchmark/current_benchmark.nc",
        "glorys": "data/benchmark/glorys_benchmark.nc"
    }
    
    # Check if files exist
    for k, v in benchmark_paths.items():
        if not os.path.exists(v):
            print(f"Waiting for {v} to be downloaded...")
            return
            
    out_dir = "data/processed/benchmark"
    os.makedirs(out_dir, exist_ok=True)
    
    adapter = RealDataAdapter()
    
    t0 = time.time()
    print("Loading and canonicalizing datasets...")
    canonical_data = adapter.load_and_canonicalize(benchmark_paths)
    t1 = time.time()
    
    print(f"Canonicalization took {t1 - t0:.2f} seconds.")
    
    process = psutil.Process()
    ram_mb = process.memory_info().rss / (1024 * 1024)
    print(f"RAM consumption after loading: {ram_mb:.2f} MB")
    
    # Generate dates. Need 7 days of input, so first target is Jan 7.
    dates = pd.date_range(start="2018-01-07", end="2018-01-07", freq="D")
    
    total_time = 0.0
    total_size = 0.0
    num_samples = 0
    
    print(f"Processing {len(dates)} samples...")
    
    for dt in dates:
        target_str = dt.strftime("%Y-%m-%dT%H:%M:%S")
        
        t_start = time.time()
        try:
            X, Y, masks = adapter.create_sample(canonical_data, target_str)
            
            sample_data = {
                "X": X,
                "Y": Y,
                "masks": masks
            }
            
            out_file = os.path.join(out_dir, f"sample_{dt.strftime('%Y%m%d')}.pt")
            torch.save(sample_data, out_file)
            
            t_end = time.time()
            
            file_size_mb = os.path.getsize(out_file) / (1024 * 1024)
            
            total_time += (t_end - t_start)
            total_size += file_size_mb
            num_samples += 1
            
        except KeyError as e:
            # If the dataset is missing a boundary date (like the last day)
            print(f"Skipping {target_str} due to missing data: {e}")
            pass
            
    if num_samples > 0:
        avg_time = total_time / num_samples
        avg_size = total_size / num_samples
        
        print("\n=========================================")
        print("BENCHMARK RESULTS")
        print("=========================================")
        print(f"Total Samples Generated: {num_samples}")
        print(f"Processing Time / Sample: {avg_time:.4f} seconds")
        print(f"Disk Size / Sample: {avg_size:.4f} MB")
        print(f"RAM Consumption: {ram_mb:.2f} MB")
        
        daily_samples = 1 # We produce 1 sample per day
        total_days = 365 * 5 # 2018-2022
        
        est_total_storage_mb = avg_size * total_days
        est_total_storage_gb = est_total_storage_mb / 1024
        
        est_total_time_sec = avg_time * total_days
        est_total_time_min = est_total_time_sec / 60
        
        print("\nPROJECTED (2018-2022)")
        print(f"Estimated 5-Year Storage: {est_total_storage_gb:.2f} GB")
        print(f"Estimated 5-Year Processing Time: {est_total_time_min:.2f} minutes")
        
if __name__ == "__main__":
    benchmark_corpus_generation()
