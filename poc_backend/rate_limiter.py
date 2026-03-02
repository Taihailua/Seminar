import time
from collections import deque
import threading

class SlidingWindowRateLimiter:
    """
    Sliding Window Log Rate Limiter
    Tracks exact timestamps of valid requests. Uses deque for O(1) ops.
    Implementation as specified in the PRD (Anti-Spam).
    """
    def __init__(self, max_requests: int, window_ms: int):
        self.max_requests = max_requests
        self.window_ms = window_ms
        self.logs = {}  # Format: { client_key: deque([timestamp1, timestamp2, ...]) }
        self.lock = threading.Lock() # Thread-safe operations for FastAPI async calls
    
    def is_allowed(self, client_key: str) -> bool:
        current_time = time.time() * 1000  # Convert to milliseconds
        
        with self.lock:
            # 1. Initialize empty deque if new client
            if client_key not in self.logs:
                self.logs[client_key] = deque()
                
            client_log = self.logs[client_key]
            
            # 2. Pruning: pop old timestamps outside the window
            window_start = current_time - self.window_ms
            while client_log and client_log[0] <= window_start:
                client_log.popleft()
                
            # 3. Threshold Evaluation
            if len(client_log) >= self.max_requests:
                return False  # Target reached, deny access
                
            # Valid request: Append timestamp and allow
            client_log.append(current_time)
            return True
