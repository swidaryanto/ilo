export type Mood = "happy" | "sad" | "frustrated" | "tired" | "excited" | "calm";

export interface JournalEntry {
  id: string;
  date: string;
  hour: number;
  content: string;
  mood?: Mood;
  createdAt: string;
  updatedAt: string;
}

export interface JournalDay {
  date: string;
  entries: JournalEntry[];
}

