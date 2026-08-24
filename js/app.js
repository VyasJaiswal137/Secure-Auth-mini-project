// ============================================================
//  app.js  –  Interactive Credential Journey
//           + Pwned Passwords (1) + JWT Inspector (2) + Verify (5)
// ============================================================

// ---------- 1. FIREBASE CONFIG ----------
const firebaseConfig = {
    apiKey: "AIzaSyCcfLD520aOBjfu9KJOS8Yj7uPYYaQQRGk",
    authDomain: "auth-demo-a7767.firebaseapp.com",
    projectId: "auth-demo-a7767",
    storageBucket: "auth-demo-a7767.firebasestorage.app",
    messagingSenderId: "815962811429",
    appId: "1:815962811429:web:95c1326adb4332822ae3cc"
};

// ---------- 2. IMPORTS ----------
import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
    onAuthStateChanged,
    sendEmailVerification,
    signOut,
    updateProfile,
    sendPasswordResetEmail
} from "firebase/auth";

// ---------- 3. INIT ----------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

// ---------- 4. DOM REFS ----------
const $ = (id) => document.getElementById(id);
const loginFormElement = $('loginFormElement');
const signupFormElement = $('signupFormElement');
const loginEmail = $('loginEmail');
const loginPassword = $('loginPassword');
const signupEmail = $('signupEmail');
const signupPassword = $('signupPassword');
const signupConfirm = $('signupConfirm');
const loginError = $('loginError');
const signupError = $('signupError');
const loginBtn = $('loginBtn');
const signupBtn = $('signupBtn');
const authSection = $('authSection');
const dashboardSection = $('dashboardSection');
const userDisplayName = $('userDisplayName');
const userEmail = $('userEmail');
const logoutBtn = $('logoutBtn');
const toastContainer = $('toastContainer');
const strengthFill = $('strengthFill');
const strengthLabel = $('strengthLabel');
const criteriaItems = document.querySelectorAll('.criteria-item');
const journeyProgress = $('journeyProgress');
const liveBadge = $('liveBadge');
const journeyTimer = $('journeyTimer');
const pwnedWarning = $('pwnedWarning');
const verifyBanner = $('verifyBanner');
const resendVerifyBtn = $('resendVerifyBtn');
const jwtPayload = $('jwtPayload');
const jwtTimer = $('jwtTimer');

// ---------- 5. JOURNEY ENGINE ----------
let journeyStartTime = 0;

function resetJourney() {
    document.querySelectorAll('.journey-step').forEach(el => {
        el.classList.remove('active', 'completed', 'error');
    });
    document.querySelectorAll('.step-status').forEach(el => el.textContent = '⏳');
    if (journeyProgress) journeyProgress.style.width = '0%';
    if (liveBadge) { liveBadge.textContent = '● Idle'; liveBadge.classList.remove('active'); }
    if (journeyTimer) journeyTimer.textContent = '⏱️ 0ms';
}

function updateStep(stepNumber, status) {
    const step = document.querySelector(`.journey-step[data-step="${stepNumber}"]`);
    if (!step) return;
    step.classList.remove('active', 'completed', 'error');
    if (status) step.classList.add(status);
    
    const statusEl = document.getElementById(`status${stepNumber}`);
    if (statusEl) {
        if (status === 'active') statusEl.textContent = '⏳';
        else if (status === 'completed') statusEl.textContent = '✅';
        else if (status === 'error') statusEl.textContent = '❌';
        else statusEl.textContent = '⏳';
    }
    const progress = (stepNumber / 5) * 100;
    if (journeyProgress) journeyProgress.style.width = `${Math.min(progress, 100)}%`;
    if (status === 'active') {
        if (liveBadge) { liveBadge.textContent = '● Processing...'; liveBadge.classList.add('active'); }
    } else if (status === 'completed' && stepNumber === 5) {
        if (liveBadge) { liveBadge.textContent = '● Journey Complete ✅'; liveBadge.classList.add('active'); }
    }
}

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function startJourney() {
    resetJourney();
    journeyStartTime = performance.now();
    updateStep(1, 'active');
    await delay(400);
    updateStep(1, 'completed');
    updateStep(2, 'active');
    await delay(500);
    updateStep(2, 'completed');
    updateStep(3, 'active');
    await delay(700);
    return true;
}

