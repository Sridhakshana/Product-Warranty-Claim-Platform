-- ============================================================
-- Seed data for the Warranty Claim Platform
-- Run AFTER schema.sql (or after the backend has created tables)
-- ============================================================
-- NOTE: Passwords below are bcrypt hashes of "password123"
--       Demo logins (case-sensitive email):
--         customer@demo.com  / password123
--         admin@demo.com     / password123
--         service@demo.com   / password123
-- ============================================================

USE warranty_claim_db;

-- Users
INSERT INTO users (full_name, email, password, role, phone, address)
SELECT * FROM (
  SELECT 'Arjun Kumar'   AS full_name, 'customer@demo.com'  AS email,
         '$2b$12$SoiY2UBIrWqBaDNVBVm6IO26ggLAeeob6UH0gwoRUgz/K/dJ45U/2' AS password,
         'customer'      AS role, '9876543210' AS phone, 'Chennai, Tamil Nadu' AS address
  UNION ALL SELECT 'Priya Sharma', 'admin@demo.com', '$2b$12$SoiY2UBIrWqBaDNVBVm6IO26ggLAeeob6UH0gwoRUgz/K/dJ45U/2', 'admin', '9000011111', 'Chennai HQ'
  UNION ALL SELECT 'Tech City Repairs', 'service@demo.com', '$2b$12$SoiY2UBIrWqBaDNVBVm6IO26ggLAeeob6UH0gwoRUgz/K/dJ45U/2', 'service_center', '044-24850000', 'T Nagar, Chennai'
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'customer@demo.com');

-- Service centers
INSERT INTO service_centers (name, address, city, phone, email, rating, is_active)
SELECT * FROM (
  SELECT 'Tech City Repairs'    AS name, '12 Anna Salai, T Nagar' AS address, 'Chennai'   AS city, '044-24850000' AS phone, 'service@demo.com' AS email, 4.5 AS rating, 1 AS is_active
  UNION ALL SELECT 'Urban Service Hub', '45 MG Road', 'Bengaluru', '080-41230000', 'bengaluru.sc@demo.com', 4.2, 1
  UNION ALL SELECT 'QuickFix Electronics', '78 Inner Ring Road', 'Coimbatore', '0422-2550000', 'cbe.sc@demo.com', 4.0, 1
  UNION ALL SELECT 'North Zone Care', '5 Kottur Road', 'Chennai', '044-22550000', 'north.sc@demo.com', 3.8, 0
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM service_centers WHERE name = 'Tech City Repairs');

-- Products for the demo customer (user id of customer@demo.com)
INSERT INTO products (product_name, product_code, category, purchase_date, warranty_period, user_id)
SELECT * FROM (
  SELECT 'Samsung Galaxy S24' AS product_name, 'SAM-GAL-S24-001' AS product_code,
         'Mobile' AS category, '2025-08-01' AS purchase_date, 24 AS warranty_period,
         (SELECT id FROM users WHERE email = 'customer@demo.com') AS user_id
  UNION ALL SELECT 'Dell Inspiron 15', 'DELL-INSP-15-002', 'Laptop', '2025-10-12', 12,
         (SELECT id FROM users WHERE email = 'customer@demo.com')
  UNION ALL SELECT 'Sony 55" Smart TV', 'SONY-TV55-003', 'Television', '2026-01-20', 12,
         (SELECT id FROM users WHERE email = 'customer@demo.com')
  UNION ALL SELECT 'LG Washing Machine', 'LG-WM-8KG-004', 'Home Appliance', '2019-05-05', 24,
         (SELECT id FROM users WHERE email = 'customer@demo.com')
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM products WHERE product_code = 'SAM-GAL-S24-001');

-- Sample claims
INSERT INTO warranty_claims
  (claim_number, product_id, user_id, service_center_id, claim_reason,
   description, claim_status, repair_status, admin_note, assigned_at, completed_at, created_at)
SELECT * FROM (
  SELECT 'WC-2026-100001' AS claim_number,
         (SELECT id FROM products WHERE product_code = 'SAM-GAL-S24-001') AS product_id,
         (SELECT id FROM users WHERE email = 'customer@demo.com') AS user_id,
         (SELECT id FROM service_centers WHERE name = 'Tech City Repairs') AS service_center_id,
         'Display flickering' AS claim_reason,
         'Screen flickers after an hour of usage' AS description,
         'in_progress' AS claim_status, 'in_repair' AS repair_status,
         'Replaced display assembly, testing' AS admin_note,
         DATE_SUB(NOW(), INTERVAL 3 DAY) AS assigned_at, NULL AS completed_at,
         DATE_SUB(NOW(), INTERVAL 5 DAY) AS created_at
  UNION ALL SELECT 'WC-2026-100002',
         (SELECT id FROM products WHERE product_code = 'DELL-INSP-15-002'),
         (SELECT id FROM users WHERE email = 'customer@demo.com'),
         (SELECT id FROM service_centers WHERE name = 'Urban Service Hub'),
         'Battery drains fast', 'Battery backup reduced drastically',
         'approved', 'not_started', NULL,
         DATE_SUB(NOW(), INTERVAL 1 DAY), NULL,
         DATE_SUB(NOW(), INTERVAL 2 DAY)
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM warranty_claims WHERE claim_number = 'WC-2026-100001');

-- Demo notifications
INSERT INTO notifications (user_id, title, message, channel, is_read)
SELECT * FROM (
  SELECT (SELECT id FROM users WHERE email = 'customer@demo.com') AS user_id,
         'Claim assigned to service center' AS title,
         'Your claim WC-2026-100001 was approved and assigned to Tech City Repairs.' AS message,
         'email' AS channel, 1 AS is_read
  UNION ALL SELECT (SELECT id FROM users WHERE email = 'customer@demo.com'),
         'Repair status updated',
         'Your claim WC-2026-100001 repair status is now in_repair.',
         'app', 0
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE title = 'Claim assigned to service center');
