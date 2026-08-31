from io import BytesIO
import os

import soundfile as sf
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from kokoro import KPipeline
from pydantic import BaseModel, Field


app = FastAPI(title="Hush Companion local Kokoro TTS")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_methods=["POST"], allow_headers=["*"])

LANG_CODE = os.getenv("HUSH_KOKORO_LANG", "a")
VOICE_MAP = {"system": os.getenv("HUSH_KOKORO_SYSTEM_VOICE", "af_heart"), "female": os.getenv("HUSH_KOKORO_FEMALE_VOICE", "af_heart"), "male": os.getenv("HUSH_KOKORO_MALE_VOICE", "am_adam")}
pipeline = None

class TTSRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    voice: str = Field(default="system", pattern="^(system|male|female)$")

@app.get("/health")
def health():
    return {"ok": True, "model_loaded": pipeline is not None, "engine": "kokoro", "voices": VOICE_MAP}

def get_pipeline():
    global pipeline
    if pipeline is None:
        pipeline = KPipeline(lang_code=LANG_CODE)
    return pipeline

@app.post("/tts")
@app.post("/api/tts")
def tts(request: TTSRequest):
    try:
        current_pipeline = get_pipeline()
        generator = current_pipeline(request.text, voice=VOICE_MAP[request.voice], speed=1.0)
        audio_chunks = [audio for _, _, audio in generator]
        if not audio_chunks:
            raise HTTPException(status_code=500, detail="Kokoro returned no audio")
        import numpy as np
        samples = np.concatenate(audio_chunks)
        output = BytesIO()
        sf.write(output, samples, 24000, format="WAV")
        return Response(content=output.getvalue(), media_type="audio/wav")
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error)) from error
