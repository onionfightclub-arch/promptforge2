
export interface SearchResult {
  title: string;
  description: string;
  jsonPrompt: string;
  exampleJson: string;
  jsonSchema?: string;
  tsInterface?: string;
  sources: Source[];
  promptVariations?: string[];
}

export interface SavedResult extends SearchResult {
  id: string;
  savedAt: number;
}

export interface Source {
  title: string;
  uri: string;
}

export interface AppState {
  isSearching: boolean;
  query: string;
  results: SearchResult | null;
  error: string | null;
  favorites: SavedResult[];
  searchHistory: string[];
  useCount: number;
  isSubscribed: boolean;
}
