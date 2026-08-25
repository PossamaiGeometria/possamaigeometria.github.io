(() => {
  const STORAGE_KEY = 'possamai-language-position-v1';
  const LANGUAGE_LINK_SELECTOR = '.lang-switch a[lang], .language a[lang]';
  const SECTION_ID_FALLBACKS = {
    aplicacoes: 'aplicaciones',
    aplicaciones: 'aplicacoes',
    entregaveis: 'entregables',
    entregables: 'entregaveis',
    duvidas: 'preguntas',
    preguntas: 'duvidas',
    diferenciais: 'diferenciales',
    diferenciales: 'diferenciais',
    preparacao: 'preparacion',
    preparacion: 'preparacao'
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const normalizePath = (path) => {
    if (!path) return '/';
    const clean = path.replace(/\/index\.html$/i, '/');
    return clean.endsWith('/') ? clean : `${clean}/`;
  };

  const headerOffset = () => {
    const header = document.querySelector('.site-header, .service-header');
    return header ? header.getBoundingClientRect().height : 0;
  };

  const getReferenceY = () => headerOffset() + 20;

  const findCurrentSection = () => {
    const sections = Array.from(document.querySelectorAll('section[id]'));
    if (!sections.length) return null;

    const referenceY = getReferenceY();
    let current = sections.find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= referenceY && rect.bottom > referenceY;
    });

    if (!current) {
      current = sections.reduce((best, section) => {
        const distance = Math.abs(section.getBoundingClientRect().top - referenceY);
        if (!best || distance < best.distance) return { section, distance };
        return best;
      }, null)?.section || null;
    }

    if (!current) return null;
    const rect = current.getBoundingClientRect();
    const progress = clamp((referenceY - rect.top) / Math.max(rect.height, 1), 0, 1);
    return { id: current.id, progress };
  };

  const savePosition = (destinationHref) => {
    const destination = new URL(destinationHref, window.location.href);
    const currentSection = findCurrentSection();
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      destinationPath: normalizePath(destination.pathname),
      sectionId: currentSection?.id || '',
      sectionProgress: currentSection?.progress ?? null,
      pageProgress: clamp(window.scrollY / maxScroll, 0, 1),
      savedAt: Date.now()
    }));
  };

  const resolveTargetSection = (sectionId) => {
    if (!sectionId) return null;
    return document.getElementById(sectionId) ||
      document.getElementById(SECTION_ID_FALLBACKS[sectionId] || '');
  };

  const restorePosition = () => {
    let state;
    try {
      state = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    if (!state) return;
    if (Date.now() - state.savedAt > 15000) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
    if (normalizePath(window.location.pathname) !== state.destinationPath) return;

    const applyScroll = () => {
      const target = resolveTargetSection(state.sectionId);
      let destinationY;

      if (target) {
        const absoluteTop = target.getBoundingClientRect().top + window.scrollY;
        const progress = typeof state.sectionProgress === 'number' ? state.sectionProgress : 0;
        destinationY = absoluteTop + (target.offsetHeight * progress) - getReferenceY();
      } else {
        const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
        destinationY = maxScroll * (typeof state.pageProgress === 'number' ? state.pageProgress : 0);
      }

      window.scrollTo({ top: Math.max(0, destinationY), left: 0, behavior: 'auto' });
    };

    sessionStorage.removeItem(STORAGE_KEY);
    requestAnimationFrame(() => requestAnimationFrame(applyScroll));
    setTimeout(applyScroll, 180);
  };

  document.querySelectorAll(LANGUAGE_LINK_SELECTOR).forEach((link) => {
    if (link.classList.contains('active') || link.getAttribute('aria-current') === 'page') return;

    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      savePosition(link.href);
      window.location.assign(link.href);
    });
  });

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (document.readyState === 'complete') restorePosition();
  else window.addEventListener('load', restorePosition, { once: true });
})();
