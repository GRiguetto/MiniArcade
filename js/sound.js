let audio;
function bip(freq, dur = 0.08, tipo = "square") {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = tipo; o.frequency.value = freq; g.gain.value = 0.05;
    o.connect(g); g.connect(audio.destination);
    o.start(); o.stop(audio.currentTime + dur);
  } catch (e) { /* sem áudio, segue o jogo */ }
}