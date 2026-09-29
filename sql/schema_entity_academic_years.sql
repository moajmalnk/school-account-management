-- =============================================================================
-- Financial year on catalogs + staff (students already use year-fields)
-- Run on Hostinger / MySQL (phpMyAdmin → SQL). Safe to re-run.
-- Skips missing tables and columns/indexes that already exist.
--
-- Your deploy may not have every table (e.g. no `roles` / `transport_routes`).
-- That is OK — only tables that exist are altered.
--
-- JSON keys the API should persist (camelCase or snake_case):
--   POST/PUT /api/settings/classes.php       → academicYear | academic_year
--   POST/PUT /api/settings/departments.php   → academicYear | academic_year
--   POST/PUT /api/settings/roles.php         → academicYear | academic_year
--   POST/PUT /api/settings/fees.php?resource=categories
--   POST/PUT /api/settings/transport.php
--   POST/PUT /api/staff/create.php | update.php
--   POST     /api/students/year-fields.php already stores academic_year
-- =============================================================================

-- Preview which targets exist on THIS database (optional — run alone first):
-- SELECT t.table_name
-- FROM (
--   SELECT 'classes' AS table_name UNION ALL SELECT 'staff'
--   UNION ALL SELECT 'departments' UNION ALL SELECT 'roles'
--   UNION ALL SELECT 'payment_categories' UNION ALL SELECT 'fee_categories'
--   UNION ALL SELECT 'transport_routes' UNION ALL SELECT 'transport'
-- ) t
-- INNER JOIN information_schema.TABLES i
--   ON i.TABLE_SCHEMA = DATABASE() AND i.TABLE_NAME = t.table_name;

DROP PROCEDURE IF EXISTS ensure_entity_academic_years;

DELIMITER //
CREATE PROCEDURE ensure_entity_academic_years()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE tname VARCHAR(64);
  DECLARE idxname VARCHAR(64);
  DECLARE cur CURSOR FOR
    SELECT table_name, index_name FROM (
      SELECT 'classes' AS table_name, 'idx_classes_year' AS index_name
      UNION ALL SELECT 'staff', 'idx_staff_year'
      UNION ALL SELECT 'departments', 'idx_departments_year'
      UNION ALL SELECT 'roles', 'idx_roles_year'
      UNION ALL SELECT 'payment_categories', 'idx_payment_categories_year'
      UNION ALL SELECT 'fee_categories', 'idx_fee_categories_year'
      UNION ALL SELECT 'transport_routes', 'idx_transport_routes_year'
      UNION ALL SELECT 'transport', 'idx_transport_year'
    ) AS targets;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO tname, idxname;
    IF done = 1 THEN
      LEAVE read_loop;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tname
    ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = tname
          AND COLUMN_NAME = 'academic_year'
      ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', tname, '` ADD COLUMN academic_year VARCHAR(64) NULL');
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = tname
          AND INDEX_NAME = idxname
      ) THEN
        SET @ddl = CONCAT(
          'ALTER TABLE `', tname,
          '` ADD INDEX `', idxname, '` (tenant_id, branch_id, academic_year)'
        );
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
      END IF;
    END IF;
  END LOOP;
  CLOSE cur;
END //
DELIMITER ;

CALL ensure_entity_academic_years();
DROP PROCEDURE IF EXISTS ensure_entity_academic_years;
