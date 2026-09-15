(() => {
  const body = document.body;
  const search = document.querySelector('#search');
  const clear = document.querySelector('#clearSearch');
  const status = document.querySelector('#searchStatus');
  const sections = [...document.querySelectorAll('.searchable')];
  const quizItems = [...document.querySelectorAll('.quiz-item')];

  const normalize = (value = '') => value
    .toLocaleLowerCase('de-DE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Lesefortschritt: rein visuell, ohne Tracking oder Netzwerkzugriff.
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  progress.innerHTML = '<span></span>';
  body.prepend(progress);
  const progressBar = progress.firstElementChild;
  const updateReadingProgress = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const value = Math.min(1, Math.max(0, window.scrollY / max));
    progressBar.style.transform = `scaleX(${value})`;
  };
  updateReadingProgress();
  window.addEventListener('scroll', updateReadingProgress, { passive: true });
  window.addEventListener('resize', updateReadingProgress);

  // Klare Lern-Einstiege, ohne den eigentlichen Inhalt zu duplizieren.
  const toolbar = document.querySelector('.toolbar');
  if (toolbar && !document.querySelector('.study-launchpad')) {
    const launchpad = document.createElement('section');
    launchpad.className = 'study-launchpad';
    launchpad.setAttribute('aria-labelledby', 'lernwege-title');
    launchpad.innerHTML = `
      <div class="launchpad-head">
        <div><p class="eyebrow">Lernwege</p><h2 id="lernwege-title">Was willst du gerade schaffen?</h2></div>
        <p>Vier direkte Einstiege statt einmal durch alles scrollen.</p>
      </div>
      <div class="launch-grid">
        <a class="launch-card" href="#landkarte"><span>01</span><strong>5-Minuten-Überblick</strong><small>Kernprinzipien und Denkmodell</small></a>
        <a class="launch-card" href="#fallanalyse"><span>02</span><strong>Fall analysieren</strong><small>13 Schritte + Satzstarter</small></a>
        <a class="launch-card featured" href="internalisierendes-verhalten.html"><span>03</span><strong>Internalisierend vertiefen</strong><small>Erkennen · Verstehen · Handeln</small></a>
        <a class="launch-card" href="#training"><span>04</span><strong>Klausur trainieren</strong><small>20 Fragen mit Lösungen</small></a>
      </div>`;
    toolbar.insertAdjacentElement('afterend', launchpad);
  }

  // Suche: fehlertolerant und per Tastatur erreichbar.
  const filter = () => {
    if (!search) return;
    const raw = search.value.trim();
    const query = normalize(raw);
    let visible = 0;
    sections.forEach((section) => {
      const haystack = normalize(`${section.dataset.search || ''} ${section.textContent}`);
      const match = !query || haystack.includes(query);
      section.classList.toggle('search-hidden', !match);
      if (match) visible += 1;
    });
    if (status) {
      status.textContent = query
        ? `${visible} von ${sections.length} Themenblöcken passen zu „${raw}“.`
        : 'Tipp: Mit / springst du direkt in die Suche.';
    }
  };

  search?.addEventListener('input', filter);
  clear?.addEventListener('click', () => {
    search.value = '';
    filter();
    search.focus();
  });
  if (search && status && !search.value) filter();

  document.addEventListener('keydown', (event) => {
    const target = event.target;
    const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable;
    if (event.key === '/' && !typing && search) {
      event.preventDefault();
      search.focus();
      search.select();
    }
    if (event.key === 'Escape' && document.activeElement === search && search?.value) {
      search.value = '';
      filter();
    }
  });

  // Aktive Navigation: zeigt beim Scrollen, wo man gerade ist.
  const navLinks = [...document.querySelectorAll('.topnav a[href^="#"]')];
  const navTargets = navLinks
    .map((link) => ({ link, target: document.querySelector(link.getAttribute('href')) }))
    .filter(({ target }) => target);

  const setActiveNav = (id) => {
    navTargets.forEach(({ link, target }) => {
      const active = target.id === id;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  if ('IntersectionObserver' in window && navTargets.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible?.target?.id) setActiveNav(visible.target.id);
    }, { rootMargin: '-22% 0px -68% 0px', threshold: [0, .1, .35] });
    navTargets.forEach(({ target }) => observer.observe(target));
  }

  // Quizbedienung + lokaler Lernstand. Es werden keine Daten versendet.
  const quizControls = document.querySelector('.quiz-controls');
  let seen = new Set();
  const storageKey = `klausurkompass:quiz-seen:${location.pathname}`;
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    seen = new Set(stored.filter((value) => Number.isInteger(value)));
  } catch (_) { /* localStorage ist optional */ }

  const quizProgress = document.createElement('p');
  quizProgress.className = 'quiz-progress';
  quizProgress.setAttribute('aria-live', 'polite');
  const updateQuizProgress = () => {
    if (!quizItems.length) return;
    quizProgress.textContent = `Lernstand: ${seen.size} von ${quizItems.length} Antworten angesehen.`;
    try { localStorage.setItem(storageKey, JSON.stringify([...seen])); } catch (_) { /* optional */ }
  };
  if (quizControls && quizItems.length) {
    quizControls.insertAdjacentElement('afterend', quizProgress);
    updateQuizProgress();
  }

  quizItems.forEach((item, index) => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        seen.add(index);
        updateQuizProgress();
      }
    });
  });

  document.querySelector('#openAllAnswers')?.addEventListener('click', () => {
    quizItems.forEach((item) => { item.open = true; });
  });

  document.querySelector('#closeAllAnswers')?.addEventListener('click', () => {
    quizItems.forEach((item) => { item.open = false; });
  });

  document.querySelector('#randomQuestion')?.addEventListener('click', () => {
    if (!quizItems.length) return;
    quizItems.forEach((item) => { item.open = false; item.classList.remove('flash'); });
    const item = quizItems[Math.floor(Math.random() * quizItems.length)];
    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
    item.classList.add('flash');
    item.querySelector('summary')?.focus({ preventScroll: true });
    window.setTimeout(() => item.classList.remove('flash'), 1400);
  });

  // Querverlinkung bleibt auch für den bisherigen HTML-Bestand verfügbar.
  const sisterHref = 'internalisierendes-verhalten.html';
  const internalisingCard = [...document.querySelectorAll('.behavior-types article')]
    .find((card) => card.querySelector('h3')?.textContent.trim() === 'Internalisierend');
  if (internalisingCard && !internalisingCard.querySelector(`a[href="${sisterHref}"]`)) {
    const link = document.createElement('a');
    link.className = 'button small card-link';
    link.href = sisterHref;
    link.textContent = 'Schwerpunktseite öffnen →';
    internalisingCard.append(link);
  }

  const nav = document.querySelector('.topnav .nav-inner');
  if (nav && !nav.querySelector(`a[href="${sisterHref}"]`)) {
    const link = document.createElement('a');
    link.href = sisterHref;
    link.className = 'nav-sister-link';
    link.textContent = 'Internalisierend ↗';
    nav.append(link);
  }

  // Kleine Werkzeugleiste: Drucken/Lernzettel und schnell nach oben.
  const dock = document.createElement('div');
  dock.className = 'utility-dock';
  dock.setAttribute('aria-label', 'Seitenwerkzeuge');
  dock.innerHTML = `
    <button class="utility-button" type="button" data-print aria-label="Seite drucken oder als PDF sichern">Drucken</button>
    <button class="utility-button utility-top" type="button" data-top aria-label="Zum Seitenanfang">↑</button>`;
  body.append(dock);
  dock.querySelector('[data-print]')?.addEventListener('click', () => window.print());
  dock.querySelector('[data-top]')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Beim Drucken sind alle Details sichtbar; danach wird der Zustand wiederhergestellt.
  let detailsBeforePrint = [];
  const allDetails = [...document.querySelectorAll('details')];
  window.addEventListener('beforeprint', () => {
    detailsBeforePrint = allDetails.map((item) => item.open);
    allDetails.forEach((item) => { item.open = true; });
  });
  window.addEventListener('afterprint', () => {
    allDetails.forEach((item, index) => { item.open = detailsBeforePrint[index] ?? item.open; });
  });
})();
