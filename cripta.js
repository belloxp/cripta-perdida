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
    des.drawImage(pegaImg('assets/home.png'), 0, 0, LARG, ALT)

    piscaTimer += 1
    if (Math.floor(piscaTimer / 35) % 2 === 0) {
        let t = new Texto()
        t.des_text('PRESSIONE ENTER', LARG / 2, ALT - 60, '#ffd84d', 'bold 24px monospace', 'center')
    }
}

function desGameOver() {
    des.fillStyle = 'rgba(20, 0, 0, 0.78)'
    des.fillRect(0, 0, LARG, ALT)
    let t = new Texto()
    t.des_text('A CRIPTA OS CONSUMIU...', LARG / 2, ALT / 2 - 30, '#d63a3a', 'bold 42px serif', 'center')
    t.des_text('As pragas avançam sobre o mundo.', LARG / 2, ALT / 2 + 10, '#f3e9d2', '17px monospace', 'center')
    piscaTimer += 1
    if (Math.floor(piscaTimer / 35) % 2 === 0) {
        t.des_text('ENTER para tentar a fase novamente', LARG / 2, ALT / 2 + 70, '#ffd84d', 'bold 18px monospace', 'center')
    }
}

let cenaFinal = {
    t: 0,
    creditos: [
        'A CRIPTA PERDIDA',
        '',
        'As 10 pragas foram seladas.',
        'O mundo segue em paz... por enquanto.',
        '',
        '— HISTÓRIA & GAME DESIGN —',
        'Bello & Equipe',
        '',
        '— PROGRAMAÇÃO —',
        'VAI Tecnologia',
        '',
        '— ARTE & SPRITES —',
        '(em produção)',
        '',
        'Obrigado por jogar!',
        '',
        'FIM'
    ],
    init() {
        this.t = 0
    },
    atual() {
        this.t += 1
    },
    des() {
        let grad = des.createLinearGradient(0, 0, 0, ALT)
        grad.addColorStop(0, '#2a1a4a')
        grad.addColorStop(0.45, '#c4502a')
        grad.addColorStop(0.7, '#ffb347')
        grad.addColorStop(1, '#d49a4a')
        des.fillStyle = grad
        des.fillRect(0, 0, LARG, ALT)

        des.fillStyle = '#ffdf8a'
        des.beginPath()
        des.arc(LARG / 2, ALT * 0.62, 70, 0, Math.PI * 2)
        des.fill()

        des.fillStyle = '#7a4a22'
        des.beginPath()
        des.moveTo(140, ALT * 0.72); des.lineTo(330, ALT * 0.40); des.lineTo(520, ALT * 0.72)
        des.closePath(); des.fill()
        des.fillStyle = '#653a18'
        des.beginPath()
        des.moveTo(480, ALT * 0.72); des.lineTo(640, ALT * 0.48); des.lineTo(800, ALT * 0.72)
        des.closePath(); des.fill()

        des.fillStyle = '#caa05a'
        des.fillRect(0, ALT * 0.72, LARG, ALT * 0.28)
        des.fillStyle = '#b8904e'
        des.beginPath()
        des.ellipse(LARG * 0.3, ALT * 0.85, 260, 30, 0, 0, Math.PI * 2)
        des.fill()

        let camX = Math.min(LARG - 220, -80 + this.t * 0.55)
        let camY = ALT * 0.74
        des.fillStyle = '#2a1a0c'
        des.fillRect(camX, camY, 90, 34)
        des.beginPath()
        des.arc(camX + 28, camY, 16, Math.PI, 0)
        des.arc(camX + 62, camY, 16, Math.PI, 0)
        des.fill()
        des.fillRect(camX + 82, camY - 18, 10, 26)
        des.fillRect(camX + 80, camY - 28, 18, 12)
        let passo = Math.sin(this.t / 8) * 4
        des.fillRect(camX + 10, camY + 32, 7, 26 + passo)
        des.fillRect(camX + 34, camY + 32, 7, 26 - passo)
        des.fillRect(camX + 56, camY + 32, 7, 26 + passo)
        des.fillRect(camX + 78, camY + 32, 7, 26 - passo)
        des.fillStyle = '#3aa0ff'
        des.fillRect(camX + 18, camY - 22, 14, 20)
        des.fillStyle = '#37d67a'
        des.fillRect(camX + 50, camY - 22, 14, 20)

        let baseY = ALT + 80 - this.t * 0.55
        des.textAlign = 'center'
        this.creditos.forEach((linha, i) => {
            let y = baseY + i * 36
            if (y > -20 && y < ALT + 30) {
                des.fillStyle = i === 0 ? '#ffd84d' : '#fff6e0'
                des.font = i === 0 ? 'bold 34px serif' : (linha.indexOf('—') === 0 ? 'bold 16px monospace' : '17px monospace')
                des.fillText(linha, LARG / 2, y)
            }
        })
        des.textAlign = 'left'

        if (this.t > 300) {
            piscaTimer += 1
            if (Math.floor(piscaTimer / 35) % 2 === 0) {
                des.fillStyle = '#fff6e0'
                des.font = '14px monospace'
                des.textAlign = 'center'
                des.fillText('ENTER para voltar ao início', LARG / 2, ALT - 20)
                des.textAlign = 'left'
            }
        }
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


// ============================================================
//  LOOP PRINCIPAL
// ============================================================
// tela de carregamento com a dica do GoldenCarlos (depois da fase da harpa)
let telaDica = {
    prog: 0,
    des() {
        des.fillStyle = '#0b0805'
        des.fillRect(0, 0, LARG, ALT)
        let t = new Texto()
        t.des_text('DICAS', LARG / 2, 62, '#ffd84d', 'bold 40px serif', 'center')

        // ícone do GoldenCarlos com brilho dourado, flutuando
        let flut = Math.sin(this.prog / 10) * 5
        des.save()
        des.shadowColor = '#ffd84d'
        des.shadowBlur = 26
        let ic = pegaImg('assets/coletavel.png')
        if (ic.complete && ic.naturalWidth > 0) des.drawImage(ic, LARG / 2 - 42, 82 + flut, 84, 84)
        des.restore()

        // dica principal do GoldenCarlos
        let msg = 'GOLDENCARLOS: junte 5 espalhados pelas fases e ganhe +5 de vida máxima pro DESAFIO FINAL!'
        let linhas = quebraTexto(msg, LARG - 180, 'bold 18px monospace')
        des.fillStyle = '#ffe9b0'
        des.font = 'bold 18px monospace'
        des.textAlign = 'center'
        linhas.forEach((l, i) => des.fillText(l, LARG / 2, 198 + i * 26))
        des.textAlign = 'left'

        // outras dicas
        let dicas = [
            'VIDA e FORÇA caem dos inimigos — curam e reforçam o tiro.',
            'Na fórmula, sigam a ordem certa — errar tira vida dos dois.',
            'Joguem em 2!  P1 = W A S D + F   •   P2 = setas + L.',
            'No desafio final (boss) não cai coletável.'
        ]
        des.font = '16px monospace'
        let y0 = 288
        dicas.forEach((d, i) => {
            des.fillStyle = '#ffd84d'
            des.fillText('•', 130, y0 + i * 34)
            des.fillStyle = '#f3e9d2'
            des.fillText(d, 156, y0 + i * 34)
        })

        // barra de progresso
        let bw = 440, bx = LARG / 2 - bw / 2, by = ALT - 88
        des.fillStyle = '#2a2118'
        des.fillRect(bx, by, bw, 24)
        des.fillStyle = '#ffd84d'
        des.fillRect(bx + 2, by + 2, (bw - 4) * (this.prog / 100), 20)
        des.strokeStyle = '#5a4322'
        des.lineWidth = 2
        des.strokeRect(bx, by, bw, 24)
        t.des_text('Carregando... ' + Math.floor(this.prog) + '%', LARG / 2, by - 12, '#c4943a', '14px monospace', 'center')
        if (this.prog >= 100) {
            t.des_text('PRESSIONE ENTER PARA COMEÇAR', LARG / 2, by + 48, '#ffd84d', 'bold 20px monospace', 'center')
        }
    }
}
