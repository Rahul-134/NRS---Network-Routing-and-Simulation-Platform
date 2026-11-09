try {
  if (localStorage.getItem('nrs-theme') === 'light') document.documentElement.dataset.theme = 'light'
} catch {
  /* storage unavailable, keep the default dark theme */
}
