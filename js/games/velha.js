/* ===== JOGO DA VELHA com IA MINIMAX =====
   Você é o X, a IA é o O. O tabuleiro é uma lista de 9 posições:
        0 | 1 | 2
        3 | 4 | 5      cada posição é null (vazia), "X" ou "O"
        6 | 7 | 8                                                   */

const LINHAS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// Devolve { quem: "X" | "O" | "empate", linha: [...] } se acabou, ou null se segue o jogo
function vencedor(t) {
  for (const [a, b, c] of LINHAS) {
    if (t[a] && t[a] === t[b] && t[a] === t[c])
      return { quem: t[a], linha: [a, b, c] };
  }
  return t.includes(null) ? null : { quem: "empate", linha: [] };
}

/* ----- MINIMAX com poda alfa-beta -----
           A IA (O) quer MAXIMIZAR a nota; você (X) quer MINIMIZAR.
           Nota:  +10 - prof  → IA ganha (quanto mais rápido, melhor)
                  prof - 10   → você ganha (quanto mais tarde, melhor para a IA)
                  0           → empate
           A função se chama recursivamente testando TODAS as jogadas até o fim do jogo.
           A poda alfa-beta ignora ramos que não podem mudar o resultado (mais rápido). */
let nosAnalisados = 0; // só para mostrar na tela quanto a IA “pensou”

function minimax(t, vez, prof, alfa, beta) {
  nosAnalisados++;
  const r = vencedor(t);
  if (r) return r.quem === "O" ? 10 - prof : r.quem === "X" ? prof - 10 : 0;

  if (vez === "O") {
    // vez da IA: procura a MAIOR nota
    let melhor = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (t[i]) continue;
      t[i] = "O"; // testa a jogada...
      melhor = Math.max(melhor, minimax(t, "X", prof + 1, alfa, beta));
      t[i] = null; // ...e desfaz
      alfa = Math.max(alfa, melhor);
      if (beta <= alfa) break; // poda
    }
    return melhor;
  } else {
    // sua vez: assume que você joga bem (MENOR nota)
    let melhor = Infinity;
    for (let i = 0; i < 9; i++) {
      if (t[i]) continue;
      t[i] = "X";
      melhor = Math.min(melhor, minimax(t, "O", prof + 1, alfa, beta));
      t[i] = null;
      beta = Math.min(beta, melhor);
      if (beta <= alfa) break;
    }
    return melhor;
  }
}

// Testa cada casa vazia com minimax e escolhe a de maior nota (sorteia se houver empate de notas)
function melhorJogada(t) {
  nosAnalisados = 0;
  let melhor = -Infinity,
    opcoes = [];
  for (let i = 0; i < 9; i++) {
    if (t[i]) continue;
    t[i] = "O";
    const nota = minimax(t, "X", 1, -Infinity, Infinity);
    t[i] = null;
    if (nota > melhor) {
      melhor = nota;
      opcoes = [i];
    } else if (nota === melhor) opcoes.push(i);
  }
  return opcoes[Math.floor(Math.random() * opcoes.length)];
}

function jogadaAleatoria(t) {
  const livres = t.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  return livres[Math.floor(Math.random() * livres.length)];
}

