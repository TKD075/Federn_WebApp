import { escapeHTML } from '../utils/sanitize.js';

type StatusSetter = (message: string, isError?: boolean) => void;

function initCommon(): void {
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  initMenuToggle();
  initContactForm();
  initAuthModal();
}

function initMenuToggle(): void {
  const header = document.querySelector('.site-header') as HTMLElement | null;
  const toggle = document.getElementById('menu-toggle');
  if (!header || !toggle) return;

  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  header.addEventListener('click', (event) => {
    const target = event.target;
    if (
      target instanceof HTMLElement &&
      target.tagName === 'A' &&
      header.classList.contains('open')
    ) {
      header.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function initContactForm(): void {
  const form = document.getElementById('contact-form') as HTMLFormElement | null;
  const statusEl = document.getElementById('cf-status') as HTMLElement | null;
  const submitBtn = document.getElementById('cf-submit') as HTMLButtonElement | null;
  if (!form || form.dataset.bound) return;

  const setBusy = (busy: boolean): void => {
    if (submitBtn) submitBtn.disabled = busy;
  };
  const setStatus: StatusSetter = (message, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.style.color = isError ? '#ff6b6b' : 'var(--muted)';
  };

  form.dataset.bound = '1';
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
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
        body: JSON.stringify({ name, email, message }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.reset();
      setStatus('ありがとうございます。これはAPI疎通確認用ダミーメールです。');
    } catch (err) {
      setStatus(`送信に失敗しました: ${escapeHTML(String(err))}`, true);
    } finally {
      setBusy(false);
    }
  });
}

function initAuthModal(): void {
  const authModal = document.getElementById('auth-modal');
  const loginOpen = document.getElementById('login-open');
  const authClose = document.getElementById('auth-close');
  if (!authModal || !loginOpen) return;

  const open = (): void => authModal.classList.add('open');
  const close = (): void => authModal.classList.remove('open');

  loginOpen.addEventListener('click', (event) => {
    event.preventDefault();
    open();
  });
  authClose?.addEventListener('click', close);
  authModal.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.hasAttribute('data-close')) {
      close();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
}

window.addEventListener('DOMContentLoaded', initCommon);
window.addEventListener('partials:loaded', initCommon);
