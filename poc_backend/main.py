from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any
import uuid

# Internal services
from billing import process_scan_billing
from rate_limiter import SlidingWindowRateLimiter
from language_detector import detect_language
from tts_queue import TTSWorkerPool

app = FastAPI(title="Vinh Khanh Audio Guide POC")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rate_limiter = SlidingWindowRateLimiter(max_requests=10, window_ms=60000)
tts_pool = TTSWorkerPool(num_workers=4)

@app.on_event("startup")
async def startup_event():
    # Start the worker processes when the server starts
    tts_pool.start()

@app.on_event("shutdown")
async def shutdown_event():
    # Send poison pills and join the processes
    tts_pool.shutdown()

@app.get("/scan")
async def handle_scan(request: Request, merchant_id: str, client_token: str = None):
    """
    Handle the initial QR scan event.
    Extracts fingerprint, checks rate limit, and triggers billing transaction.
    """
    # 1. Device fingerprinting implementation (Backend portion)
    user_agent = request.headers.get("user-agent", "")
    accept_lang = request.headers.get("accept-language", "")
    ip_addr = request.client.host
    
    # 2. Rate Limiting via Sliding Window Log
    # Combine IP and base fingerprint for rate limiter key
    client_key = f"{ip_addr}_{hash(user_agent)}"
    if not rate_limiter.is_allowed(client_key):
        raise HTTPException(status_code=429, detail="Too Many Requests")
    
    # 3. Process Billing
    result = await process_scan_billing(
        merchant_id=merchant_id,
        user_agent=user_agent,
        accept_lang=accept_lang,
        ip_addr=ip_addr,
        client_token=client_token
    )
    
    return result

@app.post("/audio/stream")
async def stream_audio(request: Request, payload: Dict[str, Any]):
    """
    Accepts text payload and pushes to Multiprocessing queue for TTS conversion.
    Returns a stream of the generated MP3 file chunks.
    """
    text = payload.get("text")
    if not text:
        raise HTTPException(status_code=400, detail="Missing text payload")
        
    client_key = f"{request.client.host}_{hash(request.headers.get('user-agent', ''))}"
    if not rate_limiter.is_allowed(client_key):
        raise HTTPException(status_code=429, detail="Too Many Requests")

    lang_code = payload.get("lang")
    if not lang_code:
        # Fallback to detector
        lang_code = detect_language(request.headers, request.client.host)
        
    # We must not await an async generator. Instead, we call it to get the generator object,
    # and pass the generator object directly to StreamingResponse.
    audio_generator = tts_pool.process_text(text, lang_code)
    
    return StreamingResponse(audio_generator, media_type="audio/mpeg")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
