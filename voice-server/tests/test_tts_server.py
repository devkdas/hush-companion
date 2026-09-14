"""
Unit tests for voice-server/tts_server.py.
Uses FastAPI's TestClient (via httpx) — no real server or Kokoro model needed.
The KPipeline is mocked so tests run without GPU/model weights.
"""
import io
import numpy as np
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient


# ── helpers ────────────────────────────────────────────────────────────────────
def _make_pipeline_mock(audio: np.ndarray | None = None):
    """Return a KPipeline mock that yields one chunk of audio."""
    if audio is None:
        audio = np.zeros(24000, dtype=np.float32)  # 1 second of silence at 24 kHz
    mock = MagicMock()
    mock.return_value = iter([("text", "phonemes", audio)])
    return mock


# ── fixtures ───────────────────────────────────────────────────────────────────
@pytest.fixture
def client():
    """TestClient with KPipeline fully mocked (no model weights loaded)."""
    with patch("voice_server.tts_server.KPipeline", _make_pipeline_mock()):
        import importlib
        import voice_server.tts_server as module
        importlib.reload(module)
        yield TestClient(module.app)


# ── /health ────────────────────────────────────────────────────────────────────
class TestHealth:
    def test_returns_ok(self, client):
        res = client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["ok"] is True
        assert "engine" in data
        assert "voices" in data


# ── /tts validation ────────────────────────────────────────────────────────────
class TestTTSValidation:
    def test_rejects_empty_text(self, client):
        res = client.post("/tts", json={"text": ""})
        assert res.status_code == 422  # Pydantic min_length=1

    def test_rejects_text_over_4000_chars(self, client):
        res = client.post("/tts", json={"text": "a" * 4001})
        assert res.status_code == 422

    def test_rejects_unknown_voice(self, client):
        res = client.post("/tts", json={"text": "Hello", "voice": "robot"})
        assert res.status_code == 422

    def test_accepts_valid_system_voice(self, client):
        res = client.post("/tts", json={"text": "Hello world", "voice": "system"})
        assert res.status_code == 200
        assert res.headers["content-type"] == "audio/wav"

    def test_accepts_valid_male_voice(self, client):
        res = client.post("/tts", json={"text": "Hello", "voice": "male"})
        assert res.status_code == 200

    def test_accepts_valid_female_voice(self, client):
        res = client.post("/tts", json={"text": "Hello", "voice": "female"})
        assert res.status_code == 200

    def test_default_voice_is_system(self, client):
        """When voice is omitted, the server should still succeed (defaults to system)."""
        res = client.post("/tts", json={"text": "Hello"})
        assert res.status_code == 200

    def test_accepts_text_at_max_length(self, client):
        res = client.post("/tts", json={"text": "a" * 4000})
        assert res.status_code == 200

    def test_response_is_wav_bytes(self, client):
        res = client.post("/tts", json={"text": "Test audio output"})
        assert res.status_code == 200
        # WAV files start with the RIFF header
        assert res.content[:4] == b"RIFF"

    def test_api_tts_route_also_works(self, client):
        """Both /tts and /api/tts should be registered."""
        res = client.post("/api/tts", json={"text": "Hello"})
        assert res.status_code == 200


# ── error handling ─────────────────────────────────────────────────────────────
class TestTTSErrorHandling:
    def test_pipeline_error_returns_500(self):
        """When KPipeline raises, the endpoint should return HTTP 500."""
        bad_pipeline = MagicMock(side_effect=RuntimeError("model crashed"))
        with patch("voice_server.tts_server.KPipeline", bad_pipeline):
            import importlib
            import voice_server.tts_server as module
            importlib.reload(module)
            # Force pipeline to be None so get_pipeline() will call KPipeline()
            module.pipeline = None
            c = TestClient(module.app, raise_server_exceptions=False)
            res = c.post("/tts", json={"text": "Hello"})
            assert res.status_code == 500

    def test_empty_audio_chunks_returns_500(self):
        """If KPipeline yields no chunks, endpoint should return HTTP 500."""
        empty_pipeline = MagicMock(return_value=iter([]))
        with patch("voice_server.tts_server.KPipeline", empty_pipeline):
            import importlib
            import voice_server.tts_server as module
            importlib.reload(module)
            module.pipeline = None
            c = TestClient(module.app, raise_server_exceptions=False)
            res = c.post("/tts", json={"text": "Hello"})
            assert res.status_code == 500
