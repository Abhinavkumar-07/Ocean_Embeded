import os
import numpy as np

dirs = ['data/samples/train', 'data/samples/val']
for d in dirs:
    if os.path.exists(d):
        for f in os.listdir(d):
            if f.endswith('.npz'):
                p = os.path.join(d, f)
                try:
                    _ = np.load(p, allow_pickle=True)
                except Exception as e:
                    print(f"Removing corrupt file: {p}")
                    os.remove(p)
