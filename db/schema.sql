-- D1 schema for the Pages Functions (binding name `DB`). Safe to re-run.
-- hits: per-client and global hourly request counts (functions/_lib/rateLimit.ts); `ip` holds a hash, never a raw IP.
CREATE TABLE IF NOT EXISTS hits (
  ip TEXT NOT NULL,
  bucket TEXT NOT NULL,
  hour INTEGER NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (ip, bucket, hour)
);

-- counts: "View CV" / "Get it" clicks per language and site (functions/api/count.ts).
CREATE TABLE IF NOT EXISTS counts (
  event TEXT NOT NULL,
  lang TEXT NOT NULL,
  site TEXT NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (event, lang, site)
);