async function completeJourney(success = true, errorMsg = '') {
    if (success) {
        updateStep(3, 'completed');
        updateStep(4, 'active');
        await delay(400);
        updateStep(4, 'completed');
        updateStep(5, 'active');
        await delay(300);
        updateStep(5, 'completed');
        const endTime = performance.now();
        if (journeyTimer) journeyTimer.textContent = `⏱️ ${Math.round(endTime - journeyStartTime)}ms`;
        if (liveBadge) liveBadge.textContent = '● Access Granted ✅';
    } else {
        updateStep(3, 'error');
        const desc = document.querySelector('.journey-step[data-step="3"] .step-desc');
        if (desc) desc.textContent = `❌ ${errorMsg || 'Verification failed'}`;
        if (liveBadge) liveBadge.textContent = '● Access Denied ❌';
        if (journeyTimer) journeyTimer.textContent = '⏱️ Failed';
        setTimeout(() => {
            resetJourney();
            const descReset = document.querySelector('.journey-step[data-step="3"] .step-desc');
            if (descReset) descReset.textContent = 'Memory-hard key derivation';
        }, 4000);
    }
}

// ---------- 6. FEATURE 1: PWNED PASSWORDS (API) ----------
async function sha1(message) {
    const enc = new TextEncoder();
    const hash = await crypto.subtle.digest('SHA-1', enc.encode(message));
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function isPasswordPwned(password) {
    try {
        const hash = await sha1(password);
        const prefix = hash.substring(0, 5);
        const suffix = hash.substring(5).toUpperCase();
        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        const text = await response.text();
        return text.includes(suffix);
    } catch (e) {
        console.warn('Pwned API unavailable, skipping check.');
        return false; // Fail open so user isn't blocked if API is down
    }
}

let pwnedCheckPending = false;
async function checkPwnedOnSignup(password) {
    if (!password || password.length < 6) {
        pwnedWarning.style.display = 'none';
        signupBtn.disabled = false;
        return;
    }
    pwnedCheckPending = true;
    signupBtn.disabled = true;
    pwnedWarning.style.display = 'none';
    const isBreached = await isPasswordPwned(password);
    pwnedCheckPending = false;
    if (isBreached) {
        pwnedWarning.style.display = 'block';
        signupBtn.disabled = true;
    } else {
        pwnedWarning.style.display = 'none';
        signupBtn.disabled = false;
    }
}

// ---------- 7. FEATURE 2: JWT INSPECTOR ----------
let jwtCountdownInterval = null;

function decodeJWT(token) {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
}

function updateJWTInspector(user) {
    if (!user) return;
    user.getIdToken().then(token => {
        const payload = decodeJWT(token);
        if (!payload) {
            jwtPayload.innerHTML = `<pre>Error decoding token.</pre>`;
            return;
        }
        const formatted = {
            uid: payload.user_id || payload.sub || 'N/A',
            email: payload.email || 'N/A',
            iat: payload.iat ? new Date(payload.iat * 1000).toLocaleString() : 'N/A',
            exp: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'N/A'
        };
        jwtPayload.innerHTML = `<pre>{\n  "uid": "${formatted.uid}",\n  "email": "${formatted.email}",\n  "iat": "${formatted.iat}",\n  "exp": "${formatted.exp}"\n}</pre>`;
        
        // Start countdown timer
        if (jwtCountdownInterval) clearInterval(jwtCountdownInterval);
        if (payload.exp) {
            const updateTimer = () => {
                const now = Math.floor(Date.now() / 1000);
                const diff = payload.exp - now;
                if (diff <= 0) {
                    jwtTimer.textContent = '⏳ Expired!';
                    clearInterval(jwtCountdownInterval);
                    return;
                }
                const mins = Math.floor(diff / 60);
                const secs = diff % 60;
                jwtTimer.textContent = `⏳ Expires in: ${mins}m ${secs}s`;
            };
            updateTimer();
            jwtCountdownInterval = setInterval(updateTimer, 1000);
        } else {
            jwtTimer.textContent = '⏳ No expiry info';
        }
    }).catch(() => {
        jwtPayload.innerHTML = `<pre>Unable to fetch token.</pre>`;
    });
}

// ---------- 8. FEATURE 5: VERIFICATION BANNER ----------
function updateVerificationBanner(user) {
    if (!user) {
        verifyBanner.style.display = 'none';
        return;
    }
    if (!user.emailVerified) {
        verifyBanner.style.display = 'flex';
    } else {
        verifyBanner.style.display = 'none';
    }
}

// ---------- 9. HELPERS ----------
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 4000);
}

function toggleLoading(button, isLoading) {
    const text = button?.querySelector('.btn-text');
    const loader = button?.querySelector('.btn-loader');
    if (!button) return;
    if (isLoading) {
        button.disabled = true;
        if (text) text.style.display = 'none';
        if (loader) loader.style.display = 'inline';
    } else {
        button.disabled = false;
        if (text) text.style.display = 'inline';
        if (loader) loader.style.display = 'none';
    }
}

