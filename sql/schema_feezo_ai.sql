-- =============================================================================
-- Feezo AI — feedback + light usage log
-- Run in phpMyAdmin → SQL (safe to re-run: IF NOT EXISTS).
-- =============================================================================

CREATE TABLE IF NOT EXISTS feezo_ai_feedback (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id          BIGINT UNSIGNED NOT NULL,
  branch_id          BIGINT UNSIGNED NOT NULL,
  public_id          VARCHAR(64)     NOT NULL,
  user_id            BIGINT UNSIGNED NOT NULL,
  message_client_id  VARCHAR(64)     NOT NULL,
  rating             ENUM('up','down') NOT NULL,
  reply_excerpt      VARCHAR(1000)   NULL,
  locale             VARCHAR(8)      NOT NULL DEFAULT 'en',
  model              VARCHAR(128)    NULL,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_feezo_fb_pub (tenant_id, branch_id, public_id),
  UNIQUE KEY uq_feezo_fb_msg (tenant_id, branch_id, user_id, message_client_id),
  KEY idx_feezo_fb_branch (tenant_id, branch_id, created_at),
  KEY idx_feezo_fb_rating (tenant_id, branch_id, rating, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: one row per chat turn (for quota / model analytics). Frontend does not require this.
CREATE TABLE IF NOT EXISTS feezo_ai_usage (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id          BIGINT UNSIGNED NOT NULL,
  branch_id          BIGINT UNSIGNED NOT NULL,
  user_id            BIGINT UNSIGNED NOT NULL,
  locale             VARCHAR(8)      NOT NULL DEFAULT 'en',
  provider           VARCHAR(32)     NULL,
  model              VARCHAR(128)    NULL,
  prompt_chars       INT UNSIGNED    NOT NULL DEFAULT 0,
  reply_chars        INT UNSIGNED    NOT NULL DEFAULT 0,
  ok                 TINYINT(1)      NOT NULL DEFAULT 1,
  error_excerpt      VARCHAR(500)    NULL,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_feezo_usage_branch (tenant_id, branch_id, created_at),
  KEY idx_feezo_usage_model (tenant_id, model, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
