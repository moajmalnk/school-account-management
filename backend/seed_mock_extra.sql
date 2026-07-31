-- Extra mock data for Silver Hills (tenant_id = 1)
-- Run in phpMyAdmin if catalogs look empty, or re-import after backend deploy.

SET NAMES utf8mb4;

-- Workspace users (in addition to school_admin)
-- Skip if public_id OR email already exists (uq_users_tenant_email)
INSERT INTO users (tenant_id, public_id, email, password_hash, display_name, role, permissions, org_role_id, staff_public_id, active)
SELECT 1, 'USR-FINANCE', 'finance@silverhills.edu.in',
  '$2y$12$B5LyQ.Cfvb93QtBpdsyKIuoxPrEu2IAXXVeUAYyYkV9BLXFuuHTpG',
  'Finance Desk', 'tenant_user',
  JSON_ARRAY('dashboard','finance.overview','finance.receive','finance.make','finance.fees_report','settings.fees'),
  (SELECT id FROM org_roles WHERE tenant_id = 1 AND public_id = 'ROL-003' LIMIT 1),
  NULL, 1
WHERE NOT EXISTS (
  SELECT 1 FROM users
  WHERE tenant_id = 1
    AND (public_id = 'USR-FINANCE' OR email = 'finance@silverhills.edu.in')
);

INSERT INTO users (tenant_id, public_id, email, password_hash, display_name, role, permissions, org_role_id, staff_public_id, active)
SELECT 1, 'USR-FRONT', 'front@silverhills.edu.in',
  '$2y$12$B5LyQ.Cfvb93QtBpdsyKIuoxPrEu2IAXXVeUAYyYkV9BLXFuuHTpG',
  'Front Office', 'tenant_user',
  JSON_ARRAY('dashboard','students','staff'),
  NULL, 'STF-003', 1
WHERE NOT EXISTS (
  SELECT 1 FROM users
  WHERE tenant_id = 1
    AND (public_id = 'USR-FRONT' OR email = 'front@silverhills.edu.in')
);
-- password for both: school2026

-- Ensure class tiers exist
INSERT INTO classes (tenant_id, public_id, class_name, grade, section, tuition_fee_amount, vehicle_fee_amount, billing_cycle)
SELECT * FROM (
  SELECT 1 AS tenant_id, 'CLS-001' AS public_id, 'LKG - M' AS class_name, 'LKG' AS grade, 'M' AS section, 3273 AS tuition_fee_amount, 1500 AS vehicle_fee_amount, 'Monthly' AS billing_cycle
  UNION ALL SELECT 1, 'CLS-002', 'Grade 4 - B', 'Grade 4', 'B', 4000, 1600, 'Monthly'
  UNION ALL SELECT 1, 'CLS-003', 'Grade 6 - C', 'Grade 6', 'C', 4500, 1700, 'Monthly'
  UNION ALL SELECT 1, 'CLS-004', 'Grade 8 - B', 'Grade 8', 'B', 5200, 1800, 'Term'
  UNION ALL SELECT 1, 'CLS-005', 'Grade 10 - A', 'Grade 10', 'A', 6800, 2000, 'Term'
  UNION ALL SELECT 1, 'CLS-006', 'Grade 12 - A', 'Grade 12', 'A', 8400, 2200, 'Annually'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM classes c WHERE c.tenant_id = seed.tenant_id AND c.public_id = seed.public_id);

-- Ensure departments
INSERT INTO departments (tenant_id, public_id, name, code)
SELECT * FROM (
  SELECT 1 AS tenant_id, 'DEP-001' AS public_id, 'Senior Wing' AS name, 'SNR-WNG' AS code
  UNION ALL SELECT 1, 'DEP-002', 'Junior Wing', 'JNR-WNG'
  UNION ALL SELECT 1, 'DEP-003', 'Administration', 'ADM'
  UNION ALL SELECT 1, 'DEP-004', 'Co-curricular', 'COC'
  UNION ALL SELECT 1, 'DEP-005', 'Support', 'SUP'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM departments d WHERE d.tenant_id = seed.tenant_id AND d.public_id = seed.public_id);

-- Payment categories
INSERT INTO payment_categories (tenant_id, public_id, label)
SELECT * FROM (
  SELECT 1 AS tenant_id, 'CAT-001' AS public_id, 'Tuition' AS label
  UNION ALL SELECT 1, 'CAT-002', 'Transport'
  UNION ALL SELECT 1, 'CAT-003', 'Admission'
  UNION ALL SELECT 1, 'CAT-004', 'Miscellaneous'
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM payment_categories p WHERE p.tenant_id = seed.tenant_id AND p.public_id = seed.public_id);

-- Transport routes
INSERT INTO transport_routes (tenant_id, public_id, map_from, map_to, from_lat, from_lng, to_lat, to_lng, morning_fee, evening_fee, both_fee)
SELECT * FROM (
  SELECT 1 AS tenant_id, 'TR-001' AS public_id, 'Lotus Greens Sector 21' AS map_from, 'Main Campus Drop-off' AS map_to,
    28.5021000 AS from_lat, 77.4105000 AS from_lng, 28.4595000 AS to_lat, 77.0266000 AS to_lng, 1000 AS morning_fee, 1000 AS evening_fee, 1800 AS both_fee
  UNION ALL SELECT 1, 'TR-002', 'Marina Crest, MG Road', 'Main Campus Drop-off', 12.9750000, 77.6063000, 12.9716000, 77.5946000, 850, 850, 1500
  UNION ALL SELECT 1, 'TR-003', 'Hiranandani Gardens, Powai', 'Main Campus Drop-off', 19.1197000, 72.9051000, 19.0760000, 72.8777000, 1350, 1350, 2400
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM transport_routes t WHERE t.tenant_id = seed.tenant_id AND t.public_id = seed.public_id);
