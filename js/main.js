// main.js
const JOGOS = [
  {
    id: "cobrinha",
    nome: "COBRINHA",
    icone: sprite("cobra", 6),
    desc: "Coma, cresça, não bata.",
    iniciar: iniciarCobrinha,
  },
  {
    id: "pong",
    nome: "PONG",
    icone: sprite("pong", 6),
    desc: "Rebata.",
    iniciar: iniciarPong,
  },
  {
    id: "breve2",
    nome: "EM BREVE",
    icone: sprite("cadeado", 3),
    desc: "Jogo #3",
    bloqueado: true,
  },
];

const $ = (sel) => document.querySelector(sel);
let limpar = null;

function montarMenu() {
  const grade = $("#grade");
  JOGOS.forEach((j) => {
    const b = document.createElement("button");
    b.className = "cartucho";
    b.disabled = !!j.bloqueado;

    b.innerHTML = `
      <div class="icone">${j.icone}</div>
      <div class="info">
        <span class="nome">${j.nome}</span>
        <span class="desc">${j.desc}</span>
      </div>
    `;

    if (!j.bloqueado)
      b.addEventListener("click", () => {
        location.hash = j.id;
      });
    grade.appendChild(b);
  });
}

function rotear() {
  if (limpar) {
    limpar();
    limpar = null;
  }
  $("#palco").innerHTML = "";
  const jogo = JOGOS.find(
    (j) => j.id === location.hash.slice(1) && !j.bloqueado
  );
  $("#menu").hidden = !!jogo;
  $("#jogo").hidden = !jogo;
  if (jogo) {
    $("#titulo-jogo").textContent = jogo.nome;
    limpar = jogo.iniciar($("#palco"));
  }
}
$("#voltar").addEventListener("click", () => {
  location.hash = "";
});
window.addEventListener("hashchange", rotear);

function temaAtual() {
  return (
    document.documentElement.dataset.theme ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );
}
function atualizarBotaoTema() {
  $("#tema").textContent = temaAtual() === "dark" ? "☀ CLARO" : "☾ ESCURO";
}
$("#tema").addEventListener("click", () => {
  const novo = temaAtual() === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = novo;
  try {
    localStorage.setItem("arcade:tema", novo);
  } catch (e) {}
  atualizarBotaoTema();
  document.dispatchEvent(new Event("tema")); // avisa os jogos para redesenhar com as cores novas
});
atualizarBotaoTema();

montarMenu();
rotear();
