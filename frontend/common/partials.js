// Load shared header and footer into placeholders
document.addEventListener('DOMContentLoaded', async () => {
  async function inject(id, url) {
    const host = document.getElementById(id);
    if (!host) return;
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      const html = await res.text();
      host.innerHTML = html;
    } catch (e) {
      // noop
    }
  }
  await inject('site-header', 'common/header.html');
  await inject('site-footer', 'common/footer.html');
  window.dispatchEvent(new CustomEvent('partials:loaded'));
});

