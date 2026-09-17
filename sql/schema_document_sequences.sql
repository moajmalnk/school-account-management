-- =============================================================================
-- Per-campus document number sequences (receipts, vouchers, salary slips)
-- Run after schema.sql + branches. Safe to re-run (IF NOT EXISTS).
-- =============================================================================

CREATE TABLE IF NOT EXISTS document_sequences (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id     BIGINT UNSIGNED NOT NULL,
  branch_id     BIGINT UNSIGNED NOT NULL,
  kind          VARCHAR(32)     NOT NULL,
  prefix        VARCHAR(48)     NOT NULL DEFAULT '',
  next_number   INT UNSIGNED    NOT NULL DEFAULT 1,
  padding       TINYINT UNSIGNED NOT NULL DEFAULT 4,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_doc_seq_tenant_branch_kind (tenant_id, branch_id, kind),
  KEY idx_doc_seq_tenant (tenant_id),
  KEY idx_doc_seq_branch (branch_id),
  CONSTRAINT fk_doc_seq_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_doc_seq_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- kind values used by the app:
--   receipt      → fee payment receipts (default RC-)
--   voucher      → payment vouchers / disbursements (default DISB-)
--   salary_slip  → salary payment slips (default SAL-)
--
-- Format: {prefix}{zero-padded next_number}  e.g. RC-1001, HILS-R-0001
-- next_number increments after each successful allocate (row-locked).
