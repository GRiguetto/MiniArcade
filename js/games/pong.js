function iniciarPong(Palco) {
  const W = 320,
    H = 320;

  const PW = 8,
    PH = 56,
    R = 4,
    MARGEM = 12;

  const VEL_JOGADOR = 280;
  const VEL_CPU = 165;
  const VEL_INICIAL = 190,
    VEL_MAX = 400,
    ACEL = 14;
  const VENCE = 7;
  const TECLAS = {
    ArrowUp: "cima",
    w: "cima",
    W: "cima",
    ArrowDown: "baixo",
    s: "baixo",
    S: "baixo",
  };

  Palco.innerHTML = `
        <div class="placar">
            <span>VOCÊ <b id="pts-j">0</b></span>
            <span>CPU <b id="pts-c">0</b></span>
        </div>

        <div class="moldura"><canvas id="tela" width="${W}" height="${H}"></canvas></div>
        <div class="dpad" style="grid-template-columns: repeat(2, 96px); grid-template-rows: 64px;">
        <button class="btn" data-d="cima" aria-label="Subir" style="grid-column:1;grid-row:1">▲</button>
        <button class="btn" data-d="baixo" aria-label="Descer" style="grid-column:2;grid-row:1">▼</button>
        </div>
        <p class="dica">SETAS OU W/S · ESPAÇO = PAUSA</p>`;
}
