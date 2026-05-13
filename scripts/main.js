document.addEventListener('DOMContentLoaded', () => {
  // Fade-in on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        // Add a staggered delay
        setTimeout(() => e.target.classList.add('visible'), i * 60);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-up').forEach(el => {
    observer.observe(el);
  });

  // Active nav link highlight on scroll
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const activateNavLink = () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (window.scrollY >= sectionTop - 100) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', activateNavLink);

  // Hamburger menu toggle
  const hamburger = document.getElementById('hamburger');
  const navLinksMenu = document.getElementById('navLinks');
  const navToggle = document.getElementById('navToggle');

  function setNavOpen(open) {
    if (!navLinksMenu) return;
    navLinksMenu.classList.toggle('open', open);
    if (hamburger) {
      hamburger.setAttribute('aria-expanded', open);
      hamburger.classList.toggle('open', open);
    }
    if (navToggle) navToggle.setAttribute('aria-expanded', open);
    // expose state for assistive tech
    navLinksMenu.setAttribute('aria-hidden', String(!open));
  }

  if (hamburger && navLinksMenu) {
    hamburger.addEventListener('click', () => setNavOpen(!navLinksMenu.classList.contains('open')));
    // keyboard support
    hamburger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setNavOpen(!navLinksMenu.classList.contains('open'));
      }
    });
  }
  if (navToggle && navLinksMenu) {
    navToggle.addEventListener('click', () => setNavOpen(!navLinksMenu.classList.contains('open')));
  }

  // Close menu when link clicked (mobile)
  navLinksMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setNavOpen(false)));

  // Close on ESC
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setNavOpen(false); });

  // Form submission simulation
  // Form submission: validation + mailto fallback
  const sendButton = document.querySelector('.btn-send');
  const formFeedback = document.getElementById('formFeedback');
  if (sendButton) {
    sendButton.addEventListener('click', function () {
      const emailInput = document.getElementById('email');
      const messageInput = document.getElementById('message');
      const email = emailInput ? emailInput.value.trim() : '';
      const message = messageInput ? messageInput.value.trim() : '';

      function showFeedback(msg, ok = false) {
        if (formFeedback) formFeedback.textContent = msg;
        if (ok) {
          formFeedback.style.color = 'var(--green)';
        } else {
          formFeedback.style.color = 'var(--red)';
        }
      }

      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        showFeedback('Por favor, insira um e-mail válido.');
        return;
      }
      if (!message || message.length < 8) {
        showFeedback('Mensagem muito curta. Escreva pelo menos 8 caracteres.');
        return;
      }

      const originalText = this.textContent;
      this.textContent = 'ENVIANDO...';
      this.disabled = true;

      // Fallback: abrir cliente de e-mail com subject/body (sem destinatário configurado)
      const subject = encodeURIComponent('Contato via portfólio');
      const body = encodeURIComponent(`De: ${email}\n\n${message}`);
      // Sem destinatário para permitir abrir o cliente do usuário — ajuste se quiser um email direto
      window.location.href = `mailto:?subject=${subject}&body=${body}`;

      setTimeout(() => {
        this.textContent = originalText;
        this.disabled = false;
        showFeedback('A janela do seu cliente de e-mail foi aberta.', true);
      }, 1200);
    });
  }

  // Theme toggle (dark / light) with prefers-color-scheme and persistence
  const themeToggle = document.getElementById('themeToggle');
  function applyTheme(theme) {
    if (theme === 'light') document.documentElement.classList.add('light-theme');
    else document.documentElement.classList.remove('light-theme');
    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
      themeToggle.textContent = theme === 'light' ? '☀️' : '🌙';
    }
    try { localStorage.setItem('theme', theme); } catch (e) { }
  }

  const savedTheme = (() => { try { return localStorage.getItem('theme'); } catch (e) { return null; } })();
  if (savedTheme) applyTheme(savedTheme);
  else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) applyTheme('light');

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const now = document.documentElement.classList.contains('light-theme') ? 'light' : 'dark';
      applyTheme(now === 'light' ? 'dark' : 'light');
    });
  }

  // GitHub stats: advanced metrics (commits, lines of code, PRs)
  // Helper function to format numbers like social media (K, M)
  function formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  }

  function animateCount(el, to, format = 'number') {
    const start = 0;
    const duration = 800;
    const startTime = performance.now();
    function tick(now) {
      const progress = Math.min(1, (now - startTime) / duration);
      const value = Math.floor(progress * (to - start) + start);
      
      let displayValue = value;
      if (format === 'number') displayValue = formatNumber(value);
      else if (format === 'hours') displayValue = formatNumber(value) + 'h';
      
      el.textContent = displayValue;
      
      if (progress < 1) requestAnimationFrame(tick);
      else {
        let finalValue = to;
        if (format === 'number') finalValue = formatNumber(to);
        else if (format === 'hours') finalValue = formatNumber(to) + 'h';
        el.textContent = finalValue;
      }
    }
    requestAnimationFrame(tick);
  }

  async function fetchGitHubStats() {
    try {
      // Fetch user repos
      const reposRes = await fetch('https://api.github.com/users/alt-gusta/repos?per_page=100');
      if (!reposRes.ok) throw new Error('Failed to fetch repos');
      const repos = await reposRes.json();

      let totalCommits = 0;
      let totalSize = 0;
      let totalPRs = 0;

      // Process each repo
      for (const repo of repos) {
        // Get commits count for this repo
        try {
          const commitsRes = await fetch(`https://api.github.com/repos/alt-gusta/${repo.name}/commits?per_page=1`);
          if (commitsRes.ok) {
            const link = commitsRes.headers.get('link');
            if (link) {
              const matches = link.match(/&page=(\d+)>; rel="last"/);
              if (matches) totalCommits += parseInt(matches[1], 10);
            } else {
              totalCommits += 1; // At least 1 commit
            }
          }
        } catch (e) { }

        // Accumulate size (in KB)
        totalSize += repo.size || 0;

        // Count PRs (approximation from open_issues_count if repo has PRs enabled)
        if (repo.open_issues_count) totalPRs += Math.floor(repo.open_issues_count * 0.3); // rough estimate
      }

      // Approximate lines of code: size in KB * average lines per KB
      const estimatedLines = Math.floor(totalSize * 50); // rough: ~50 lines per KB

      // Update DOM
      const commitsEl = document.getElementById('commitsCount');
      const linesEl = document.getElementById('linesCount');
      const prsEl = document.getElementById('prsCount');

      if (commitsEl) animateCount(commitsEl, totalCommits);
      if (linesEl) animateCount(linesEl, estimatedLines);
      if (prsEl) animateCount(prsEl, repos.length + totalPRs); // repos count + estimated PRs
    } catch (err) {
      console.error('GitHub stats error:', err);
      document.getElementById('commitsCount') && (document.getElementById('commitsCount').textContent = '—');
      document.getElementById('linesCount') && (document.getElementById('linesCount').textContent = '—');
      document.getElementById('prsCount') && (document.getElementById('prsCount').textContent = '—');
    }
  }

  async function fetchWakatiStats() {
    try {
      // Wakatime API (public stats, no auth needed for public profiles)
      // Replace with actual Wakatime username if available
      const wakatiRes = await fetch('https://wakatime.com/api/v1/users/current/stats/all_time?range=last_7_days', {
        headers: { 'Authorization': 'Bearer ' + (window.WAKATIME_API_KEY || '') }
      });

      if (wakatiRes.ok) {
        const data = await wakatiRes.json();
        const hours = data.data?.total_seconds ? Math.floor(data.data.total_seconds / 3600) : 0;
        const hoursEl = document.getElementById('hoursCount');
        if (hoursEl) animateCount(hoursEl, hours, 'hours');
      }
    } catch (err) {
      // Wakatime is optional, so we just fallback
      const hoursEl = document.getElementById('hoursCount');
      if (hoursEl) hoursEl.textContent = '—';
    }
  }

  // Load GitHub stats on page load
  fetchGitHubStats();

  // Try to load Wakatime stats (optional)
  // Uncomment and set window.WAKATIME_API_KEY if you want to enable it
  // fetchWakatiStats();
});
