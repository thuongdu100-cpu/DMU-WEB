import { useTheme } from "../hooks/useTheme.js";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      role="switch"
      aria-checked={theme === "dark" ? "true" : "false"}
      aria-label="Chuyển giao diện sáng hoặc tối"
    >
      <span className="theme-toggle__track">
        <span className="theme-toggle__thumb" aria-hidden="true" />
      </span>
      <span className="theme-toggle__label theme-toggle__label--dark">Tối</span>
      <span className="theme-toggle__label theme-toggle__label--light">Sáng</span>
    </button>
  );
}
