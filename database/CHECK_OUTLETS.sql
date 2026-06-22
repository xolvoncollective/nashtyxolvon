-- Check all outlets
SELECT 
  id,
  name,
  slug,
  status
FROM outlets
ORDER BY name;

-- Check staff by outlet
SELECT 
  o.id as outlet_id,
  o.name as outlet_name,
  COUNT(s.id) as staff_count
FROM outlets o
LEFT JOIN staff s ON s.outlet_id = o.id
GROUP BY o.id, o.name
ORDER BY o.name;
