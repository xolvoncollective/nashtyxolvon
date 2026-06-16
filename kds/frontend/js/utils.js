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
// SOUND (Web Audio API)
// ═══════════════════════════════════════════════════════
let audioCtx = null;
function ensureAudio(){
  if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
}
function playTone(freq, dur, vol=0.3, when=0){
  try {
    ensureAudio();
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    const t = audioCtx.currentTime + when;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t+dur);
    osc.start(t); osc.stop(t+dur);
  } catch(e){}
}
function playSound(type){
  if(!CFG.soundEnabled) return;
  if(type==='new')    { playTone(880, 0.18, 0.25); }
  if(type==='urgent') { playTone(660, 0.12, 0.3, 0); playTone(880, 0.12, 0.3, 0.18); }
}
