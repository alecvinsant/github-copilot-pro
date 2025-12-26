// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// Navbar background change on scroll
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.background = 'rgba(15, 23, 42, 0.98)';
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    } else {
        navbar.style.background = 'rgba(15, 23, 42, 0.95)';
        navbar.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// Add intersection observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards
document.querySelectorAll('.feature-card').forEach((card, index) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
});

// Observe stats
document.querySelectorAll('.stat').forEach((stat, index) => {
    stat.style.opacity = '0';
    stat.style.transform = 'translateY(30px)';
    stat.style.transition = `opacity 0.6s ease ${index * 0.15}s, transform 0.6s ease ${index * 0.15}s`;
    observer.observe(stat);
});

// Animate numbers in stats section
const animateNumber = (element, start, end, duration) => {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value + (element.dataset.suffix || '');
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
};

// Trigger number animation when stats come into view
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
            entry.target.classList.add('animated');
            const statNumber = entry.target.querySelector('.stat-number');
            const text = statNumber.textContent;
            
            // Extract number and suffix
            const match = text.match(/(\d+)(.+)?/);
            if (match) {
                const number = parseInt(match[1]);
                const suffix = match[2] || '';
                statNumber.dataset.suffix = suffix;
                statNumber.textContent = '0' + suffix;
                animateNumber(statNumber, 0, number, 2000);
            }
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat').forEach(stat => {
    statsObserver.observe(stat);
});

// Add active state to navigation links based on scroll position
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 100) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Add parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroContent = document.querySelector('.hero-content');
    const heroVisual = document.querySelector('.hero-visual');
    
    if (heroContent) {
        heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
    if (heroVisual) {
        heroVisual.style.transform = `translateY(${scrolled * 0.2}px)`;
    }
});

// Add click effect to feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', function() {
        // Create ripple effect
        const ripple = document.createElement('span');
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(102, 126, 234, 0.3)';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.pointerEvents = 'none';
        
        this.style.position = 'relative';
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Add typing effect to code window (optional enhancement)
const codeContent = document.querySelector('.code-content code');
if (codeContent) {
    const originalText = codeContent.innerHTML;
    let index = 0;
    
    // Uncomment to enable typing effect
    /*
    codeContent.innerHTML = '';
    const typeWriter = () => {
        if (index < originalText.length) {
            codeContent.innerHTML += originalText.charAt(index);
            index++;
            setTimeout(typeWriter, 50);
        }
    };
    setTimeout(typeWriter, 1000);
    */
}

// Console message for developers
console.log('%c🚀 GitHub Copilot Pro', 'font-size: 24px; font-weight: bold; color: #667eea;');
console.log('%cWelcome to the future of coding!', 'font-size: 14px; color: #94a3b8;');
console.log('%cInterested in the code? Check out the repository: https://github.com/alecvinsant/github-copilot-pro', 'font-size: 12px; color: #667eea;');
