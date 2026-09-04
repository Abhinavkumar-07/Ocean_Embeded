"""
Quality control for ocean observation datasets.

Implements explicit checks for data integrity and
generates quality reports.
"""

import numpy as np
import xarray as xr
from typing import Dict, List, Optional
from dataclasses import dataclass, field

from ml.constants import TEMPERATURE_RANGE, SALINITY_RANGE, SSH_RANGE


@dataclass
class QualityReport:
    """Quality control report for a dataset."""
    dataset_name: str
    total_points: int = 0
    variables: Dict[str, dict] = field(default_factory=dict)
    issues: List[str] = field(default_factory=list)
    passed: bool = True

    def add_variable_stats(self, name: str, data: np.ndarray, valid_range: tuple = None):
        """Compute and store quality statistics for a variable."""
        total = data.size
        missing = int(np.isnan(data).sum())
        missing_pct = (missing / total * 100) if total > 0 else 0

        valid_data = data[~np.isnan(data)]
        stats = {
            'total_points': total,
            'missing_points': missing,
            'missing_pct': round(missing_pct, 2),
            'min': float(np.min(valid_data)) if len(valid_data) > 0 else None,
            'max': float(np.max(valid_data)) if len(valid_data) > 0 else None,
            'mean': float(np.mean(valid_data)) if len(valid_data) > 0 else None,
            'std': float(np.std(valid_data)) if len(valid_data) > 0 else None,
        }

        # Range check
        if valid_range and len(valid_data) > 0:
            below = int(np.sum(valid_data < valid_range[0]))
            above = int(np.sum(valid_data > valid_range[1]))
            stats['out_of_range'] = below + above
            stats['valid_range'] = valid_range
            
            if below + above > 0:
                self.issues.append(
                    f"{name}: {below + above} values outside range "
                    f"[{valid_range[0]}, {valid_range[1]}]"
                )
                self.passed = False

        # Fill value check
        common_fill_values = [-9999, -999, 9999, -1e30, 1e30]
        for fv in common_fill_values:
            count = int(np.sum(np.isclose(valid_data, fv, atol=1e-5)))
            if count > 0:
                self.issues.append(f"{name}: {count} possible fill values ({fv})")
                stats['fill_value_count'] = count

        self.variables[name] = stats
        self.total_points += total

    def summary(self) -> str:
        """Generate text summary."""
        lines = [
            f"Dataset Quality Report: {self.dataset_name}",
            f"Status: {'PASSED' if self.passed else 'ISSUES FOUND'}",
            "",
            f"{'Variable':<15} {'Missing %':>10} {'Min':>10} {'Max':>10} {'Mean':>10}",
            "-" * 60,
        ]
        
        for name, stats in self.variables.items():
            missing = f"{stats['missing_pct']:.1f}%"
            vmin = f"{stats['min']:.2f}" if stats['min'] is not None else "N/A"
            vmax = f"{stats['max']:.2f}" if stats['max'] is not None else "N/A"
            vmean = f"{stats['mean']:.2f}" if stats['mean'] is not None else "N/A"
            lines.append(f"{name:<15} {missing:>10} {vmin:>10} {vmax:>10} {vmean:>10}")

        if self.issues:
            lines.extend(["", "Issues:"])
            for issue in self.issues:
                lines.append(f"  ⚠ {issue}")

        return "\n".join(lines)


def run_quality_control(
    ds: xr.Dataset,
    dataset_name: str = "unknown",
    variable_ranges: Optional[Dict[str, tuple]] = None,
) -> QualityReport:
    """
    Run quality control on a dataset.
    
    Args:
        ds: xarray Dataset
        dataset_name: name for the report
        variable_ranges: dict of variable_name -> (min, max) valid ranges
    """
    if variable_ranges is None:
        variable_ranges = {
            'sst': TEMPERATURE_RANGE,
            'analysed_sst': TEMPERATURE_RANGE,
            'thetao': TEMPERATURE_RANGE,
            'sss': SALINITY_RANGE,
            'sos': SALINITY_RANGE,
            'ssh': SSH_RANGE,
            'sla': SSH_RANGE,
            'adt': SSH_RANGE,
        }

    report = QualityReport(dataset_name=dataset_name)

    for var_name in ds.data_vars:
        data = ds[var_name].values
        valid_range = variable_ranges.get(var_name)
        report.add_variable_stats(var_name, data, valid_range)

    # Check for duplicate timestamps
    if 'time' in ds.coords:
        times = ds.time.values
        unique_times = np.unique(times)
        if len(times) != len(unique_times):
            n_dups = len(times) - len(unique_times)
            report.issues.append(f"Found {n_dups} duplicate timestamps")
            report.passed = False

    # Check coordinate consistency
    if 'lon' in ds.coords:
        lon_diff = np.diff(ds.lon.values)
        if not np.allclose(lon_diff, lon_diff[0], atol=1e-4):
            report.issues.append("Irregular longitude spacing detected")

    if 'lat' in ds.coords:
        lat_diff = np.diff(ds.lat.values)
        if not np.allclose(lat_diff, lat_diff[0], atol=1e-4):
            report.issues.append("Irregular latitude spacing detected")

    return report
