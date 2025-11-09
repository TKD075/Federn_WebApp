// Common interactions: year stamp, mobile menu toggle, contact form, auth modal

function initCommon() {
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  const header = document.querySelector('.site-header');
  const toggle = document.getElementById('menu-toggle');
  if (toggle && header) {
    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    header.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.tagName === 'A' && header.classList.contains('open')) {
        header.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Contact form submit (idempotent)
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('cf-status');
  const submitBtn = document.getElementById('cf-submit');
  if (form && !form.dataset.bound) {
    form.dataset.bound = '1';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = (fd.get('name') || '').toString().trim();
      const email = (fd.get('email') || '').toString().trim();
      const message = (fd.get('message') || '').toString().trim();
      if (!name || !email || !message) {
        setStatus('必須項目を入力してください。', true);
        return;
      }
      try {
        setBusy(true);
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        form.reset();
        setStatus('送信しました。ありがとうございます。');
      } catch (err) {
        setStatus(`送信に失敗しました: ${escapeHTML(String(err))}`, true);
      } finally {
        setBusy(false);
      }
    });
  }

  // Auth modal (future)
  const authModal = document.getElementById('auth-modal');
  const loginOpen = document.getElementById('login-open');
  const authClose = document.getElementById('auth-close');
  if (authModal && loginOpen) {
    const open = () => authModal.classList.add('open');
    const close = () => authModal.classList.remove('open');
    loginOpen.addEventListener('click', (e) => { e.preventDefault(); open(); });
    authClose && authClose.addEventListener('click', close);
    authModal.addEventListener('click', (e) => { if (e.target && e.target.hasAttribute('data-close')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  function setBusy(b) { if (submitBtn) submitBtn.disabled = b; }
  function setStatus(msg, isError = false) {
    if (statusEl) {
      statusEl.textContent = msg;
      statusEl.style.color = isError ? '#ff6b6b' : 'var(--muted)';
    }
  }
}

function escapeHTML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.addEventListener('DOMContentLoaded', initCommon);
window.addEventListener('partials:loaded', initCommon);

