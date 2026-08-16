CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
	"username" varchar(100) NOT NULL UNIQUE,
	"email" varchar(150) NOT NULL UNIQUE,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(150),
	"avatar_url" varchar(255),
	-- Kuota penyimpanan (byte)
	"storage_quota" bigint NOT NULL DEFAULT 5368709120,
	-- Penyimpanan terpakai (byte)
	"storage_used" bigint NOT NULL DEFAULT 0,
	-- user / admin
	"role" varchar(20) NOT NULL DEFAULT 'user',
	"is_active" boolean NOT NULL DEFAULT true,
	"two_factor_enabled" boolean NOT NULL DEFAULT false,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp,
	PRIMARY KEY("id")
);

COMMENT ON TABLE users IS 'Data akun pengguna';
COMMENT ON COLUMN users.storage_quota IS 'Kuota penyimpanan (byte)';
COMMENT ON COLUMN users.storage_used IS 'Penyimpanan terpakai (byte)';
COMMENT ON COLUMN users.role IS 'user / admin';


CREATE TABLE IF NOT EXISTS "password_resets" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE password_resets IS 'Token reset password';


CREATE TABLE IF NOT EXISTS "user_sessions" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
	"user_id" uuid NOT NULL,
	"session_token" varchar(255) NOT NULL UNIQUE,
	"ip_address" varchar(45),
	"user_agent" varchar(255),
	"is_active" boolean NOT NULL DEFAULT true,
	"created_at" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE user_sessions IS 'Session Management';


CREATE TABLE IF NOT EXISTS "login_activity" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
	"user_id" uuid NOT NULL,
	"ip_address" varchar(45),
	"device" varchar(150),
	"location" varchar(150),
	-- success / failed
	"status" varchar(20) NOT NULL DEFAULT 'success',
	"created_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE login_activity IS 'Login Activity';
COMMENT ON COLUMN login_activity.status IS 'success / failed';


CREATE TABLE IF NOT EXISTS "devices" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
	"user_id" uuid NOT NULL,
	"device_name" varchar(150),
	"device_type" varchar(50),
	"is_trusted" boolean NOT NULL DEFAULT false,
	"last_active" timestamp,
	"created_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE devices IS 'Device Management';


CREATE TABLE IF NOT EXISTS "account_activity_log" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
	"user_id" uuid NOT NULL,
	"activity_type" varchar(100) NOT NULL,
	"description" varchar(255),
	"ip_address" varchar(45),
	"created_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE account_activity_log IS 'Riwayat Aktivitas Akun';


CREATE TABLE IF NOT EXISTS "folders" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
	"user_id" uuid NOT NULL,
	-- Nested folder (self reference)
	"parent_id" uuid,
	"name" varchar(150) NOT NULL,
	"path" varchar(500),
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	PRIMARY KEY("id")
);

COMMENT ON TABLE folders IS 'Folder Management';
COMMENT ON COLUMN folders.parent_id IS 'Nested folder (self reference)';


CREATE TABLE IF NOT EXISTS "files" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
	"user_id" uuid NOT NULL,
	"folder_id" uuid,
	"name" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	-- Statistik berdasarkan tipe file
	"extension" varchar(20),
	"checksum" varchar(255),
	"size" bigint DEFAULT 0,
	-- Preview Gambar & Video
	"thumbnail_path" varchar(500),
	"is_favorite" boolean NOT NULL DEFAULT false,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	PRIMARY KEY("id")
);

COMMENT ON TABLE files IS 'File Management';
COMMENT ON COLUMN files.extension IS 'Statistik berdasarkan tipe file';
COMMENT ON COLUMN files.thumbnail_path IS 'Preview Gambar & Video';


CREATE TABLE IF NOT EXISTS "tags" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
	"user_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(20),
	"created_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE tags IS 'Tag & Label';


CREATE TABLE IF NOT EXISTS "file_tags" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
	"file_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE file_tags IS 'Relasi File dan Tag (many-to-many)';


CREATE TABLE IF NOT EXISTS "favorites" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
	"user_id" uuid NOT NULL,
	"file_id" uuid,
	"folder_id" uuid,
	"created_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE favorites IS 'Favorite File';


CREATE TABLE IF NOT EXISTS "recent_files" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
	"user_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"accessed_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE recent_files IS 'Recent File';

CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"target_type" varchar(50),
	"target_id" uuid,
	"details" varchar(500),
	"ip_address" varchar(45),
	"created_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE audit_logs IS 'Audit Log';


CREATE TABLE IF NOT EXISTS "two_factor_auth" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
	"user_id" uuid NOT NULL UNIQUE,
	"secret" varchar(255),
	"is_enabled" boolean NOT NULL DEFAULT false,
	"backup_codes" varchar(500),
	"created_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE two_factor_auth IS 'Two Factor Authentication (Target Pengembangan)';


CREATE TABLE IF NOT EXISTS "system_stats" (
	"id" uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
	-- Monitoring Penggunaan Storage
	"total_storage" bigint NOT NULL,
	"used_storage" bigint NOT NULL,
	-- Statistik keseluruhan sistem
	"total_users" int NOT NULL,
	"total_files" int NOT NULL,
	"recorded_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE system_stats IS 'Snapshot statistik untuk Admin Panel / Dashboard Monitoring';
COMMENT ON COLUMN system_stats.total_storage IS 'Monitoring Penggunaan Storage';
COMMENT ON COLUMN system_stats.total_users IS 'Statistik keseluruhan sistem';


ALTER TABLE "password_resets"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "user_sessions"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "login_activity"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "devices"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "account_activity_log"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "folders"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "folders"
ADD FOREIGN KEY("parent_id") REFERENCES "folders"("id")
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "files"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "files"
ADD FOREIGN KEY("folder_id") REFERENCES "folders"("id")
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "tags"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "file_tags"
ADD FOREIGN KEY("file_id") REFERENCES "files"("id")
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "file_tags"
ADD FOREIGN KEY("tag_id") REFERENCES "tags"("id")
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "favorites"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "favorites"
ADD FOREIGN KEY("file_id") REFERENCES "files"("id")
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "favorites"
ADD FOREIGN KEY("folder_id") REFERENCES "folders"("id")
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "recent_files"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "recent_files"
ADD FOREIGN KEY("file_id") REFERENCES "files"("id")
ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE "audit_logs"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE "two_factor_auth"
ADD FOREIGN KEY("user_id") REFERENCES "users"("id")
ON UPDATE CASCADE ON DELETE CASCADE;