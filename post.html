<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>List your home — SwapNest</title>
  <link rel="stylesheet" href="css/style.css">
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>

  <nav class="navbar">
    <a href="index.html" class="logo">swap<span>nest</span></a>
    <div class="nav-links">
      <a href="browse.html">Browse homes</a>
      <a href="#" id="myListingsLink" style="display:none">My listings</a>
      <span id="userEmail" class="user-email"></span>
      <button id="authBtn" class="btn btn-outline" onclick="handleAuth()">Sign in</button>
      <a href="post.html" class="btn btn-primary active">List your home</a>
    </div>
    <button class="hamburger" onclick="toggleMenu()">&#9776;</button>
  </nav>

  <div class="page-header">
    <div class="container">
      <h1>List your home</h1>
      <p>Free to list. No agent commissions.</p>
    </div>
  </div>

  <div class="container form-layout">

    <!-- Must be signed in -->
    <div id="authGate" style="display:none" class="auth-gate">
      <div class="auth-gate-inner">
        <h2>Sign in to list your home</h2>
        <p>Create a free account to post your listing and manage swap offers.</p>
        <button class="btn btn-primary btn-lg" onclick="signInToList()">Sign in with email</button>
      </div>
    </div>

    <form id="listingForm" class="listing-form" onsubmit="submitListing(event)">

      <div class="form-card">
        <h2>Property details</h2>

        <div class="form-row">
          <label for="address">Full address <span class="req">*</span></label>
          <input type="text" id="address" placeholder="e.g. 34 Aro Street, Aro Valley, Wellington 6021" required>
        </div>

        <div class="form-grid-2">
          <div class="form-row">
            <label for="price">Asking price ($) <span class="req">*</span></label>
            <input type="number" id="price" placeholder="850000" min="1" required>
          </div>
          <div class="form-row">
            <label for="propType">Property type <span class="req">*</span></label>
            <select id="propType" required>
              <option value="">Select…</option>
              <option value="House">House</option>
              <option value="Townhouse">Townhouse</option>
              <option value="Apartment">Apartment</option>
              <option value="Section + house">Section + house</option>
              <option value="Lifestyle block">Lifestyle block</option>
            </select>
          </div>
        </div>

        <div class="form-grid-3">
          <div class="form-row">
            <label for="beds">Bedrooms <span class="req">*</span></label>
            <input type="number" id="beds" placeholder="3" min="1" max="20" required>
          </div>
          <div class="form-row">
            <label for="baths">Bathrooms <span class="req">*</span></label>
            <input type="number" id="baths" placeholder="2" min="1" max="20" required>
          </div>
          <div class="form-row">
            <label for="garages">Garages</label>
            <input type="number" id="garages" placeholder="1" min="0" max="10">
          </div>
        </div>

        <div class="form-row">
          <label for="landSize">Land area (m²)</label>
          <input type="number" id="landSize" placeholder="650" min="0">
        </div>

        <div class="form-row">
          <label for="description">Description <span class="req">*</span></label>
          <textarea id="description" rows="5" placeholder="Describe your home — standout features, recent renovations, school zones, what you love about the neighbourhood…" required></textarea>
          <span class="field-hint">Be specific. Good descriptions attract better swap offers.</span>
        </div>
      </div>

      <div class="form-card">
        <h2>Photos</h2>
        <p class="card-subtitle">Upload up to 10 photos. First photo becomes the cover image.</p>

        <div class="photo-upload-zone" id="photoZone" onclick="document.getElementById('photoInput').click()">
          <input type="file" id="photoInput" accept="image/*" multiple style="display:none" onchange="handlePhotoSelect(event)">
          <div class="upload-prompt" id="uploadPrompt">
            <div class="upload-icon">📷</div>
            <p>Click to add photos</p>
            <span>JPG, PNG up to 10MB each</span>
          </div>
          <div class="photo-previews" id="photoPreviews"></div>
        </div>

        <div id="uploadProgress" class="upload-progress" style="display:none">
          <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
          <span id="progressText">Uploading photos…</span>
        </div>
      </div>

      <div class="form-card">
        <h2>Swap preference</h2>
        <p class="card-subtitle">Tell potential swappers what you're looking for.</p>

        <div class="swap-options">
          <label class="swap-option">
            <input type="radio" name="swapPref" value="up" required>
            <div class="swap-option-content">
              <strong>Upsizing</strong>
              <span>I want a bigger or more valuable home — I'll pay the difference</span>
            </div>
          </label>
          <label class="swap-option">
            <input type="radio" name="swapPref" value="down">
            <div class="swap-option-content">
              <strong>Downsizing</strong>
              <span>I want a smaller or cheaper home — I'll receive the difference</span>
            </div>
          </label>
          <label class="swap-option">
            <input type="radio" name="swapPref" value="lateral">
            <div class="swap-option-content">
              <strong>Lateral swap</strong>
              <span>Roughly equal value — small top-up either way is fine</span>
            </div>
          </label>
          <label class="swap-option">
            <input type="radio" name="swapPref" value="any">
            <div class="swap-option-content">
              <strong>Open to any swap</strong>
              <span>Happy to consider all offers and discuss the difference</span>
            </div>
          </label>
        </div>

        <div class="form-row" style="margin-top:1.5rem">
          <label for="swapLocation">Preferred swap location</label>
          <input type="text" id="swapLocation" placeholder="e.g. Wellington region, Wairarapa, open to NZ-wide">
        </div>

        <div class="form-row">
          <label for="swapNotes">Additional swap notes</label>
          <textarea id="swapNotes" rows="3" placeholder="Anything else swappers should know — timeline, conditions, what you're specifically looking for…"></textarea>
        </div>
      </div>

      <div class="form-card">
        <h2>Contact details</h2>
        <p class="card-subtitle">How interested swappers reach you. Your email is never shown publicly.</p>

        <div class="form-row">
          <label for="contactName">Your name <span class="req">*</span></label>
          <input type="text" id="contactName" placeholder="First name is fine" required>
        </div>

        <div class="form-row">
          <label for="contactPhone">Phone number</label>
          <input type="tel" id="contactPhone" placeholder="e.g. 021 234 5678">
        </div>

        <div class="form-row">
          <label>
            <input type="checkbox" id="showPhone"> Show phone number on listing
          </label>
        </div>
      </div>

      <div class="form-card form-card-terms">
        <label class="checkbox-label">
          <input type="checkbox" id="agreeTerms" required>
          I have read and agree to the <a href="pages/terms.html" target="_blank">terms of use</a>. I confirm this is my property and the information provided is accurate.
        </label>
      </div>

      <div class="form-actions">
        <div id="formError" class="form-error" style="display:none"></div>
        <button type="submit" class="btn btn-primary btn-lg" id="submitBtn">
          Publish listing
        </button>
        <p class="form-note">Free to list. SwapNest does not charge listing fees during our launch period.</p>
      </div>

    </form>
  </div>

  <footer class="footer">
    <div class="container footer-inner">
      <div class="footer-brand">
        <span class="logo">swap<span>nest</span></span>
        <p>New Zealand's private home swap marketplace.</p>
      </div>
      <div class="footer-links">
        <a href="browse.html">Browse</a>
        <a href="post.html">List a home</a>
        <a href="pages/terms.html">Terms of use</a>
        <a href="pages/privacy.html">Privacy policy</a>
        <a href="mailto:hello@swapnest.co.nz">Contact</a>
      </div>
      <p class="footer-disclaimer">SwapNest connects buyers and sellers. We are not a licensed real estate agent and do not provide property advice.</p>
    </div>
  </footer>

  <script src="js/supabase.js"></script>
  <script src="js/auth.js"></script>
  <script src="js/post.js"></script>
</body>
</html>
