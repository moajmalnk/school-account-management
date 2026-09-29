-- =============================================================================
-- Website contact leads (feezo.app/contact) + pipeline activity
-- Run the whole file in phpMyAdmin → SQL. Safe to re-run: every step checks
-- first, so there are no "Duplicate column name" errors.
-- =============================================================================

-- 1) Leads table (fresh install) ----------------------------------------------
CREATE TABLE IF NOT EXISTS contact_messages (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reference         VARCHAR(20)     NOT NULL,
  topic             VARCHAR(20)     NOT NULL DEFAULT 'other',
  name              VARCHAR(120)    NOT NULL,
  email             VARCHAR(255)    NOT NULL,
  phone             VARCHAR(32)     NULL,
  school            VARCHAR(200)    NULL,
  message           TEXT            NOT NULL,
  page              VARCHAR(255)    NULL,
  status            VARCHAR(20)     NOT NULL DEFAULT 'new',
  priority          VARCHAR(10)     NOT NULL DEFAULT 'normal',
  follow_up_at      DATE            NULL,
  last_contacted_at DATETIME        NULL,
  admin_read        TINYINT(1)      NOT NULL DEFAULT 0,
  ip_address        VARCHAR(45)     NULL,
  user_agent        VARCHAR(512)    NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_contact_reference (reference),
  KEY idx_contact_email (email),
  KEY idx_contact_ip_created (ip_address, created_at),
  KEY idx_contact_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) Upgrade an older contact_messages table (each column added only if missing)
ALTER TABLE contact_messages MODIFY status VARCHAR(20) NOT NULL DEFAULT 'new';
UPDATE contact_messages SET status = 'contacted' WHERE status = 'in_progress';
UPDATE contact_messages SET status = 'won' WHERE status = 'closed';

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact_messages' AND COLUMN_NAME = 'priority') = 0,
  'ALTER TABLE contact_messages ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT ''normal'' AFTER status',
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact_messages' AND COLUMN_NAME = 'follow_up_at') = 0,
  'ALTER TABLE contact_messages ADD COLUMN follow_up_at DATE NULL AFTER priority',
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact_messages' AND COLUMN_NAME = 'last_contacted_at') = 0,
  'ALTER TABLE contact_messages ADD COLUMN last_contacted_at DATETIME NULL AFTER follow_up_at',
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact_messages' AND COLUMN_NAME = 'admin_read') = 0,
  'ALTER TABLE contact_messages ADD COLUMN admin_read TINYINT(1) NOT NULL DEFAULT 0 AFTER last_contacted_at',
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'contact_messages' AND COLUMN_NAME = 'updated_at') = 0,
  'ALTER TABLE contact_messages ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
  'DO 0'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3) Activity timeline (notes, status changes, outreach) -----------------------
CREATE TABLE IF NOT EXISTS contact_lead_events (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lead_id     BIGINT UNSIGNED NOT NULL,
  type        VARCHAR(20)     NOT NULL,
  body        TEXT            NULL,
  author      VARCHAR(120)    NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_lead_events_lead (lead_id, id),
  CONSTRAINT fk_lead_events_lead FOREIGN KEY (lead_id)
    REFERENCES contact_messages(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
