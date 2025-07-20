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
// Form submission handling
const contactForm = document.getElementById('contactForm');
const consultationForm = document.getElementById('consultationForm');
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

// Consultation form submission handling
if (consultationForm) {
  consultationForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form elements
    const nameInput = document.getElementById('consult-name');
    const emailInput = document.getElementById('consult-email');
    const phoneInput = document.getElementById('consult-phone');
    const companyInput = document.getElementById('consult-company');
    const companySizeSelect = document.getElementById('consult-size');
    const budgetSelect = document.getElementById('consult-budget');
    const goalsTextarea = document.getElementById('consult-goals');
    
    // Reset previous error states
    [nameInput, emailInput, phoneInput, companyInput, companySizeSelect, budgetSelect].forEach(input => {
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
    
    if (!phoneInput.value.trim()) {
      phoneInput.classList.add('error');
      isValid = false;
    }
    
    if (!companyInput.value.trim()) {
      companyInput.classList.add('error');
      isValid = false;
    }
    
    if (!companySizeSelect.value) {
      companySizeSelect.classList.add('error');
      isValid = false;
    }
    
    if (!budgetSelect.value) {
      budgetSelect.classList.add('error');
      isValid = false;
    }
    
    // If validation passes, submit form
    if (isValid) {
      try {
        const response = await fetch('/api/consultation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            phone: phoneInput.value.trim(),
            company: companyInput.value.trim(),
            companySize: companySizeSelect.value,
            budget: budgetSelect.value,
            goals: goalsTextarea.value.trim(),
            type: 'consultation'
          }),
        });

        if (response.ok) {
          // Show success toast
          successToast.querySelector('.toast__text').textContent = 'Consultation request received – we\'ll contact you within 24h to schedule';
          successToast.classList.remove('toast--hidden');
          successToast.classList.add('toast--visible');
          
          // Reset form
          consultationForm.reset();
          
          // Hide toast after 5 seconds
          setTimeout(() => {
            successToast.classList.remove('toast--visible');
            successToast.classList.add('toast--hidden');
          }, 5000);
        } else {
          throw new Error('Failed to submit consultation request');
        }
      } catch (error) {
        console.error('Consultation form submission error:', error);
        alert('Failed to submit consultation request. Please try again.');
      }
    }
  });
}
// Consultation form submission handling
const consultationForm2 = document.getElementById('consultationForm');

if (consultationForm2) {
  consultationForm2.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form elements
    const nameInput = document.getElementById('consult-name');
    const emailInput = document.getElementById('consult-email');
    const phoneInput = document.getElementById('consult-phone');
    const companyInput = document.getElementById('consult-company');
    const companySizeSelect = document.getElementById('consult-size');
    const budgetSelect = document.getElementById('consult-budget');
    const goalsTextarea = document.getElementById('consult-goals');
    
    // Reset previous error states
    [nameInput, emailInput, phoneInput, companyInput, companySizeSelect, budgetSelect].forEach(input => {
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
    
    if (!phoneInput.value.trim()) {
      phoneInput.classList.add('error');
      isValid = false;
    }
    
    if (!companyInput.value.trim()) {
      companyInput.classList.add('error');
      isValid = false;
    }
    
    if (!companySizeSelect.value) {
      companySizeSelect.classList.add('error');
      isValid = false;
    }
    
    if (!budgetSelect.value) {
      budgetSelect.classList.add('error');
      isValid = false;
    }
    
    // If validation passes, submit form
    if (isValid) {
      try {
        const response = await fetch('/api/consultation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            phone: phoneInput.value.trim(),
            company: companyInput.value.trim(),
            companySize: companySizeSelect.value,
            budget: budgetSelect.value,
            goals: goalsTextarea.value.trim(),
            type: 'consultation'
          }),
        });

        if (response.ok) {
          // Show success toast
          successToast.querySelector('.toast__text').textContent = 'Consultation request received – we\'ll contact you within 24h to schedule';
          successToast.classList.remove('toast--hidden');
          successToast.classList.add('toast--visible');
          
          // Reset form
          consultationForm2.reset();
          
          // Hide toast after 5 seconds
          setTimeout(() => {
            successToast.classList.remove('toast--visible');
            successToast.classList.add('toast--hidden');
          }, 5000);
        } else {
          throw new Error('Failed to submit consultation request');
        }
      } catch (error) {
        console.error('Consultation form submission error:', error);
        alert('Failed to submit consultation request. Please try again.');
      }
    }
  });
}

// Header scroll effect
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
  
  const animatedElements = document.querySelectorAll('.feature__card, .testimonial__card, .consultation__card');
  
  animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
});

// Consultation card interactions
const consultationCards = document.querySelectorAll('.consultation__card');

consultationCards.forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-8px) scale(1.02)';
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0) scale(1)';
  });
});

// Add Stripe script to head
const stripeScript = document.createElement('script');
stripeScript.src = 'https://js.stripe.com/v3/';
stripeScript.async = true;
document.head.appendChild(stripeScript);

// Add ripple animation
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}