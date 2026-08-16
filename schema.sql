
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial NOT NULL UNIQUE,
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
	"role" varchar(20) NOT NULL DEFAULT '''user''',
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
	"id" serial NOT NULL UNIQUE,
	"user_id" int NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE password_resets IS 'Token reset password';


CREATE TABLE IF NOT EXISTS "user_sessions" (
	"id" serial NOT NULL UNIQUE,
	"user_id" int NOT NULL,
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
	"id" serial NOT NULL UNIQUE,
	"user_id" int NOT NULL,
	"ip_address" varchar(45),
	"device" varchar(150),
	"location" varchar(150),
	-- success / failed
	"status" varchar(20) NOT NULL DEFAULT '''success''',
	"created_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE login_activity IS 'Login Activity';
COMMENT ON COLUMN login_activity.status IS 'success / failed';


CREATE TABLE IF NOT EXISTS "devices" (
	"id" serial NOT NULL UNIQUE,
	"user_id" int NOT NULL,
	"device_name" varchar(150),
	"device_type" varchar(50),
	"is_trusted" boolean NOT NULL DEFAULT false,
	"last_active" timestamp,
	"created_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE devices IS 'Device Management';


CREATE TABLE IF NOT EXISTS "account_activity_log" (
	"id" serial NOT NULL UNIQUE,
	"user_id" int NOT NULL,
	"activity_type" varchar(100) NOT NULL,
	"description" varchar(255),
	"ip_address" varchar(45),
	"created_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE account_activity_log IS 'Riwayat Aktivitas Akun';


CREATE TABLE IF NOT EXISTS "folders" (
	"id" serial NOT NULL UNIQUE,
	"user_id" int NOT NULL,
	-- Nested folder (self reference)
	"parent_id" int,
	"name" varchar(150) NOT NULL,
	"path" varchar(500),
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp,
	"deleted_at" timestamp,
	PRIMARY KEY("id")
);

COMMENT ON TABLE folders IS 'Folder Management';
COMMENT ON COLUMN folders.parent_id IS 'Nested folder (self reference)';
COMMENT ON COLUMN folders.is_locked IS 'Folder Lock / Private Vault';


CREATE TABLE IF NOT EXISTS "files" (
	"id" serial NOT NULL UNIQUE,
	"user_id" int NOT NULL,
	"folder_id" int,
	"name" varchar(255) NOT NULL,
	"file_path" varchar(500) NOT NULL,
	-- Statistik berdasarkan tipe file
	"extension" varchar(20),
	"checksum" varchar(255),
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
	"id" serial NOT NULL UNIQUE,
	"user_id" int NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(20),
	"created_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE tags IS 'Tag & Label';


CREATE TABLE IF NOT EXISTS "file_tags" (
	"id" serial NOT NULL UNIQUE,
	"file_id" int NOT NULL,
	"tag_id" int NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE file_tags IS 'Relasi File dan Tag (many-to-many)';


CREATE TABLE IF NOT EXISTS "favorites" (
	"id" serial NOT NULL UNIQUE,
	"user_id" int NOT NULL,
	"file_id" int,
	"folder_id" int,
	"created_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE favorites IS 'Favorite File';


CREATE TABLE IF NOT EXISTS "recent_files" (
	"id" serial NOT NULL UNIQUE,
	"user_id" int NOT NULL,
	"file_id" int NOT NULL,
	"accessed_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE recent_files IS 'Recent File';

CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" serial NOT NULL UNIQUE,
	"user_id" int,
	"action" varchar(100) NOT NULL,
	"target_type" varchar(50),
	"target_id" int,
	"details" varchar(500),
	"ip_address" varchar(45),
	"created_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE audit_logs IS 'Audit Log';


CREATE TABLE IF NOT EXISTS "two_factor_auth" (
	"id" serial NOT NULL UNIQUE,
	"user_id" int NOT NULL UNIQUE,
	"secret" varchar(255),
	"is_enabled" boolean NOT NULL DEFAULT false,
	"backup_codes" varchar(500),
	"created_at" timestamp NOT NULL,
	PRIMARY KEY("id")
);

COMMENT ON TABLE two_factor_auth IS 'Two Factor Authentication (Target Pengembangan)';


CREATE TABLE IF NOT EXISTS "system_stats" (
	"id" serial NOT NULL UNIQUE,
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


ALTER TABLE "users"
ADD FOREIGN KEY("id") REFERENCES "password_resets"("user_id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "users"
ADD FOREIGN KEY("id") REFERENCES "user_sessions"("user_id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "users"
ADD FOREIGN KEY("id") REFERENCES "login_activity"("user_id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "users"
ADD FOREIGN KEY("id") REFERENCES "devices"("user_id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "users"
ADD FOREIGN KEY("id") REFERENCES "account_activity_log"("user_id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "users"
ADD FOREIGN KEY("id") REFERENCES "folders"("user_id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "folders"
ADD FOREIGN KEY("id") REFERENCES "folders"("parent_id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "users"
ADD FOREIGN KEY("id") REFERENCES "files"("user_id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "folders"
ADD FOREIGN KEY("id") REFERENCES "files"("folder_id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "users"
ADD FOREIGN KEY("id") REFERENCES "tags"("user_id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "files"
ADD FOREIGN KEY("id") REFERENCES "file_tags"("file_id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "tags"
ADD FOREIGN KEY("id") REFERENCES "file_tags"("tag_id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "users"
ADD FOREIGN KEY("id") REFERENCES "favorites"("user_id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "files"
ADD FOREIGN KEY("id") REFERENCES "favorites"("file_id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "folders"
ADD FOREIGN KEY("id") REFERENCES "favorites"("folder_id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "users"
ADD FOREIGN KEY("id") REFERENCES "recent_files"("user_id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "files"
ADD FOREIGN KEY("id") REFERENCES "recent_files"("file_id")
ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE "users"
ALTER TABLE "users"
ADD FOREIGN KEY("id") REFERENCES "audit_logs"("user_id")
ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "users"
ADD FOREIGN KEY("id") REFERENCES "two_factor_auth"("user_id")
ON UPDATE CASCADE ON DELETE CASCADE;