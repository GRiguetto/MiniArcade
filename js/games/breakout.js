function iniciarBreakout(palco) {
  const W = 320,
    H = 384;
  const RAQ_W = 56, // largura normal da raquete
    RAQ_W_LARGA = 92, // largura com o power-up LARGA
    RAQ_H = 8,
    RAQ_Y = H - 30,
    VEL_RAQ = 300; // px/s (teclado)
  const R = 4; // raio da bola
  const COLS = 8,
    BW = W / COLS, // largura do tijolo
    BH = 14,
    TOPO = 28; // onde começa a primeira linha de tijolos
  const VEL_MAX = 400,
    ACEL = 6; // a bola acelera um pouquinho a cada rebatida na raquete
  const VIDAS_INI = 3,
    VIDAS_MAX = 5;
  const CHANCE_DROP = 0.22, // chance de um tijolo soltar power-up
    VEL_QUEDA = 90, // px/s
    MAX_BOLAS = 6;
  const DURACAO = { larga: 10, lento: 8, cola: 12 }; // segundos
  // L = larga · M = multibola · D = devagar · C = cola · V = vida (V é mais raro)
  const SORTEIO = ["L", "L", "M", "M", "D", "D", "C", "C", "V"];
  const TECLAS = {
    ArrowLeft: "esq",
    a: "esq",
    A: "esq",
    ArrowRight: "dir",
    d: "dir",
    D: "dir",
  };
  const REC_KEY = "arcade:breakout";

  palco.innerHTML = `
    <div class="placar"><span>PTS <b id="b-pts">0000</b></span><span>FASE <b id="b-fase">1</b></span><span>♥<b id="b-vidas">3</b></span><span>REC <b id="b-rec">0000</b></span></div>
    <div class="moldura"><canvas id="tela" width="${W}" height="${H}"></canvas></div>
    <div class="dpad" style="grid-template-columns: repeat(3, 64px); grid-template-rows: 64px;">
      <button class="btn" data-d="esq" aria-label="Esquerda" style="grid-column:1;grid-row:1">◀</button>
      <button class="btn" data-d="lancar" aria-label="Lançar a bola" style="grid-column:2;grid-row:1">●</button>
      <button class="btn" data-d="dir" aria-label="Direita" style="grid-column:3;grid-row:1">▶</button>
    </div>
    <p class="dica">SETAS OU A/D · ESPAÇO = LANÇAR/PAUSA</p>`;

  const cv = $("#tela"),
    ctx = cv.getContext("2d");
  const cor = (v) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const limitar = (v, a, b) => Math.max(a, Math.min(b, v));

  let raq, bolas, tijolos, caem, restantes;
  let pts, vidas, nivel, rec, aviso, estado, raf, ultimo;
  let efeitos;
  const teclas = { esq: false, dir: false };
  // estado: "pronto" | "jogando" | "pausado" | "fim"

  try {
    rec = Number(localStorage.getItem(REC_KEY)) || 0;
  } catch (e) {
    rec = 0;
  }

  // ----- preparar o jogo -----
  function resetar() {
    pts = 0;
    vidas = VIDAS_INI;
    nivel = 1;
    aviso = 0;
    efeitos = { larga: 0, lento: 0, cola: 0 };
    raq = { x: W / 2 - RAQ_W / 2, w: RAQ_W };
    criarFase();
    novaBola();
    estado = "pronto";
    atualizarPlacar();
  }

  // cada fase tem uma linha a mais (até 8); as linhas de cima aguentam 2 batidas
  function criarFase() {
    tijolos = [];
    caem = [];
    const linhas = Math.min(4 + nivel, 8);
    const duros = Math.min(nivel, 3);
    for (let r = 0; r < linhas; r++) {
      for (let c = 0; c < COLS; c++) {
        // fases pares ganham buracos na parede
        if (nivel % 2 === 0 && (r + c) % 4 === 3) continue;
        tijolos.push({
          x: c * BW,
          y: TOPO + r * BH,
          linha: r,
          vida: r < duros ? 2 : 1,
          vivo: true,
          pts: (linhas - r) * 10,
        });
      }
    }
    restantes = tijolos.length;
  }

  function novaBola() {
    bolas = [
      { x: raq.x + raq.w / 2, y: RAQ_Y - R, vx: 0, vy: 0, preso: true, off: 0 },
    ];
  }

  function velBase() {
    return Math.min(300, 210 + (nivel - 1) * 18);
  }

  // lança as bolas que estão presas na raquete
  function soltar() {
    bolas.forEach((b) => {
      if (!b.preso) return;
      const ang = (Math.random() * 2 - 1) * (Math.PI / 8);
      b.vx = Math.sin(ang) * velBase();
      b.vy = -Math.cos(ang) * velBase();
      b.preso = false;
      bip(523, 0.05);
    });
  }

  function comecar() {
    estado = "jogando";
    soltar();
  }

  function atualizarPlacar() {
    const p = (n) => String(n).padStart(4, "0");
    $("#b-pts").textContent = p(pts);
    $("#b-fase").textContent = nivel;
    $("#b-vidas").textContent = vidas;
    $("#b-rec").textContent = p(Math.max(rec, pts));
  }

  function guardarRecorde() {
    if (pts <= rec) return;
    rec = pts;
    try {
      localStorage.setItem(REC_KEY, String(rec));
    } catch (e) {}
  }

  // ----- power-ups -----
  function definirLargura(w) {
    const centro = raq.x + raq.w / 2;
    raq.w = w;
    raq.x = limitar(centro - w / 2, 0, W - w);
  }

  function pegar(tipo) {
    pts += 50;
    if (tipo === "L") {
      efeitos.larga = DURACAO.larga;
      definirLargura(RAQ_W_LARGA);
    } else if (tipo === "D") {
      efeitos.lento = DURACAO.lento;
    } else if (tipo === "C") {
      efeitos.cola = DURACAO.cola;
    } else if (tipo === "V") {
      vidas = Math.min(VIDAS_MAX, vidas + 1);
    } else if (tipo === "M") {
      soltar(); // se a bola estava presa, já sai
      const base = bolas.find((b) => !b.preso);
      if (base) {
        const vel = Math.hypot(base.vx, base.vy);
        [-0.35, 0.35].forEach((a) => {
          if (bolas.length >= MAX_BOLAS) return;
          let vx = base.vx * Math.cos(a) - base.vy * Math.sin(a);
          let vy = base.vx * Math.sin(a) + base.vy * Math.cos(a);
          // evita bola quase horizontal, que demoraria uma eternidade pra voltar
          if (Math.abs(vy) < vel * 0.3) {
            vy = (vy < 0 ? -1 : 1) * vel * 0.3;
            vx = Math.sign(vx || 1) * Math.sqrt(vel * vel - vy * vy);
          }
          bolas.push({ x: base.x, y: base.y, vx, vy, preso: false, off: 0 });
        });
      }
    }
    atualizarPlacar();
    bip(740, 0.1);
  }

  // ----- regras -----
  function acertar(t) {
    t.vida--;
    if (t.vida > 0) return bip(330, 0.04); // tijolo duro: só rachou
    t.vivo = false;
    restantes--;
    pts += t.pts;
    bip(520 + (7 - Math.min(7, t.linha)) * 40, 0.05);
    if (Math.random() < CHANCE_DROP)
      caem.push({
        x: t.x + BW / 2,
        y: t.y + BH / 2,
        tipo: SORTEIO[Math.floor(Math.random() * SORTEIO.length)],
      });
    atualizarPlacar();
  }

  function moverBola(b, d) {
    b.x += b.vx * d;
    b.y += b.vy * d;

    // paredes
    if (b.x < R) {
      b.x = R;
      b.vx = Math.abs(b.vx);
      bip(220, 0.03);
    } else if (b.x > W - R) {
      b.x = W - R;
      b.vx = -Math.abs(b.vx);
      bip(220, 0.03);
    }
    if (b.y < R) {
      b.y = R;
      b.vy = Math.abs(b.vy);
      bip(220, 0.03);
    }

    // raquete: quanto mais longe do centro, mais inclinado o rebote
    if (
      b.vy > 0 &&
      b.y + R >= RAQ_Y &&
      b.y - R <= RAQ_Y + RAQ_H &&
      b.x + R >= raq.x &&
      b.x - R <= raq.x + raq.w
    ) {
      const centro = raq.x + raq.w / 2;
      const rel = limitar((b.x - centro) / (raq.w / 2), -1, 1);
      const ang = rel * (Math.PI / 3);
      const vel = Math.min(VEL_MAX, Math.hypot(b.vx, b.vy) + ACEL);
      b.y = RAQ_Y - R;
      b.vx = Math.sin(ang) * vel;
      b.vy = -Math.cos(ang) * vel;
      bip(440, 0.05);
      if (efeitos.cola > 0) {
        b.preso = true; // COLA: fica grudada até o jogador lançar
        b.off = b.x - centro;
      }
      return;
    }

    // tijolos: ponto do tijolo mais perto do centro da bola
    for (const t of tijolos) {
      if (!t.vivo) continue;
      const px = limitar(b.x, t.x, t.x + BW),
        py = limitar(b.y, t.y, t.y + BH);
      const dx = b.x - px,
        dy = b.y - py;
      if (dx * dx + dy * dy >= R * R) continue;

      // bateu de lado ou por cima/baixo? vale a menor sobreposição
      const cx = t.x + BW / 2,
        cy = t.y + BH / 2;
      const ox = BW / 2 + R - Math.abs(b.x - cx);
      const oy = BH / 2 + R - Math.abs(b.y - cy);
      if (ox < oy) {
        const esq = b.x < cx;
        b.vx = (esq ? -1 : 1) * Math.abs(b.vx);
        b.x = esq ? t.x - R - 0.01 : t.x + BW + R + 0.01;
      } else {
        const cima = b.y < cy;
        b.vy = (cima ? -1 : 1) * Math.abs(b.vy);
        b.y = cima ? t.y - R - 0.01 : t.y + BH + R + 0.01;
      }
      acertar(t);
      break; // um tijolo por passo
    }

    if (b.y - R > H) b.morta = true;
  }

  function moverRaquete(dt) {
    const mov = (teclas.dir ? 1 : 0) - (teclas.esq ? 1 : 0);
    raq.x = limitar(raq.x + mov * VEL_RAQ * dt, 0, W - raq.w);
  }

  function prenderBolas() {
    bolas.forEach((b) => {
      if (!b.preso) return;
      b.x = limitar(raq.x + raq.w / 2 + b.off, R, W - R);
      b.y = RAQ_Y - R;
    });
  }

  function perderVida() {
    vidas--;
    bip(160, 0.25, "sawtooth");
    efeitos = { larga: 0, lento: 0, cola: 0 };
    definirLargura(RAQ_W);
    caem = [];
    atualizarPlacar();
    if (vidas <= 0) return fimDeJogo();
    novaBola();
  }

  function proximaFase() {
    nivel++;
    pts += 100;
    aviso = 1.6;
    criarFase();
    novaBola();
    bip(880, 0.2);
    atualizarPlacar();
  }

  function fimDeJogo() {
    estado = "fim";
    guardarRecorde();
    atualizarPlacar();
    bip(120, 0.4, "sawtooth");
  }

  function atualizar(dt) {
    moverRaquete(dt);

    // temporizadores dos power-ups
    if (efeitos.larga > 0) {
      efeitos.larga -= dt;
      if (efeitos.larga <= 0) {
        efeitos.larga = 0;
        definirLargura(RAQ_W);
      }
    }
    efeitos.lento = Math.max(0, efeitos.lento - dt);
    efeitos.cola = Math.max(0, efeitos.cola - dt);
    aviso = Math.max(0, aviso - dt);

    prenderBolas();

    // bolas: o movimento é dividido em passos de até 4 px para não "atravessar" tijolo
    const d = dt * (efeitos.lento > 0 ? 0.65 : 1);
    for (const b of bolas) {
      if (b.preso) continue;
      const passos = Math.max(1, Math.ceil((Math.hypot(b.vx, b.vy) * d) / 4));
      for (let i = 0; i < passos && !b.morta && !b.preso; i++)
        moverBola(b, d / passos);
    }
    bolas = bolas.filter((b) => !b.morta);

    // power-ups caindo
    caem = caem.filter((p) => {
      p.y += VEL_QUEDA * dt;
      const pego =
        p.y + 6 >= RAQ_Y &&
        p.y - 6 <= RAQ_Y + RAQ_H &&
        p.x + 10 >= raq.x &&
        p.x - 10 <= raq.x + raq.w;
      if (pego) pegar(p.tipo);
      return !pego && p.y < H + 10;
    });

    if (restantes === 0) return proximaFase();
    if (!bolas.length) perderVida();
  }

  // ----- desenho -----
  function texto(msg, y, tam = 16) {
    ctx.fillStyle = cor("--accent");
    ctx.textAlign = "center";
    ctx.font = `${tam}px "Press Start 2P", monospace`;
    ctx.fillText(msg, W / 2, y);
  }

  function desenhar() {
    const C = {
      screen: cor("--screen"),
      ink: cor("--ink"),
      accent: cor("--accent"),
      accent2: cor("--accent2"),
      food: cor("--food"),
      muted: cor("--muted"),
    };
    ctx.fillStyle = C.screen;
    ctx.fillRect(0, 0, W, H);

    // tijolos
    for (const t of tijolos) {
      if (!t.vivo) continue;
      const duro = t.vida > 1;
      ctx.fillStyle = duro ? C.accent : t.linha % 2 ? C.muted : C.accent2;
      ctx.fillRect(t.x + 1, t.y + 1, BW - 2, BH - 2);
      ctx.fillStyle = C.screen;
      ctx.globalAlpha = 0.3;
      ctx.fillRect(t.x + 1, t.y + 1, BW - 2, 2); // brilho no topo
      ctx.globalAlpha = 1;
      if (duro) {
        ctx.strokeStyle = C.screen; // moldura = tijolo de 2 batidas
        ctx.lineWidth = 2;
        ctx.strokeRect(t.x + 4, t.y + 4, BW - 8, BH - 8);
      }
    }

    // raquete (muda de cor com COLA)
    ctx.fillStyle = efeitos.cola > 0 ? C.food : C.accent;
    ctx.fillRect(Math.round(raq.x), RAQ_Y, raq.w, RAQ_H);

    // bolas
    ctx.fillStyle = C.ink;
    bolas.forEach((b) =>
      ctx.fillRect(Math.round(b.x - R), Math.round(b.y - R), R * 2, R * 2)
    );

    // power-ups caindo: cápsula com a letra
    ctx.font = `8px "Press Start 2P", monospace`;
    ctx.textAlign = "center";
    caem.forEach((p) => {
      ctx.fillStyle = p.tipo === "V" ? C.food : C.accent;
      ctx.fillRect(Math.round(p.x - 10), Math.round(p.y - 6), 20, 12);
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(Math.round(p.x - 10), Math.round(p.y - 6), 20, 12);
      ctx.fillStyle = C.screen;
      ctx.fillText(p.tipo, p.x, p.y + 4);
    });

    // efeitos ativos (letra:segundos)
    const ativos = [
      ["L", efeitos.larga],
      ["D", efeitos.lento],
      ["C", efeitos.cola],
    ]
      .filter(([, t]) => t > 0)
      .map(([l, t]) => `${l}:${Math.ceil(t)}`)
      .join("  ");
    if (ativos) {
      ctx.fillStyle = C.muted;
      ctx.textAlign = "left";
      ctx.font = `7px "Press Start 2P", monospace`;
      ctx.fillText(ativos, 4, H - 6);
    }

    if (estado === "jogando") {
      if (aviso > 0) texto(`FASE ${nivel}`, 250, 16);
      if (bolas.some((b) => b.preso)) texto("TOQUE OU ESPAÇO", RAQ_Y - 26, 8);
      return;
    }

    ctx.fillStyle = C.screen;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    if (estado === "pronto") {
      texto("BREAKOUT", 170, 20);
      texto("SETAS OU ARRASTE", 215, 9);
      texto("TOQUE OU ESPAÇO", 240, 9);
    }
    if (estado === "pausado") texto("PAUSA", 195, 20);
    if (estado === "fim") {
      texto("FIM DE JOGO", 160, 16);
      texto(`PTS ${pts}`, 195, 11);
      texto(`RECORDE ${rec}`, 218, 9);
      texto("ESPAÇO = DE NOVO", 250, 9);
    }
  }

  function quadro(t) {
    raf = requestAnimationFrame(quadro);
    const dt = Math.min(0.033, (t - (ultimo ?? t)) / 1000);
    ultimo = t;
    if (estado === "jogando") atualizar(dt);
    else if (estado === "pronto") {
      moverRaquete(dt);
      prenderBolas();
    }
    desenhar(); // desenha todo quadro, então o tema novo aparece sozinho
  }

  function alternarPausa() {
    if (estado === "jogando") estado = "pausado";
    else if (estado === "pausado") estado = "jogando";
  }

  // um único lugar decide o que "apertar o botão" significa
  function acao(viaTecla) {
    if (estado === "pronto") comecar();
    else if (estado === "fim") {
      resetar();
      comecar();
    } else if (estado === "pausado") estado = "jogando";
    else if (bolas.some((b) => b.preso)) soltar();
    else if (viaTecla) alternarPausa();
  }

  // ----- controles -----
  function aoTeclar(e) {
    const d = TECLAS[e.key];
    if (d) {
      e.preventDefault();
      teclas[d] = true;
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!e.repeat) acao(true);
    } else if (e.key === "p" || e.key === "P") {
      if (!e.repeat) alternarPausa();
    }
  }
  function aoSoltar(e) {
    const d = TECLAS[e.key];
    if (d) teclas[d] = false;
  }
  function soltarTudo() {
    teclas.esq = teclas.dir = false;
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

  // botões ◀ ● ▶ (celular): segura para mover, ● lança a bola
  palco.querySelectorAll(".dpad .btn").forEach((b) => {
    const d = b.dataset.d;
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (d === "lancar") acao(false);
      else teclas[d] = true;
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((ev) =>
      b.addEventListener(ev, () => {
        if (d !== "lancar") teclas[d] = false;
      })
    );
  });

  // arrastar o dedo (ou mexer o mouse) sobre o campo move a raquete
  function moverPelaTela(e) {
    const r = cv.getBoundingClientRect();
    const x = (e.clientX - r.left) * (W / r.width);
    raq.x = limitar(x - raq.w / 2, 0, W - raq.w);
  }
  cv.addEventListener("pointerdown", (e) => {
    moverPelaTela(e);
    acao(false);
  });
  cv.addEventListener("pointermove", moverPelaTela);

  resetar();
  raf = requestAnimationFrame(quadro);

  // função de limpeza: chamada ao sair do jogo
  return () => {
    guardarRecorde();
    cancelAnimationFrame(raf);
    document.removeEventListener("keydown", aoTeclar);
    document.removeEventListener("keyup", aoSoltar);
    window.removeEventListener("blur", soltarTudo);
    document.removeEventListener("visibilitychange", aoMudarVisibilidade);
  };
}