function clearErrors() {
    if (loginError) loginError.textContent = '';
    if (signupError) signupError.textContent = '';
    document.querySelectorAll('.input-feedback').forEach(el => el.textContent = '');
}

function setFeedback(inputId, message) {
    const el = document.getElementById(inputId + 'Feedback');
    if (el) el.textContent = message;
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------- 10. PASSWORD STRENGTH ----------
function checkPasswordStrength(password) {
    const criteria = {
        length: password.length >= 8,
        lower: /[a-z]/.test(password),
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[^a-zA-Z0-9]/.test(password)
    };
    const score = Object.values(criteria).filter(Boolean).length;
    const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#22c55e'];
    const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    if (strengthFill) {
        strengthFill.style.width = (score / 5) * 100 + '%';
        strengthFill.style.background = colors[score - 1] || '#ef4444';
    }
    if (strengthLabel) strengthLabel.textContent = password ? labels[score - 1] || 'Weak' : 'Enter a password';
    criteriaItems.forEach(item => {
        const key = item.dataset.criteria;
        if (criteria[key]) item.classList.add('met');
        else item.classList.remove('met');
    });
    // Trigger pwned check on password change (debounced)
    if (password.length >= 6) {
        clearTimeout(window._pwnedTimeout);
        window._pwnedTimeout = setTimeout(() => checkPwnedOnSignup(password), 600);
    } else {
        pwnedWarning.style.display = 'none';
        signupBtn.disabled = false;
    }
}

// ---------- 11. EVENT BINDINGS ----------
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        const target = btn.dataset.tab === 'login' ? 'loginForm' : 'signupForm';
        const form = document.getElementById(target);
        if (form) form.classList.add('active');
        clearErrors();
        resetJourney();
    });
});

document.querySelectorAll('.toggle-visibility').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (input) input.type = input.type === 'password' ? 'text' : 'password';
    });
});

if (signupPassword) {
    signupPassword.addEventListener('input', (e) => checkPasswordStrength(e.target.value));
}

if (loginEmail) {
    loginEmail.addEventListener('blur', () => {
        if (loginEmail.value && !validateEmail(loginEmail.value)) setFeedback('loginEmail', 'Valid email required.');
        else setFeedback('loginEmail', '');
    });
}
if (signupEmail) {
    signupEmail.addEventListener('blur', () => {
        if (signupEmail.value && !validateEmail(signupEmail.value)) setFeedback('signupEmail', 'Valid email required.');
        else setFeedback('signupEmail', '');
    });
}
if (signupConfirm) {
    signupConfirm.addEventListener('input', () => {
        if (signupConfirm.value && signupConfirm.value !== signupPassword?.value) setFeedback('signupConfirm', 'Passwords do not match.');
        else setFeedback('signupConfirm', '');
    });
}

// ---------- 12. AUTH HANDLERS ----------
// --- LOGIN ---
if (loginFormElement) {
    loginFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();
        const email = loginEmail?.value?.trim() || '';
        const password = loginPassword?.value || '';
        if (!validateEmail(email)) { setFeedback('loginEmail', 'Valid email required.'); return; }
        if (password.length < 6) { setFeedback('loginPassword', 'Min 6 characters.'); return; }
        
        toggleLoading(loginBtn, true);
        await startJourney();
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            await completeJourney(true);
            showToast('Login successful! 🚀', 'success');
        } catch (err) {
            await completeJourney(false, err.message);
            if (loginError) loginError.textContent = '❌ ' + err.message;
            showToast('Login failed: ' + err.message, 'error');
        } finally {
            toggleLoading(loginBtn, false);
        }
    });
}

// --- SIGNUP (with Pwned check) ---
if (signupFormElement) {
    signupFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();
        const email = signupEmail?.value?.trim() || '';
        const password = signupPassword?.value || '';
        const confirm = signupConfirm?.value || '';
        const terms = document.getElementById('termsCheck')?.checked || false;
        if (!validateEmail(email)) { setFeedback('signupEmail', 'Valid email required.'); return; }
        if (password.length < 6) { setFeedback('signupPassword', 'Min 6 characters.'); return; }
        if (password !== confirm) { setFeedback('signupConfirm', 'Passwords do not match.'); return; }
        if (!terms) { if (signupError) signupError.textContent = 'Agree to Terms.'; return; }
        
        // Check if pwned check is pending or flagged
        if (pwnedWarning && pwnedWarning.style.display === 'block') {
            if (signupError) signupError.textContent = '❌ Please choose a different password (breached).';
            return;
        }
        // If pwned check hasn't run yet for this password, run it now
        if (!pwnedCheckPending && password.length >= 6) {
            const isBreached = await isPasswordPwned(password);
            if (isBreached) {
                pwnedWarning.style.display = 'block';
                if (signupError) signupError.textContent = '❌ Password breached. Choose another.';
                return;
            }
        }

        toggleLoading(signupBtn, true);
        await startJourney();
        
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(cred.user, { displayName: email.split('@')[0] });
            await sendEmailVerification(cred.user);
            await completeJourney(true);
            showToast('Account created! Verify your email.', 'success');
        } catch (err) {
            await completeJourney(false, err.message);
            if (signupError) signupError.textContent = '❌ ' + err.message;
            showToast('Signup failed: ' + err.message, 'error');
        } finally {
            toggleLoading(signupBtn, false);
        }
    });
}

