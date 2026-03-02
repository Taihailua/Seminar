import asyncio
import time
from rate_limiter import SlidingWindowRateLimiter

def test_sliding_window_rate_limiter():
    print("Testing Sliding Window Rate Limiter...")
    limiter = SlidingWindowRateLimiter(max_requests=2, window_ms=1000)
    client_ip = "192.168.1.1"

    assert limiter.is_allowed(client_ip) == True
    assert limiter.is_allowed(client_ip) == True
    assert limiter.is_allowed(client_ip) == False # 3rd request should fail
    
    print("Sleeping for 1.1 seconds to slide window...")
    time.sleep(1.1)
    
    assert limiter.is_allowed(client_ip) == True
    print("test_sliding_window_rate_limiter PASSED.")

if __name__ == "__main__":
    test_sliding_window_rate_limiter()
