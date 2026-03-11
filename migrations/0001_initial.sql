-- Create formations table
CREATE TABLE IF NOT EXISTS formations (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  publisher TEXT NOT NULL,
  ip TEXT,
  timestamp INTEGER NOT NULL
);

-- Create index for timestamp ordering
CREATE INDEX IF NOT EXISTS idx_formations_timestamp ON formations(timestamp DESC);

-- Create index for name lookups
CREATE INDEX IF NOT EXISTS idx_formations_name ON formations(name);
