CREATE TABLE IF NOT EXISTS "accounts" (
	"id_account" UUID DEFAULT uuid_generate_v4(),
	"email" VARCHAR(150) NOT NULL UNIQUE,
	"password_hash" VARCHAR(255) NOT NULL,
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id_account")
);




CREATE TABLE IF NOT EXISTS "users" (
	"id_user" UUID DEFAULT uuid_generate_v4(),
	"id_account" UUID NOT NULL UNIQUE,
	"name" VARCHAR(100),
	"language" VARCHAR(10) DEFAULT 'vi',
	"token_balance" INTEGER DEFAULT 999,
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id_user")
);


CREATE TABLE IF NOT EXISTS "restaurants" (
	"id_restaurant" UUID DEFAULT uuid_generate_v4(),
	"name" VARCHAR(200) NOT NULL,
	"description" TEXT,
	"address" TEXT,
	"latitude" DECIMAL(10,7),
	"longitude" DECIMAL(10,7),
	"qr_code" VARCHAR(255) NOT NULL UNIQUE,
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id_restaurant")
);


CREATE TABLE IF NOT EXISTS "menu_items" (
	"id_menu_item" UUID DEFAULT uuid_generate_v4(),
	"name" VARCHAR(200) NOT NULL,
	"description" TEXT,
	"price" DECIMAL(10,2),
	"image_url" TEXT,
	"created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id_menu_item")
);




CREATE TABLE IF NOT EXISTS "restaurant_audios" (
	"id_audio" UUID DEFAULT uuid_generate_v4(),
	"language" VARCHAR(10) NOT NULL,
	"audio_url" TEXT,
	"script_text" TEXT,
	PRIMARY KEY("id_audio")
);




CREATE TABLE IF NOT EXISTS "restaurant_owners" (
	"id_user" UUID NOT NULL,
	"id_restaurant" UUID NOT NULL,
	PRIMARY KEY("id_user", "id_restaurant")
);




CREATE TABLE IF NOT EXISTS "restaurant_menu_items" (
	"id_restaurant" UUID NOT NULL,
	"id_menu_item" UUID NOT NULL,
	PRIMARY KEY("id_restaurant", "id_menu_item")
);




CREATE TABLE IF NOT EXISTS "restaurant_audio_map" (
	"id_restaurant" UUID NOT NULL,
	"id_audio" UUID NOT NULL,
	PRIMARY KEY("id_restaurant", "id_audio")
);




CREATE TABLE IF NOT EXISTS "scan_history" (
	"id_user" UUID NOT NULL,
	"id_restaurant" UUID NOT NULL,
	"scan_time" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	"token_used" INTEGER DEFAULT 0,
	PRIMARY KEY("id_user", "id_restaurant")
);


CREATE INDEX "idx_scan_user"
ON "scan_history" ("id_user");
CREATE INDEX "idx_scan_restaurant"
ON "scan_history" ("id_restaurant");
ALTER TABLE "users"
ADD FOREIGN KEY("id_account") REFERENCES "accounts"("id_account")
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "restaurant_owners"
ADD FOREIGN KEY("id_user") REFERENCES "users"("id_user")
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "restaurant_owners"
ADD FOREIGN KEY("id_restaurant") REFERENCES "restaurants"("id_restaurant")
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "restaurant_menu_items"
ADD FOREIGN KEY("id_restaurant") REFERENCES "restaurants"("id_restaurant")
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "restaurant_menu_items"
ADD FOREIGN KEY("id_menu_item") REFERENCES "menu_items"("id_menu_item")
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "restaurant_audio_map"
ADD FOREIGN KEY("id_restaurant") REFERENCES "restaurants"("id_restaurant")
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "restaurant_audio_map"
ADD FOREIGN KEY("id_audio") REFERENCES "restaurant_audios"("id_audio")
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "scan_history"
ADD FOREIGN KEY("id_user") REFERENCES "users"("id_user")
ON UPDATE NO ACTION ON DELETE CASCADE;
ALTER TABLE "scan_history"
ADD FOREIGN KEY("id_restaurant") REFERENCES "restaurants"("id_restaurant")
ON UPDATE NO ACTION ON DELETE CASCADE;