// ==========================================
// RECEIPT SETTINGS JS
// Date: 2026-06-22
// Purpose: Handle receipt customization
// ==========================================

class ReceiptSettings {
  constructor() {
    this.initElements();
    this.loadSettings();
    this.attachEventListeners();
    this.updatePreview();
  }

  initElements() {
    this.logoUpload = document.getElementById('logoUpload');
    this.logoInput = document.getElementById('logoInput');
    this.logoPreview = document.getElementById('logoPreview');
    this.headerText = document.getElementById('headerText');
    this.footerText = document.getElementById('footerText');
    this.fontSize = document.getElementById('fontSize');
    this.qrEnabled = document.getElementById('qrEnabled');
    this.qrUrl = document.getElementById('qrUrl');
    this.qrUrlGroup = document.getElementById('qrUrlGroup');
    this.facebookUrl = document.getElementById('facebookUrl');
    this.instagramUrl = document.getElementById('instagramUrl');
    this.twitterUrl = document.getElementById('twitterUrl');
    this.tiktokUrl = document.getElementById('tiktokUrl');
    this.promo1 = document.getElementById('promo1');
    this.promo2 = document.getElementById('promo2');
    this.promo3 = document.getElementById('promo3');
    this.btnSave = document.getElementById('btnSave');
    
    // Preview elements
    this.previewLogo = document.getElementById('previewLogo');
    this.previewHeader = document.getElementById('previewHeader');
    this.previewFooter = document.getElementById('previewFooter');
    this.previewPromo = document.getElementById('previewPromo');
    this.previewQr = document.getElementById('previewQr');
    this.previewSocial = document.getElementById('previewSocial');
  }

  attachEventListeners() {
    // Logo upload
    this.logoUpload.addEventListener('click', () => this.logoInput.click());
    this.logoInput.addEventListener('change', (e) => this.handleLogoUpload(e));
    
    // QR toggle
    this.qrEnabled.addEventListener('change', () => {
      this.qrUrlGroup.style.display = this.qrEnabled.checked ? 'block' : 'none';
      this.updatePreview();
    });
    
    // Real-time preview updates
    this.headerText.addEventListener('input', () => {
      this.updateCharCount('headerCount', this.headerText.value.length);
      this.updatePreview();
    });
    
    this.footerText.addEventListener('input', () => {
      this.updateCharCount('footerCount', this.footerText.value.length);
      this.updatePreview();
    });
    
    this.promo1.addEventListener('input', () => {
      this.updateCharCount('promo1Count', this.promo1.value.length);
      this.updatePreview();
    });
    
    this.promo2.addEventListener('input', () => {
      this.updateCharCount('promo2Count', this.promo2.value.length);
      this.updatePreview();
    });
    
    this.promo3.addEventListener('input', () => {
      this.updateCharCount('promo3Count', this.promo3.value.length);
      this.updatePreview();
    });
    
    this.fontSize.addEventListener('change', () => this.updatePreview());
    this.qrUrl.addEventListener('input', () => this.updatePreview());
    this.facebookUrl.addEventListener('input', () => this.updatePreview());
    this.instagramUrl.addEventListener('input', () => this.updatePreview());
    this.twitterUrl.addEventListener('input', () => this.updatePreview());
    this.tiktokUrl.addEventListener('input', () => this.updatePreview());
    
    // Save button
    this.btnSave.addEventListener('click', () => this.saveSettings());
  }