// --- SOCIAL LOGINS ---
async function socialLogin(provider) {
    try {
        await signInWithPopup(auth, provider);
        showToast('Social login successful!', 'success');
    } catch (err) {
        showToast('Social login failed: ' + err.message, 'error');
    }
}
document.getElementById('googleLogin')?.addEventListener('click', () => socialLogin(googleProvider));
document.getElementById('githubLogin')?.addEventListener('click', () => socialLogin(githubProvider));

// --- LOGOUT ---
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        await signOut(auth);
        showToast('Signed out safely.', 'success');
        resetJourney();
        if (jwtCountdownInterval) clearInterval(jwtCountdownInterval);
    });
}

// --- FORGOT PASSWORD ---
document.getElementById('forgotPassword')?.addEventListener('click', (e) => {
    e.preventDefault();
    const email = loginEmail?.value?.trim();
    if (!email || !validateEmail(email)) {
        alert('Please enter a valid email address in the login field.');
        return;
    }
    sendPasswordResetEmail(auth, email)
        .then(() => alert('Reset email sent! Check your inbox.'))
        .catch(err => alert('Error: ' + err.message));
});

// --- RESEND VERIFICATION (Feature 5) ---
if (resendVerifyBtn) {
    resendVerifyBtn.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) return;
        try {
            await sendEmailVerification(user);
            showToast('Verification email resent! 📧', 'success');
        } catch (err) {
            showToast('Failed to resend: ' + err.message, 'error');
        }
    });
}

// --- MODALS ---
const termsModal = document.getElementById('termsModal');
document.getElementById('termsLink')?.addEventListener('click', (e) => { e.preventDefault(); if (termsModal) termsModal.style.display = 'flex'; });
document.getElementById('termsAccept')?.addEventListener('click', () => { if (termsModal) termsModal.style.display = 'none'; });
window.addEventListener('click', (e) => { if (e.target === termsModal) termsModal.style.display = 'none'; });

// ---------- 13. AUTH STATE ----------
onAuthStateChanged(auth, (user) => {
    if (user) {
        if (authSection) authSection.style.display = 'none';
        if (dashboardSection) dashboardSection.style.display = 'block';
        if (userDisplayName) userDisplayName.textContent = user.displayName || 'User';
        if (userEmail) userEmail.textContent = user.email;
        const statAuth = document.getElementById('statAuthMethod');
        if (statAuth) statAuth.textContent = user.providerData[0]?.providerId || 'Email';
        const statCreated = document.getElementById('statCreated');
        if (statCreated) statCreated.textContent = user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : '—';
        const statVerified = document.getElementById('statVerified');
        if (statVerified) statVerified.textContent = user.emailVerified ? '✅ Yes' : '❌ No';
        const statMFA = document.getElementById('statMFA');
        if (statMFA) statMFA.textContent = 'Inactive';
        
        // Update Feature 2 (JWT) and Feature 5 (Verify Banner)
        updateVerificationBanner(user);
        updateJWTInspector(user);
    } else {
        if (authSection) authSection.style.display = 'grid';
        if (dashboardSection) dashboardSection.style.display = 'none';
        resetJourney();
        if (loginFormElement) loginFormElement.reset();
        if (signupFormElement) signupFormElement.reset();
        clearErrors();
        if (pwnedWarning) pwnedWarning.style.display = 'none';
        if (verifyBanner) verifyBanner.style.display = 'none';
        if (jwtCountdownInterval) clearInterval(jwtCountdownInterval);
        if (jwtTimer) jwtTimer.textContent = '⏳ Expires in: --';
        if (jwtPayload) jwtPayload.innerHTML = `<pre>{\n  "uid": "Not logged in",\n  "email": "---",\n  "iat": 0,\n  "exp": 0\n}</pre>`;
    }
});

console.log('🚀 Interactive Credential Journey + Pwned + JWT + Verify initialized!');