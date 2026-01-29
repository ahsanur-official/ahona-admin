// Initialize dark mode immediately before page loads
// This ensures dark mode is the default theme
document.documentElement.style.backgroundColor = '#0d1117';
// Initialize theme immediately before other scripts run.
// Priority: localStorage -> default dark. This avoids flash and
// respects the user's saved choice quickly.
try {
	const stored = localStorage.getItem('ahona_theme');
	if (stored === 'light') {
		document.body.classList.remove('dark');
		document.body.classList.add('light');
	} else {
		// default to dark
		document.body.classList.remove('light');
		document.body.classList.add('dark');
		// ensure a key exists so subsequent scripts see the choice
		if (!stored) localStorage.setItem('ahona_theme', 'dark');
	}
} catch (e) {
	// If localStorage not available, fallback to dark
	document.body.classList.remove('light');
	document.body.classList.add('dark');
}
