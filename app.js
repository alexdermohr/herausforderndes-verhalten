(() => {
  const search = document.querySelector('#search');
  const clear = document.querySelector('#clearSearch');
  const status = document.querySelector('#searchStatus');
  const sections = [...document.querySelectorAll('.searchable')];
  const quizItems = [...document.querySelectorAll('.quiz-item')];

  const normalize = (value) => value
    .toLocaleLowerCase('de-DE')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const filter = () => {
    const query = normalize(search.value.trim());
    let visible = 0;
    sections.forEach((section) => {
      const haystack = normalize(`${section.dataset.search || ''} ${section.textContent}`);
      const match = !query || haystack.includes(query);
      section.classList.toggle('search-hidden', !match);
      if (match) visible += 1;
    });
    if (!query) {
      status.textContent = '';
    } else {
      status.textContent = `${visible} von ${sections.length} Themenblöcken passen zu „${search.value.trim()}“.`;
    }
  };

  search?.addEventListener('input', filter);
  clear?.addEventListener('click', () => {
    search.value = '';
    filter();
    search.focus();
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
    window.setTimeout(() => item.classList.remove('flash'), 1400);
  });

  const sisterHref = 'internalisierendes-verhalten.html';
  const internalisingCard = [...document.querySelectorAll('.behavior-types article')]
    .find((card) => card.querySelector('h3')?.textContent.trim() === 'Internalisierend');
  if (internalisingCard && !internalisingCard.querySelector(`a[href="${sisterHref}"]`)) {
    const link = document.createElement('a');
    link.className = 'button small';
    link.href = sisterHref;
    link.textContent = 'Internalisierend vertiefen →';
    internalisingCard.append(link);
  }

  const nav = document.querySelector('.topnav .nav-inner');
  if (nav && !nav.querySelector(`a[href="${sisterHref}"]`)) {
    const link = document.createElement('a');
    link.href = sisterHref;
    link.textContent = 'Internalisierend';
    nav.append(link);
  }
})();
