import os
import glob
import torch
import json
import numpy as np

def compute_normalization(corpus_dir="data/processed/benchmark"):
    print(f"Computing normalization statistics over {corpus_dir} ...")
    
    # We will use the benchmark dir for now since train/val/test are not yet generated
    files = glob.glob(os.path.join(corpus_dir, "*.pt"))
    
    if not files:
        print("No samples found. Cannot compute normalization.")
        return
        
    print(f"Found {len(files)} files.")
    
    channels = ["sst", "sss", "ssh", "wind_u", "wind_v", "current_u", "current_v"]
    
    # Running sums for Variance = E[X^2] - (E[X])^2
    # X shape is (T, C, H, W). We compute per-channel statistics.
    
    sum_x = torch.zeros(len(channels), dtype=torch.float64)
    sum_x2 = torch.zeros(len(channels), dtype=torch.float64)
    count = torch.zeros(len(channels), dtype=torch.float64)
    
    for f in files:
        sample = torch.load(f)
        X = sample["X"] # (T, C, H, W)
        masks = sample["masks"]
        
        # Accumulate statistics per channel
        for i, ch in enumerate(channels):
            m = masks[f"{ch}_mask"] # (T, H, W)
            
            # Extract only valid pixels for this channel across all timesteps
            valid_x = X[:, i, :, :][m == 1]
            
            if len(valid_x) > 0:
                sum_x[i] += valid_x.sum().double()
                sum_x2[i] += (valid_x ** 2).sum().double()
                count[i] += valid_x.numel()
                
    means = sum_x / count
    variances = (sum_x2 / count) - (means ** 2)
    stds = torch.sqrt(variances)
    
    print("\nNormalization Statistics:")
    results = {}
    for i, ch in enumerate(channels):
        print(f"[{ch}] Mean: {means[i]:.4f}, Std: {stds[i]:.4f}, Valid Pixels: {int(count[i])}")
        results[ch] = {
            "mean": float(means[i]),
            "std": float(stds[i]),
            "valid_pixels": int(count[i])
        }
        
    out_file = os.path.join(corpus_dir, "normalization.json")
    with open(out_file, "w") as f_out:
        json.dump(results, f_out, indent=4)
        
    print(f"Saved to {out_file}")

if __name__ == "__main__":
    compute_normalization()
