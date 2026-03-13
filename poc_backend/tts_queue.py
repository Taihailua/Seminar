import multiprocessing as mp
import asyncio
import io
import time
import pyttsx3
from typing import Dict, Any, AsyncGenerator

def tts_worker(task_queue: mp.Queue, res_queue: mp.Queue):
    """
    The Consumer Process: Runs in a separate OS process, bypassing GIL.
    Listens for text tasks, processes them with pyttsx3, and returns audio bytes.
    """
    # Initialize the TTS engine per process
    engine = pyttsx3.init()
    
    while True:
        task = task_queue.get(block=True)
        # Poison pill check
        if task is None:
            break
            
        task_id = task.get("ID")
        text = task.get("Text_Content")
        lang = task.get("Language_Code")
        
        # Configure voice based on language
        voices = engine.getProperty('voices')
        selected_voice = voices[0].id # default
        
        for voice in voices:
            if lang == "vi" and "vi" in [lang.lower() for lang in voice.languages]:
                selected_voice = voice.id
                break
            elif lang == "en" and "en" in [lang.lower() for lang in voice.languages]:
                selected_voice = voice.id
                break
                
        engine.setProperty('voice', selected_voice)
        
        # Generate audio directly to a memory buffer 
        # (Note: pyttsx3 natively writes to file. Saving to a temp file and reading is standard)
        temp_file = f"temp_{task_id}.mp3"
        engine.save_to_file(text, temp_file)
        engine.runAndWait()
        
        # Read the generated file bytes
        try:
            with open(temp_file, "rb") as f:
                audio_bytes = f.read()
            res_queue.put({"ID": task_id, "status": "success", "audio": audio_bytes})
        except Exception as e:
            res_queue.put({"ID": task_id, "status": "error", "message": str(e)})

class TTSWorkerPool:
    """
    Producer/Consumer Task Queue using Python multiprocessing.
    """
    def __init__(self, num_workers: int = 4):
        self.num_workers = num_workers
        self.task_queue = mp.Queue()
        self.res_queue = mp.Queue()
        self.workers = []
        
        # We need a way to map tasks to asyncio futures
        self.pending_tasks = {}
        self.listener_task = None
        
    def start(self):
        """Pre-fork worker pool to avoid startup latency later."""
        for _ in range(self.num_workers):
            p = mp.Process(target=tts_worker, args=(self.task_queue, self.res_queue))
            p.daemon = True
            p.start()
            self.workers.append(p)
            
        # Start the background asyncio listener for results
        loop = asyncio.get_event_loop()
        self.listener_task = loop.create_task(self._listen_for_results())
            
    def shutdown(self):
        """Send poison pills to gracefully terminate processes."""
        for _ in range(self.num_workers):
            self.task_queue.put(None)
        
        for p in self.workers:
            p.join()
            
        if self.listener_task:
            self.listener_task.cancel()
            
    async def _listen_for_results(self):
        """Background asyncio loop to pick up results from the multiprocessing queue."""
        while True:
            # We use asyncio.sleep to not block the event loop while checking the queue
            if not self.res_queue.empty():
                result = self.res_queue.get()
                task_id = result["ID"]
                if task_id in self.pending_tasks:
                    future = self.pending_tasks[task_id]
                    future.set_result(result)
            await asyncio.sleep(0.01)

    def process_text(self, text: str, lang: str):
        """
        The Producer method.
        Pushes task to queue and waits for the result via asyncio Future.
        Returns the audio bytes as an async generator (streamable).
        """
        import uuid
        task_id = str(uuid.uuid4())
        
        task_dict = {
            "ID": task_id,
            "Text_Content": text,
            "Language_Code": lang
        }
        
        loop = asyncio.get_event_loop()
        future = loop.create_future()
        self.pending_tasks[task_id] = future
        
        # Enqueue to multiprocessing queue
        self.task_queue.put(task_dict)
        
        # We must return an async generator so FastAPI can stream it
        async def _audio_stream_generator():
            # Wait for the worker to complete
            result = await future
            del self.pending_tasks[task_id]
            
            if result.get("status") == "error":
                raise Exception(f"TTS Error: {result.get('message')}")
                
            # Return as streaming chunks
            audio_stream = io.BytesIO(result["audio"])
            chunk_size = 1024 * 64 # 64KB chunks
            while True:
                chunk = audio_stream.read(chunk_size)
                if not chunk:
                    break
                yield chunk
                
        return _audio_stream_generator()
