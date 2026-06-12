// ─────────────────────────────────────────────────────────
//  AUTH — sign in/out + ID verification flow
// ─────────────────────────────────────────────────────────

async function initAuth() {
  // First try to get existing session
  const { data: { session } } = await db.auth.getSession();
  updateNavForUser(session?.user || null);

  // Listen for auth state changes (sign in, sign out, token refresh)
  db.auth.onAuthStateChange((_event, session) => {
    updateNavForUser(session?.user || null);
    // If on post/register page, show form when signed in
    if (session) {
      const authGate = document.getElementById('authGate');
      const listingForm = document.getElementById('listingForm');
      if (authGate) authGate.style.display = 'none';
      if (listingForm) listingForm.style.display = 'flex';
    }
  });
}

function updateNavForUser(user) {
  const authBtn     = document.getElementById('authBtn');
  const userEmail   = document.getElementById('userEmail');
  const myListings  = document.getElementById('myListingsLink');
  const inPages     = isInPagesFolder();

  if (user) {
    if (authBtn) {
      authBtn.textContent = 'Sign out';
      authBtn.style.display = 'inline-flex';
    }
    if (userEmail) {
      // Show first name or truncated email
      const name = user.user_metadata?.first_name;
      userEmail.textContent = name ? `Hi, ${name}` : user.email.split('@')[0];
    }
    if (myListings) {
      myListings.style.display = 'inline';
      myListings.href = inPages ? 'dashboard.html' : 'pages/dashboard.html';
    }
  } else {
    if (authBtn) {
      authBtn.textContent = 'Sign in';
      authBtn.style.display = 'inline-flex';
    }
    if (userEmail) userEmail.textContent = '';
    if (myListings) myListings.style.display = 'none';
  }
}

function isInPagesFolder() {
  return window.location.pathname.includes('/pages/');
}

async function handleAuth() {
  const { data: { session } } = await db.auth.getSession();
  if (session) {
    await db.auth.signOut();
    showToast('Signed out');
    window.location.href = isInPagesFolder() ? '../index.html' : 'index.html';
  } else {
    showSignInModal();
  }
}

async function signInToList() { showSignInModal(); }

