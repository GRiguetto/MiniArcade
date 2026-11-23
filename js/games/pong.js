function iniciarPong(palco) {
  const W = 320,
    H = 320; // mesmo tamanho do canvas da cobrinha
  const PW = 8, // largura da raquete
    PH = 56, // altura da raquete
    R = 4, // raio da bola
    MARGEM = 12; // distância da raquete até a borda
  const VEL_JOGADOR = 280; // px/s (teclado)
  const VEL_CPU = 165; // px/s: mais lenta que a bola, então dá pra vencer
  const VEL_INICIAL = 190,
    VEL_MAX = 400,
    ACEL = 14; // a bola acelera a cada rebatida
  const VENCE = 7; // primeiro a chegar em 7 ganha
  const TECLAS = {
    ArrowUp: "cima",
    w: "cima",
    W: "cima",
    ArrowDown: "baixo",
    s: "baixo",
    S: "baixo",
  };

  palco.innerHTML = `
    <div class="placar"><span>VOCÊ <b id="pts-j">0</b></span><span>CPU <b id="pts-c">0</b></span></div>
    <div class="moldura"><canvas id="tela" width="${W}" height="${H}"></canvas></div>
    <div class="dpad" style="grid-template-columns: repeat(2, 96px); grid-template-rows: 64px;">
      <button class="btn" data-d="cima" aria-label="Subir" style="grid-column:1;grid-row:1">▲</button>
      <button class="btn" data-d="baixo" aria-label="Descer" style="grid-column:2;grid-row:1">▼</button>
    </div>
    <p class="dica">SETAS OU W/S · ESPAÇO = PAUSA</p>`;

  const cv = $("#tela"),
    ctx = cv.getContext("2d");
  const cor = (v) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const limitar = (v, a, b) => Math.max(a, Math.min(b, v));

  let jogador, cpu, bola, pj, pc, estado, espera, raf, ultimo;
  const teclas = { cima: false, baixo: false };
  // estado: "pronto" | "jogando" | "pausado" | "fim"

  function resetar() {
    jogador = { y: H / 2 - PH / 2 };
    cpu = { y: H / 2 - PH / 2, erro: 0 };
    bola = { x: W / 2, y: H / 2, vx: 0, vy: 0 };
    pj = 0;
    pc = 0;
    estado = "pronto";
    atualizarPlacar();
    saque(1);
  }

  function atualizarPlacar() {
    $("#pts-j").textContent = pj;
    $("#pts-c").textContent = pc;
  }

  // coloca a bola no centro e lança na direção dir (1 = para a CPU, -1 = para você)
  function saque(dir) {
    const ang = (Math.random() * 2 - 1) * (Math.PI / 7);
    bola.x = W / 2;
    bola.y = H / 2;
    bola.vx = Math.cos(ang) * VEL_INICIAL * dir;
    bola.vy = Math.sin(ang) * VEL_INICIAL;
    cpu.erro = 0;
    espera = 0.8; // pausa curta antes da bola andar
  }

  function comecar() {
    estado = "jogando";
    bip(440);
  }

  function rebater(py, dir, novoX) {
    // quanto mais longe do centro da raquete, mais inclinado o rebote
    const rel = limitar((bola.y - (py + PH / 2)) / (PH / 2), -1, 1);
    const ang = rel * (Math.PI / 3);
    const vel = Math.min(VEL_MAX, Math.hypot(bola.vx, bola.vy) + ACEL);
    bola.x = novoX;
    bola.vx = Math.cos(ang) * vel * dir;
    bola.vy = Math.sin(ang) * vel;
    // a CPU "erra a mira" um pouco a cada rebatida do jogador
    if (dir === 1) cpu.erro = (Math.random() * 2 - 1) * PH * 0.4;
    bip(440, 0.05);
  }

  function ponto(quem) {
    if (quem === "jogador") {
      pj++;
      bip(880, 0.15);
    } else {
      pc++;
      bip(160, 0.2, "sawtooth");
    }
    atualizarPlacar();
    if (pj >= VENCE || pc >= VENCE) return fimDeJogo();
    saque(quem === "jogador" ? 1 : -1); // saque vai para quem tomou o ponto
  }

  function fimDeJogo() {
    estado = "fim";
    bip(pj > pc ? 988 : 120, 0.4, pj > pc ? "square" : "sawtooth");
  }

  function atualizar(dt) {
    // raquete do jogador (teclado)
    const mov = (teclas.baixo ? 1 : 0) - (teclas.cima ? 1 : 0);
    jogador.y = limitar(jogador.y + mov * VEL_JOGADOR * dt, 0, H - PH);

    // raquete da CPU: segue a bola quando ela vem, volta ao centro quando vai
    const alvo = bola.vx > 0 ? bola.y + cpu.erro : H / 2;
    const dif = alvo - (cpu.y + PH / 2);
    if (Math.abs(dif) > 6) {
      cpu.y += Math.sign(dif) * Math.min(Math.abs(dif), VEL_CPU * dt);
      cpu.y = limitar(cpu.y, 0, H - PH);
    }

    if (espera > 0) {
      espera -= dt;
      return;
    }

    bola.x += bola.vx * dt;
    bola.y += bola.vy * dt;

    // paredes de cima e de baixo
    if (bola.y < R) {
      bola.y = R;
      bola.vy = Math.abs(bola.vy);
      bip(220, 0.04);
    } else if (bola.y > H - R) {
      bola.y = H - R;
      bola.vy = -Math.abs(bola.vy);
      bip(220, 0.04);
    }

    // raquete do jogador (esquerda)
    const bordaJ = MARGEM + PW;
    if (
      bola.vx < 0 &&
      bola.x - R <= bordaJ &&
      bola.x + R >= MARGEM &&
      bola.y + R >= jogador.y &&
      bola.y - R <= jogador.y + PH
    )
      rebater(jogador.y, 1, bordaJ + R);

    // raquete da CPU (direita)
    const bordaC = W - MARGEM - PW;
    if (
      bola.vx > 0 &&
      bola.x + R >= bordaC &&
      bola.x - R <= W - MARGEM &&
      bola.y + R >= cpu.y &&
      bola.y - R <= cpu.y + PH
    )
      rebater(cpu.y, -1, bordaC - R);

    // saiu pelos lados: ponto
    if (bola.x < -R) ponto("cpu");
    else if (bola.x > W + R) ponto("jogador");
  }

  function texto(msg, y, tam = 16) {
    ctx.fillStyle = cor("--accent");
    ctx.textAlign = "center";
    ctx.font = `${tam}px "Press Start 2P", monospace`;
    ctx.fillText(msg, W / 2, y);
  }

  function desenhar() {
    ctx.fillStyle = cor("--screen");
    ctx.fillRect(0, 0, W, H);

    // rede tracejada
    ctx.fillStyle = cor("--muted");
    ctx.globalAlpha = 0.5;
    for (let y = 4; y < H; y += 20) ctx.fillRect(W / 2 - 2, y, 4, 10);
    ctx.globalAlpha = 1;

    // raquetes
    ctx.fillStyle = cor("--accent");
    ctx.fillRect(MARGEM, Math.round(jogador.y), PW, PH);
    ctx.fillStyle = cor("--accent2");
    ctx.fillRect(W - MARGEM - PW, Math.round(cpu.y), PW, PH);

    // bola
    ctx.fillStyle = cor("--ink");
    ctx.fillRect(Math.round(bola.x - R), Math.round(bola.y - R), R * 2, R * 2);

    if (estado !== "jogando") {
      ctx.fillStyle = cor("--screen");
      ctx.globalAlpha = 0.7;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    if (estado === "pronto") {
      texto("PONG", 140, 20);
      texto("TOQUE OU USE AS SETAS", 180, 9);
      texto(`PRIMEIRO A ${VENCE} GANHA`, 205, 9);
    }
    if (estado === "pausado") texto("PAUSA", 165, 20);
    if (estado === "fim") {
      texto(pj > pc ? "VOCÊ VENCEU!" : "CPU VENCEU", 140, 18);
      texto(`${pj} x ${pc}`, 175, 11);
      texto("ESPAÇO = DE NOVO", 205, 9);
    }
  }

  function quadro(t) {
    raf = requestAnimationFrame(quadro);
    const dt = Math.min(0.033, (t - (ultimo ?? t)) / 1000);
    ultimo = t;
    if (estado === "jogando") atualizar(dt);
    desenhar(); // desenha todo quadro, então o tema novo aparece sozinho
  }

  function alternarPausa() {
    if (estado === "jogando") estado = "pausado";
    else if (estado === "pausado") estado = "jogando";
  }

  // ----- controles -----
  function aoTeclar(e) {
    const d = TECLAS[e.key];
    if (d) {
      e.preventDefault();
      teclas[d] = true;
      if (estado === "pronto") comecar();
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (e.repeat) return;
      if (estado === "fim") {
        resetar();
        comecar();
      } else if (estado === "pronto") comecar();
      else alternarPausa();
    }
  }
  function aoSoltar(e) {
    const d = TECLAS[e.key];
    if (d) teclas[d] = false;
  }
  function soltarTudo() {
    teclas.cima = teclas.baixo = false;
  }
  function aoMudarVisibilidade() {
    if (document.hidden) {
      soltarTudo();
      if (estado === "jogando") estado = "pausado";
    }
  }
  document.addEventListener("keydown", aoTeclar);
  document.addEventListener("keyup", aoSoltar);
  window.addEventListener("blur", soltarTudo);
  document.addEventListener("visibilitychange", aoMudarVisibilidade);

  // botões ▲ ▼ (celular): segura para mover
  palco.querySelectorAll(".dpad .btn").forEach((b) => {
    const d = b.dataset.d;
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      teclas[d] = true;
      if (estado === "pronto") comecar();
      else if (estado === "fim") {
        resetar();
        comecar();
      }
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((ev) =>
      b.addEventListener(ev, () => (teclas[d] = false))
    );
  });

  // arrastar o dedo (ou mexer o mouse) sobre o campo move a raquete
  function moverPelaTela(e) {
    const r = cv.getBoundingClientRect();
    const y = (e.clientY - r.top) * (H / r.height);
    jogador.y = limitar(y - PH / 2, 0, H - PH);
  }
  cv.addEventListener("pointerdown", (e) => {
    moverPelaTela(e);
    if (estado === "fim") {
      resetar();
      comecar();
    } else if (estado === "pronto") comecar();
  });
  cv.addEventListener("pointermove", moverPelaTela);

  resetar();
  raf = requestAnimationFrame(quadro);

  // função de limpeza: chamada ao sair do jogo
  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener("keydown", aoTeclar);
    document.removeEventListener("keyup", aoSoltar);
    window.removeEventListener("blur", soltarTudo);
    document.removeEventListener("visibilitychange", aoMudarVisibilidade);
  };
}
