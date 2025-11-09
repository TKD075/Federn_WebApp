// Minimal top page behavior + integrations

document.addEventListener('DOMContentLoaded', () => {
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Mobile menu
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

  // Scroll spy for nav
  const navLinks = Array.from(document.querySelectorAll('#primary-nav a[href^="#"]'));
  const sections = navLinks
    .map((a) => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean);
  if (sections.length > 0 && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        const link = navLinks.find((a) => a.getAttribute('href') === `#${id}`);
        if (!link) return;
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          navLinks.forEach((a) => a.classList.remove('active'));
          link.classList.add('active');
        }
      });
    }, { root: null, threshold: [0.5] });
    sections.forEach((sec) => obs.observe(sec));
  }

  // Backend: load latest project (single)
  const list = document.getElementById('project-list');
  if (list) {
    const one = '/api/project/latest';
    fetch(one)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((p) => {
        const title = escapeHTML(p.title || 'Untitled');
        const desc = escapeHTML(p.description || '');
        const url = escapeAttr(p.url || '#');
        list.innerHTML = `
          <article class="card">
            <h3>${title}</h3>
            <p>${desc}</p>
            <p><a href="${url}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-icon">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.57v-2.23c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.35-1.76-1.35-1.76-1.1-.75.08-.73.08-.73 1.22.09 1.86 1.25 1.86 1.25 1.08 1.85 2.84 1.32 3.53 1.01.11-.79.42-1.32.76-1.62-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.16 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.64.24 2.86.12 3.16.77.84 1.24 1.9 1.24 3.22 0 4.62-2.8 5.64-5.48 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.21.69.82.57A12 12 0 0 0 12 .5Z"/></svg>
              <span>GitHub リポジトリ</span>
            </a></p>
          </article>`;
      })
      .catch(() => {
        // Fallback: try list endpoint
        const endpoint = '/api/projects';
        fetch(endpoint)
          .then((r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          })
          .then((items) => {
            if (!Array.isArray(items) || items.length === 0) {
              list.innerHTML = '<p class="lead">まだデータがありません。</p>';
              return;
            }
            const p = items[0];
            const title = escapeHTML(p.title || 'Untitled');
            const desc = escapeHTML(p.description || '');
            const url = escapeAttr(p.url || '#');
            list.innerHTML = `
              <article class="card">
                <h3>${title}</h3>
                <p>${desc}</p>
                <p><a href="${url}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-icon">
                  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.57v-2.23c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.35-1.76-1.35-1.76-1.1-.75.08-.73.08-.73 1.22.09 1.86 1.25 1.86 1.25 1.08 1.85 2.84 1.32 3.53 1.01.11-.79.42-1.32.76-1.62-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.16 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.64.24 2.86.12 3.16.77.84 1.24 1.9 1.24 3.22 0 4.62-2.8 5.64-5.48 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.21.69.82.57A12 12 0 0 0 12 .5Z"/></svg>
                  <span>GitHub リポジトリ</span>
                </a></p>
              </article>`;
          })
          .catch((err) => {
            list.innerHTML = `<p class="lead">バックエンドに接続できません: ${escapeHTML(String(err))}</p>`;
          });
      });
  }

  // Contact form submit
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('cf-status');
  const submitBtn = document.getElementById('cf-submit');
  if (form) {
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
    const authForm = document.getElementById('auth-form');
    const authStatus = document.getElementById('auth-status');
    const authSubmit = document.getElementById('auth-submit');
    if (authForm) {
      authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (authStatus) authStatus.textContent = 'ログイン機能は未実装です。';
        if (authSubmit) {
          authSubmit.disabled = true;
          setTimeout(() => { authSubmit.disabled = false; }, 800);
        }
      });
    }
  }

  function setBusy(b) {
    if (submitBtn) submitBtn.disabled = b;
  }
  function setStatus(msg, isError = false) {
    if (statusEl) {
      statusEl.textContent = msg;
      statusEl.style.color = isError ? '#ff6b6b' : 'var(--muted)';
    }
  }
});

// Escape helpers
function escapeHTML(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function escapeAttr(s) {
  return escapeHTML(s);
}
