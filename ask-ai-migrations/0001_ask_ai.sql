CREATE TABLE IF NOT EXISTS ask_ai_turns (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ask_ai_turns_created ON ask_ai_turns(created_at, conversation_id);
CREATE INDEX IF NOT EXISTS ask_ai_turns_conversation ON ask_ai_turns(conversation_id);

CREATE TABLE IF NOT EXISTS ask_ai_leads (
  conversation_id TEXT PRIMARY KEY,
  state TEXT NOT NULL CHECK (state IN ('sending', 'sent')),
  created_at TEXT NOT NULL
);
