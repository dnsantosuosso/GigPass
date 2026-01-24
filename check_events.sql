-- Check all events in the database
SELECT 
  id,
  title,
  venue,
  event_date,
  claimed_count,
  capacity,
  created_at
FROM events
ORDER BY event_date DESC;

-- Check upcoming events (what the app shows)
SELECT 
  id,
  title,
  venue,
  event_date,
  claimed_count,
  capacity
FROM events
WHERE event_date >= NOW()
ORDER BY event_date ASC;

-- Check ticket types for events
SELECT 
  tt.id,
  tt.name,
  tt.event_id,
  e.title as event_title,
  tt.quantity,
  tt.claimed_count,
  COUNT(ttt.id) as tier_count
FROM ticket_types tt
LEFT JOIN events e ON e.id = tt.event_id
LEFT JOIN ticket_type_tiers ttt ON ttt.ticket_type_id = tt.id
GROUP BY tt.id, tt.name, tt.event_id, e.title, tt.quantity, tt.claimed_count
ORDER BY e.event_date DESC;
