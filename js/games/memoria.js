
// Cada par: id (vira o nome do sprite "carta" + id) e nome (para leitores de tela)
const PARES_MEMORIA = [
  { id: "K", nome: "Rei" },
  { id: "Q", nome: "Dama" },
  { id: "J", nome: "Valete" },
  { id: "Coringa", nome: "Coringa" },
  { id: "A", nome: "Ás" },
  { id: "2", nome: "Dois" },
  { id: "3", nome: "Três" },
];

// Fisher-Yates: embaralha a lista de verdade (sort(() => Math.random() - 0.5) é viciado)
function embaralhar(lista) {
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j], lista[i]];
  }
  return lista;
}

function iniciarMemoria(palco) {
  const TOTAL = PARES_MEMORIA.length;
  let baralho, abertas, travado, jogadas, pares, timer;
  // travado = true enquanto duas cartas erradas estão visíveis (ignora cliques)

  let recorde = 0; // menor número de jogadas já feito
  try {
    recorde = +localStorage.getItem("arcade:memoria") || 0;
  } catch (e) {}

  palco.innerHTML = `
    <div class="placar">
      <span>JOGADAS <b id="m-j">0</b></span>
      <span>PARES <b id="m-p">0</b></span>
      <span>RECORDE <b id="m-r">-</b></span>
    </div>
    <div class="mesa" id="mesa"></div>
    <p class="dica" id="m-msg"></p>
    <div class="opcoes"><button class="btn" id="novo">NOVA PARTIDA</button></div>
    <p class="dica">CLIQUE OU TOQUE NAS CARTAS · R = REINICIAR</p>`;

  const mesa = $("#mesa");

  function novaPartida() {
    clearTimeout(timer);
    // cada par entra duas vezes na lista; as duas cópias são o MESMO objeto,
    // então comparar com === basta para saber se formam um par
    baralho = embaralhar(PARES_MEMORIA.flatMap((p) => [p, p]));
    abertas = [];
    travado = false;
    jogadas = 0;
    pares = 0;
    mesa.innerHTML = baralho
      .map(
        (p, i) => `
      <button class="carta" data-i="${i}" aria-label="Carta ${
          i + 1
        }, virada para baixo">
        <span class="miolo">
          <span class="verso"></span>
          <span class="frente">${sprite("carta" + p.id, 4)}</span>
        </span>
      </button>`
      )
      .join("");
    atualizar("ENCONTRE OS PARES");
  }

  function atualizar(msg) {
    $("#m-j").textContent = jogadas;
    $("#m-p").textContent = `${pares}/${TOTAL}`;
    $("#m-r").textContent = recorde || "-";
    if (msg !== undefined) $("#m-msg").textContent = msg;
  }

  function virar(carta, para_cima) {
    carta.classList.toggle("virada", para_cima);
    const i = carta.dataset.i;
    carta.setAttribute(
      "aria-label",
      para_cima ? baralho[i].nome : `Carta ${+i + 1}, virada para baixo`
    );
  }

  function venceu() {
    let msg = `VOCÊ VENCEU EM ${jogadas} JOGADAS!`;
    if (!recorde || jogadas < recorde) {
      recorde = jogadas;
      msg += " NOVO RECORDE!";
      try {
        localStorage.setItem("arcade:memoria", recorde);
      } catch (e) {}
    }
    atualizar(msg);
    bip(880, 0.15);
    setTimeout(() => bip(1100, 0.3), 160);
  }

  // um único listener na mesa descobre qual carta foi clicada (delegação de eventos)
  mesa.addEventListener("click", (e) => {
    const carta = e.target.closest(".carta");
    if (!carta || travado || carta.classList.contains("virada")) return;

    virar(carta, true);
    bip(520, 0.04);
    abertas.push(carta);
    if (abertas.length < 2) return;

    // duas cartas abertas: conta uma jogada e compara
    jogadas++;
    const [a, b] = abertas;
    if (baralho[a.dataset.i] === baralho[b.dataset.i]) {
      a.classList.add("par");
      b.classList.add("par");
      abertas = [];
      pares++;
      bip(880, 0.12);
      atualizar(pares === TOTAL ? undefined : "PAR!");
      if (pares === TOTAL) venceu();
    } else {
      travado = true;
      bip(200, 0.15, "sawtooth");
      atualizar("NÃO FOI DESSA VEZ");
      timer = setTimeout(() => {
        virar(a, false);
        virar(b, false);
        abertas = [];
        travado = false;
      }, 800);
    }
  });

  $("#novo").addEventListener("click", novaPartida);
  function aoTeclar(e) {
    if (e.key === "r" || e.key === "R") novaPartida();
  }
  document.addEventListener("keydown", aoTeclar);

  novaPartida();
  
  return () => {
    clearTimeout(timer);
    document.removeEventListener("keydown", aoTeclar);
  };
}
