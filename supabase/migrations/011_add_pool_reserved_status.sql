-- Add "reserved" status for shared WhatsApp numbers that should never be assigned
ALTER TABLE phone_number_pool
  DROP CONSTRAINT IF EXISTS phone_number_pool_status_check,
  ADD CONSTRAINT phone_number_pool_status_check
    CHECK (status IN ('pending_approval', 'approved', 'assigned', 'reserved'));
