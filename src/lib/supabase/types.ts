export type Mood = "happy" | "sad" | "frustrated" | "tired" | "excited" | "calm";

export type Database = {
  public: {
    Tables: {
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          hour: number;
          content: string;
          mood: Mood | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          date: string;
          hour: number;
          content: string;
          mood?: Mood | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          hour?: number;
          content?: string;
          mood?: Mood | null;
          updated_at?: string;
        };
      };
      journal_trash: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          entries_json: unknown;
          deleted_at: string;
          expires_at: string;
        };
        Insert: {
          user_id: string;
          date: string;
          entries_json: unknown;
          expires_at?: string;
        };
        Update: {
          entries_json?: unknown;
          expires_at?: string;
        };
      };
    };
  };
};
