-- PSMS advanced PostgreSQL constraints and indexes not expressible in Prisma schema
-- Apply after the base Prisma migration.

BEGIN;

-- Required for exclusion constraint with uuid equality + range overlap.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1) Complex CHECK constraints
ALTER TABLE appointment_series
  ADD CONSTRAINT appointment_series_end_condition_chk
  CHECK (
    -- none
    (recurrence_count IS NULL AND recurrence_until IS NULL)
    OR
    -- exactly one of count/until
    (recurrence_count IS NOT NULL AND recurrence_until IS NULL)
    OR
    (recurrence_count IS NULL AND recurrence_until IS NOT NULL)
  );

ALTER TABLE appointments
  ADD CONSTRAINT appointments_time_order_chk
  CHECK (starts_at < ends_at);

-- 2) Range column + exclusion constraint (overlap prevention for active scheduled appointments)
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS time_range tstzrange
  GENERATED ALWAYS AS (tstzrange(starts_at, ends_at, '[)')) STORED;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_overlap_excl
  EXCLUDE USING gist (
    user_id WITH =,
    time_range WITH &&
  )
  WHERE (status = 'SCHEDULED' AND deleted_at IS NULL);

-- 3) Partial indexes
CREATE INDEX IF NOT EXISTS appointments_user_starts_active_idx
  ON appointments (user_id, starts_at)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS tags_user_lower_name_active_uk
  ON tags (user_id, lower(name))
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS reminders_due_pending_idx
  ON reminders (next_trigger_at)
  WHERE state IN ('PENDING', 'SNOOZED');

-- 4) Full-text search index
CREATE INDEX IF NOT EXISTS appointments_fts_idx
  ON appointments
  USING gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')));

-- 5) Trigger: enforce tag-owner consistency in join table
CREATE OR REPLACE FUNCTION enforce_appointment_tag_same_owner()
RETURNS trigger AS $$
DECLARE
  appointment_owner uuid;
  tag_owner uuid;
BEGIN
  SELECT user_id INTO appointment_owner
  FROM appointments
  WHERE id = NEW.appointment_id;

  SELECT user_id INTO tag_owner
  FROM tags
  WHERE id = NEW.tag_id;

  IF appointment_owner IS NULL OR tag_owner IS NULL THEN
    RAISE EXCEPTION 'Invalid appointment_id or tag_id in appointment_tags';
  END IF;

  IF appointment_owner <> tag_owner THEN
    RAISE EXCEPTION 'Tag and Appointment must belong to same user';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_appointment_tags_same_owner ON appointment_tags;
CREATE TRIGGER trg_appointment_tags_same_owner
BEFORE INSERT OR UPDATE ON appointment_tags
FOR EACH ROW
EXECUTE FUNCTION enforce_appointment_tag_same_owner();

-- 6) Trigger: enforce reminder ownership + remind_at before appointment starts_at
CREATE OR REPLACE FUNCTION enforce_reminder_consistency()
RETURNS trigger AS $$
DECLARE
  appointment_owner uuid;
  appointment_start timestamptz;
BEGIN
  SELECT user_id, starts_at INTO appointment_owner, appointment_start
  FROM appointments
  WHERE id = NEW.appointment_id;

  IF appointment_owner IS NULL THEN
    RAISE EXCEPTION 'Invalid appointment_id in reminders';
  END IF;

  IF NEW.user_id <> appointment_owner THEN
    RAISE EXCEPTION 'Reminder user_id must match appointment user_id';
  END IF;

  IF NEW.remind_at >= appointment_start THEN
    RAISE EXCEPTION 'Reminder time must be before appointment start time';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reminders_consistency ON reminders;
CREATE TRIGGER trg_reminders_consistency
BEFORE INSERT OR UPDATE ON reminders
FOR EACH ROW
EXECUTE FUNCTION enforce_reminder_consistency();

COMMIT;
