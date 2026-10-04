-- =============================================================================
-- 22 · Support auto-reply history (per-tenant FAQ assistant usage)
-- Safe to re-run. MySQL 5.7 compatible. PHP also auto-creates this table.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS support_auto_replies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id VARCHAR(64) NOT NULL,
  tenant_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  user_name VARCHAR(255) NOT NULL DEFAULT '',
  user_email VARCHAR(255) NOT NULL DEFAULT '',
  faq_public_id VARCHAR(64) NULL,
  faq_question VARCHAR(255) NOT NULL DEFAULT '',
  query_text VARCHAR(512) NOT NULL DEFAULT '',
  answer_text TEXT NOT NULL,
  intent VARCHAR(64) NULL,
  matched TINYINT(1) NOT NULL DEFAULT 1,
  source ENUM('faq_click','text_match','fallback') NOT NULL DEFAULT 'text_match',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_support_auto_replies_public (public_id),
  KEY idx_sar_tenant_created (tenant_id, created_at),
  KEY idx_sar_created (created_at),
  KEY idx_sar_faq (faq_public_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional FK when tenants table exists (ignored if already present / privileges lack).
-- ALTER TABLE support_auto_replies
--   ADD CONSTRAINT fk_support_auto_replies_tenant
--   FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
