CREATE TABLE IF NOT EXISTS ask_ai_transcript_turns (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  page TEXT NOT NULL,
  question TEXT NOT NULL,
  selection TEXT NOT NULL,
  reply TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ask_ai_transcript_conversation
  ON ask_ai_transcript_turns(conversation_id, created_at, id);

CREATE TABLE IF NOT EXISTS ask_ai_transcript_emails (
  conversation_id TEXT PRIMARY KEY,
  state TEXT NOT NULL CHECK (state IN ('sending', 'sent')),
  created_at TEXT NOT NULL
);
