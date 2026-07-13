# A Cripta Perdida

Jogo em JavaScript puro (canvas) para 2 jogadores locais. Atravessem as 10 pragas
do Egito: harpa sagrada, chuva de pragas, fórmula do antídoto, granizo, gafanhotos,
o labirinto nas trevas e o Anjo da Morte.

## Como rodar

Abra o `index.html` num servidor local (ex.: `python3 -m http.server`) ou direto no navegador.

## Controles

| Ação    | Player 1 | Player 2 |
|---------|----------|----------|
| Mover   | WASD     | Setas    |
| Atirar  | F        | L        |
| Notas (fase 1) | 1–7 | Q–U |
| Ingredientes (fase 3) | 1/2/3 | 8/9/0 |
| Mecanismo (fase 5) | ESPAÇO | ESPAÇO |

## Estrutura

- `cripta.js` — estados do jogo, fluxo das fases, HUD e telas
- `Fases.js` — as fases e seus objetivos
- `Util.js` — classes base (Player, Inimigo, Boss...) e helpers
- `Cutscenes.js` — diálogos entre as fases
- `assets/` e `audios/` — arte e sons

## Equipe

Bello · Rafael · Mario · Rech — SESI SENAI Tijucas
