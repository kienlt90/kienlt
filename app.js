
// ==========================================
// KID ACCOUNTS & DIRECT MATH ARENA ROUTING
// ==========================================
window.switchLoginType = function(type) {
  const btnAdmin = document.getElementById('tab-admin-login');
  const btnKid = document.getElementById('tab-kid-login');
  const kidSection = document.getElementById('kid-quick-section');
  const loginForm = document.getElementById('login-form');

  if (type === 'kid') {
    btnKid.className = "flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all duration-200 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/25";
    btnAdmin.className = "flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60";

    kidSection.classList.remove('hidden');
    renderKidsLoginList();
  } else {
    btnAdmin.className = "flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all duration-200 bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-md shadow-sky-600/25";
    btnKid.className = "flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60";

    kidSection.classList.add('hidden');
  }
};

window.renderKidsLoginList = function() {
  const container = document.getElementById('kids-avatar-list');
  if (!container) return;

  function render(kids) {
    container.innerHTML = kids.map(k => {
      const isGrade2 = k.grade === 2 || k.id === 'kid_thoc';
      const theme = isGrade2 ? {
        cardBg: 'from-amber-50 via-orange-50/40 to-white',
        border: 'border-amber-300 hover:border-amber-500',
        avatarBg: 'bg-amber-100 border-amber-300 text-amber-800',
        nameColor: 'text-amber-950 group-hover:text-amber-700',
        badgeBg: 'bg-amber-200/80 text-amber-900 border border-amber-300/60',
        subColor: 'text-amber-800',
        btnBg: 'from-amber-500 to-orange-500 group-hover:from-amber-600 group-hover:to-orange-600',
        shadow: 'shadow-amber-500/20'
      } : {
        cardBg: 'from-sky-50 via-indigo-50/40 to-white',
        border: 'border-sky-300 hover:border-sky-500',
        avatarBg: 'bg-sky-100 border-sky-300 text-sky-800',
        nameColor: 'text-slate-900 group-hover:text-sky-700',
        badgeBg: 'bg-sky-200/80 text-sky-900 border border-sky-300/60',
        subColor: 'text-sky-800',
        btnBg: 'from-sky-600 to-indigo-600 group-hover:from-sky-700 group-hover:to-indigo-700',
        shadow: 'shadow-sky-500/20'
      };

      return `
        <button type="button" onclick="loginDirectAsKid('${k.id}')" class="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r ${theme.cardBg} border-2 ${theme.border} hover:shadow-md hover:scale-[1.01] transition-all duration-200 text-left group cursor-pointer shadow-xs">
          <div class="flex items-center space-x-3">
            <div class="w-11 h-11 rounded-xl ${theme.avatarBg} border flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition shrink-0">
              🎓
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <span class="font-black text-sm ${theme.nameColor} transition">${k.name}</span>
                <span class="text-[10px] font-black px-2 py-0.5 rounded-full ${theme.badgeBg}">
                  Lớp ${k.grade}
                </span>
              </div>
              <div class="text-[11px] font-bold ${theme.subColor} mt-0.5 flex items-center space-x-1.5">
                <span>Toán Tư Duy</span>
                <span class="text-slate-400">•</span>
                <span class="font-semibold text-slate-500">#${k.username}</span>
              </div>
            </div>
          </div>
          <span class="px-3.5 py-1.5 rounded-xl bg-gradient-to-r ${theme.btnBg} text-white text-xs font-black shadow-md ${theme.shadow} transition flex items-center space-x-1.5 shrink-0">
            <span>Vào thi</span>
            <span class="text-sm">➔</span>
          </span>
        </button>
      `;
    }).join('');
  }

  if (window.CloudSync) {
    window.CloudSync.getKids(render);
  } else {
    const defaultKids = [
      { id: 'kid_thoc', name: 'THÓC', grade: 2, username: 'thoc', pin: '1234' },
      { id: 'kid_gau', name: 'Gấu', grade: 5, username: 'Gau', pin: '1234' }
    ];
    let kids = defaultKids;
    try {
      const stored = localStorage.getItem('kienlt_kid_accounts');
      if (stored) kids = JSON.parse(stored);
    } catch(e) {}
    render(kids);
  }
};

