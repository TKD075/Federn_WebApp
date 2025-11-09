// Render hero/about with data fetched from backend using React (no JSX)

const e = React.createElement;

function HeroProfile({ profile }) {
  const initial = (profile.name || 'U').trim().charAt(0).toUpperCase();
  const avatar = (profile.avatar_url || 'assets/favicon_tkd.svg').trim();
  const avatarEl = avatar
    ? e('img', {
        className: 'avatar',
        src: avatar,
        alt: `${profile.name || 'ユーザー'}のアイコン`,
        width: 96,
        height: 96,
        loading: 'eager',
        decoding: 'async',
      })
    : e('div', { className: 'avatar', 'aria-hidden': 'true' }, initial);
  return e(
    React.Fragment,
    null,
    avatarEl,
    e(
      'h1',
      { id: 'hero-title', className: 'hero-title' },
      e('span', { className: 'name' }, profile.name || ''),
      e('span', { className: 'title' }, profile.title || '')
    ),
    e(
      'p',
      { className: 'lead' },
      profile.bio || ''
    ),
    e(
      'div',
      { className: 'actions' },
      e(
        'a',
        { href: '#projects', id: 'cta', className: 'btn btn-primary' },
        'プロジェクトを見る'
      ),
      e('a', { className: 'btn btn-ghost', href: '#about' }, '自己紹介'),
      profile.github_url
        ? e(
            'a',
            {
              className: 'btn btn-ghost btn-icon',
              href: profile.github_url,
              target: '_blank',
              rel: 'noopener noreferrer',
            },
            e(
              'svg',
              { className: 'icon', viewBox: '0 0 24 24', 'aria-hidden': 'true' },
              e('path', {
                d: 'M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.57v-2.23c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.35-1.76-1.35-1.76-1.1-.75.08-.73.08-.73 1.22.09 1.86 1.25 1.86 1.25 1.08 1.85 2.84 1.32 3.53 1.01.11-.79.42-1.32.76-1.62-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.16 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.64.24 2.86.12 3.16.77.84 1.24 1.9 1.24 3.22 0 4.62-2.8 5.64-5.48 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.21.69.82.57A12 12 0 0 0 12 .5Z',
              })
            ),
            e('span', null, 'GitHub')
          )
        : null
    )
  );
}

function AboutProfile({ profile }) {
  return e(
    'div',
    null,
    e('p', { className: 'lead' }, profile.bio || ''),
    e(
      'ul',
      { className: 'features' },
      e('li', null, 'JavaScript / TypeScript（React）'),
      e('li', null, 'Go / REST API'),
      e('li', null, 'PostgreSQL / SQL'),
      e('li', null, 'AWS / Docker / CI')
    )
  );
}

async function loadProfile() {
  const endpoint = '/api/profile';
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error('failed to load profile');
  return await res.json();
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const profile = await loadProfile();
    const heroRootEl = document.getElementById('hero-react');
    if (heroRootEl) {
      const root = ReactDOM.createRoot(heroRootEl);
      root.render(e(HeroProfile, { profile }));
    }
    const aboutRootEl = document.getElementById('about-react');
    if (aboutRootEl) {
      const root = ReactDOM.createRoot(aboutRootEl);
      root.render(e(AboutProfile, { profile }));
    }
  } catch (err) {
    // Render minimal fallback if API fails
    const heroRootEl = document.getElementById('hero-react');
    if (heroRootEl) {
      heroRootEl.innerHTML = '<p class="lead">プロフィールを取得できませんでした。</p>';
    }
  }
});
