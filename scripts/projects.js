/* ─────────────────────────────────────────────
   projects.js  —  Carregamento dinâmico de projetos
   Lê data/projects.json e monta carrosséis por categoria
   ───────────────────────────────────────────── */

/* Observer reutilizável para animar elementos injetados dinamicamente */
const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08 }
);

const DEFAULT_PROJECT_IMAGE = 'data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%" height="100%" fill="%23111827"/><rect x="32" y="32" width="576" height="296" rx="16" fill="%231a2233"/><text x="50%" y="44%" fill="%2378bdf8" font-family="JetBrains%20Mono,monospace" font-size="28" text-anchor="middle">IMAGEM</text><text x="50%" y="58%" fill="%23647eaa" font-family="JetBrains%20Mono,monospace" font-size="18" text-anchor="middle">GENÉRICA</text></svg>';

async function loadProjects() {
  const container = document.getElementById('projects-root');
  if (!container) return;

  let data;
  try {
    const res = await fetch('data/projects.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error('[projects.js] Erro ao carregar projects.json:', err);
    container.innerHTML = '<p class="projects-error">// ERRO ao carregar projetos.</p>';
    return;
  }

  container.innerHTML = '';

  // build carousels
  data.categories.forEach(category => {
    const section = buildCarousel(category);
    container.appendChild(section);
    initializeCarousel(section);
  });

  // collect chips and attach data attributes to cards
  const uniqueChips = new Set();
  container.querySelectorAll('.project-card').forEach(card => {
    const chips = Array.from(card.querySelectorAll('.chip')).map(c => c.textContent.trim().toLowerCase());
    card.setAttribute('data-chips', chips.join(','));
    chips.forEach(c => uniqueChips.add(c));
  });

  // inject filter UI
  if (uniqueChips.size > 0) createFilterUI(container, Array.from(uniqueChips).sort());
}

/* ── Constrói o bloco completo de um carrossel ── */
function buildCarousel(category) {
  const wrapper = document.createElement('div');
  wrapper.className = 'carousel-section';

  /* Cabeçalho da categoria */
  wrapper.innerHTML = `
    <div class="carousel-header">
      <div>
        <div class="carousel-tag">${category.tag}</div>
        <h3 class="carousel-label">${category.label}</h3>
        <p class="carousel-desc">${category.desc}</p>
      </div>
      <div class="carousel-controls">
        <button class="carousel-btn" data-dir="-1" aria-label="Anterior">&#x2039;</button>
        <button class="carousel-btn" data-dir="1"  aria-label="Próximo">&#x203a;</button>
      </div>
    </div>
  `;

  /* Track dos cards */
  const track = document.createElement('div');
  track.className = 'carousel-track';

  category.projects.forEach((project, i) => {
    const card = buildCard(project);
    /* Delay escalonado para efeito cascata */
    card.style.transitionDelay = `${i * 80}ms`;
    track.appendChild(card);
    fadeObserver.observe(card);
  });

  wrapper.appendChild(track);

  /* Dots de navegação */
  const dots = buildDots(1, track, wrapper);
  wrapper.appendChild(dots);

  /* Navegação pelos botões */
  wrapper.querySelectorAll('.carousel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const metrics = getCarouselMetrics(track);
      if (!metrics) return;

      const currentPage = Math.round(track.scrollLeft / metrics.pageWidth);
      let nextPage = currentPage + parseInt(btn.dataset.dir, 10);

      if (nextPage < 0) nextPage = metrics.pageCount - 1;
      if (nextPage >= metrics.pageCount) nextPage = 0;

      track.scrollTo({ left: getPageOffset(track, nextPage), behavior: 'smooth' });
    });
  });

  /* Atualiza dots ao rolar */
  track.addEventListener('scroll', () => updateDots(track, wrapper), { passive: true });
  window.addEventListener('resize', () => initializeCarousel(wrapper));

  return wrapper;
}

