"""
utils/qr_generator.py — Generate QR code PNG and return base64 data URL
"""
import io
import base64
import os
import qrcode
from dotenv import load_dotenv

load_dotenv()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5500")


def generate_qr_base64(restaurant_id: str) -> str:
    """
    Generate a QR code that encodes the restaurant detail URL.
    Returns a base64-encoded PNG data URI.
    """
    url = f"{FRONTEND_URL}/pages/restaurant.html?id={restaurant_id}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)

    b64 = base64.b64encode(buffer.read()).decode("utf-8")
    return f"data:image/png;base64,{b64}"
