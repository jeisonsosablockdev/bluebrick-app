-- 015_user_profile_basic_info.sql
-- Adición de campos para información básica del usuario en la tabla user_profiles

ALTER TABLE user_profiles 
ADD COLUMN first_name VARCHAR(100) DEFAULT NULL,
ADD COLUMN last_name VARCHAR(100) DEFAULT NULL,
ADD COLUMN email VARCHAR(255) DEFAULT NULL,
ADD COLUMN country VARCHAR(100) DEFAULT NULL,
ADD COLUMN address VARCHAR(500) DEFAULT NULL,
ADD COLUMN phone VARCHAR(50) DEFAULT NULL;
