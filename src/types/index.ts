export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

export interface GalleryItem {
  id: string;
  uri: string;
  caption: string;
  timestamp: number;
  userId: string;
  synced?: boolean;
  cloudId?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export interface GalleryContextType {
  items: GalleryItem[];
  isLoading: boolean;
  addItem: (uri: string, caption: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateCaption: (id: string, caption: string) => Promise<void>;
  refreshItems: () => Promise<void>;
}

export interface Theme {
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    border: string;
    notification: string;
    surface: string;
    onSurface: string;
    accent: string;
  };
}

export interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
}