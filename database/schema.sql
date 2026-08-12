-- ============================================================
-- Product Warranty Claim Processing Platform
-- MySQL Database Schema
-- ============================================================
-- Run with:  mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS warranty_claim_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE warranty_claim_db;

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    full_name   VARCHAR(100)  NOT NULL,
    email       VARCHAR(100)  NOT NULL UNIQUE,
    password    VARCHAR(255)  NOT NULL,
    role        VARCHAR(20)   NOT NULL DEFAULT 'customer',
    phone       VARCHAR(20)   NULL,
    address     VARCHAR(255)  NULL,
    created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
    INDEX ix_users_email (email)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- products
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    product_name   VARCHAR(100)  NOT NULL,
    product_code   VARCHAR(100)  NOT NULL UNIQUE,
    category       VARCHAR(100)  NULL,
    purchase_date  DATE          NOT NULL,
    warranty_period INT          NOT NULL,            -- months
    user_id        INT           NOT NULL,
    created_at     DATETIME      DEFAULT CURRENT_TIMESTAMP,
    INDEX ix_products_user_id (user_id),
    CONSTRAINT fk_products_user
        FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- service_centers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_centers (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    address     VARCHAR(255) NULL,
    city        VARCHAR(100) NULL,
    phone       VARCHAR(20)  NULL,
    email       VARCHAR(100) NULL,
    rating      FLOAT        DEFAULT 0.0,
    is_active   TINYINT(1)   DEFAULT 1,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    INDEX ix_service_centers_name (name)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- warranty_claims
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS warranty_claims (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    claim_number       VARCHAR(30)  NOT NULL UNIQUE,
    product_id         INT          NOT NULL,
    user_id            INT          NOT NULL,
    service_center_id  INT          NULL,
    claim_reason       VARCHAR(255) NOT NULL,
    description        TEXT         NULL,
    claim_status       VARCHAR(30)  NOT NULL DEFAULT 'pending',
    repair_status      VARCHAR(30)  NOT NULL DEFAULT 'not_started',
    admin_note         TEXT         NULL,
    assigned_at        DATETIME     NULL,
    completed_at       DATETIME     NULL,
    created_at         DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME     DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,
    INDEX ix_warranty_claims_product_id (product_id),
    INDEX ix_warranty_claims_user_id (user_id),
    INDEX ix_warranty_claims_service_center_id (service_center_id),
    CONSTRAINT fk_warranty_claims_product
        FOREIGN KEY (product_id) REFERENCES products(id),
    CONSTRAINT fk_warranty_claims_user
        FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_warranty_claims_service_center
        FOREIGN KEY (service_center_id) REFERENCES service_centers(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- invoices
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    product_id      INT          NOT NULL,
    file_name       VARCHAR(255) NOT NULL,
    file_path       VARCHAR(255) NOT NULL,
    file_size       INT          DEFAULT 0,
    content_type    VARCHAR(100) NULL,
    extracted_text  TEXT         NULL,
    verified        TINYINT(1)   DEFAULT 0,
    upload_date     DATETIME     DEFAULT CURRENT_TIMESTAMP,
    INDEX ix_invoices_product_id (product_id),
    CONSTRAINT fk_invoices_product
        FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- notifications
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT          NOT NULL,
    title       VARCHAR(150) NOT NULL,
    message     TEXT         NOT NULL,
    channel     VARCHAR(20)  DEFAULT 'app',
    is_read     TINYINT(1)   DEFAULT 0,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    INDEX ix_notifications_user_id (user_id),
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;