function showSignInModal() {
  const existing = document.getElementById('signInModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'signInModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h2>Sign in to Nest X</h2>
        <button class="modal-close" onclick="document.getElementById('signInModal').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div id="signInError" class="form-error" style="display:none;margin-bottom:1rem"></div>

        <div id="signInView">
          <div class="form-row"><label>Email address</label><input type="email" id="siEmail" placeholder="you@example.com" autofocus></div>
          <div class="form-row"><label>Password</label><input type="password" id="siPassword" placeholder="At least 8 characters" onkeydown="if(event.key==='Enter')doSignIn()"></div>
          <div style="text-align:right;margin-top:-6px;margin-bottom:12px;">
            <button onclick="showForgotView()" style="background:none;border:none;font-size:13px;color:var(--green);cursor:pointer;text-decoration:underline;font-family:inherit;">Forgot password?</button>
          </div>
          <div class="modal-footer" style="padding:0;border:none;margin-top:1rem">
            <button class="btn btn-outline" onclick="showSignUpView()">Create account</button>
            <button class="btn btn-primary" onclick="doSignIn()">Sign in</button>
          </div>
        </div>

        <div id="forgotView" style="display:none">
          <p style="font-size:14px;color:var(--text-mid);margin-bottom:1.25rem;">Enter your email address and we'll send you a link to reset your password.</p>
          <div class="form-row"><label>Email address</label><input type="email" id="forgotEmail" placeholder="you@example.com" onkeydown="if(event.key==='Enter')doForgotPassword()"></div>
          <div class="modal-footer" style="padding:0;border:none;margin-top:1.5rem">
            <button class="btn btn-outline" onclick="showSignInView()">← Back to sign in</button>
            <button class="btn btn-primary" onclick="doForgotPassword()">Send reset link</button>
          </div>
        </div>

        <div id="forgotSentView" style="display:none;text-align:center;padding:1rem 0">
          <div style="font-size:36px;margin-bottom:1rem">📬</div>
          <h3 style="margin-bottom:0.5rem">Check your email</h3>
          <p style="color:var(--text-muted);font-size:14px;margin-bottom:1rem">We've sent a password reset link to your email. Click it to set a new password.</p>
          <p style="color:var(--text-muted);font-size:13px;">Didn't receive it? Check your spam folder or <button onclick="showForgotView()" style="background:none;border:none;color:var(--green);cursor:pointer;font-size:13px;text-decoration:underline;font-family:inherit;">try again</button>.</p>
        </div>

        <div id="signUpView" style="display:none">
          <div class="verify-notice">
            <div class="verify-notice-icon">🪪</div>
            <div>
              <strong>Identity verification required</strong>
              <p>All Nest X members must verify their identity before listing or making offers. You'll be asked to upload a government-issued ID after signing up.</p>
            </div>
          </div>
          <div class="form-row"><label>Email address</label><input type="email" id="suEmail" placeholder="you@example.com"></div>
          <div class="form-row"><label>Password</label><input type="password" id="suPassword" placeholder="At least 8 characters"></div>
          <div class="form-row"><label>First name</label><input type="text" id="suFirstName" placeholder="First name"></div>
          <div class="form-row"><label>Last name</label><input type="text" id="suLastName" placeholder="Last name (not shown publicly)"></div>
          <div class="modal-footer" style="padding:0;border:none;margin-top:1.5rem">
            <button class="btn btn-outline" onclick="showSignInView()">Back to sign in</button>
            <button class="btn btn-primary" onclick="doSignUp()">Create account</button>
          </div>
        </div>

        <div id="verifyView" style="display:none">
          <div class="verify-steps">
            <h3 style="margin-bottom:1rem">Verify your identity</h3>
            <p style="font-size:14px;color:var(--text-mid);margin-bottom:1.5rem">Upload a clear photo of your government-issued ID. This is reviewed privately and never shown publicly.</p>

            <div class="form-row">
              <label>ID Type</label>
              <select id="idType">
                <option value="drivers_licence">NZ Driver's Licence</option>
                <option value="passport">Passport (any country)</option>
                <option value="kiwiaccess">Kiwi Access Card</option>
              </select>
            </div>

            <div class="form-row">
              <label>Upload your ID photo <span class="req">*</span></label>
              <div class="id-upload-zone" onclick="document.getElementById('idFileInput').click()">
                <input type="file" id="idFileInput" accept="image/*,.pdf" style="display:none" onchange="handleIdUpload(event)">
                <div id="idUploadPrompt">
                  <div style="font-size:28px;margin-bottom:6px">📄</div>
                  <p style="font-size:14px;font-weight:500">Click to upload ID</p>
                  <span style="font-size:12px;color:var(--text-muted)">JPG, PNG or PDF — max 10MB</span>
                </div>
                <div id="idUploadDone" style="display:none;text-align:center;padding:1rem">
                  <div style="font-size:28px">✅</div>
                  <p style="font-size:14px;font-weight:500;color:var(--green)" id="idFileName"></p>
                </div>
              </div>
            </div>

            <div class="form-row">
              <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">
                <input type="checkbox" id="policeCheck" style="margin-top:3px;accent-color:var(--green)">
                <div>
                  <strong style="font-size:14px">Optional: Submit a Police Vetting check</strong>
                  <p style="font-size:13px;color:var(--text-muted);margin-top:3px">Members who submit a NZ Police vetting check receive a verified badge. You can obtain one free at <a href="https://www.police.govt.nz/advice-services/personal-requests/vetting" target="_blank">police.govt.nz</a> — it takes 5–10 working days.</p>
                </div>
              </label>
            </div>

            <div id="policeUploadSection" style="display:none">
              <div class="form-row">
                <label>Upload your Police Vetting result</label>
                <div class="id-upload-zone" onclick="document.getElementById('policeFileInput').click()">
                  <input type="file" id="policeFileInput" accept="image/*,.pdf" style="display:none" onchange="handlePoliceUpload(event)">
                  <div id="policeUploadPrompt">
                    <div style="font-size:28px;margin-bottom:6px">🚔</div>
                    <p style="font-size:14px;font-weight:500">Click to upload Police Vetting result</p>
                  </div>
                  <div id="policeUploadDone" style="display:none;text-align:center;padding:1rem">
                    <div style="font-size:28px">✅</div>
                    <p style="font-size:14px;font-weight:500;color:var(--green)" id="policeFileName"></p>
                  </div>
                </div>
              </div>
            </div>

            <p style="font-size:12px;color:var(--text-muted);margin-top:1rem">Your ID is stored securely and never shown to other users. It is used solely to verify your identity. See our <a href="${isInPagesFolder() ? 'privacy.html' : 'pages/privacy.html'}">privacy policy</a>.</p>
          </div>

          <div class="modal-footer" style="padding:0;border:none;margin-top:1.5rem">
            <button class="btn btn-outline" onclick="skipVerification()">Skip for now</button>
            <button class="btn btn-primary" onclick="submitVerification()">Submit for review</button>
          </div>
        </div>

        <div id="checkEmailView" style="display:none;text-align:center;padding:1rem 0">
          <div style="font-size:36px;margin-bottom:1rem">📬</div>
          <h3 style="margin-bottom:0.5rem">Check your email</h3>
          <p style="color:var(--text-muted);font-size:14px">We sent a confirmation link to your email. Click it to activate your account, then sign in to complete identity verification.</p>
        </div>

        <div id="verifyPendingView" style="display:none;text-align:center;padding:1rem 0">
          <div style="font-size:36px;margin-bottom:1rem">⏳</div>
          <h3 style="margin-bottom:0.5rem">Verification submitted!</h3>
          <p style="color:var(--text-muted);font-size:14px">Your ID is being reviewed. This usually takes 1–2 business days. You'll receive an email when your verified badge is applied.</p>
          <button class="btn btn-primary" style="margin-top:1rem" onclick="document.getElementById('signInModal').remove()">Continue to Nest X</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  // Show police upload when checkbox ticked
  modal.querySelector('#policeCheck').addEventListener('change', function() {
    document.getElementById('policeUploadSection').style.display = this.checked ? 'block' : 'none';
  });
}

function showForgotView() {
  document.getElementById('signInView').style.display = 'none';
  document.getElementById('signUpView').style.display = 'none';
  document.getElementById('forgotView').style.display = 'block';
  document.getElementById('signInError').style.display = 'none';
}

async function doForgotPassword() {
  const email = document.getElementById('forgotEmail').value.trim();
  const errEl = document.getElementById('signInError');

  if (!email) {
    errEl.textContent = 'Please enter your email address.';
    errEl.style.display = 'block';
    return;
  }

  const redirectTo = window.location.origin + '/pages/reset-password.html';

  const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    errEl.textContent = error.message;
    errEl.style.display = 'block';
    return;
  }

  document.getElementById('forgotView').style.display = 'none';
  document.getElementById('forgotSentView').style.display = 'block';
}

