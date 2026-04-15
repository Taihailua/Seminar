import asyncio
import os
import sys

# Ensure backend folder is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from database import engine

async def migrate_db():
    print("Đang kết nối tới Database (trên Render)...")
    async with engine.begin() as conn:
        try:
            # Thêm cột image_url vào bảng restaurants
            await conn.execute(text("ALTER TABLE restaurants ADD COLUMN image_url VARCHAR(255);"))
            print("✅ Thành công: Đã thêm cột 'image_url' vào bảng 'restaurants'.")
        except Exception as e:
            error_msg = str(e).lower()
            if "already exists" in error_msg or "duplicate column" in error_msg:
                print("✅ Thông báo: Cột 'image_url' đã có sẵn trên database của bạn.")
            else:
                print(f"❌ Lỗi: {e}")

if __name__ == "__main__":
    asyncio.run(migrate_db())
