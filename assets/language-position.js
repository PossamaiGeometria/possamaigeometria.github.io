(() => {
  const STORAGE_KEY = 'possamai-language-position-v2';
  const LANGUAGE_LINK_SELECTOR = '.lang-switch a[lang], .language a[lang]';

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const normalizePath = (path) => {
    if (!path) return '/';
    const clean = path.replace(/\/index\.html$/i, '/');
    return clean.endsWith('/') ? clean : `${clean}/`;
  };

  const getMaxScroll = () => Math.max(
    document.documentElement.scrollHeight - window.innerHeight,
    0
  );

  const savePosition = (destinationHref) => {
    const destination = new URL(destinationHref, window.location.href);
    const maxScroll = getMaxScroll();

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      destinationPath: normalizePath(destination.pathname),
      scrollY: window.scrollY,
      pageProgress: maxScroll > 0 ? clamp(window.scrollY / maxScroll, 0, 1) : 0,
      savedAt: Date.now()
    }));
  };

  const readState = () => {
    let state;
    try {
      state = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    if (!state) return null;

    if (Date.now() - state.savedAt > 15000) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    if (normalizePath(window.location.pathname) !== state.destinationPath) {
      return null;
    }

    return state;
  };

  const restorePosition = () => {
    const state = readState();
    if (!state) return;

    sessionStorage.removeItem(STORAGE_KEY);

    const applyScroll = () => {
      const maxScroll = getMaxScroll();
      const proportionalY = maxScroll * (typeof state.pageProgress === 'number' ? state.pageProgress : 0);

      // Nas versões PT/ES o layout é equivalente. Usamos a posição absoluta quando
      // ela ainda cabe na página de destino; caso contrário, usamos a proporção.
      const absoluteY = typeof state.scrollY === 'number' ? state.scrollY : proportionalY;
      const destinationY = absoluteY <= maxScroll ? absoluteY : proportionalY;

      window.scrollTo({
        top: clamp(destinationY, 0, maxScroll),
        left: 0,
        behavior: 'auto'
      });
    };

    // O script é carregado com defer, portanto o DOM já está disponível aqui.
    // Aplicar imediatamente evita o efeito visual de "ir ao topo e voltar".
    applyScroll();
    requestAnimationFrame(applyScroll);

    // Reaplica após fontes/imagens alterarem discretamente a altura da página.
    window.addEventListener('load', applyScroll, { once: true });
    setTimeout(applyScroll, 120);
  };

  document.querySelectorAll(LANGUAGE_LINK_SELECTOR).forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const isCurrentLanguage =
        link.classList.contains('active') ||
        link.getAttribute('aria-current') === 'page';

      // Um segundo clique na bandeira do idioma já ativo não deve navegar,
      // recarregar a página, alterar o hash nem mover a rolagem.
      if (isCurrentLanguage) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      savePosition(link.href);
      window.location.assign(link.href);
    });
  });

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  restorePosition();
})();
