"""
Tests for the FastAPI backend endpoints.
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


class TestHealthEndpoint:
    def test_health_returns_200(self):
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_response_structure(self):
        response = client.get("/health")
        data = response.json()
        assert "status" in data
        assert "version" in data
        assert data["status"] == "healthy"


class TestMetadataEndpoint:
    def test_metadata_returns_200(self):
        response = client.get("/metadata")
        assert response.status_code == 200

    def test_metadata_has_depths(self):
        response = client.get("/metadata")
        data = response.json()
        assert "depths" in data
        assert len(data["depths"]) == 15

    def test_metadata_has_region(self):
        response = client.get("/metadata")
        data = response.json()
        assert "region" in data
        assert data["region"]["lat_min"] == 5.0
        assert data["region"]["lat_max"] == 30.0

    def test_grid_returns_200(self):
        response = client.get("/grid")
        assert response.status_code == 200
        data = response.json()
        assert "latitudes" in data
        assert "longitudes" in data
        assert "depths" in data


class TestProfileEndpoint:
    def test_invalid_latitude_returns_400(self):
        response = client.get("/profile?latitude=50.0&longitude=80.0&date=2020-01-01")
        assert response.status_code == 400

    def test_invalid_longitude_returns_400(self):
        response = client.get("/profile?latitude=15.0&longitude=200.0&date=2020-01-01")
        assert response.status_code == 400


class TestMetricsEndpoint:
    def test_metrics_returns_200(self):
        response = client.get("/metrics")
        assert response.status_code == 200


class TestQualityEndpoint:
    def test_quality_returns_200(self):
        response = client.get("/data-quality")
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