function initializeCarousel(wrapper) {
  const track = wrapper.querySelector('.carousel-track');
  const dots = wrapper.querySelector('.carousel-dots');
  if (!track || !dots) return;

  const pageCount = getCarouselMetrics(track)?.pageCount ?? 1;
  const newDots = buildDots(pageCount, track, wrapper);
  dots.replaceWith(newDots);
  updateDots(track, wrapper);
}

/* ── Monta um card individual ── */
function buildCard(project) {
  const card = document.createElement('div');
  card.className = 'project-card fade-up';

  const chipsHtml = project.chips
    .map(c => `<span class="chip">${c}</span>`)
    .join('');

  const codeLink = project.links.code
    ? `<a href="${project.links.code}" target="_blank" rel="noopener noreferrer" aria-label="Abrir código do ${project.title}">CODE</a>`
    : '';

  const demoLink = project.links.demo
    ? `<a href="${project.links.demo}" target="_blank" rel="noopener noreferrer" aria-label="Abrir demo do ${project.title}">DEMO</a>`
    : '';

  const imageSrc = project.image || DEFAULT_PROJECT_IMAGE;

  card.innerHTML = `
    <div class="project-cover">
      <img src="${imageSrc}" alt="${project.title} — imagem" loading="lazy" decoding="async" />
    </div>
    <div class="project-title">${project.title}</div>
    <div class="project-desc">${project.desc}</div>
    <div class="project-chips">${chipsHtml}</div>
    <div class="project-links">${codeLink}${demoLink}</div>
  `;

  return card;
}

function createFilterUI(container, chips) {
  const bar = document.createElement('div');
  bar.className = 'filter-bar';
  bar.innerHTML = `<button class="filter-btn active" data-filter="all">Todos</button>` + chips.map(c => ` <button class="filter-btn" data-filter="${c}">${c}</button>`).join('');
  container.prepend(bar);

  bar.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      filterProjectCards(container, filter);
    });
  });
}

function filterProjectCards(container, filter) {
  const sections = container.querySelectorAll('.carousel-section');
  sections.forEach(sec => {
    let anyVisible = false;
    sec.querySelectorAll('.project-card').forEach(card => {
      const chips = card.getAttribute('data-chips') || '';
      const show = filter === 'all' ? true : chips.split(',').includes(filter);
      card.style.display = show ? '' : 'none';
      if (show) anyVisible = true;
    });
    sec.style.display = anyVisible ? '' : 'none';
  });
}

function getCarouselMetrics(track) {
  const card = track.querySelector('.project-card');
  if (!card) return null;

  const styles = getComputedStyle(track);
  const gap = parseFloat(styles.gap || styles.columnGap || '0');
  const cardWidth = card.offsetWidth;
  const visibleCards = Math.max(
    1,
    Math.floor((track.clientWidth + gap) / (cardWidth + gap))
  );
  const pageWidth = cardWidth * visibleCards + Math.max(0, visibleCards - 1) * gap;
  const pageCount = Math.max(1, Math.ceil(track.children.length / visibleCards));

  return { cardWidth, gap, visibleCards, pageWidth, pageCount };
}

function getPageOffset(track, pageIndex) {
  const metrics = getCarouselMetrics(track);
  if (!metrics) return 0;
  const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
  return Math.min(pageIndex * metrics.pageWidth, maxScroll);
}

/* ── Dots de progresso ── */
function buildDots(count, track, wrapper) {
  const nav = document.createElement('div');
  nav.className = 'carousel-dots';

  for (let i = 0; i < count; i++) {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Página ${i + 1}`);
    dot.addEventListener('click', () => {
      track.scrollTo({ left: getPageOffset(track, i), behavior: 'smooth' });
    });
    nav.appendChild(dot);
  }

  return nav;
}

function updateDots(track, wrapper) {
  const metrics = getCarouselMetrics(track);
  if (!metrics) return;

  let index = Math.round((track.scrollLeft - metrics.cloneOffset) / metrics.pageWidth);
  if (index < 0) index = metrics.pageCount - 1;
  if (index >= metrics.pageCount) index = 0;

  wrapper.querySelectorAll('.carousel-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === index);
  });
}

/* ── Inicialização ── */
document.addEventListener('DOMContentLoaded', loadProjects);