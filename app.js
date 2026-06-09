document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const loginForm = document.getElementById('login-form');
  const loginCard = document.getElementById('login-card');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const usernameError = document.getElementById('username-error');
  const passwordError = document.getElementById('password-error');
  const errorToast = document.getElementById('error-toast');
  const toastMessage = document.getElementById('toast-message');
  const togglePasswordBtn = document.getElementById('toggle-password-btn');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');

  // Check login state on load: if session exists, redirect to main.html
  const currentSession = localStorage.getItem('vnpt_his_session');
  if (currentSession) {
    window.location.href = 'main.html';
  }

  // Toggle password visibility
  togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    
    // Toggle icon visual state
    if (isPassword) {
      togglePasswordBtn.classList.add('visible');
      togglePasswordBtn.innerHTML = `
        <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      `;
    } else {
      togglePasswordBtn.classList.remove('visible');
      togglePasswordBtn.innerHTML = `
        <svg class="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      `;
    }
  });

  // Real-time validation
  usernameInput.addEventListener('input', () => {
    if (usernameInput.value.trim().length > 0) {
      clearFieldError(usernameInput, usernameError);
    }
  });

  passwordInput.addEventListener('input', () => {
    if (passwordInput.value.length >= 4) {
      clearFieldError(passwordInput, passwordError);
    }
  });

  // Handle Form Submission
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    hideToast();

    const usernameVal = usernameInput.value.trim();
    const passwordVal = passwordInput.value;
    let isValid = true;

    // Validate Username
    if (!usernameVal) {
      showFieldError(usernameInput, usernameError, 'Vui lòng nhập tên đăng nhập.');
      isValid = false;
    } else {
      clearFieldError(usernameInput, usernameError);
    }

    // Validate Password
    if (!passwordVal) {
      showFieldError(passwordInput, passwordError, 'Vui lòng nhập mật khẩu.');
      isValid = false;
    } else if (passwordVal.length < 4) {
      showFieldError(passwordInput, passwordError, 'Mật khẩu phải có ít nhất 4 ký tự.');
      isValid = false;
    } else {
      clearFieldError(passwordInput, passwordError);
    }

    if (!isValid) {
      triggerCardShake();
      return;
    }

    // Process login (Simulated API request)
    setLoadingState(true);

    setTimeout(() => {
      // Mock credentials: admin / admin
      if (usernameVal.toLowerCase() === 'admin' && passwordVal === 'admin') {
        const userData = {
          username: usernameVal,
          displayName: 'Lê Trung Kiên',
          role: 'Quản trị viên'
        };
        
        if (document.getElementById('remember').checked) {
          localStorage.setItem('vnpt_his_session', JSON.stringify(userData));
        } else {
          sessionStorage.setItem('vnpt_his_session', JSON.stringify(userData));
          localStorage.setItem('vnpt_his_session', JSON.stringify(userData));
        }
        
        setLoadingState(false);
        window.location.href = 'main.html';
      } else {
        setLoadingState(false);
        showToast('Tài khoản hoặc mật khẩu không chính xác. Thử lại với admin / admin');
        triggerCardShake();
      }
    }, 1500);
  });

  // Helper Functions
  function showFieldError(inputEl, errorEl, message) {
    inputEl.classList.add('error-input');
    errorEl.textContent = message;
  }

  function clearFieldError(inputEl, errorEl) {
    inputEl.classList.remove('error-input');
    errorEl.textContent = '';
  }

  function showToast(message) {
    toastMessage.textContent = message;
    errorToast.classList.remove('hidden');
  }

  function hideToast() {
    errorToast.classList.add('hidden');
  }

  function triggerCardShake() {
    loginCard.classList.remove('shake');
    // Trigger reflow to restart animation
    void loginCard.offsetWidth;
    loginCard.classList.add('shake');
    setTimeout(() => {
      loginCard.classList.remove('shake');
    }, 500);
  }

  function setLoadingState(isLoading) {
    if (isLoading) {
      submitBtn.disabled = true;
      btnText.classList.add('hidden');
      btnLoader.classList.remove('hidden');
    } else {
      submitBtn.disabled = false;
      btnText.classList.remove('hidden');
      btnLoader.classList.add('hidden');
    }
  }
  // Theme Toggle Logic
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeIcon = document.getElementById('theme-icon');
  
  function updateThemeUI(theme) {
    if (themeIcon) {
      themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
    }
  }

  // Initial UI Setup
  const initialTheme = localStorage.getItem('vnpt_his_theme') || 'dark';
  updateThemeUI(initialTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = localStorage.getItem('vnpt_his_theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      localStorage.setItem('vnpt_his_theme', newTheme);
      
      if (newTheme === 'light') {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
      
      updateThemeUI(newTheme);
    });
  }
});