/* ----- O JOGO NA TELA ----- */
function iniciarVelha(palco) {
  const NIVEIS = { facil: "FÁCIL", medio: "MÉDIO", impossivel: "IMPOSSÍVEL" };
  let nivel = "medio",
    tab,
    acabou,
    vezHumano,
    humanoComeca = true,
    timer;
  const placar = { v: 0, e: 0, i: 0 };

  palco.innerHTML = `
            <div class="placar"><span>VOCÊ <b id="p-v">0</b></span><span>EMPATES <b id="p-e">0</b></span><span>IA <b id="p-i">0</b></span></div>
            <div class="opcoes" id="niveis">${Object.entries(NIVEIS)
              .map(
                ([k, n]) => `<button class="btn" data-n="${k}">${n}</button>`
              )
              .join("")}</div>
            <div class="moldura"><div class="velha" id="tab">${'<button class="cel"></button>'.repeat(
              9
            )}</div></div>
            <p class="dica" id="msg"></p>
            <p class="dica" id="info"></p>
            <div class="opcoes" style="margin-top:16px">
              <button class="btn" id="novo">NOVA PARTIDA</button>
              <button class="btn" id="quem"></button>
            </div>`;

  const celulas = [...palco.querySelectorAll(".cel")];

  function novaPartida() {
    clearTimeout(timer);
    tab = Array(9).fill(null);
    acabou = false;
    vezHumano = humanoComeca;
    $("#info").textContent = "";
    $("#quem").textContent = "COMEÇA: " + (humanoComeca ? "VOCÊ" : "IA");
    palco
      .querySelectorAll("#niveis .btn")
      .forEach((b) => b.classList.toggle("ativo", b.dataset.n === nivel));
    desenhar();
    if (!vezHumano) agendarIA();
  }

  function desenhar(linhaVit = []) {
    celulas.forEach((c, i) => {
      c.innerHTML = tab[i]
        ? sprite(
            tab[i] === "X" ? "marcaX" : "marcaO",
            6,
            tab[i] === "X" ? "var(--accent)" : "var(--accent2)"
          )
        : "";
      c.disabled = !!tab[i] || acabou || !vezHumano;
      c.classList.toggle("vit", linhaVit.includes(i));
    });
    if (!acabou)
      $("#msg").textContent = vezHumano ? "SUA VEZ" : "IA PENSANDO...";
  }

  function jogar(i, marca) {
    tab[i] = marca;
    const r = vencedor(tab);
    if (r) return terminar(r);
    vezHumano = marca === "O";
    desenhar();
    if (!vezHumano) agendarIA();
  }

  function agendarIA() {
    timer = setTimeout(jogadaIA, 450);
  } // pausinha pra parecer que pensa

  function jogadaIA() {
    // fácil = sempre aleatória · médio = 50% aleatória · impossível = sempre minimax
    const erra =
      nivel === "facil" || (nivel === "medio" && Math.random() < 0.5);
    nosAnalisados = 0;
    const i = erra ? jogadaAleatoria(tab) : melhorJogada(tab);
    $("#info").textContent = erra
      ? ""
      : `MINIMAX ANALISOU ${nosAnalisados} POSIÇÕES`;
    bip(330);
    jogar(i, "O");
  }

  function terminar(r) {
    acabou = true;
    if (r.quem === "X") {
      placar.v++;
      $("#msg").textContent = "VOCÊ VENCEU!";
      bip(880, 0.3);
    } else if (r.quem === "O") {
      placar.i++;
      $("#msg").textContent = "A IA VENCEU!";
      bip(120, 0.4, "sawtooth");
    } else {
      placar.e++;
      $("#msg").textContent = "EMPATE!";
      bip(220, 0.2);
    }
    $("#p-v").textContent = placar.v;
    $("#p-e").textContent = placar.e;
    $("#p-i").textContent = placar.i;
    humanoComeca = !humanoComeca; // alterna quem começa a próxima
    desenhar(r.linha);
  }

  // cliques (um único listener no tabuleiro, descobre qual casa foi clicada)
  $("#tab").addEventListener("click", (e) => {
    const c = e.target.closest(".cel");
    if (!c || c.disabled) return;
    bip(440);
    jogar(celulas.indexOf(c), "X");
  });
  $("#novo").addEventListener("click", novaPartida);
  $("#quem").addEventListener("click", () => {
    humanoComeca = !humanoComeca;
    novaPartida();
  });
  $("#niveis").addEventListener("click", (e) => {
    if (e.target.dataset.n) {
      nivel = e.target.dataset.n;
      novaPartida();
    }
  });

  novaPartida();
  return () => clearTimeout(timer);
}
