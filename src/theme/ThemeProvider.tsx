import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSiteSettings } from '../firebase/siteSettings';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

async function getInitialTheme(): Promise<Theme> {
  // Only access browser APIs on client side
  if (typeof window === 'undefined') {
    return 'light';
  }
  
  try {
    // Get theme from Firestore siteSettings (admin-controlled)
    const settings = await getSiteSettings();
    return settings.uiTheme || 'light';
  } catch (e) {
    console.error('Error loading theme from site settings:', e);
    // Default to light if Firestore read fails
    return 'light';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from Firestore on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const initialTheme = await getInitialTheme();
        setThemeState(initialTheme);
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', initialTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        // Default to light
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', 'light');
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  // Subscribe to siteSettings changes (polling + event listener)
  useEffect(() => {
    const pollTheme = async () => {
      try {
        const settings = await getSiteSettings();
        const newTheme = settings.uiTheme || 'light';
        if (newTheme !== theme) {
          setThemeState(newTheme);
          if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', newTheme);
          }
        }
      } catch (error) {
        console.error('Error polling theme:', error);
      }
    };

    // Listen for immediate theme changes from admin
    const handleThemeChange = (event: CustomEvent) => {
      const newTheme = event.detail.theme as Theme;
      setThemeState(newTheme);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', newTheme);
      }
    };

    window.addEventListener('theme-changed', handleThemeChange as EventListener);

    // Poll every 30 seconds to check for theme changes
    const interval = setInterval(pollTheme, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('theme-changed', handleThemeChange as EventListener);
    };
  }, [theme]);

  useEffect(() => {
    // Apply theme to HTML element whenever it changes
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    // Only allow toggle in admin context (not exposed to regular users)
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  // Don't render children until theme is loaded to avoid flash
  if (isLoading) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

