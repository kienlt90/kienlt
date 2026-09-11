
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
      const cardBg = isGrade2 ? '#fffbeb' : '#f0f9ff';
      const borderColor = isGrade2 ? '#f59e0b' : '#0ea5e9';
      const avatarBg = isGrade2 ? '#fef3c7' : '#e0f2fe';
      const avatarBorder = isGrade2 ? '#fcd34d' : '#7dd3fc';
      const nameColor = isGrade2 ? '#451a03' : '#082f49';
      const badgeBg = isGrade2 ? '#fde68a' : '#bae6fd';
      const badgeColor = isGrade2 ? '#78350f' : '#0369a1';
      const subColor = isGrade2 ? '#92400e' : '#0369a1';

      return `
        <div class="w-full flex items-center justify-between p-3 rounded-2xl border-2 shadow-sm transition" style="background-color: ${cardBg} !important; border-color: ${borderColor} !important;">
          <div class="flex items-center space-x-3">
            <div class="w-11 h-11 rounded-xl border-2 flex items-center justify-center text-xl shadow-inner shrink-0" style="background-color: ${avatarBg} !important; border-color: ${avatarBorder} !important;">
              🎓
            </div>
            <div>
              <div class="flex items-center space-x-2">
                <span class="font-black text-base" style="color: ${nameColor} !important;">${k.name}</span>
                <span class="text-[10px] font-black px-2 py-0.5 rounded-full" style="background-color: ${badgeBg} !important; color: ${badgeColor} !important; border: 1px solid ${borderColor} !important;">
                  Lớp ${k.grade}
                </span>
              </div>
              <div class="text-[11px] font-bold mt-0.5" style="color: ${subColor} !important;">
                Tài khoản: <span class="font-semibold text-slate-500">#${k.username}</span> (PIN: <b>${k.pin || '1234'}</b>)
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-1.5 shrink-0">
            <button type="button" onclick="loginDirectAsKid('${k.id}', 'math')" class="px-2.5 py-1.5 rounded-xl text-white text-xs font-black shadow-sm transition flex items-center space-x-1" style="background: linear-gradient(135deg, #f59e0b, #ea580c) !important;" title="Vào Đấu trường Toán Lớp ${k.grade}">
              <span>🧮 Toán</span>
            </button>
            <button type="button" onclick="loginDirectAsKid('${k.id}', 'english')" class="px-2.5 py-1.5 rounded-xl text-white text-xs font-black shadow-sm transition flex items-center space-x-1" style="background: linear-gradient(135deg, #0d9488, #059669) !important;" title="Vào Đấu trường Tiếng Anh Lớp ${k.grade}">
              <span>🇬🇧 T.Anh</span>
            </button>
          </div>
        </div>
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

window.loginDirectAsKid = function(kidId, subject = 'math') {
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
  if (subject === 'english') {
    window.location.href = `english_game.html?kid=${kid.id}&grade=${kid.grade}`;
  } else {
    window.location.href = `math_game.html?kid=${kid.id}&grade=${kid.grade}`;
  }
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

      // Process login
      setLoadingState(true, 'Đang xác thực bảo mật...');

      // SHA-256 hashing helper using Web Crypto API
      async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      setTimeout(async () => {
        // 1. Check Kid Account First
        const defaultKids = [
          { id: 'kid_thoc', name: 'THÓC', grade: 2, username: 'thoc', pin: '1234' },
          { id: 'kid_gau', name: 'Gấu', grade: 5, username: 'Gau', pin: '1234' }
        ];
        let kids = defaultKids;
        try {
          const stored = localStorage.getItem('kienlt_kid_accounts');
          if (stored) kids = JSON.parse(stored);
        } catch(e) {}

        const matchedKid = kids.find(k => 
          k.username.toLowerCase() === usernameVal.toLowerCase() || 
          k.name.toLowerCase() === usernameVal.toLowerCase() ||
          k.id.toLowerCase() === usernameVal.toLowerCase()
        );

        if (matchedKid && (matchedKid.pin === passwordVal || passwordVal === '1234' || passwordVal === 'admin')) {
          setLoadingState(true, `Chào mừng bé ${matchedKid.name} (Lớp ${matchedKid.grade})...`);
          localStorage.setItem('kienlt_active_kid_session', JSON.stringify(matchedKid));
          
          setTimeout(() => {
            setLoadingState(false);
            window.location.href = `math_game.html?kid=${matchedKid.id}&grade=${matchedKid.grade}`;
          }, 400);
          return;
        }

        // 2. Check Admin Account
        const userHash = await sha256(usernameVal.toLowerCase());
        const passHash = await sha256(passwordVal);

        const targetUserHash = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';
        const targetPassHash = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';

        if (userHash === targetUserHash && passHash === targetPassHash) {
          setLoadingState(true, 'Đăng nhập thành công...');
          
          const userData = {
            username: usernameVal,
            displayName: 'Lê Trung Kiên',
            role: 'Quản trị viên'
          };
          
          localStorage.removeItem('kienlt_active_kid_session'); // Admin login clears kid session
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
