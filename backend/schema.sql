-- =============================================================================
-- School Admin Console (Silver Hills Global) — MySQL schema
-- Database: u455934768_spi
-- Multi-tenant: shared schema, tenant_id on every scoped table
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------------
-- Tenants (SaaS root — no tenant_id)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id     VARCHAR(64)     NOT NULL,
  name          VARCHAR(255)    NOT NULL,
  subdomain     VARCHAR(100)    NOT NULL,
  tier          ENUM('Basic','Premium','Enterprise') NOT NULL DEFAULT 'Basic',
  status        ENUM('Active','Trial','Overdue','Suspended') NOT NULL DEFAULT 'Active',
  capacity      INT UNSIGNED    NOT NULL DEFAULT 500,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tenants_public_id (public_id),
  UNIQUE KEY uq_tenants_subdomain (subdomain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Users (school_admin | tenant_user)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id      BIGINT UNSIGNED NOT NULL,
  public_id      VARCHAR(64)     NOT NULL,
  email          VARCHAR(255)    NOT NULL,
  password_hash  VARCHAR(255)    NOT NULL,
  display_name   VARCHAR(255)    NOT NULL,
  role           ENUM('school_admin','tenant_user') NOT NULL DEFAULT 'tenant_user',
  permissions    JSON            NOT NULL,
  org_role_id    BIGINT UNSIGNED NULL,
  staff_public_id VARCHAR(64)    NULL,
  active         TINYINT(1)      NOT NULL DEFAULT 1,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_tenant_public (tenant_id, public_id),
  UNIQUE KEY uq_users_tenant_email (tenant_id, email),
  KEY idx_users_tenant (tenant_id),
  CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- School settings (1:1 per tenant) — SchoolDetails + ThemeSettings + active AY
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS school_settings (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id         BIGINT UNSIGNED NOT NULL,
  name              VARCHAR(255)    NOT NULL,
  logo_url          VARCHAR(512)    NULL,
  letterhead_url    VARCHAR(512)    NULL,
  tagline           VARCHAR(255)    NOT NULL DEFAULT '',
  address           TEXT            NOT NULL,
  phone             VARCHAR(64)     NOT NULL DEFAULT '',
  email             VARCHAR(255)    NOT NULL DEFAULT '',
  website           VARCHAR(255)    NOT NULL DEFAULT '',
  registration_no   VARCHAR(128)    NOT NULL DEFAULT '',
  affiliation_no    VARCHAR(128)    NOT NULL DEFAULT '',
  principal_name    VARCHAR(255)    NOT NULL DEFAULT '',
  established_year  VARCHAR(16)     NOT NULL DEFAULT '',
  theme_mode        ENUM('Light','Dark') NOT NULL DEFAULT 'Light',
  theme_accent      ENUM('Neon Lime','Pale Lime','Ink') NOT NULL DEFAULT 'Neon Lime',
  theme_density     ENUM('Comfortable','Compact') NOT NULL DEFAULT 'Comfortable',
  theme_nav         ENUM('Left','Right','Top','Bottom') NOT NULL DEFAULT 'Left',
  academic_year     VARCHAR(32)     NOT NULL DEFAULT 'AY 2025-26',
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_school_settings_tenant (tenant_id),
  CONSTRAINT fk_school_settings_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Academic years
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS academic_years (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id     BIGINT UNSIGNED NOT NULL,
  label         VARCHAR(32)     NOT NULL,
  is_active     TINYINT(1)      NOT NULL DEFAULT 0,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ay_tenant_label (tenant_id, label),
  KEY idx_ay_tenant (tenant_id),
  CONSTRAINT fk_ay_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Departments
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id     BIGINT UNSIGNED NOT NULL,
  public_id     VARCHAR(64)     NOT NULL,
  name          VARCHAR(255)    NOT NULL,
  code          VARCHAR(64)     NOT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dept_tenant_public (tenant_id, public_id),
  KEY idx_dept_tenant (tenant_id),
  CONSTRAINT fk_dept_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Org roles (settings catalog — not auth roles)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS org_roles (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id       BIGINT UNSIGNED NOT NULL,
  public_id       VARCHAR(64)     NOT NULL,
  title           VARCHAR(255)    NOT NULL,
  department_id   BIGINT UNSIGNED NOT NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_org_roles_tenant_public (tenant_id, public_id),
  KEY idx_org_roles_tenant (tenant_id),
  KEY idx_org_roles_dept (department_id),
  CONSTRAINT fk_org_roles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_org_roles_dept FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Classes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS classes (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id             BIGINT UNSIGNED NOT NULL,
  public_id             VARCHAR(64)     NOT NULL,
  class_name            VARCHAR(128)    NOT NULL,
  grade                 VARCHAR(64)     NOT NULL,
  section               VARCHAR(32)     NOT NULL DEFAULT '',
  tuition_fee_amount    INT UNSIGNED    NOT NULL DEFAULT 0,
  vehicle_fee_amount    INT UNSIGNED    NOT NULL DEFAULT 0,
  billing_cycle         ENUM('Monthly','Term','Annually') NOT NULL DEFAULT 'Monthly',
  class_teacher_id      VARCHAR(64)     NULL,
  created_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_classes_tenant_public (tenant_id, public_id),
  KEY idx_classes_tenant (tenant_id),
  CONSTRAINT fk_classes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Fee terms
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fee_terms (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id       BIGINT UNSIGNED NOT NULL,
  public_id       VARCHAR(64)     NOT NULL,
  kind            ENUM('tuition','vehicle') NOT NULL,
  period_mode     ENUM('term','month') NOT NULL,
  label           VARCHAR(128)    NOT NULL,
  academic_year   VARCHAR(32)     NULL,
  start_date      DATE            NULL,
  end_date        DATE            NULL,
  fee_amount      INT UNSIGNED    NULL,
  coverage        VARCHAR(255)    NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fee_terms_tenant_public (tenant_id, public_id),
  KEY idx_fee_terms_tenant_year (tenant_id, academic_year),
  CONSTRAINT fk_fee_terms_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Payment categories
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_categories (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id     BIGINT UNSIGNED NOT NULL,
  public_id     VARCHAR(64)     NOT NULL,
  label         VARCHAR(128)    NOT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_paycat_tenant_public (tenant_id, public_id),
  KEY idx_paycat_tenant (tenant_id),
  CONSTRAINT fk_paycat_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Students
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS students (
  id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id             BIGINT UNSIGNED NOT NULL,
  public_id             VARCHAR(64)     NOT NULL,
  name                  VARCHAR(255)    NOT NULL,
  cls                   VARCHAR(128)    NOT NULL DEFAULT '',
  guardian              VARCHAR(255)    NOT NULL DEFAULT '',
  due                   INT             NOT NULL DEFAULT 0,
  gender                ENUM('M','F')   NULL,
  phone                 VARCHAR(64)     NULL,
  dob                   DATE            NULL,
  email                 VARCHAR(255)    NULL,
  address               TEXT            NULL,
  photo_url             VARCHAR(512)    NULL,
  aadhaar               VARCHAR(32)     NULL,
  admission_number      VARCHAR(64)     NULL,
  place_of_birth        VARCHAR(128)    NULL,
  nationality           VARCHAR(64)     NULL,
  religion              VARCHAR(64)     NULL,
  student_category      VARCHAR(64)     NULL,
  blood_group           VARCHAR(8)      NULL,
  father_occupation     VARCHAR(128)    NULL,
  mother_name           VARCHAR(255)    NULL,
  guardian_relation     ENUM('Father','Mother','Others') NULL,
  guardian_occupation   VARCHAR(128)    NULL,
  needs_bus             TINYINT(1)      NOT NULL DEFAULT 0,
  bus_point1            VARCHAR(255)    NULL,
  bus_point2            VARCHAR(255)    NULL,
  active                TINYINT(1)      NOT NULL DEFAULT 1,
  share_token           VARCHAR(64)     NULL,
  documents             JSON            NULL,
  deleted_at            DATETIME        NULL,
  created_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_students_tenant_public (tenant_id, public_id),
  UNIQUE KEY uq_students_share_token (share_token),
  KEY idx_students_tenant_active (tenant_id, active, deleted_at),
  KEY idx_students_tenant_cls (tenant_id, cls),
  CONSTRAINT fk_students_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Student year ledger (per academic year overlay)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS student_year_fields (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id       BIGINT UNSIGNED NOT NULL,
  student_id      BIGINT UNSIGNED NOT NULL,
  academic_year   VARCHAR(32)     NOT NULL,
  cls             VARCHAR(128)    NOT NULL DEFAULT '',
  due             INT             NOT NULL DEFAULT 0,
  active          TINYINT(1)      NOT NULL DEFAULT 1,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_syf_tenant_student_year (tenant_id, student_id, academic_year),
  KEY idx_syf_tenant_year (tenant_id, academic_year),
  CONSTRAINT fk_syf_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_syf_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Staff
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff (
  id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id               BIGINT UNSIGNED NOT NULL,
  public_id               VARCHAR(64)     NOT NULL,
  name                    VARCHAR(255)    NOT NULL,
  role                    VARCHAR(255)    NOT NULL DEFAULT '',
  dept                    VARCHAR(255)    NOT NULL DEFAULT '',
  active                  TINYINT(1)      NOT NULL DEFAULT 1,
  joined_at               DATE            NOT NULL,
  phone                   VARCHAR(64)     NULL,
  alt_phone               VARCHAR(64)     NULL,
  guardian_phone          VARCHAR(64)     NULL,
  photo_url               VARCHAR(512)    NULL,
  basic_salary            INT UNSIGNED    NOT NULL DEFAULT 0,
  additional_allowances   INT UNSIGNED    NOT NULL DEFAULT 0,
  documents               JSON            NULL,
  deleted_at              DATETIME        NULL,
  created_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_staff_tenant_public (tenant_id, public_id),
  KEY idx_staff_tenant_active (tenant_id, active, deleted_at),
  CONSTRAINT fk_staff_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_attendance (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id       BIGINT UNSIGNED NOT NULL,
  staff_id        BIGINT UNSIGNED NOT NULL,
  month           CHAR(7)         NOT NULL COMMENT 'YYYY-MM',
  days_present    INT UNSIGNED    NOT NULL DEFAULT 0,
  working_days    INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_att_tenant_staff_month (tenant_id, staff_id, month),
  KEY idx_att_tenant (tenant_id),
  CONSTRAINT fk_att_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_att_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_salary_history (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id       BIGINT UNSIGNED NOT NULL,
  staff_id        BIGINT UNSIGNED NOT NULL,
  public_id       VARCHAR(64)     NOT NULL,
  amount          INT UNSIGNED    NOT NULL DEFAULT 0,
  mode            VARCHAR(128)    NOT NULL DEFAULT '',
  paid_at         DATETIME        NOT NULL,
  description     VARCHAR(512)    NOT NULL DEFAULT '',
  status          ENUM('Paid','Queued','Cleared') NOT NULL DEFAULT 'Paid',
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ssh_tenant_public (tenant_id, public_id),
  KEY idx_ssh_staff (tenant_id, staff_id),
  CONSTRAINT fk_ssh_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_ssh_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_status_events (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id       BIGINT UNSIGNED NOT NULL,
  staff_id        BIGINT UNSIGNED NOT NULL,
  public_id       VARCHAR(64)     NOT NULL,
  type            ENUM('joined','deactivated','reactivated') NOT NULL,
  at              DATETIME        NOT NULL,
  note            VARCHAR(512)    NULL,
  created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sse_tenant_public (tenant_id, public_id),
  KEY idx_sse_staff (tenant_id, staff_id),
  CONSTRAINT fk_sse_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_sse_staff FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Finance — receipts (income)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id         BIGINT UNSIGNED NOT NULL,
  public_id         VARCHAR(64)     NOT NULL,
  name              VARCHAR(255)    NOT NULL,
  cat               VARCHAR(128)    NOT NULL DEFAULT '',
  mode              VARCHAR(128)    NOT NULL DEFAULT '',
  amount            INT UNSIGNED    NOT NULL DEFAULT 0,
  paid_at           DATETIME        NOT NULL,
  academic_year     VARCHAR(32)     NULL,
  payer_type        ENUM('student','external') NOT NULL DEFAULT 'student',
  class_name        VARCHAR(128)    NULL,
  fee_period_kind   ENUM('month','term') NULL,
  fee_period        VARCHAR(128)    NULL,
  fee_month         VARCHAR(64)     NULL,
  narration         TEXT            NULL,
  attachments       JSON            NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_tenant_public (tenant_id, public_id),
  KEY idx_payments_tenant_year (tenant_id, academic_year),
  KEY idx_payments_tenant_paid (tenant_id, paid_at),
  CONSTRAINT fk_payments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Finance — disbursements (made payments / outflows)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS disbursements (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id     BIGINT UNSIGNED NOT NULL,
  public_id     VARCHAR(64)     NOT NULL,
  payee         VARCHAR(255)    NOT NULL,
  description   VARCHAR(512)    NOT NULL DEFAULT '',
  amount        INT UNSIGNED    NOT NULL DEFAULT 0,
  mode          VARCHAR(128)    NOT NULL DEFAULT '',
  payee_type    ENUM('Salary','Vendor') NOT NULL DEFAULT 'Vendor',
  paid_at       DATETIME        NOT NULL,
  status        ENUM('Queued','Cleared') NOT NULL DEFAULT 'Cleared',
  attachments   JSON            NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_disb_tenant_public (tenant_id, public_id),
  KEY idx_disb_tenant_paid (tenant_id, paid_at),
  CONSTRAINT fk_disb_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Finance — pending obligations (AP)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS obligations (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id     BIGINT UNSIGNED NOT NULL,
  public_id     VARCHAR(64)     NOT NULL,
  payee         VARCHAR(255)    NOT NULL,
  description   VARCHAR(512)    NOT NULL DEFAULT '',
  amount        INT UNSIGNED    NOT NULL DEFAULT 0,
  due_date      DATE            NOT NULL,
  payee_type    ENUM('Salary','Vendor') NOT NULL DEFAULT 'Vendor',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_obl_tenant_public (tenant_id, public_id),
  KEY idx_obl_tenant_due (tenant_id, due_date),
  CONSTRAINT fk_obl_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Transport
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transport_routes (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id     BIGINT UNSIGNED NOT NULL,
  public_id     VARCHAR(64)     NOT NULL,
  map_from      VARCHAR(255)    NOT NULL,
  map_to        VARCHAR(255)    NOT NULL,
  from_lat      DECIMAL(10,7)   NULL,
  from_lng      DECIMAL(10,7)   NULL,
  to_lat        DECIMAL(10,7)   NULL,
  to_lng        DECIMAL(10,7)   NULL,
  morning_fee   INT UNSIGNED    NOT NULL DEFAULT 0,
  evening_fee   INT UNSIGNED    NOT NULL DEFAULT 0,
  both_fee      INT UNSIGNED    NOT NULL DEFAULT 0,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tr_tenant_public (tenant_id, public_id),
  KEY idx_tr_tenant (tenant_id),
  CONSTRAINT fk_tr_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS transport_vehicles (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id         BIGINT UNSIGNED NOT NULL,
  public_id         VARCHAR(64)     NOT NULL,
  name              VARCHAR(255)    NOT NULL,
  registration_no   VARCHAR(64)     NOT NULL,
  capacity          INT UNSIGNED    NOT NULL DEFAULT 0,
  ownership         ENUM('owned','rental') NOT NULL DEFAULT 'owned',
  driver_name       VARCHAR(255)    NULL,
  driver_phone      VARCHAR(64)     NULL,
  route_ids         JSON            NOT NULL,
  active            TINYINT(1)      NOT NULL DEFAULT 1,
  documents         JSON            NULL,
  created_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tv_tenant_public (tenant_id, public_id),
  KEY idx_tv_tenant (tenant_id),
  CONSTRAINT fk_tv_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Notifications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id     BIGINT UNSIGNED NOT NULL,
  public_id     VARCHAR(64)     NOT NULL,
  title         VARCHAR(255)    NOT NULL,
  body          TEXT            NOT NULL,
  category      ENUM('fees','admissions','staff','system','transport') NOT NULL DEFAULT 'system',
  is_read       TINYINT(1)      NOT NULL DEFAULT 0,
  time_label    VARCHAR(64)     NOT NULL DEFAULT '',
  href          VARCHAR(512)    NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ntf_tenant_public (tenant_id, public_id),
  KEY idx_ntf_tenant_read (tenant_id, is_read, created_at),
  CONSTRAINT fk_ntf_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- Dashboard state (todos + note)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dashboard_state (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tenant_id     BIGINT UNSIGNED NOT NULL,
  todos         JSON            NOT NULL,
  note          TEXT            NOT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_dash_tenant (tenant_id),
  CONSTRAINT fk_dash_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- SEED: Silver Hills Global
-- Password for silverhills@tenant.com: school2026
-- =============================================================================

INSERT INTO tenants (id, public_id, name, subdomain, tier, status, capacity, created_at)
VALUES (1, 'T-1042', 'Silver Hills Global', 'silverhills', 'Enterprise', 'Active', 5000, '2025-02-14 00:00:00')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO school_settings (
  tenant_id, name, tagline, address, phone, email, website,
  registration_no, affiliation_no, principal_name, established_year,
  theme_mode, theme_accent, theme_density, theme_nav, academic_year
) VALUES (
  1,
  'Silver Hills Global',
  'Excellence in education',
  'NH-66, Calicut Bypass, Kozhikode, Kerala 673601',
  '+91 495 240 1122',
  'office@silverhills.edu.in',
  'www.silverhills.edu.in',
  'REG/KL/2014/0842',
  'CBSE/AFF/930821',
  'Dr. Anitha Menon',
  '1998',
  'Light',
  'Neon Lime',
  'Comfortable',
  'Left',
  'AY 2025-26'
) ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO academic_years (tenant_id, label, is_active) VALUES
  (1, 'AY 2024-25', 0),
  (1, 'AY 2025-26', 1),
  (1, 'AY 2026-27', 0)
ON DUPLICATE KEY UPDATE is_active = VALUES(is_active);

-- school2026
INSERT INTO users (tenant_id, public_id, email, password_hash, display_name, role, permissions, active)
VALUES (
  1,
  'USR-ADMIN',
  'silverhills@tenant.com',
  '$2y$12$B5LyQ.Cfvb93QtBpdsyKIuoxPrEu2IAXXVeUAYyYkV9BLXFuuHTpG',
  'Silver Hills Admin',
  'school_admin',
  JSON_ARRAY('*'),
  1
) ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO departments (tenant_id, public_id, name, code) VALUES
  (1, 'DEP-001', 'Senior Wing', 'SNR-WNG'),
  (1, 'DEP-002', 'Junior Wing', 'JNR-WNG'),
  (1, 'DEP-003', 'Administration', 'ADM'),
  (1, 'DEP-004', 'Co-curricular', 'COC'),
  (1, 'DEP-005', 'Support', 'SUP')
ON DUPLICATE KEY UPDATE name = VALUES(name);

DELETE FROM org_roles WHERE tenant_id = 1 AND public_id IN ('ROL-001','ROL-002','ROL-003','ROL-004');

INSERT INTO org_roles (tenant_id, public_id, title, department_id)
SELECT 1, 'ROL-001', 'Mathematics · HOD', d.id FROM departments d WHERE d.tenant_id = 1 AND d.public_id = 'DEP-001'
UNION ALL
SELECT 1, 'ROL-002', 'Physics Faculty', d.id FROM departments d WHERE d.tenant_id = 1 AND d.public_id = 'DEP-001'
UNION ALL
SELECT 1, 'ROL-003', 'Principal Office', d.id FROM departments d WHERE d.tenant_id = 1 AND d.public_id = 'DEP-003'
UNION ALL
SELECT 1, 'ROL-004', 'Sports Coordinator', d.id FROM departments d WHERE d.tenant_id = 1 AND d.public_id = 'DEP-004';

INSERT INTO classes (tenant_id, public_id, class_name, grade, section, tuition_fee_amount, vehicle_fee_amount, billing_cycle) VALUES
  (1, 'CLS-001', 'LKG - M', 'LKG', 'M', 3273, 1500, 'Monthly'),
  (1, 'CLS-002', 'Grade 4 - B', 'Grade 4', 'B', 4000, 1600, 'Monthly'),
  (1, 'CLS-003', 'Grade 6 - C', 'Grade 6', 'C', 4500, 1700, 'Monthly'),
  (1, 'CLS-004', 'Grade 8 - B', 'Grade 8', 'B', 5200, 1800, 'Term'),
  (1, 'CLS-005', 'Grade 10 - A', 'Grade 10', 'A', 6800, 2000, 'Term'),
  (1, 'CLS-006', 'Grade 12 - A', 'Grade 12', 'A', 8400, 2200, 'Annually')
ON DUPLICATE KEY UPDATE class_name = VALUES(class_name);

INSERT INTO payment_categories (tenant_id, public_id, label) VALUES
  (1, 'CAT-001', 'Tuition'),
  (1, 'CAT-002', 'Transport'),
  (1, 'CAT-003', 'Admission'),
  (1, 'CAT-004', 'Miscellaneous')
ON DUPLICATE KEY UPDATE label = VALUES(label);

INSERT INTO fee_terms (tenant_id, public_id, kind, period_mode, label, academic_year, start_date, end_date) VALUES
  (1, 'FT-T1-2526', 'tuition', 'term', 'Term 1', 'AY 2025-26', '2025-04-01', '2025-07-31'),
  (1, 'FT-T2-2526', 'tuition', 'term', 'Term 2', 'AY 2025-26', '2025-08-01', '2025-11-30'),
  (1, 'FT-T3-2526', 'tuition', 'term', 'Term 3', 'AY 2025-26', '2025-12-01', '2026-03-31'),
  (1, 'FT-APR-2526', 'tuition', 'month', 'April', 'AY 2025-26', '2025-04-01', '2025-04-30')
ON DUPLICATE KEY UPDATE label = VALUES(label);

INSERT INTO transport_routes (tenant_id, public_id, map_from, map_to, from_lat, from_lng, to_lat, to_lng, morning_fee, evening_fee, both_fee) VALUES
  (1, 'TR-001', 'Lotus Greens Sector 21', 'Main Campus Drop-off', 28.5021000, 77.4105000, 28.4595000, 77.0266000, 1000, 1000, 1800),
  (1, 'TR-002', 'Marina Crest, MG Road', 'Main Campus Drop-off', 12.9750000, 77.6063000, 12.9716000, 77.5946000, 850, 850, 1500)
ON DUPLICATE KEY UPDATE map_from = VALUES(map_from);

INSERT INTO transport_vehicles (tenant_id, public_id, name, registration_no, capacity, ownership, driver_name, driver_phone, route_ids, active, documents) VALUES
  (1, 'VH-001', 'Bus 12 · Blue Line', 'KL-11-AB-4521', 42, 'owned', 'Ravi Kumar', '+91 98765 43210', JSON_ARRAY('TR-001'), 1, JSON_ARRAY()),
  (1, 'VH-002', 'Van 3 · Shuttle', 'KL-11-CD-8890', 18, 'rental', 'Suresh Nair', '+91 98765 11122', JSON_ARRAY('TR-002'), 1, JSON_ARRAY())
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO students (tenant_id, public_id, name, cls, guardian, due, gender, phone, active, share_token) VALUES
  (1, 'STU-001', 'Aarav Menon', 'Grade 8 - B', 'Rajesh Menon', 5200, 'M', '+91 98000 10001', 1, 'shr-aarav-001'),
  (1, 'STU-002', 'Diya Nair', 'Grade 10 - A', 'Sreekumar Nair', 0, 'F', '+91 98000 10002', 1, 'shr-diya-002'),
  (1, 'STU-003', 'Ishaan Pillai', 'Grade 6 - C', 'Anil Pillai', 4500, 'M', '+91 98000 10003', 1, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO student_year_fields (tenant_id, student_id, academic_year, cls, due, active)
SELECT 1, s.id, 'AY 2025-26', s.cls, s.due, 1
FROM students s WHERE s.tenant_id = 1 AND s.public_id IN ('STU-001','STU-002','STU-003');

INSERT INTO staff (tenant_id, public_id, name, role, dept, active, joined_at, phone, basic_salary, additional_allowances, documents) VALUES
  (1, 'STF-001', 'Priya Krishnan', 'Mathematics · HOD', 'Senior Wing', 1, '2018-06-01', '+91 97000 20001', 45000, 5000, JSON_ARRAY()),
  (1, 'STF-002', 'Arun Thomas', 'Physics Faculty', 'Senior Wing', 1, '2019-04-15', '+91 97000 20002', 38000, 3000, JSON_ARRAY()),
  (1, 'STF-003', 'Meera Joseph', 'Office Administrator', 'Administration', 1, '2016-01-10', '+91 97000 20003', 28000, 2000, JSON_ARRAY())
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO staff_status_events (tenant_id, staff_id, public_id, type, at, note)
SELECT 1, s.id, CONCAT('SSE-', s.public_id), 'joined', CONCAT(s.joined_at, ' 09:00:00'), NULL
FROM staff s WHERE s.tenant_id = 1;

INSERT INTO payments (tenant_id, public_id, name, cat, mode, amount, paid_at, academic_year, payer_type, class_name, fee_period_kind, fee_period) VALUES
  (1, 'PAY-001', 'Diya Nair', 'Tuition', 'UPI', 6800, '2025-05-02 10:15:00', 'AY 2025-26', 'student', 'Grade 10 - A', 'term', 'Term 1'),
  (1, 'PAY-002', 'Walk-in Donor', 'Miscellaneous', 'Cash', 10000, '2025-05-10 14:00:00', 'AY 2025-26', 'external', NULL, NULL, NULL)
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO disbursements (tenant_id, public_id, payee, description, amount, mode, payee_type, paid_at, status) VALUES
  (1, 'DISB-2401', 'Faculty Payroll · April', '34 staff · net payable', 598400, 'Bank Transfer · NEFT', 'Salary', '2025-04-30 16:00:00', 'Cleared'),
  (1, 'DISB-2402', 'BrightBus Logistics', 'Bus diesel + maintenance', 46800, 'UPI Business', 'Vendor', '2025-04-28 11:20:00', 'Cleared')
ON DUPLICATE KEY UPDATE payee = VALUES(payee);

INSERT INTO obligations (tenant_id, public_id, payee, description, amount, due_date, payee_type) VALUES
  (1, 'OBL-001', 'BrightBus Logistics', 'Bus diesel + maintenance', 48200, '2025-06-02', 'Vendor'),
  (1, 'OBL-002', 'Faculty Payroll · May', '35 staff · net payable', 612000, '2025-05-31', 'Salary')
ON DUPLICATE KEY UPDATE payee = VALUES(payee);

INSERT INTO notifications (tenant_id, public_id, title, body, category, is_read, time_label, href) VALUES
  (1, 'NTF-001', 'Fee reminder sent', 'WhatsApp reminder queued for 12 overdue accounts.', 'fees', 0, '2h ago', '/tenant/finance?tab=fees'),
  (1, 'NTF-002', 'New admission', 'Aarav Menon enrolled in Grade 8 - B.', 'admissions', 0, 'Yesterday', '/tenant/students?id=STU-001'),
  (1, 'NTF-003', 'Staff roster updated', 'Priya Krishnan attendance logged for May.', 'staff', 1, '3d ago', '/tenant/staff?id=STF-001')
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO dashboard_state (tenant_id, todos, note) VALUES
  (1, JSON_ARRAY('Follow up overdue fees', 'Confirm May payroll', '', '', ''), 'Focus: close Term 1 fee collections before mid-May.')
ON DUPLICATE KEY UPDATE todos = VALUES(todos);
