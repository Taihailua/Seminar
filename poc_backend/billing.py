import hashlib
import uuid
import asyncpg
from fastapi import HTTPException
from pydantic import BaseModel

DB_DSN = "postgresql://postgres:1234@localhost/vinh_khanh_poc"

def generate_device_hash(ip_addr: str, user_agent: str, accept_lang: str) -> str:
    """
    Device fingerprinting generation (SHA-256).
    """
    raw_str = f"{ip_addr}|{user_agent}|{accept_lang}"
    return hashlib.sha256(raw_str.encode('utf-8')).hexdigest()

async def process_scan_billing(merchant_id: str, user_agent: str, accept_lang: str, ip_addr: str, client_token: str = None) -> dict:
    """
    ACID transaction for first-time user billing with row-level locking.
    """
    device_hash = generate_device_hash(ip_addr, user_agent, accept_lang)
    
    # Generate new UUID Token if not provided
    is_new_token = False
    if not client_token:
        client_token = str(uuid.uuid4())
        is_new_token = True

    try:
        conn = await asyncpg.connect(DB_DSN)
        
        # Isolation level Serializable
        # Start Transaction using context manager
        async with conn.transaction(isolation='serializable'):
            # 1. Atomic check
            existing_log = await conn.fetchrow(
                "SELECT LogID FROM ScanLogs WHERE MerchantID = $1 AND (DeviceHash = $2 OR Token = $3)",
                merchant_id, device_hash, client_token
            )
            
            if not existing_log:
                # 2. First-time client logic -> Deduct fee
                # Row-level lock (FOR UPDATE)
                merchant = await conn.fetchrow(
                    "SELECT Balance FROM Merchants WHERE MerchantID = $1 FOR UPDATE",
                    merchant_id
                )
                
                if not merchant:
                    raise HTTPException(status_code=404, detail="Merchant not found")
                    
                new_balance = float(merchant['balance']) - 5.00 # Assume $5.00 fee
                
                # Update Balance
                await conn.execute(
                    "UPDATE Merchants SET Balance = $1 WHERE MerchantID = $2",
                    new_balance, merchant_id
                )
                
                # Insert Scan Log
                await conn.execute(
                    "INSERT INTO ScanLogs (MerchantID, DeviceHash, Token) VALUES ($1, $2, $3)",
                    merchant_id, device_hash, client_token
                )
                
                result_msg = "First-time visitor. Fee deducted."
            else:
                # 3. Returning client logic -> No fee deduction
                result_msg = "Returning visitor. Access granted."

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await conn.close()
        
    return {
        "status": "success",
        "message": result_msg,
        "token": client_token,
        "device_hash": device_hash
    }
