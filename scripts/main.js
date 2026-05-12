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
});
