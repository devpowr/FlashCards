export interface FlashcardData {
  id: string;
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  definition: string;
  example?: string;
  bookmarked?: boolean;
}
