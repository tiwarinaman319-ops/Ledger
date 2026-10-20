(function () {
  function getTheme() {
    return localStorage.getItem("ledger_theme") || "dark";
  }
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }
  // Apply immediately (before DOMContentLoaded) to avoid a flash of the wrong theme.
  applyTheme(getTheme());

  window.getTheme = getTheme;
  window.setTheme = function (theme) {
    localStorage.setItem("ledger_theme", theme);
    applyTheme(theme);
    document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.themeBtn === theme);
    });
    if (window.onThemeChange) window.onThemeChange(theme);
  };

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-theme-btn]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.themeBtn === getTheme());
      btn.addEventListener("click", () => window.setTheme(btn.dataset.themeBtn));
    });
  });
})();
