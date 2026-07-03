// ============================================================
//  A CRIPTA PERDIDA — cripta.js (principal)
//  Máquina de estados: HOME → cut-scene → fase → ... → FINAL
// ============================================================

des = document.getElementById('des').getContext('2d')
const LARG = 900
const ALT = 600

// ---------- entrada ----------
// Os dois jogadores gravam suas teclas no mesmo mapa `teclas`.
// P1: A/D/W/S move + F atira  |  P2: setas + L atira
const teclas = {}
document.addEventListener('keydown', (ev) => {
    let k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key
    teclas[k] = true
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(ev.key)) ev.preventDefault()
    if (!ev.repeat) aoApertar(k)
})
document.addEventListener('keyup', (ev) => {
    let k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key
    teclas[k] = false
})

// roteamento de teclas apertadas (não contínuas)
// stub — o fluxo de cut-scenes/fases entra nas próximas sprints
function aoApertar(k) {
    if (estado === 'HOME' && k === 'Enter') {
        // TODO: iniciar o fluxo do jogo (cut-scene de intro)
    }
}

// ============================================================
//  ESTADO + LOOP PRINCIPAL
// ============================================================
let estado = 'HOME' // HOME | CUTSCENE | FASE | GAMEOVER | FINAL
let piscaTimer = 0

// tela inicial (placeholder — arte definitiva entra depois)
function desHome() {
    des.fillStyle = '#0b0805'
    des.fillRect(0, 0, LARG, ALT)

    let t = new Texto()
    t.des_text('A CRIPTA PERDIDA', LARG / 2, ALT / 2 - 20, '#c4943a', 'bold 40px serif', 'center')

    piscaTimer += 1
    if (Math.floor(piscaTimer / 35) % 2 === 0) {
        t.des_text('PRESSIONE ENTER', LARG / 2, ALT - 60, '#ffd84d', 'bold 24px monospace', 'center')
    }
}

function main() {
    des.clearRect(0, 0, LARG, ALT)

    if (estado === 'HOME') {
        desHome()
    }

    requestAnimationFrame(main)
}

main()
