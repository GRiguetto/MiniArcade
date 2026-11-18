function iniciarCobrinha(palco) {
  const N = 20,
    CEL = 16; // grade 20x20, cada célula com 16px
  const DIRS = { cima: [0, -1], baixo: [0, 1], esq: [-1, 0], dir: [1, 0] };
  const TECLAS = {
    ArrowUp: "cima",
    w: "cima",
    W: "cima",
    ArrowDown: "baixo",
    s: "baixo",
    S: "baixo",
    ArrowLeft: "esq",
    a: "esq",
    A: "esq",
    ArrowRight: "dir",
    d: "dir",
    D: "dir",
  };

  palco.innerHTML = `
    <div class="placar"><span>PONTOS <b id="pts">0</b></span><span>RECORDE <b id="rec">0</b></span></div>
    <div class="moldura"><canvas id="tela" width="${N * CEL}" height="${
    N * CEL
  }"></canvas></div>
    <div class="dpad">
      <button class="btn" data-d="cima" aria-label="Cima">▲</button>
      <button class="btn" data-d="esq" aria-label="Esquerda">◀</button>
      <button class="btn" data-d="baixo" aria-label="Baixo">▼</button>
      <button class="btn" data-d="dir" aria-label="Direita">▶</button>
    </div>
    <p class="dica">SETAS OU WASD · ESPAÇO = PAUSA</p>`;

  const cv = $("#tela"),
    ctx = cv.getContext("2d");
  const cor = (v) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim();

  let recorde = 0;
  try {
    recorde = +localStorage.getItem("arcade:cobrinha") || 0;
  } catch (e) {}
  $("#rec").textContent = recorde;

  let cobra, dir, fila, comida, pontos, estado, timer;
  // estado: "pronto" | "jogando" | "pausado" | "fim"

  function resetar() {
    cobra = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    dir = "dir";
    fila = [];
    pontos = 0;
    estado = "pronto";
    $("#pts").textContent = 0;
    sortearComida();
    desenhar();
  }

  function sortearComida() {
    do {
      comida = {
        x: Math.floor(Math.random() * N),
        y: Math.floor(Math.random() * N),
      };
    } while (cobra.some((p) => p.x === comida.x && p.y === comida.y));
  }

  function mudarDir(nova) {
    // compara com a última direção da fila para não permitir marcha à ré
    const ultima = fila.length ? fila[fila.length - 1] : dir;
    const [ax, ay] = DIRS[ultima],
      [bx, by] = DIRS[nova];
    if (ax + bx === 0 && ay + by === 0) return;
    if (fila.length < 2) fila.push(nova);
    if (estado === "pronto") comecar();
  }

  function comecar() {
    estado = "jogando";
    bip(440);
    agendar();
  }

  function agendar() {
    clearTimeout(timer);
    const vel = Math.max(55, 140 - pontos * 4); // acelera a cada ponto
    timer = setTimeout(passo, vel);
  }

  function passo() {
    if (estado !== "jogando") return;
    if (fila.length) dir = fila.shift();
    const [dx, dy] = DIRS[dir];
    const cab = { x: cobra[0].x + dx, y: cobra[0].y + dy };

    const bateuParede = cab.x < 0 || cab.y < 0 || cab.x >= N || cab.y >= N;
    const bateuCorpo = cobra.some((p) => p.x === cab.x && p.y === cab.y);
    if (bateuParede || bateuCorpo) return fimDeJogo();

    cobra.unshift(cab);
    if (cab.x === comida.x && cab.y === comida.y) {
      pontos++;
      $("#pts").textContent = pontos;
      bip(880);
      sortearComida();
    } else {
      cobra.pop(); // não comeu: remove a cauda, a cobra “anda”
    }
    desenhar();
    agendar();
  }

  function fimDeJogo() {
    estado = "fim";
    bip(120, 0.4, "sawtooth");
    if (pontos > recorde) {
      recorde = pontos;
      $("#rec").textContent = recorde;
      try {
        localStorage.setItem("arcade:cobrinha", recorde);
      } catch (e) {}
    }
    desenhar();
  }

  function texto(msg, y, tam = 16) {
    ctx.fillStyle = cor("--accent");
    ctx.textAlign = "center";
    ctx.font = `${tam}px "Press Start 2P", monospace`;
    ctx.fillText(msg, cv.width / 2, y);
  }

  function desenhar() {
    ctx.fillStyle = cor("--screen");
    ctx.fillRect(0, 0, cv.width, cv.height);
    // grade sutil
    ctx.fillStyle = cor("--muted");
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++)
        if ((i + j) % 2) ctx.fillRect(i * CEL, j * CEL, CEL, CEL);
    ctx.globalAlpha = 1;
    // comida
    ctx.fillStyle = cor("--food");
    ctx.fillRect(comida.x * CEL + 3, comida.y * CEL + 3, CEL - 6, CEL - 6);
    // cobra
    ctx.fillStyle = cor("--snake");
    cobra.forEach((p, i) => {
      ctx.globalAlpha = i === 0 ? 1 : 0.85;
      ctx.fillRect(p.x * CEL + 1, p.y * CEL + 1, CEL - 2, CEL - 2);
    });
    ctx.globalAlpha = 1;

    if (estado !== "jogando") {
      ctx.fillStyle = cor("--screen");
      ctx.globalAlpha = 0.7;
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.globalAlpha = 1;
    }
    if (estado === "pronto") {
      texto("COBRINHA", 140, 20);
      texto("TOQUE OU USE AS SETAS", 180, 9);
    }
    if (estado === "pausado") texto("PAUSA", 165, 20);
    if (estado === "fim") {
      texto("GAME OVER", 140, 20);
      texto(`PONTOS: ${pontos}`, 175, 11);
      texto("ESPAÇO = DE NOVO", 205, 9);
    }
  }

  function alternarPausa() {
    if (estado === "jogando") {
      estado = "pausado";
      desenhar();
    } else if (estado === "pausado") {
      estado = "jogando";
      agendar();
    }
  }

  // ----- controles -----
  function aoTeclar(e) {
    if (TECLAS[e.key]) {
      e.preventDefault();
      mudarDir(TECLAS[e.key]);
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (estado === "fim") {
        resetar();
        comecar();
      } else if (estado === "pronto") comecar();
      else alternarPausa();
    }
  }
  document.addEventListener("keydown", aoTeclar);
  document.addEventListener("tema", desenhar);

  palco.querySelectorAll(".dpad .btn").forEach((b) =>
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      mudarDir(b.dataset.d);
    })
  );

  // gesto de deslizar no canvas (celular)
  let ini = null;
  cv.addEventListener("pointerdown", (e) => {
    ini = { x: e.clientX, y: e.clientY };
    if (estado === "fim") {
      resetar();
      comecar();
    } else if (estado === "pronto") comecar();
  });
  cv.addEventListener("pointerup", (e) => {
    if (!ini) return;
    const dx = e.clientX - ini.x,
      dy = e.clientY - ini.y;
    ini = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    mudarDir(
      Math.abs(dx) > Math.abs(dy)
        ? dx > 0
          ? "dir"
          : "esq"
        : dy > 0
        ? "baixo"
        : "cima"
    );
  });

  resetar();
  // se a fonte demorar a carregar, redesenha quando chegar
  if (document.fonts) document.fonts.ready.then(desenhar);

  // função de limpeza: chamada ao sair do jogo
  return () => {
    clearTimeout(timer);
    document.removeEventListener("keydown", aoTeclar);
    document.removeEventListener("tema", desenhar);
  };
}
