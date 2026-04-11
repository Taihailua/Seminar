import urllib.request
import urllib.error
import json

url = 'http://localhost:8001/api/auth/register'
data = json.dumps({
    'username': 'test1',
    'email': 'abc@gmail.com',
    'password': 'password123',
    'role': 'user'
}).encode()

req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    res = urllib.request.urlopen(req)
    print("Success:", res.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}:")
    print(e.read().decode())
except Exception as e:
    print("Error:", e)