function showSignUpView() {
  document.getElementById('signInView').style.display = 'none';
  document.getElementById('signUpView').style.display = 'block';
  document.getElementById('signInError').style.display = 'none';
}

function showSignInView() {
  document.getElementById('signUpView').style.display = 'none';
  document.getElementById('signInView').style.display = 'block';
  document.getElementById('signInError').style.display = 'none';
}

function handleIdUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  document.getElementById('idUploadPrompt').style.display = 'none';
  document.getElementById('idUploadDone').style.display = 'block';
  document.getElementById('idFileName').textContent = file.name;
}

function handlePoliceUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  document.getElementById('policeUploadPrompt').style.display = 'none';
  document.getElementById('policeUploadDone').style.display = 'block';
  document.getElementById('policeFileName').textContent = file.name;
}

async function doSignIn() {
  const email    = document.getElementById('siEmail').value.trim();
  const password = document.getElementById('siPassword').value;
  const errEl    = document.getElementById('signInError');
  if (!email || !password) { errEl.textContent = 'Please enter your email and password.'; errEl.style.display = 'block'; return; }
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) { errEl.textContent = error.message; errEl.style.display = 'block'; }
  else {
    document.getElementById('signInModal').remove();
    showToast('Welcome back!');
    const authGate = document.getElementById('authGate');
    const listingForm = document.getElementById('listingForm');
    if (authGate) authGate.style.display = 'none';
    if (listingForm) listingForm.style.display = 'flex';
  }
}

async function doSignUp() {
  const email     = document.getElementById('suEmail').value.trim();
  const password  = document.getElementById('suPassword').value;
  const firstName = document.getElementById('suFirstName').value.trim();
  const lastName  = document.getElementById('suLastName').value.trim();
  const errEl     = document.getElementById('signInError');

  if (!email || !password || !firstName || !lastName) {
    errEl.textContent = 'Please fill in all fields.'; errEl.style.display = 'block'; return;
  }
  if (password.length < 8) {
    errEl.textContent = 'Password must be at least 8 characters.'; errEl.style.display = 'block'; return;
  }

  const { data, error } = await db.auth.signUp({
    email, password,
    options: { data: { first_name: firstName, last_name: lastName, last_initial: lastName.charAt(0).toUpperCase() } }
  });

  if (error) { errEl.textContent = error.message; errEl.style.display = 'block'; }
  else {
    // Show verify view
    document.getElementById('signUpView').style.display = 'none';
    document.getElementById('verifyView').style.display = 'block';
  }
}

async function submitVerification() {
  const idFile = document.getElementById('idFileInput').files[0];
  if (!idFile) { showToast('Please upload your ID photo'); return; }

  const { data: { session } } = await db.auth.getSession();
  if (!session) { showToast('Please sign in first'); return; }

  // Upload ID to Supabase storage
  const idPath = `verifications/${session.user.id}/id_${Date.now()}.${idFile.name.split('.').pop()}`;
  await db.storage.from('verifications').upload(idPath, idFile);

  // Upload police check if provided
  const policeFile = document.getElementById('policeFileInput').files[0];
  if (policeFile) {
    const policePath = `verifications/${session.user.id}/police_${Date.now()}.${policeFile.name.split('.').pop()}`;
    await db.storage.from('verifications').upload(policePath, policeFile);
  }

  // Record verification request
  await db.from('verifications').insert({
    user_id: session.user.id,
    id_type: document.getElementById('idType').value,
    has_police_check: document.getElementById('policeCheck').checked,
    status: 'pending'
  });

  document.getElementById('verifyView').style.display = 'none';
  document.getElementById('verifyPendingView').style.display = 'block';
}

function skipVerification() {
  document.getElementById('signInModal').remove();
  showToast('Account created! Complete ID verification before listing.');
}

initAuth();
