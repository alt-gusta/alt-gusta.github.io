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

  if (hamburger && navLinksMenu) {
    hamburger.addEventListener('click', () => {
      navLinksMenu.classList.toggle('open');
    });
  }

  // Form submission simulation
  const sendButton = document.querySelector('.btn-send');
  if (sendButton) {
    sendButton.addEventListener('click', function() {
      const originalText = this.textContent;
      const originalBg = this.style.background;

      this.textContent = 'MENSAGEM_ENVIADA ✓';
      this.style.background = 'var(--green-dim)';
      this.disabled = true;

      setTimeout(() => {
        this.textContent = originalText;
        this.style.background = originalBg;
        this.disabled = false;
      }, 2500);
    });
  }
});
