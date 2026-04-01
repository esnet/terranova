"""
Tests for CORS configuration.

Verifies that:
- In dev environment (SAMPLE_CONFIG.yml), localhost origins receive CORS headers
- TERRANOVA_CORS_ORIGINS env var is parsed correctly (comma-split, whitespace-stripped)
"""

import pytest


def _parse_cors_origins(raw: str):
    """Mirror the parsing logic in terranova/api/api.py"""
    return [o.strip() for o in raw.split(",")]


class TestCORSOriginParsing:
    """Unit tests for the origin list parsing logic"""

    def test_single_origin(self):
        result = _parse_cors_origins("http://example.com")
        assert result == ["http://example.com"]

    def test_multiple_origins(self):
        result = _parse_cors_origins("http://example.com,http://other.com:3000")
        assert result == ["http://example.com", "http://other.com:3000"]

    def test_whitespace_stripped(self):
        result = _parse_cors_origins("http://example.com, http://other.com")
        assert result == ["http://example.com", "http://other.com"]

    def test_trailing_whitespace(self):
        result = _parse_cors_origins("  http://example.com  ,  http://other.com  ")
        assert result == ["http://example.com", "http://other.com"]

    def test_with_port(self):
        result = _parse_cors_origins("http://localhost:9999")
        assert result == ["http://localhost:9999"]


class TestCORSHeaders:
    """Integration tests verifying CORS headers via the FastAPI test client"""

    def test_dev_mode_allows_localhost_vite(self, client):
        """In dev environment, requests from the Vite dev server origin get CORS headers"""
        response = client.get(
            "/public/maps/",
            headers={"Origin": "http://localhost:5173"},
        )
        assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"

    def test_dev_mode_allows_localhost_3001(self, client):
        """In dev environment, requests from localhost:3001 get CORS headers"""
        response = client.get(
            "/public/maps/",
            headers={"Origin": "http://localhost:3001"},
        )
        assert response.headers.get("access-control-allow-origin") == "http://localhost:3001"

    def test_dev_mode_rejects_unknown_origin(self, client):
        """In dev environment, unknown origins do not receive CORS headers"""
        response = client.get(
            "/public/maps/",
            headers={"Origin": "http://attacker.com"},
        )
        # The response still succeeds (the API requires auth, not CORS),
        # but the Access-Control-Allow-Origin header should not be set to attacker.com
        allow_origin = response.headers.get("access-control-allow-origin", "")
        assert allow_origin != "http://attacker.com"
