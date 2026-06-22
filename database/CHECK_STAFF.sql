SELECT COUNT(*) as staff_count FROM staff;

SELECT 
  s.name,
  s.pin,
  s.role,
  o.name as outlet_name,
  s.is_active
FROM staff s
JOIN outlets o ON s.outlet_id = o.id
ORDER BY o.name, s.name;
