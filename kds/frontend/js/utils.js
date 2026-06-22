// ═══════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════

function pad(n){ return String(n).padStart(2,'0'); }

function getElapsed(ts){ return Math.floor((Date.now()-ts)/1000); }

function fmtTimer(sec){
  const m = Math.floor(sec/60), s = sec%60;
  return pad(m)+':'+pad(s);
}

function urgClass(sec, o){
  const targetSec = (o && o.targetTime ? o.targetTime : CFG.urgentMin) * 60;
  const warnSec = (o && o.targetTime ? o.targetTime * 0.8 : CFG.warnMin) * 60;
  if(sec >= targetSec) return 'urgent';
  if(sec >= warnSec)   return 'warn';
  return 'fresh';
}

// ═══════════════════════════════════════════════════════
// SCROLL TO CARD (from urgent strip)
// ═══════════════════════════════════════════════════════
function scrollToCard(id){
  const el = document.getElementById('ocard-'+id);
  if(el) el.scrollIntoView({behavior:'smooth', block:'center'});
}

// ═══════════════════════════════════════════════════════
// SOUND (Web Audio API) - FIXED FOR BROWSER AUTOPLAY POLICY
// ═══════════════════════════════════════════════════════
let audioCtx = null;
let audioInitialized = false;

// Initialize AudioContext on first user interaction
document.addEventListener('click', initAudioOnce, { once: true });
document.addEventListener('touchstart', initAudioOnce, { once: true });

function initAudioOnce() {
  if (!audioInitialized) {
    try {
      audioCtx = new (window.AudioContext||window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      audioInitialized = true;
      console.log('✅ KDS AudioContext initialized');
      
      // Play silent tone to unlock audio on iOS/Safari
      playTone(0, 0, 0);
      
      // Hide "Enable Sound" button if visible
      const unlockBtn = document.getElementById('audio-unlock');
      if (unlockBtn) unlockBtn.style.display = 'none';
    } catch(e) {
      console.error('❌ Failed to initialize AudioContext:', e);
    }
  }
}

function ensureAudio(){
  if(!audioCtx) {
    try {
      audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    } catch(e) {
      console.error('AudioContext not available:', e);
      return false;
    }
  }
  
  // Resume if suspended (common on mobile browsers)
  if(audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => {
      console.log('AudioContext resumed');
    });
  }
  
  return audioCtx.state === 'running';
}

function playTone(freq, dur, vol=0.3, when=0){
  try {
    if (!ensureAudio()) {
      console.warn('AudioContext not running');
      return;
    }
    
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    const t = audioCtx.currentTime + when;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+dur);
    osc.start(t); osc.stop(t+dur);
  } catch(e){
    console.error('Failed to play tone:', e);
  }
}

function playSound(type){
  if(!CFG.soundEnabled) {
    console.log('🔇 Sound disabled in config');
    return;
  }
  
  if(!audioInitialized) {
    console.warn('⚠️ AudioContext not initialized yet. Click anywhere to enable sound.');
    // Show "Enable Sound" button if exists
    const unlockBtn = document.getElementById('audio-unlock');
    if (unlockBtn) unlockBtn.style.display = 'block';
    return;
  }
  
  console.log('🔊 Playing sound:', type);
  
  if(type==='new')    { 
    playTone(880, 0.18, 0.25); 
    console.log('✅ New order sound played');
  }
  if(type==='urgent') { 
    playTone(660, 0.12, 0.3, 0); 
    playTone(880, 0.12, 0.3, 0.18); 
    console.log('✅ Urgent sound played');
  }
  if(type==='escalation') {
    playTone(1047, 0.15, 0.35, 0);
    playTone(784, 0.15, 0.35, 0.2);
    playTone(1047, 0.15, 0.35, 0.4);
    console.log('✅ Escalation sound played');
  }
}

// Manual unlock function for button
window.unlockAudio = function() {
  initAudioOnce();
  // Test sound
  setTimeout(() => {
    if (CFG.soundEnabled) playSound('new');
  }, 100);
};

// Show "Enable Sound" button after 3 seconds if not initialized
setTimeout(() => {
  if (!audioInitialized) {
    const unlockBtn = document.getElementById('audio-unlock');
    if (unlockBtn) unlockBtn.style.display = 'block';
  }
}, 3000);
