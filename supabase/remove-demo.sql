-- Removes every demonstration listing and everything attached to it.
-- Child rows (locations, services, hours, categories, service areas) cascade.
delete from public.businesses where is_demo = true;
