import { useTheme } from '../theme/ThemeProvider';
import './ThemeToggle.css';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className={`theme-toggle-icon ${isDark ? 'theme-toggle-icon-active' : ''}`}>
        🌙
      </span>
      <span className="theme-toggle-divider"></span>
      <span className={`theme-toggle-icon ${!isDark ? 'theme-toggle-icon-active' : ''}`}>
        ☀️
      </span>
    </button>
  );
}

