async function injectPartial(id: string, url: string): Promise<void> {
  const host = document.getElementById(id);
  if (!host) return;
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    host.innerHTML = await res.text();
  } catch {
    // noop
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await injectPartial('site-header', 'common/header.html');
  await injectPartial('site-footer', 'common/footer.html');
  window.dispatchEvent(new CustomEvent('partials:loaded'));
});
