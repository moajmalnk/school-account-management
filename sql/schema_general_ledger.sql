-- =============================================================================
-- General ledger (double-entry) — campus-scoped chart + journals
-- Safe to re-run (IF NOT EXISTS). Run after branches schema.
-- =============================================================================

CREATE TABLE IF NOT EXISTS account_groups (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id     BIGINT UNSIGNED NOT NULL,
  branch_id     BIGINT UNSIGNED NOT NULL,
  public_id     VARCHAR(64)     NOT NULL,
  sector        VARCHAR(32)     NOT NULL,
  name          VARCHAR(128)    NOT NULL,
  uid_code      VARCHAR(64)     NOT NULL,
  nature        VARCHAR(32)     NOT NULL,
  sort_order    INT             NOT NULL DEFAULT 0,
  is_system     TINYINT(1)      NOT NULL DEFAULT 0,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_acct_grp_pub (tenant_id, branch_id, public_id),
  UNIQUE KEY uq_acct_grp_uid (tenant_id, branch_id, uid_code),
  KEY idx_acct_grp_branch (tenant_id, branch_id),
  KEY idx_acct_grp_sector (tenant_id, branch_id, sector)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS accounts (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id           BIGINT UNSIGNED NOT NULL,
  branch_id           BIGINT UNSIGNED NOT NULL,
  public_id           VARCHAR(64)     NOT NULL,
  group_id            BIGINT UNSIGNED NOT NULL,
  code                VARCHAR(32)     NOT NULL,
  name                VARCHAR(255)    NOT NULL,
  is_cash             TINYINT(1)      NOT NULL DEFAULT 0,
  is_bank             TINYINT(1)      NOT NULL DEFAULT 0,
  is_party_student    TINYINT(1)      NOT NULL DEFAULT 0,
  is_party_staff      TINYINT(1)      NOT NULL DEFAULT 0,
  is_system           TINYINT(1)      NOT NULL DEFAULT 0,
  active              TINYINT(1)      NOT NULL DEFAULT 1,
  expense_ledger_id   BIGINT UNSIGNED NULL,
  payment_category_id BIGINT UNSIGNED NULL,
  sort_order          INT             NOT NULL DEFAULT 0,
  created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_acct_pub (tenant_id, branch_id, public_id),
  UNIQUE KEY uq_acct_code (tenant_id, branch_id, code),
  UNIQUE KEY uq_acct_name (tenant_id, branch_id, name),
  KEY idx_acct_branch (tenant_id, branch_id),
  KEY idx_acct_group (group_id),
  KEY idx_acct_flags (tenant_id, branch_id, is_cash, is_bank)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS accounting_periods (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id     BIGINT UNSIGNED NOT NULL,
  branch_id     BIGINT UNSIGNED NOT NULL,
  year_label    VARCHAR(64)     NOT NULL,
  status        VARCHAR(16)     NOT NULL DEFAULT 'open',
  closed_at     DATETIME        NULL,
  closed_by     BIGINT UNSIGNED NULL,
  reopen_note   VARCHAR(512)    NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_acct_period (tenant_id, branch_id, year_label),
  KEY idx_acct_period_status (tenant_id, branch_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS journal_entries (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id       BIGINT UNSIGNED NOT NULL,
  branch_id       BIGINT UNSIGNED NOT NULL,
  public_id       VARCHAR(64)     NOT NULL,
  voucher_type    VARCHAR(16)     NOT NULL,
  voucher_no      VARCHAR(64)     NOT NULL,
  entry_date      DATE            NOT NULL,
  academic_year   VARCHAR(64)     NULL,
  narration       VARCHAR(512)    NULL,
  source_type     VARCHAR(32)     NULL,
  source_id       VARCHAR(64)     NULL,
  is_locked       TINYINT(1)      NOT NULL DEFAULT 0,
  is_void         TINYINT(1)      NOT NULL DEFAULT 0,
  created_by      BIGINT UNSIGNED NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_je_pub (tenant_id, branch_id, public_id),
  UNIQUE KEY uq_je_voucher (tenant_id, branch_id, voucher_no),
  KEY idx_je_branch_date (tenant_id, branch_id, entry_date),
  KEY idx_je_source (tenant_id, branch_id, source_type, source_id),
  KEY idx_je_year (tenant_id, branch_id, academic_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS journal_lines (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id       BIGINT UNSIGNED NOT NULL,
  branch_id       BIGINT UNSIGNED NOT NULL,
  entry_id        BIGINT UNSIGNED NOT NULL,
  account_id      BIGINT UNSIGNED NOT NULL,
  line_no         SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  debit           BIGINT          NOT NULL DEFAULT 0,
  credit          BIGINT          NOT NULL DEFAULT 0,
  party_type      VARCHAR(32)     NULL,
  party_id        VARCHAR(64)     NULL,
  description     VARCHAR(512)    NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_jl_entry (entry_id),
  KEY idx_jl_account (tenant_id, branch_id, account_id),
  KEY idx_jl_party (tenant_id, branch_id, party_type, party_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
