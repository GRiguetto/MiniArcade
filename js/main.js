const JOGOS = [
    {id: "cobrinha",
     nome:"COBRINHA",
     icone:"🐍",
     desc: "Coma, cresça, não bata",
     iniciar: iniciarCobrinha
    }

    // adicionar novos cartuchos de jogos aqui
]

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

// startando o js
montarMenu();
rotear();