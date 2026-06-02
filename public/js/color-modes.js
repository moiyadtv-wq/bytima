(() => {
  const getTheme = () => localStorage.getItem('theme') || 'light';
  const setTheme = theme => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
  };
  setTheme(getTheme());
  window.toggleTheme = () => {
    const current = getTheme();
    setTheme(current === 'dark' ? 'light' : 'dark');
  };
})();
