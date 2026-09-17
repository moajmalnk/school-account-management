-- =============================================================================
-- Bank account details on GL `accounts` (for Bank ledgers)
-- Run after schema_general_ledger.sql (phpMyAdmin → SQL).
-- If a column already exists, skip that line (Duplicate column name is OK).
-- =============================================================================

ALTER TABLE accounts ADD COLUMN bank_name VARCHAR(128) NULL;
ALTER TABLE accounts ADD COLUMN bank_account_no VARCHAR(64) NULL;
ALTER TABLE accounts ADD COLUMN bank_ifsc VARCHAR(16) NULL;
ALTER TABLE accounts ADD COLUMN bank_branch VARCHAR(128) NULL;
ALTER TABLE accounts ADD COLUMN bank_account_holder VARCHAR(255) NULL;
ALTER TABLE accounts ADD COLUMN bank_account_type VARCHAR(32) NULL;
ALTER TABLE accounts ADD COLUMN bank_address VARCHAR(512) NULL;
ALTER TABLE accounts ADD COLUMN bank_city VARCHAR(64) NULL;
ALTER TABLE accounts ADD COLUMN bank_state VARCHAR(64) NULL;
ALTER TABLE accounts ADD COLUMN bank_micr VARCHAR(16) NULL;

-- Optional lookup index (ignore if it already exists)
-- ALTER TABLE accounts ADD INDEX idx_acct_bank_ifsc (tenant_id, branch_id, bank_ifsc);
