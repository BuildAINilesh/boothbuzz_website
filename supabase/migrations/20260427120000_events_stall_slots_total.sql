-- Optional cap for exhibitor stall slots (used on public event cards vs registration count).
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS stall_slots_total INTEGER;

COMMENT ON COLUMN public.events.stall_slots_total IS 'Total exhibitor stall slots for this event; booked count is derived from non-cancelled event_registrations.';
