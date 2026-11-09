CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('administrator', 'staff')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  floor INTEGER NOT NULL DEFAULT 1 CHECK (floor >= 0),
  price BIGINT NOT NULL DEFAULT 0 CHECK (price >= 0),
  deposit BIGINT NOT NULL DEFAULT 0 CHECK (deposit >= 0),
  max_tenants INTEGER NOT NULL DEFAULT 1 CHECK (max_tenants > 0),
  area NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (area >= 0),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','occupied','maintenance')),
  current_electric NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (current_electric >= 0),
  current_water NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (current_water >= 0),
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  note TEXT NOT NULL DEFAULT '',
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_card TEXT NOT NULL DEFAULT '',
  hometown TEXT NOT NULL DEFAULT '',
  birth_date DATE,
  vehicle_plate TEXT NOT NULL DEFAULT '',
  room_id TEXT REFERENCES rooms(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  start_date DATE,
  deposit BIGINT NOT NULL DEFAULT 0 CHECK (deposit >= 0),
  is_representative BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','left')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tenants_room_status_idx ON tenants(room_id, status);

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  tenant_id TEXT NOT NULL REFERENCES tenants(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE,
  rent BIGINT NOT NULL CHECK (rent >= 0),
  deposit BIGINT NOT NULL DEFAULT 0 CHECK (deposit >= 0),
  terms TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','ended','expired')),
  contract_file_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS contracts_room_status_idx ON contracts(room_id,status);
CREATE INDEX IF NOT EXISTS contracts_end_date_idx ON contracts(end_date) WHERE status='active';

CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  room_name TEXT NOT NULL,
  month TEXT NOT NULL CHECK (month ~ '^[0-9]{4}-[0-9]{2}$'),
  created_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','partial')),
  payment_method TEXT NOT NULL DEFAULT 'Chuyển khoản',
  room_price BIGINT NOT NULL DEFAULT 0 CHECK (room_price >= 0),
  old_electric NUMERIC(14,2) NOT NULL DEFAULT 0,
  new_electric NUMERIC(14,2) NOT NULL DEFAULT 0,
  electric_usage NUMERIC(14,2) NOT NULL DEFAULT 0,
  electric_price BIGINT NOT NULL DEFAULT 0,
  electric_total BIGINT NOT NULL DEFAULT 0,
  old_water NUMERIC(14,2) NOT NULL DEFAULT 0,
  new_water NUMERIC(14,2) NOT NULL DEFAULT 0,
  water_usage NUMERIC(14,2) NOT NULL DEFAULT 0,
  water_price BIGINT NOT NULL DEFAULT 0,
  water_total BIGINT NOT NULL DEFAULT 0,
  internet_price BIGINT NOT NULL DEFAULT 0,
  trash_price BIGINT NOT NULL DEFAULT 0,
  other_fee BIGINT NOT NULL DEFAULT 0,
  other_fee_reason TEXT NOT NULL DEFAULT '',
  discount BIGINT NOT NULL DEFAULT 0,
  total_amount BIGINT NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  note TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id,month),
  CHECK (new_electric >= old_electric),
  CHECK (new_water >= old_water)
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id TEXT NOT NULL REFERENCES invoices(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  amount BIGINT NOT NULL CHECK (amount > 0),
  method TEXT NOT NULL DEFAULT 'cash',
  reference TEXT NOT NULL DEFAULT '',
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS payments_invoice_idx ON payments(invoice_id,paid_at);

CREATE TABLE IF NOT EXISTS file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK(size_bytes >= 0),
  entity_type TEXT NOT NULL CHECK(entity_type IN ('room','contract','tenant','checkin','checkout')),
  entity_id TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS file_entity_idx ON file_metadata(entity_type,entity_id);

CREATE TABLE IF NOT EXISTS checkout_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES rooms(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  tenant_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  deposit_total BIGINT NOT NULL DEFAULT 0 CHECK (deposit_total >= 0),
  deduction BIGINT NOT NULL DEFAULT 0 CHECK (deduction >= 0),
  deduction_reason TEXT NOT NULL DEFAULT '',
  refund_amount BIGINT NOT NULL DEFAULT 0 CHECK (refund_amount >= 0),
  note TEXT NOT NULL DEFAULT '',
  checked_out_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS checkout_room_date_idx ON checkout_history(room_id,checked_out_at DESC);

CREATE TABLE IF NOT EXISTS handover_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL REFERENCES rooms(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  contract_id TEXT REFERENCES contracts(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('checkin','checkout')),
  note TEXT NOT NULL DEFAULT '',
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL
);

ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_contract_file_id_fkey;
ALTER TABLE contracts ADD CONSTRAINT contracts_contract_file_id_fkey
  FOREIGN KEY (contract_file_id) REFERENCES file_metadata(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO app_settings(id,data) VALUES (1,'{}'::jsonb) ON CONFLICT (id) DO NOTHING;
