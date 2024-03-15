DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS messages;
CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY,
  active BOOLEAN NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  host_to_guest BOOLEAN NOT NULL
);

WITH RECURSIVE cnt(x) AS (
  SELECT 0
  UNION ALL
  SELECT x + 1 FROM cnt
  LIMIT 1000000
)
INSERT INTO rooms (id) SELECT * FROM cnt;