  async handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type. Please upload PNG, JPG, or SVG.');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert('File too large. Maximum size is 2MB.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.logoPreview.src = e.target.result;
      this.logoPreview.classList.add('show');
      this.logoUpload.classList.add('has-image');
      this.updatePreview();
    };
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // This would call your Supabase Storage API
      // const response = await fetch('/api/upload-logo', { method: 'POST', body: formData });
      // const { url } = await response.json();
      // this.logoUrl = url;
      
      console.log('Logo would be uploaded to Supabase Storage');
    } catch (error) {
      console.error('Logo upload error:', error);
      alert('Failed to upload logo. Please try again.');
    }
  }

  updateCharCount(elementId, count) {
    document.getElementById(elementId).textContent = count;
  }

  updatePreview() {
    // Update header
    const headerValue = this.headerText.value || 'Welcome!';
    this.previewHeader.textContent = headerValue;
    
    // Update footer
    const footerValue = this.footerText.value || 'Thank you!';
    this.previewFooter.textContent = footerValue;
    
    // Update font size
    const fontSizeValue = this.fontSize.value + 'pt';
    document.querySelector('.preview-card').style.fontSize = fontSizeValue;
    
    // Update promo (random selection)
    const promos = [this.promo1.value, this.promo2.value, this.promo3.value].filter(p => p.trim());
    if (promos.length > 0) {
      const randomPromo = promos[Math.floor(Math.random() * promos.length)];
      this.previewPromo.textContent = randomPromo;
      this.previewPromo.style.display = 'block';
    } else {
      this.previewPromo.style.display = 'none';
    }
    
    // Update QR
    this.previewQr.style.display = this.qrEnabled.checked && this.qrUrl.value ? 'block' : 'none';
    
    // Update social media
    const socials = [];
    if (this.facebookUrl.value) socials.push('📘 Facebook');
    if (this.instagramUrl.value) socials.push('📸 Instagram');
    if (this.twitterUrl.value) socials.push('🐦 Twitter');
    if (this.tiktokUrl.value) socials.push('🎵 TikTok');
    
    this.previewSocial.innerHTML = socials.length > 0 
      ? socials.join(' | ') 
      : '';
    
    // Update logo
    if (this.logoPreview.src && this.logoPreview.classList.contains('show')) {
      this.previewLogo.innerHTML = `<img src="${this.logoPreview.src}" style="max-width: 150px; max-height: 60px;">`;
    }
  }

  async loadSettings() {
    try {
      // Load settings from API
      const outletId = localStorage.getItem('outlet_id');
      // const response = await fetch(`/api/outlets/${outletId}/settings`);
      // const settings = await response.json();
      
      // Populate form (mock data for now)
      console.log('Settings would be loaded from API');
      
      // Initialize char counts
      this.updateCharCount('headerCount', this.headerText.value.length);
      this.updateCharCount('footerCount', this.footerText.value.length);
      this.updateCharCount('promo1Count', this.promo1.value.length);
      this.updateCharCount('promo2Count', this.promo2.value.length);
      this.updateCharCount('promo3Count', this.promo3.value.length);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async saveSettings() {
    // Validate QR URL if enabled
    if (this.qrEnabled.checked && this.qrUrl.value) {
      if (!this.qrUrl.value.startsWith('https://')) {
        alert('QR URL must be HTTPS');
        return;
      }
    }

    // Validate social media URLs
    const socialUrls = [
      { input: this.facebookUrl, pattern: 'facebook.com', name: 'Facebook' },
      { input: this.instagramUrl, pattern: 'instagram.com', name: 'Instagram' },
      { input: this.twitterUrl, pattern: 'twitter.com', name: 'Twitter' },
      { input: this.tiktokUrl, pattern: 'tiktok.com', name: 'TikTok' },
    ];

    for (const social of socialUrls) {
      if (social.input.value && !social.input.value.includes(social.pattern)) {
        alert(`Invalid ${social.name} URL`);
        return;
      }
    }

    const settings = {
      logo_url: this.logoUrl || null,
      header_text: this.headerText.value,
      footer_text: this.footerText.value,
      font_size: parseInt(this.fontSize.value),
      qr_enabled: this.qrEnabled.checked,
      qr_url: this.qrUrl.value || null,
      facebook_url: this.facebookUrl.value || null,
      instagram_url: this.instagramUrl.value || null,
      twitter_url: this.twitterUrl.value || null,
      tiktok_url: this.tiktokUrl.value || null,
      promo_messages: [
        this.promo1.value,
        this.promo2.value,
        this.promo3.value,
      ].filter(p => p.trim()),
    };

    try {
      this.btnSave.textContent = '💾 Saving...';
      this.btnSave.disabled = true;

      const outletId = localStorage.getItem('outlet_id');
      // const response = await fetch(`/api/outlets/${outletId}/settings`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(settings),
      // });

      // if (!response.ok) throw new Error('Save failed');

      console.log('Settings saved:', settings);
      alert('✅ Settings saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Failed to save settings. Please try again.');
    } finally {
      this.btnSave.textContent = '💾 Save Settings';
      this.btnSave.disabled = false;
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  new ReceiptSettings();
});
