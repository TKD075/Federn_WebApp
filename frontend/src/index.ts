import { escapeAttr, escapeHTML } from './utils/sanitize.js';

type Project = {
  title?: string;
  description?: string;
  url?: string;
};

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

function renderProjectCard(host: HTMLElement, project: Project): void {
  const title = escapeHTML(project.title || 'Untitled');
  const desc = escapeHTML(project.description || '');
  const url = escapeAttr(project.url || '#');
  host.innerHTML = `
    <article class="card">
      <h3>${title}</h3>
      <p>${desc}</p>
      <p><a href="${url}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-icon">
        <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.57v-2.23c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.35-1.76-1.35-1.76-1.1-.75.08-.73.08-.73 1.22.09 1.86 1.25 1.86 1.25 1.08 1.85 2.84 1.32 3.53 1.01.11-.79.42-1.32.76-1.62-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.16 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.64.24 2.86.12 3.16.77.84 1.24 1.9 1.24 3.22 0 4.62-2.8 5.64-5.48 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.21.69.82.57A12 12 0 0 0 12 .5Z"/></svg>
        <span>GitHub リポジトリ</span>
      </a></p>
    </article>`;
}

async function renderLatestProject(): Promise<void> {
  const listEl = document.getElementById('project-list');
  if (!(listEl instanceof HTMLElement)) return;

  try {
    const project = await fetchJSON<Project>('/api/project/latest');
    renderProjectCard(listEl, project);
    return;
  } catch {
    // ignore and fall back to list endpoint
  }

  try {
    const projects = await fetchJSON<Project[]>('/api/projects');
    if (!Array.isArray(projects) || projects.length === 0) {
      listEl.innerHTML = '<p class="lead">まだデータがありません。</p>';
      return;
    }
    renderProjectCard(listEl, projects[0]);
  } catch (err) {
    listEl.innerHTML = `<p class="lead">バックエンドに接続できません: ${escapeHTML(String(err))}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  void renderLatestProject();
});
