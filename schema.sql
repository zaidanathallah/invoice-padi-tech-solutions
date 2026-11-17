CREATE DATABASE IF NOT EXISTS `invoice_app` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `invoice_app`;

-- Table: users
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `role` ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: companies
CREATE TABLE IF NOT EXISTS `companies` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `address` TEXT NOT NULL,
  `phone` VARCHAR(50) NULL,
  `email` VARCHAR(191) NULL,
  `bank_name` VARCHAR(100) NULL,
  `bank_account_no` VARCHAR(50) NULL,
  `bank_account_name` VARCHAR(191) NULL,
  `logo` LONGTEXT NULL,
  `created_by_user_id` VARCHAR(36) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: clients
CREATE TABLE IF NOT EXISTS `clients` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NULL,
  `phone` VARCHAR(50) NULL,
  `address` TEXT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sync_status` VARCHAR(20) NOT NULL DEFAULT 'SYNCED',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: invoices
CREATE TABLE IF NOT EXISTS `invoices` (
  `id` VARCHAR(36) NOT NULL,
  `invoice_no` VARCHAR(50) NOT NULL UNIQUE,
  `created_by_user_id` VARCHAR(36) NOT NULL,
  `company_id` VARCHAR(36) NULL,
  `client_id` VARCHAR(36) NOT NULL,
  `issue_date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
  `sub_total` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `tax` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `tax_rate` DECIMAL(5, 2) NOT NULL DEFAULT 11.00,
  `discount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `grand_total` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sync_status` VARCHAR(20) NOT NULL DEFAULT 'SYNCED',
  PRIMARY KEY (`id`),
  KEY `idx_invoices_created_by` (`created_by_user_id`),
  KEY `idx_invoices_client` (`client_id`),
  CONSTRAINT `fk_invoices_users` FOREIGN KEY (`created_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_invoices_clients` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_invoices_companies` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: invoice_items
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `id` VARCHAR(36) NOT NULL,
  `invoice_id` VARCHAR(36) NOT NULL,
  `description` TEXT NOT NULL,
  `qty` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `total` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `idx_invoice_items_invoice` (`invoice_id`),
  CONSTRAINT `fk_invoice_items_invoices` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: cms_settings
CREATE TABLE IF NOT EXISTS `cms_settings` (
  `key` VARCHAR(50) NOT NULL,
  `value` TEXT NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Seed Data
INSERT IGNORE INTO `users` (`id`, `name`, `email`, `role`, `password_hash`, `created_at`) VALUES
('usr-admin-01', 'Admin Utama', 'admin@invoice.com', 'ADMIN', 'password123', NOW()),
('usr-kasir-01', 'Kasir Staff', 'kasir@invoice.com', 'USER', 'password123', NOW());

INSERT IGNORE INTO `companies` (`id`, `name`, `address`, `phone`, `email`, `bank_name`, `bank_account_no`, `bank_account_name`, `created_by_user_id`, `created_at`) VALUES
('cmp-01', 'PT Sinergy Solusi Indonesia', 'Jl. Jendral Sudirman No. 123, Jakarta', '081234567890', 'info@sinergy.co.id', 'Bank BCA', '1234567890', 'PT Sinergy Solusi Indonesia', 'usr-admin-01', NOW());

INSERT IGNORE INTO `clients` (`id`, `name`, `email`, `phone`, `address`, `created_by_user_id`, `created_at`, `sync_status`) VALUES
('cli-01', 'PT Wijaya Karya', 'contact@wikaimp.com', '021-5551234', 'Gedung WIKA Tower 2, Jakarta', 'usr-admin-01', NOW(), 'SYNCED');
