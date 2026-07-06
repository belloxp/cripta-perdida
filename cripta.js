// ============================================================
//  A CRIPTA PERDIDA — cripta.js (principal)
//  Máquina de estados: HOME → cut-scene → fase → ... → FINAL
// ============================================================

des = document.getElementById('des').getContext('2d')
const LARG = 900
const ALT = 600
const TOPO = 60

let p1 = new Player(280, 470, 46, 64, 'assets/player1', 'assets/selecaoPlayer1.png',
    { esq: 'a', dir: 'd', cima: 'w', baixo: 's', tiro: 'f' })
let p2 = new Player(580, 470, 46, 64, 'assets/player2', 'assets/selecaoPlayer2.png',
    { esq: 'ArrowLeft', dir: 'ArrowRight', cima: 'ArrowUp', baixo: 'ArrowDown', tiro: 'l' })

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

function aoApertar(k) {
    if (estado === 'HOME' && k === 'Enter') {
        // TODO: iniciar o fluxo do jogo (cut-scene de intro)
    }
}

let estado = 'HOME' // HOME | CUTSCENE | FASE | GAMEOVER | FINAL
let piscaTimer = 0
let faseAtualObj = null

let txtHud = new Texto()
let barraHud = new BarraProgresso()

function desHUD() {
    des.fillStyle = 'rgba(10, 7, 4, 0.88)'
    des.fillRect(0, 0, LARG, TOPO)
    des.strokeStyle = '#5a4322'
    des.lineWidth = 2
    des.strokeRect(0, 0, LARG, TOPO)

    desPainelPlayer(p1, 8, NOMES.p1, '#3aa0ff', false)
    desPainelPlayer(p2, LARG - 258, NOMES.p2, '#37d67a', true)

    if (faseAtualObj) {
        txtHud.des_text(faseAtualObj.nome, LARG / 2, 26, '#ffd84d', 'bold 15px monospace', 'center')
        txtHud.des_text('Pontos: ' + (p1.pts + p2.pts), LARG / 2, 46, '#c4943a', '13px monospace', 'center')
    }
}

function desPainelPlayer(pl, x, nome, cor, invertido) {
    let rostoX = invertido ? x + 208 : x
    let infoX = invertido ? x : x + 56

    des.drawImage(pegaImg(pl.rosto), rostoX, 8, 44, 44)
    des.strokeStyle = cor
    des.strokeRect(rostoX, 8, 44, 44)

    txtHud.des_text(nome + (pl.vivo ? '' : ' ☠'), infoX, 20, cor, 'bold 13px monospace')
    barraHud.des(infoX, 26, 148, 14, pl.vida / pl.maxVida, '#2a1414', pl.vida > 3 ? '#d63a3a' : '#ff7a3a', null)
    txtHud.des_text('♥ ' + pl.vida + '/' + pl.maxVida + '   ⚔ x' + pl.forca, infoX, 54, '#f3e9d2', '12px monospace')
}

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
