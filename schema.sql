CREATE TABLE IF NOT EXISTS imei_history (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  imei            TEXT NOT NULL UNIQUE,
  tac             TEXT NOT NULL,
  serial          TEXT NOT NULL,
  brand           TEXT NOT NULL,
  model           TEXT NOT NULL,
  client          TEXT DEFAULT '',
  timestamp       INTEGER NOT NULL,
  is5g            INTEGER,        -- NULL=unknown, 1=yes, 0=no
  has_physical_sim INTEGER        -- NULL=unknown, 1=yes, 0=no
);

CREATE TABLE IF NOT EXISTS clients (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS tac_additions (
  tac             TEXT PRIMARY KEY,
  brand           TEXT NOT NULL,
  model           TEXT NOT NULL,
  is5g            INTEGER NOT NULL DEFAULT 0,
  has_physical_sim INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS tac_removals (
  tac TEXT PRIMARY KEY
);
