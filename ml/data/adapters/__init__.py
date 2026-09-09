"""Dataset adapter base class and implementations."""

from .base import DatasetAdapter, QualityReport
from .mock import MockSurfaceAdapter, MockSubsurfaceAdapter
from .cmems import CMEMSAdapter
from .argo import ArgoAdapter

__all__ = [
    'DatasetAdapter',
    'QualityReport',
    'MockSurfaceAdapter',
    'MockSubsurfaceAdapter',
    'CMEMSAdapter',
    'ArgoAdapter'
]
