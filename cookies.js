// ─── CONSENTIMIENTO DE COOKIES + carga de Google Analytics ────────────────────
// GA4 NO se carga hasta que el usuario acepta (no se ponen cookies sin permiso).
(function () {
  const GA_ID = 'G-3FQFWB3R32';
  const KEY = 'cookieConsent';
  const host = location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';

  function loadGA() {
    if (isLocal || window.__gaLoaded) return;  // nunca rastrea localhost
    window.__gaLoaded = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  function getChoice() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }
  function hideBanner() {
    const b = document.getElementById('cookieBanner');
    if (b) b.classList.add('hidden');
  }

  // Expuesto a los botones del banner
  window.cookieAccept = function () { save('granted'); hideBanner(); loadGA(); };
  window.cookieReject = function () { save('denied');  hideBanner(); };

  document.addEventListener('DOMContentLoaded', function () {
    const choice = getChoice();
    if (choice === 'granted') { loadGA(); return; }   // ya aceptó antes
    if (choice === 'denied')  { return; }              // ya rechazó antes
    const b = document.getElementById('cookieBanner'); // sin elección → mostrar banner
    if (b) b.classList.remove('hidden');
  });
})();
