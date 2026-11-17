const JOGOS = [
    {id: "cobrinha",
     nome:"COBRINHA",
     icone:"🐍",
     desc: "Coma, cresça, não bata",
     iniciar: iniciarCobrinha
    }

    // adicionar novos cartuchos de jogos aqui
]

const $ = (sel) => document.querySelector(sel);
let limpar = null; 

function montarMenu(){
    const grade = $("#grade");
    JOGOS.forEach((j) => {
        const b = document.createElement("button");
        b.className = "cartucho";
        b.disabled = !!j.bloqueado;
        b.innerHTML = 
            `<span class = "icone">${j.icone}</span>
             <span class = "nome">${j.nome}</span>
             <span class = "desc">${j.desc}</span>`;
        if (!j.bloqueado) b.addEventListener("click", () => { location.hash = j.id;});
        grade.appendChild(b);
    });
}

function rotear(){
    if(limpar) {limpar(); limpar=null; }
    $("#palco").innerHTML = "";
    const jogo = JOGOS.find((j) => j.id === location.hash.slice(1) && !j.bloqueado);
    $("#menu").hidden = !!jogo;
    $("#jogo").hidden = !jogo;
    
    if (jogo) {
        $("#titulo-jogo").textContent = jogo.nome;
        limpar = jogo.iniciar($("#palco"));
    }
}

$("#voltar").addEventListener("click", () => {location.hash = "";});
window.addEventListener("hashchange", rotear);

// alternar tema 
function temaAtual() {
    
    return document.documentElement.dataset.theme ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
    
    function atualizarBotaoTema() {
      $("#tema").textContent = temaAtual() === "dark" ? "☀ CLARO" : "☾ ESCURO";
    }
    
    $("#tema").addEventListener("click", () => {
      const novo = temaAtual() === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = novo;
      try { localStorage.setItem("arcade:tema", novo); } catch (e) {}
      atualizarBotaoTema();
      document.dispatchEvent(new Event("tema")); // avisa os jogos para redesenhar com as cores novas
    });
    
    atualizarBotaoTema();

// startando o js
montarMenu();
rotear();