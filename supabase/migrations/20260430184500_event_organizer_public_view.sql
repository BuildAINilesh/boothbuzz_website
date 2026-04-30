-- Public-safe organizer projection for event pages.
-- Exposes only event_id + organization/admin contact info needed by frontend.

CREATE OR REPLACE VIEW public.event_organizer_public AS
SELECT
  e.id AS event_id,
  e.organization_id,
  o.name AS org_name,
  u.name AS admin_name,
  u.email AS admin_email,
  u.phone AS admin_phone
FROM public.events e
LEFT JOIN public.organizations o
  ON o.id = e.organization_id
LEFT JOIN LATERAL (
  SELECT
    u1.name,
    u1.email,
    u1.phone
  FROM public.users u1
  WHERE u1.organization_id = e.organization_id
    AND u1.role = 'admin'
  ORDER BY u1.updated_at DESC NULLS LAST, u1.created_at DESC NULLS LAST
  LIMIT 1
) u ON TRUE;

GRANT SELECT ON public.event_organizer_public TO anon, authenticated;