window.loginDirectAsKid = function(kidId) {
  const defaultKids = [
    { id: 'kid_thoc', name: 'THÓC', grade: 2, username: 'thoc', pin: '1234' },
    { id: 'kid_gau', name: 'Gấu', grade: 5, username: 'Gau', pin: '1234' }
  ];
  let kids = defaultKids;
  try {
    const stored = localStorage.getItem('kienlt_kid_accounts');
    if (stored) kids = JSON.parse(stored);
  } catch(e) {}
  const kid = kids.find(k => k.id === kidId) || kids[0];

  localStorage.setItem('kienlt_active_kid_session', JSON.stringify(kid));
  window.location.href = 'math_game.html';
};

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
  const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
  const btnLoader = submitBtn ? submitBtn.querySelector('.btn-loader') : null;

  // Check login state on load: if session exists, redirect to main.html
  const currentSession = localStorage.getItem('vnpt_his_session');
  if (currentSession) {
    window.location.href = 'main.html';
  }

  // Toggle password visibility
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      togglePasswordBtn.innerHTML = isPassword 
        ? '<i data-lucide="eye-off" class="w-4 h-4"></i>'
        : '<i data-lucide="eye" class="w-4 h-4"></i>';
      if (window.lucide) window.lucide.createIcons();
    });
  }

  // Real-time validation
  if (usernameInput) {
    usernameInput.addEventListener('input', () => {
      if (usernameInput.value.trim().length > 0) {
        clearFieldError(usernameInput, usernameError);
      }
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      if (passwordInput.value.length >= 4) {
        clearFieldError(passwordInput, passwordError);
      }
    });
  }

  // Handle Form Submission
  if (loginForm) {
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

      // Process login (Simulated secure API request with cryptographic verification)
      setLoadingState(true, 'Đang xác thực bảo mật...');

      // SHA-256 hashing helper using Web Crypto API
      async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      setTimeout(async () => {
        const userHash = await sha256(usernameVal.toLowerCase());
        const passHash = await sha256(passwordVal);

        // Hash of "admin" is '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
        const targetUserHash = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';
        const targetPassHash = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';

        if (userHash === targetUserHash && passHash === targetPassHash) {
          setLoadingState(true, 'Đăng nhập thành công...');
          
          const userData = {
            username: usernameVal,
            displayName: 'Lê Trung Kiên',
            role: 'Quản trị viên'
          };
          
          const rememberMe = document.getElementById('remember');
          if (rememberMe && rememberMe.checked) {
            localStorage.setItem('vnpt_his_session', JSON.stringify(userData));
          } else {
            sessionStorage.setItem('vnpt_his_session', JSON.stringify(userData));
            localStorage.setItem('vnpt_his_session', JSON.stringify(userData));
          }
          
          setTimeout(() => {
            setLoadingState(false);
            window.location.href = 'main.html';
          }, 400);
        } else {
          setLoadingState(false);
          showToast('Tên đăng nhập hoặc mật khẩu không chính xác.');
          triggerCardShake();
        }
      }, 500);
    });
  }

  // Helper Functions
  function showFieldError(inputEl, errorEl, message) {
    if (inputEl) {
      inputEl.classList.add('border-rose-500', 'bg-rose-50/50');
      inputEl.classList.remove('border-slate-200', 'bg-slate-50');
    }
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  }

  function clearFieldError(inputEl, errorEl) {
    if (inputEl) {
      inputEl.classList.remove('border-rose-500', 'bg-rose-50/50');
      inputEl.classList.add('border-slate-200', 'bg-slate-50');
    }
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
  }

  function showToast(message) {
    if (toastMessage) toastMessage.textContent = message;
    if (errorToast) errorToast.classList.remove('hidden');
  }

  function hideToast() {
    if (errorToast) errorToast.classList.add('hidden');
  }

  function triggerCardShake() {
    if (!loginCard) return;
    loginCard.classList.remove('shake');
    void loginCard.offsetWidth;
    loginCard.classList.add('shake');
    setTimeout(() => {
      loginCard.classList.remove('shake');
    }, 500);
  }

  function setLoadingState(isLoading, message = 'Đăng nhập vào Portal') {
    if (!submitBtn) return;
    if (isLoading) {
      submitBtn.disabled = true;
      if (btnText) btnText.textContent = message;
      if (btnLoader) btnLoader.classList.remove('hidden');
    } else {
      submitBtn.disabled = false;
      if (btnText) btnText.textContent = message;
      if (btnLoader) btnLoader.classList.add('hidden');
    }
  }
});
