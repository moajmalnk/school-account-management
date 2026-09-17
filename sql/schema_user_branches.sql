-- =============================================================================
-- User ↔ campus access (one user, one or many branches)
-- Run on Hostinger / MySQL after schema.sql + seeds/13_branches.sql
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_branches (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id   BIGINT UNSIGNED NOT NULL,
  user_id     BIGINT UNSIGNED NOT NULL,
  branch_id   BIGINT UNSIGNED NOT NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_branches_user_branch (user_id, branch_id),
  KEY idx_user_branches_tenant (tenant_id),
  KEY idx_user_branches_branch (branch_id),
  CONSTRAINT fk_user_branches_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_branches_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_branches_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Semantics:
--   • No rows for a user  → access to EVERY campus (legacy / unrestricted / school_admin)
--   • One or more rows    → access ONLY to those campuses
-- school_admin always bypasses this table in application code.
