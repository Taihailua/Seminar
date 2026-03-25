-- ========================
-- EXTENSION (BẮT BUỘC)
-- ========================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ========================
-- ACCOUNTS (CHỨA ROLE)
-- ========================
CREATE TABLE IF NOT EXISTS "accounts" (
	"id_account" UUID DEFAULT gen_random_uuid(),
	"email" VARCHAR(150) NOT NULL UNIQUE,
	"password_hash" VARCHAR(255) NOT NULL,

	-- role: user | owner | admin
	"role" VARCHAR(20) DEFAULT 'user',

	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id_account")
);

-- constraint role
ALTER TABLE "accounts"
ADD CONSTRAINT chk_account_role
CHECK ("role" IN ('user', 'owner', 'admin'));


-- ========================
-- USERS (PROFILE)
-- ========================
CREATE TABLE IF NOT EXISTS "users" (
	"id_user" UUID DEFAULT gen_random_uuid(),
	"id_account" UUID NOT NULL UNIQUE,
	"name" VARCHAR(100),
	"avatar_url" TEXT,

	-- status: active | inactive | banned
	"status" VARCHAR(20) DEFAULT 'active',

	"language" VARCHAR(10) DEFAULT 'vi',
	"token_balance" INTEGER DEFAULT 999,
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

	PRIMARY KEY("id_user")
);

-- constraint status
ALTER TABLE "users"
ADD CONSTRAINT chk_user_status
CHECK ("status" IN ('active', 'inactive', 'banned'));


-- ========================
-- RESTAURANTS
-- ========================
CREATE TABLE IF NOT EXISTS "restaurants" (
	"id_restaurant" UUID DEFAULT gen_random_uuid(),
	"name" VARCHAR(200) NOT NULL,
	"description" TEXT,
	"image_url" TEXT,
	"address" TEXT,
	"latitude" DECIMAL(10,7),
	"longitude" DECIMAL(10,7),
	"qr_code" VARCHAR(255) NOT NULL UNIQUE,
	"qr_image_url" TEXT,
	"status" VARCHAR(20) DEFAULT 'approved',
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id_restaurant")
);

ALTER TABLE "restaurants"
ADD CONSTRAINT chk_restaurant_status
CHECK ("status" IN ('approved', 'pending', 'rejected', 'deleted'));


-- ========================
-- MENU ITEMS (1-N)
-- ========================
CREATE TABLE IF NOT EXISTS "menu_items" (
	"id_menu_item" UUID DEFAULT gen_random_uuid(),
	"id_restaurant" UUID NOT NULL,
	"name" VARCHAR(200) NOT NULL,
	"description" TEXT,
	"price" DECIMAL(10,2),
	"image_url" TEXT,
	"status" VARCHAR(20) DEFAULT 'available',
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id_menu_item")
);

ALTER TABLE "menu_items"
ADD CONSTRAINT chk_menu_status
CHECK ("status" IN ('available', 'unavailable'));


-- ========================
-- SCRIPTS
-- ========================
CREATE TABLE IF NOT EXISTS "scripts" (
	"id_script" UUID DEFAULT gen_random_uuid(),
	"content" TEXT NOT NULL,
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id_script")
);


-- ========================
-- RESTAURANT SCRIPT MAP
-- ========================
CREATE TABLE IF NOT EXISTS "restaurant_script_map" (
	"id_restaurant" UUID NOT NULL,
	"id_script" UUID NOT NULL,
	"is_active" BOOLEAN DEFAULT false,
	PRIMARY KEY("id_restaurant", "id_script")
);


-- ========================
-- RESTAURANT OWNERS
-- ========================
CREATE TABLE IF NOT EXISTS "restaurant_owners" (
	"id_user" UUID NOT NULL,
	"id_restaurant" UUID NOT NULL,
	PRIMARY KEY("id_user", "id_restaurant")
);


-- ========================
-- SCAN HISTORY
-- ========================
CREATE TABLE IF NOT EXISTS "scan_history" (
	"id" UUID DEFAULT gen_random_uuid(),
	"id_user" UUID NOT NULL,
	"id_restaurant" UUID NOT NULL,
	"scan_time" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	"token_used" INTEGER DEFAULT 0,
	PRIMARY KEY("id")
);


-- ========================
-- INDEX
-- ========================
CREATE INDEX "idx_scan_user"
ON "scan_history" ("id_user");

CREATE INDEX "idx_scan_restaurant"
ON "scan_history" ("id_restaurant");


-- ========================
-- FOREIGN KEYS
-- ========================
ALTER TABLE "users"
ADD FOREIGN KEY("id_account") REFERENCES "accounts"("id_account")
ON DELETE CASCADE;

ALTER TABLE "menu_items"
ADD FOREIGN KEY("id_restaurant") REFERENCES "restaurants"("id_restaurant")
ON DELETE CASCADE;

ALTER TABLE "restaurant_script_map"
ADD FOREIGN KEY("id_restaurant") REFERENCES "restaurants"("id_restaurant")
ON DELETE CASCADE;

ALTER TABLE "restaurant_script_map"
ADD FOREIGN KEY("id_script") REFERENCES "scripts"("id_script")
ON DELETE CASCADE;

ALTER TABLE "restaurant_owners"
ADD FOREIGN KEY("id_user") REFERENCES "users"("id_user")
ON DELETE CASCADE;

ALTER TABLE "restaurant_owners"
ADD FOREIGN KEY("id_restaurant") REFERENCES "restaurants"("id_restaurant")
ON DELETE CASCADE;

ALTER TABLE "scan_history"
ADD FOREIGN KEY("id_user") REFERENCES "users"("id_user")
ON DELETE CASCADE;

ALTER TABLE "scan_history"
ADD FOREIGN KEY("id_restaurant") REFERENCES "restaurants"("id_restaurant")
ON DELETE CASCADE;