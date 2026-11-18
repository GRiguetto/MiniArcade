/* ===== SPRITES PIXEL ART =====
   Cada sprite é uma lista de linhas: cada caractere é um pixel.
   "." = vazio · "#" = cor principal · "x" = cor de destaque (língua da cobra)
   Para criar um sprite novo, é só desenhar com caracteres aqui. */
const SPRITES = {
  cobra: [
    "................",
    "...##########.#.",
    "...############x",
    "...###########..",
    "...###..........",
    "...###..........",
    "...##########...",
    "...##########...",
    "...##########...",
    "..........###...",
    "..........###...",
    "...##########...",
    "....#########...",
    "......#######...",
    "................",
    "................",
  ],
  sol: [
    ".....##.....",
    ".#...##...#.",
    "..#......#..",
    "...######...",
    "..########..",
    "#.########.#",
    "#.########.#",
    "..########..",
    "...######...",
    "..#......#..",
    ".#...##...#.",
    ".....##.....",
  ],
  lua: [
    "....####....",
    "..####......",
    ".####....#..",
    "####....###.",
    "####.....#..",
    "####........",
    "####........",
    "####........",
    "####........",
    ".####.......",
    "..####......",
    "....####....",
  ],
  cadeado: [
    "............",
    "....####....",
    "...#....#...",
    "...#....#...",
    "...#....#...",
    "..########..",
    "..########..",
    "..###..###..",
    "..###..###..",
    "..########..",
    "..########..",
    "............",
  ],
};

// Cores de cada caractere (usam as variáveis do tema, então mudam sozinhas)
const PALETA = { "#": "var(--accent)", "x": "var(--food)" };

/* sprite("cobra", 4) devolve um <svg> pronto: cada pixel vira um <rect> 1x1.
   px = tamanho de cada pixel na tela · cor = troca a cor do "#" (opcional) */
function sprite(nome, px = 4, cor) {
  const m = SPRITES[nome];
  let rects = "";
  m.forEach((linha, y) => {
    [...linha].forEach((c, x) => {
      if (c === ".") return;
      const fill = c === "#" && cor ? cor : PALETA[c];
      rects += `<rect x="${x}" y="${y}" width="1" height="1" style="fill:${fill}"/>`;
    });
  });
  return `<svg class="sprite" viewBox="0 0 ${m[0].length} ${m.length}" width="${m[0].length * px}" height="${m.length * px}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}
