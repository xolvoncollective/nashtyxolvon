// ═══════════════════════════════════════════════════════
// MODIFIERS MODULE - Product Customization
// ═══════════════════════════════════════════════════════

let currentModifierProduct = null;
let modifierSelections = {};

// Show modifier modal
function showModifierModal(product) {
  currentModifierProduct = product;
  modifierSelections = {};
  
  // Fetch modifiers for this product
  fetchProductModifiers(product.id);
}

// Fetch modifiers from backend
async function fetchProductModifiers(productId) {
  try {
    const response = await fetch(`${API_URL}/products/${productId}/modifiers`, {
      headers: { 'Authorization': `Bearer ${API.session.token}` }
    });
    
    const data = await response.json();
    
    if (data.success && data.modifiers && data.modifiers.length > 0) {
      renderModifierModal(data.modifiers);
    } else {
      // No modifiers, add directly to cart
      addToCartDirect(currentModifierProduct, 1, {});
    }
  } catch (error) {
    console.error('Failed to fetch modifiers:', error);
    // Fallback: add without modifiers
    addToCartDirect(currentModifierProduct, 1, {});
  }
}

// Render modifier modal
function renderModifierModal(modifierGroups) {
  const modalHTML = `
    <div class="modifier-overlay" id="modifier-overlay">
      <div class="modifier-modal">
        <div class="mod-header">
          <div>
            <div class="mod-title">${currentModifierProduct.name}</div>
            <div class="mod-subtitle">Sesuaikan Pesanan Anda</div>
          </div>
          <button class="mod-close" onclick="closeModifierModal()">✕</button>
        </div>
        
        <div class="mod-body">
          ${modifierGroups.map(group => `
            <div class="mod-group" data-group-id="${group.id}">
              <div class="mod-group-header">
                <div class="mod-group-name">${group.name}</div>
                ${group.required ? '<span class="mod-required">Required</span>' : ''}
                ${group.multiple ? `<span class="mod-multiple">Max ${group.max_selections || '∞'}</span>` : ''}
              </div>
              
              <div class="mod-options">
                ${group.options.map(option => `
                  <div class="mod-option" 
                       data-option-id="${option.id}"
                       data-group-id="${group.id}"
                       data-price="${option.price_modifier || 0}"
                       onclick="toggleModifier('${group.id}', '${option.id}', ${group.multiple}, ${group.max_selections || 99})">
                    <div class="mod-opt-check"></div>
                    <div class="mod-opt-info">
                      <div class="mod-opt-name">${option.name}</div>
                      ${option.price_modifier > 0 ? `<div class="mod-opt-price">+Rp ${option.price_modifier.toLocaleString()}</div>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="mod-footer">
          <div class="mod-qty-control">
            <button onclick="adjustModQty(-1)">−</button>
            <span id="mod-qty">1</span>
            <button onclick="adjustModQty(1)">+</button>
          </div>
          <button class="mod-add-btn" onclick="confirmModifiers()">
            <span>Tambahkan ke Keranjang</span>
            <span id="mod-total-price">Rp ${currentModifierProduct.price.toLocaleString()}</span>
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Toggle modifier selection
function toggleModifier(groupId, optionId, isMultiple, maxSelections) {
  if (!modifierSelections[groupId]) {
    modifierSelections[groupId] = [];
  }
  
  const index = modifierSelections[groupId].indexOf(optionId);
  
  if (index > -1) {
    // Deselect
    modifierSelections[groupId].splice(index, 1);
  } else {
    if (isMultiple) {
      // Multi-select with limit
      if (modifierSelections[groupId].length < maxSelections) {
        modifierSelections[groupId].push(optionId);
      }
    } else {
      // Single select
      modifierSelections[groupId] = [optionId];
    }
  }
  
  // Update UI
  updateModifierUI(groupId, optionId);
  updateModifierPrice();
}

// Update modifier UI
function updateModifierUI(groupId, optionId) {
  const optionEl = document.querySelector(`.mod-option[data-group-id="${groupId}"][data-option-id="${optionId}"]`);
  const checkEl = optionEl.querySelector('.mod-opt-check');
  
  if (modifierSelections[groupId] && modifierSelections[groupId].includes(optionId)) {
    checkEl.classList.add('checked');
  } else {
    checkEl.classList.remove('checked');
  }
}

// Update price with modifiers
function updateModifierPrice() {
  const basePrice = currentModifierProduct.price;
  let modifierPrice = 0;
  
  // Calculate modifier prices
  Object.values(modifierSelections).forEach(optionIds => {
    optionIds.forEach(optionId => {
      const optionEl = document.querySelector(`.mod-option[data-option-id="${optionId}"]`);
      if (optionEl) {
        modifierPrice += parseFloat(optionEl.dataset.price || 0);
      }
    });
  });
  
  const qty = parseInt(document.getElementById('mod-qty').textContent);
  const total = (basePrice + modifierPrice) * qty;
  
  document.getElementById('mod-total-price').textContent = `Rp ${total.toLocaleString()}`;
}

// Adjust quantity
function adjustModQty(delta) {
  const qtyEl = document.getElementById('mod-qty');
  let qty = parseInt(qtyEl.textContent);
  qty = Math.max(1, qty + delta);
  qtyEl.textContent = qty;
  updateModifierPrice();
}

// Confirm modifiers and add to cart
function confirmModifiers() {
  // Validate required groups
  const requiredGroups = document.querySelectorAll('.mod-group[data-group-id]');
  for (const group of requiredGroups) {
    const groupId = group.dataset.groupId;
    const isRequired = group.querySelector('.mod-required') !== null;
    
    if (isRequired && (!modifierSelections[groupId] || modifierSelections[groupId].length === 0)) {
      alert('Please select required options');
      return;
    }
  }
  
  const qty = parseInt(document.getElementById('mod-qty').textContent);
  
  // Build modifier details for cart item
  const modifierDetails = [];
  Object.keys(modifierSelections).forEach(groupId => {
    modifierSelections[groupId].forEach(optionId => {
      const optionEl = document.querySelector(`.mod-option[data-option-id="${optionId}"]`);
      const optionName = optionEl.querySelector('.mod-opt-name').textContent;
      const optionPrice = parseFloat(optionEl.dataset.price || 0);
      
      modifierDetails.push({
        groupId,
        optionId,
        name: optionName,
        price: optionPrice
      });
    });
  });
  
  // Add to cart with modifiers
  addToCartWithModifiers(currentModifierProduct, qty, modifierDetails);
  
  closeModifierModal();
}

// Add to cart with modifiers
function addToCartWithModifiers(product, quantity, modifiers) {
  const modifierPrice = modifiers.reduce((sum, mod) => sum + mod.price, 0);
  const finalPrice = product.price + modifierPrice;
  
  const cartItem = {
    productId: product.id,
    name: product.name,
    price: finalPrice,
    basePrice: product.price,
    quantity: quantity,
    modifiers: modifiers,
    modifierText: modifiers.map(m => m.name).join(', ')
  };
  
  // Add to STATE.cart
  STATE.cart.push(cartItem);
  renderCart();
  saveCart();
}

// Add to cart directly (no modifiers)
function addToCartDirect(product, quantity, modifiers) {
  const cartItem = {
    productId: product.id,
    name: product.name,
    price: product.price,
    basePrice: product.price,
    quantity: quantity,
    modifiers: [],
    modifierText: ''
  };
  
  STATE.cart.push(cartItem);
  renderCart();
  saveCart();
}

// Close modifier modal
function closeModifierModal() {
  const overlay = document.getElementById('modifier-overlay');
  if (overlay) {
    overlay.remove();
  }
  currentModifierProduct = null;
  modifierSelections = {};
}

// Add modifier modal styles
const modifierStyles = document.createElement('style');
modifierStyles.textContent = `
.modifier-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s;
}

.modifier-modal {
  background: var(--sf);
  border: 1px solid var(--brd2);
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--sh2);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.mod-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--brd);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.mod-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--txt);
}

.mod-subtitle {
  font-size: 12px;
  color: var(--txt3);
  margin-top: 2px;
}

.mod-close {
  background: none;
  border: none;
  color: var(--txt3);
  font-size: 24px;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.15s;
}

.mod-close:hover {
  background: var(--sf2);
  color: var(--txt);
}

.mod-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.mod-group {
  margin-bottom: 24px;
}

.mod-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.mod-group-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--txt);
}

.mod-required {
  background: var(--rdL);
  color: var(--rd);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
}

.mod-multiple {
  background: var(--blL);
  color: var(--bl);
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
}

.mod-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mod-option {
  background: var(--sf2);
  border: 2px solid var(--brd);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.15s;
}

.mod-option:hover {
  border-color: var(--or);
  background: var(--orM);
}

.mod-option.selected {
  border-color: var(--or);
  background: var(--orL);
}

.mod-opt-check {
  width: 20px;
  height: 20px;
  border: 2px solid var(--brd2);
  border-radius: 6px;
  flex-shrink: 0;
  position: relative;
  transition: all 0.2s;
}

.mod-opt-check.checked {
  background: var(--or);
  border-color: var(--or);
}

.mod-opt-check.checked::after {
  content: '✓';
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: 700;
}

.mod-opt-info {
  flex: 1;
}

.mod-opt-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--txt);
}

.mod-opt-price {
  font-size: 12px;
  font-weight: 700;
  color: var(--or);
  margin-top: 2px;
}

.mod-footer {
  padding: 20px 24px;
  border-top: 1px solid var(--brd);
  display: flex;
  gap: 12px;
  align-items: center;
}

.mod-qty-control {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--sf2);
  border: 1px solid var(--brd);
  border-radius: 12px;
  padding: 8px 12px;
}

.mod-qty-control button {
  background: none;
  border: none;
  color: var(--or);
  font-size: 20px;
  font-weight: 700;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.15s;
}

.mod-qty-control button:hover {
  background: var(--orL);
}

.mod-qty-control span {
  font-size: 16px;
  font-weight: 700;
  color: var(--txt);
  min-width: 32px;
  text-align: center;
}

.mod-add-btn {
  flex: 1;
  background: var(--or);
  border: none;
  border-radius: 12px;
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: all 0.15s;
}

.mod-add-btn:hover {
  background: var(--orD);
  transform: translateY(-1px);
}

.mod-add-btn span:first-child {
  font-size: 13px;
  font-weight: 600;
  color: white;
}

.mod-add-btn span:last-child {
  font-size: 16px;
  font-weight: 800;
  color: white;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(40px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
`;
document.head.appendChild(modifierStyles);
