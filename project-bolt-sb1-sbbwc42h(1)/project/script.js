// Smooth-scroll anchor links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Simple email validation
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Stripe integration
let stripe;
let plans = [];

// Initialize Stripe
async function initializeStripe() {
  try {
    const response = await fetch('/api/stripe/config');
    const { publishableKey } = await response.json();
    stripe = Stripe(publishableKey);
    
    // Load plans
    const plansResponse = await fetch('/api/plans');
    plans = await plansResponse.json();
    
    // Update pricing buttons with Stripe checkout
    updatePricingButtons();
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

// Update pricing buttons to handle Stripe checkout
function updatePricingButtons() {
  const pricingButtons = document.querySelectorAll('.pricing__card .btn');
  
  pricingButtons.forEach((button, index) => {
    const plan = plans[index];
    if (plan && plan.priceId) {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        handleSubscription(plan);
      });
    }
  });
}

// Handle subscription checkout
async function handleSubscription(plan) {
  try {
    // Get customer email from contact form or prompt
    const customerEmail = prompt('Please enter your email address:');
    if (!customerEmail || !validateEmail(customerEmail)) {
      alert('Please enter a valid email address.');
      return;
    }

    const customerName = prompt('Please enter your full name:');
    
    // Create checkout session
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: plan.priceId,
        customerEmail,
        customerName
      }),
    });

    const { sessionId } = await response.json();
    
    // Redirect to Stripe Checkout
    const { error } = await stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      console.error('Stripe checkout error:', error);
      alert('Payment failed. Please try again.');
    }
  } catch (error) {
    console.error('Subscription error:', error);
    alert('Something went wrong. Please try again.');
  }
}

// Mobile menu toggle
const navToggle = document.querySelector('.nav__toggle');
const navMenu = document.querySelector('.nav__menu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('nav__menu--open');
    navToggle.classList.toggle('nav__toggle--open');
  });
}

// Form submission handling
const contactForm = document.getElementById('contactForm');
const successToast = document.getElementById('successToast');

if (contactForm) {
  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form elements
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const companySizeSelect = document.getElementById('company-size');
    const messageTextarea = document.getElementById('message');
    
    // Reset previous error states
    [nameInput, emailInput, companySizeSelect].forEach(input => {
      if (input) input.classList.remove('error');
    });
    
    let isValid = true;
    
    // Validate required fields
    if (!nameInput.value.trim()) {
      nameInput.classList.add('error');
      isValid = false;
    }
    
    if (!emailInput.value.trim() || !validateEmail(emailInput.value.trim())) {
      emailInput.classList.add('error');
      isValid = false;
    }
    
    if (!companySizeSelect.value) {
      companySizeSelect.classList.add('error');
      isValid = false;
    }
    
    // If validation passes, show success message
    if (isValid) {
      // Submit to server
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            companySize: companySizeSelect.value,
            message: messageTextarea.value.trim()
          }),
        });

        if (response.ok) {
          // Show success toast
          successToast.classList.remove('toast--hidden');
          successToast.classList.add('toast--visible');
          
          // Reset form
          contactForm.reset();
          
          // Hide toast after 5 seconds
          setTimeout(() => {
            successToast.classList.remove('toast--visible');
            successToast.classList.add('toast--hidden');
          }, 5000);
        } else {
          throw new Error('Failed to submit form');
        }
      } catch (error) {
        console.error('Form submission error:', error);
        alert('Failed to submit form. Please try again.');
      }
    }
  });
}

// Header scroll effect
const header = document.querySelector('.header');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY;
  
  if (currentScrollY > 100) {
    header.style.background = 'rgba(14, 15, 25, 0.98)';
  } else {
    header.style.background = 'rgba(14, 15, 25, 0.95)';
  }
  
  lastScrollY = currentScrollY;
});

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe elements for fade-in animation
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Stripe
  initializeStripe();
  
  const animatedElements = document.querySelectorAll('.feature__card, .testimonial__card, .pricing__card');
  
  animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
});

// Pricing card interactions
document.querySelectorAll('.pricing__card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    if (!card.classList.contains('pricing__card--featured')) {
      card.style.transform = 'translateY(-8px) scale(1.02)';
    }
  });
  
  card.addEventListener('mouseleave', () => {
    if (!card.classList.contains('pricing__card--featured')) {
      card.style.transform = 'translateY(0) scale(1)';
    }
  });
});

// Smooth reveal for hero stats
const heroStats = document.querySelector('.hero__stats');
if (heroStats) {
  const statNumbers = heroStats.querySelectorAll('.stat__number');
  
  const revealStats = () => {
    statNumbers.forEach((stat, index) => {
      setTimeout(() => {
        stat.style.opacity = '1';
        stat.style.transform = 'translateY(0)';
      }, index * 200);
    });
  };
  
  // Initialize stats as hidden
  statNumbers.forEach(stat => {
    stat.style.opacity = '0';
    stat.style.transform = 'translateY(20px)';
    stat.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  });
  
  // Reveal stats after a delay
  setTimeout(revealStats, 1000);
}

// Form input focus effects
document.querySelectorAll('.form__input, .form__select, .form__textarea').forEach(input => {
  input.addEventListener('focus', function() {
    this.parentElement.style.transform = 'translateY(-2px)';
  });
  
  input.addEventListener('blur', function() {
    this.parentElement.style.transform = 'translateY(0)';
    this.classList.remove('error');
  });
});

// Add loading state to buttons
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', function(e) {
    if (this.type === 'submit') return;
    
    // Add ripple effect
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease;
      pointer-events: none;
    `;
    
    this.style.position = 'relative';
    this.style.overflow = 'hidden';
    this.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  });
});

// Add Stripe script to head
const stripeScript = document.createElement('script');
stripeScript.src = 'https://js.stripe.com/v3/';
stripeScript.async = true;
document.head.appendChild(stripeScript);

// Add ripple animation
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  .nav__menu--open {
    display: flex !important;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    flex-direction: column;
    background: rgba(14, 15, 25, 0.98);
    backdrop-filter: blur(10px);
    border: 1px solid var(--clr-border);
    border-radius: 0 0 var(--radius) var(--radius);
    padding: var(--space-4);
    gap: var(--space-3);
  }
  
  .nav__toggle--open span:nth-child(1) {
    transform: rotate(45deg) translate(5px, 5px);
  }
  
  .nav__toggle--open span:nth-child(2) {
    opacity: 0;
  }
  
  .nav__toggle--open span:nth-child(3) {
    transform: rotate(-45deg) translate(7px, -6px);
  }
`;
document.head.appendChild(style);