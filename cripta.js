// ============================================================
//  A CRIPTA PERDIDA — cripta.js (principal)
//  Máquina de estados: HOME → cut-scene → fase → ... → FINAL
// ============================================================

const LARG = 900
const ALT = 600
const TOPO = 60 // altura do HUD

// renderiza numa resolução interna maior pra não borrar quando o CSS estica pro fullscreen.
// as coordenadas do jogo continuam 0..LARG / 0..ALT — a escala é aplicada uma vez aqui.
const ESCALA = (window.devicePixelRatio && window.devicePixelRatio >= 2) ? 3 : 2
let _cv = document.getElementById('des')
_cv.width = LARG * ESCALA
_cv.height = ALT * ESCALA
des = _cv.getContext('2d')
des.scale(ESCALA, ESCALA)

// ---------- jogadores ----------
// P1: A/D/W/S move + F atira  |  P2: setas + L atira
let p1 = new Player(280, 470, 46, 64, 'assets/player1', 'assets/selecaoPlayer1.png',
    { esq: 'a', dir: 'd', cima: 'w', baixo: 's', tiro: 'f' }, '#3aa0ff')
let p2 = new Player(580, 470, 46, 64, 'assets/player2', 'assets/selecaoPlayer2.png',
    { esq: 'ArrowLeft', dir: 'ArrowRight', cima: 'ArrowUp', baixo: 'ArrowDown', tiro: 'l' }, '#37d67a')
let players = [p1, p2]

// ---------- entrada ----------
const teclas = {}
document.addEventListener('keydown', (ev) => {
    let k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key
    teclas[k] = true
    iniciaMusica() // navegador só deixa tocar áudio após uma interação
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(ev.key)) ev.preventDefault()
    if (!ev.repeat) aoApertar(k)
})
document.addEventListener('keyup', (ev) => {
    let k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key
    teclas[k] = false
})
// posição do mouse em coordenadas do jogo (0..LARG / 0..ALT) — usada no hover dos botões
let mouseX = -1
let mouseY = -1
_cv.addEventListener('mousemove', (ev) => {
    let r = _cv.getBoundingClientRect()
    mouseX = (ev.clientX - r.left) / r.width * LARG
    mouseY = (ev.clientY - r.top) / r.height * ALT
    let emCima = estado === 'HOME' &&
        (dentroDe(mouseX, mouseY, btnJogar) || dentroDe(mouseX, mouseY, btnManual) || dentroDe(mouseX, mouseY, btnSobre))
    _cv.style.cursor = emCima ? 'pointer' : 'default'
})
_cv.addEventListener('mouseleave', () => { mouseX = -1; mouseY = -1 })

_cv.addEventListener('click', (ev) => {
    iniciaMusica() // clique também é interação: libera o áudio
    let r = _cv.getBoundingClientRect()
    let mx = (ev.clientX - r.left) / r.width * LARG
    let my = (ev.clientY - r.top) / r.height * ALT
    if (estado === 'HOME') {
        if (dentroDe(mx, my, btnJogar)) { tocaSom(SONS.click); avancaFluxo() }
        else if (dentroDe(mx, my, btnManual)) { tocaSom(SONS.click); abreManual() }
        else if (dentroDe(mx, my, btnSobre)) { tocaSom(SONS.click); abreSobre() }
    }
})

// ---------- fluxo do jogo ----------
const FLUXO = [
    { tipo: 'dica' },
    { tipo: 'cut', id: 'intro' },
    { tipo: 'fase', n: 1 },
    { tipo: 'cut', id: 'pre2' },
    { tipo: 'fase', n: 2 },
    { tipo: 'cut', id: 'pre3' },
    { tipo: 'fase', n: 3 },
    { tipo: 'cut', id: 'pre5' },
    { tipo: 'fase', n: 5 },
    { tipo: 'cut', id: 'pre6' },
    { tipo: 'fase', n: 6 },
    { tipo: 'cut', id: 'pre7' },
    { tipo: 'fase', n: 7 },
    { tipo: 'cut', id: 'pre8' },
    { tipo: 'fase', n: 8 },
    { tipo: 'cut', id: 'final' },
    { tipo: 'final' }
]

let estado = 'HOME' // HOME | CUTSCENE | FASE | GAMEOVER | FINAL
let fluxoIdx = -1
let cena = null
let faseAtualObj = null
let faseN = 0
let piscaTimer = 0

function avancaFluxo() {
    paraMusicaBoss()
    if (estado === 'HOME') tocaFaixa('jogo') // saiu do menu: intro → trilha das fases
    fluxoIdx += 1
    if (fluxoIdx >= FLUXO.length) { voltaPraHome(); return }
    let item = FLUXO[fluxoIdx]
    if (item.tipo === 'cut') {
        cena = new CenaDialogo(ROTEIRO[item.id])
        estado = 'CUTSCENE'
    } else if (item.tipo === 'fase') {
        preparaFase(item.n)
    } else if (item.tipo === 'dica') {
        telaDica.prog = 0
        estado = 'CARREGANDO'
    } else if (item.tipo === 'final') {
        cenaFinal.init()
        estado = 'FINAL'
    }
}

function preparaFase(n) {
    faseN = n
    faseAtualObj = FASES[n]
    // quem morreu revive com metade da vida; quem sobreviveu ganha +1
    players.forEach((pl) => {
        if (!pl.vivo) {
            pl.vivo = true
            pl.vida = Math.ceil(pl.maxVida / 2)
        } else {
            pl.cura(1)
        }
        pl.invul = 0
        pl.tiroTimer = 0
        pl.cooldown = 0
    })
    faseAtualObj.init()
    estado = 'FASE'
}

function reiniciaFase() {
    paraMusicaBoss()
    players.forEach((pl) => {
        pl.vivo = true
        pl.vida = pl.maxVida
        pl.invul = 0
    })
    efeitos = []
    faseAtualObj.init()
    estado = 'FASE'
}

function voltaPraHome() {
    tocaFaixa('menu') // de volta ao menu: toca a intro
    estado = 'HOME'
    fluxoIdx = -1
    efeitos = []
    goldenCarlos = 0
    bonusGolden = false
    goldenSoltos = 0
    players.forEach((pl) => {
        pl.vivo = true
        pl.maxVida = 10
        pl.vida = pl.maxVida
        pl.forca = 1
        pl.pts = 0
    })
}

// ---------- roteamento de teclas apertadas (não contínuas) ----------
function aoApertar(k) {
    if (k === 'Escape') {
        if (overlayAberto()) tocaSom(SONS.click)
        fechaManual()
        fechaSobre()
        return
    }
    // com um overlay aberto, o jogo não recebe teclas
    if (overlayAberto()) return
    if (estado === 'HOME' && k === 'Enter') {
        tocaSom(SONS.click)
        avancaFluxo()
        return
    }
    if (estado === 'HOME' && k === 'm') {
        tocaSom(SONS.click)
        abreManual()
        return
    }
    if (estado === 'HOME' && k === 'n') {
        tocaSom(SONS.click)
        abreSobre()
        return
    }
    if (estado === 'CARREGANDO' && k === 'Enter' && telaDica.prog >= 100) {
        avancaFluxo()
        return
    }
    if (estado === 'CUTSCENE' && k === 'Enter') {
        cena.avancar()
        return
    }
    if (estado === 'GAMEOVER' && k === 'Enter') {
        reiniciaFase()
        return
    }
    if (estado === 'FINAL' && k === 'Enter' && cenaFinal.creditosAcabaram()) {
        voltaPraHome()
        return
    }
    if (estado === 'FASE') {
        // fase 1: notas da harpa
        if (faseN === 1) {
            if (TECLAS_NOTAS_P1[k] !== undefined) fase1.nota(0, TECLAS_NOTAS_P1[k])
            if (TECLAS_NOTAS_P2[k] !== undefined) fase1.nota(1, TECLAS_NOTAS_P2[k])
        }
        // fase 3: ingredientes da fórmula (P1: 1/2/3 — P2: 8/9/0)
        if (faseN === 3) {
            if (k === '1') fase3.ingrediente(0)
            if (k === '2') fase3.ingrediente(1)
            if (k === '3') fase3.ingrediente(2)
            if (k === '8') fase3.ingrediente(0)
            if (k === '9') fase3.ingrediente(1)
            if (k === '0') fase3.ingrediente(2)
        }
    }
}

// ============================================================
//  HUD — barras de vida com rosto, força e pontos
// ============================================================
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

    // nome da fase no centro
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

    txtHud.des_text(nome + (pl.vivo ? '' : ' \u2620'), infoX, 20, cor, 'bold 13px monospace')
    barraHud.des(infoX, 26, 148, 14, pl.vida / pl.maxVida, '#2a1414', pl.vida > 3 ? '#d63a3a' : '#ff7a3a', null)
    txtHud.des_text('\u2665 ' + pl.vida + '/' + pl.maxVida + '   \u2694 x' + pl.forca, infoX, 54, '#f3e9d2', '12px monospace')
}

// ============================================================
//  TELA INICIAL
// ============================================================
// ---------- botões da tela inicial ----------
// abaixo do sol da arte (o sol termina por volta de y=390) e acima do rodapé
const btnJogar = { x: LARG / 2 - 118, y: 404, w: 236, h: 50 }
const btnManual = { x: LARG / 2 - 118, y: 462, w: 236, h: 40 }
const btnSobre = { x: LARG / 2 - 118, y: 510, w: 236, h: 40 }

// ---------- botões da tela de modos ----------
const btnHistoria = { x: LARG / 2 - 200, y: 196, w: 400, h: 86, t: 'MODO HISTORIA', s: 'As dez pragas — cooperativo' }
const btnSobrev = { x: LARG / 2 - 200, y: 300, w: 400, h: 86, t: 'SOBREVIVENCIA', s: 'Ondas infinitas, cada vez mais difícil' }
const btnPvp = { x: LARG / 2 - 200, y: 404, w: 400, h: 86, t: '1 VS 1', s: 'Duelo entre os dois jogadores' }

function dentroDe(mx, my, b) {
    return mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h
}

// caminho de retângulo com cantos cortados (a forma das placas/estelas egípcias)
function caminhoChanfrado(x, y, w, h, c) {
    des.beginPath()
    des.moveTo(x + c, y)
    des.lineTo(x + w - c, y)
    des.lineTo(x + w, y + c)
    des.lineTo(x + w, y + h - c)
    des.lineTo(x + w - c, y + h)
    des.lineTo(x + c, y + h)
    des.lineTo(x, y + h - c)
    des.lineTo(x, y + c)
    des.closePath()
}

// estela de basalto: cantos chanfrados, filete dourado e texto em pixel font
function desBotao(b, txt, tam) {
    let f = tam || 15
    let hover = dentroDe(mouseX, mouseY, b)
    let y = b.y + (hover ? 2 : 0)
    let c = 10                       // tamanho do chanfro

    // sombra
    des.save()
    des.shadowColor = 'rgba(0,0,0,0.6)'
    des.shadowBlur = 10
    des.shadowOffsetY = 4
    caminhoChanfrado(b.x, y, b.w, b.h, c)
    let g = des.createLinearGradient(0, y, 0, y + b.h)
    g.addColorStop(0, hover ? '#33210f' : '#1e1409')
    g.addColorStop(1, hover ? '#1d1207' : '#0f0904')
    des.fillStyle = g
    des.fill()
    des.restore()

    // contorno externo escuro
    caminhoChanfrado(b.x, y, b.w, b.h, c)
    des.strokeStyle = '#0b0704'
    des.lineWidth = 3
    des.stroke()

    // filete dourado escavado por dentro
    caminhoChanfrado(b.x + 5, y + 5, b.w - 10, b.h - 10, c - 4)
    des.strokeStyle = hover ? '#ffe9a0' : '#a8802e'
    des.lineWidth = hover ? 2 : 1
    des.stroke()

    // texto em pixel font, dourado com contorno (igual ao logotipo)
    des.save()
    if (hover) { des.shadowColor = '#ffd84d'; des.shadowBlur = 12 }
    des.font = f + 'px "Press Start 2P", monospace'
    des.textAlign = 'center'
    des.textBaseline = 'middle'
    des.lineWidth = 4
    des.strokeStyle = '#2a1806'
    des.strokeText(txt, b.x + b.w / 2, y + b.h / 2 + 1)
    des.fillStyle = hover ? '#fff0a8' : '#ffd84d'
    des.fillText(txt, b.x + b.w / 2, y + b.h / 2 + 1)
    des.restore()
    des.textAlign = 'left'
    des.textBaseline = 'alphabetic'

    // marcadores de seleção nas laterais quando o mouse está em cima
    if (hover) {
        des.fillStyle = '#ffd84d'
        des.font = '12px "Press Start 2P", monospace'
        des.textBaseline = 'middle'
        des.fillText('▶', b.x - 20, y + b.h / 2)
        des.fillText('◀', b.x + b.w + 8, y + b.h / 2)
        des.textBaseline = 'alphabetic'
    }
}

function desHome() {
    des.drawImage(pegaImg('assets/home.png'), 0, 0, LARG, ALT)
    // a Press Start 2P não tem glifos acentuados (o "Ó" cai no fallback e desalinha),
    // por isso os rótulos dos botões são sem acento
    desBotao(btnJogar, 'JOGAR', 18)
    desBotao(btnManual, 'MANUAL', 12)
    desBotao(btnSobre, 'EQUIPE', 12)

    // dica de teclas, discreta, sobre a areia
    des.save()
    des.font = '8px "Press Start 2P", monospace'
    des.textAlign = 'center'
    des.lineWidth = 3
    des.strokeStyle = 'rgba(0,0,0,0.75)'
    des.strokeText('ENTER  JOGAR     M  MANUAL     N  EQUIPE', LARG / 2, ALT - 22)
    des.fillStyle = '#e8c98a'
    des.fillText('ENTER  JOGAR     M  MANUAL     N  EQUIPE', LARG / 2, ALT - 22)
    des.textAlign = 'left'
    des.restore()
}

// estela grande com título e subtítulo (tela de modos)
function desBotaoModo(b) {
    let hover = dentroDe(mouseX, mouseY, b)
    let y = b.y + (hover ? 2 : 0)
    des.save()
    des.shadowColor = 'rgba(0,0,0,0.6)'
    des.shadowBlur = 10
    des.shadowOffsetY = 4
    caminhoChanfrado(b.x, y, b.w, b.h, 12)
    let g = des.createLinearGradient(0, y, 0, y + b.h)
    g.addColorStop(0, hover ? '#33210f' : '#1e1409')
    g.addColorStop(1, hover ? '#1d1207' : '#0f0904')
    des.fillStyle = g
    des.fill()
    des.restore()
    caminhoChanfrado(b.x, y, b.w, b.h, 12)
    des.strokeStyle = hover ? '#ffd84d' : '#8a6a33'
    des.lineWidth = 2
    des.stroke()
    des.textAlign = 'center'
    des.textBaseline = 'middle'
    des.fillStyle = hover ? '#ffd84d' : '#e8c98a'
    des.font = '15px "Press Start 2P", monospace'
    des.fillText(b.t, b.x + b.w / 2, y + 32)
    des.fillStyle = hover ? '#d9c9a0' : '#9a8a68'
    des.font = '17px VT323, monospace'
    des.fillText(b.s, b.x + b.w / 2, y + 60)
    des.textAlign = 'left'
    des.textBaseline = 'alphabetic'
}

function desModos() {
    des.drawImage(pegaImg('assets/home.png'), 0, 0, LARG, ALT)
    des.fillStyle = 'rgba(8, 5, 2, 0.72)'
    des.fillRect(0, 0, LARG, ALT)
    des.textAlign = 'center'
    des.fillStyle = '#ffd84d'
    des.font = '22px "Press Start 2P", monospace'
    des.fillText('ESCOLHA O MODO', LARG / 2, 130)
    des.textAlign = 'left'
    desBotaoModo(btnHistoria)
    desBotaoModo(btnSobrev)
    desBotaoModo(btnPvp)
    des.save()
    des.font = '8px "Press Start 2P", monospace'
    des.textAlign = 'center'
    des.fillStyle = '#9a8a68'
    des.fillText('1 / 2 / 3 ESCOLHEM     ESC VOLTA', LARG / 2, ALT - 26)
    des.textAlign = 'left'
    des.restore()
}

// ---------- MANUAL e SOBRE NÓS (overlays HTML) ----------
let _manualEl = document.getElementById('manual')
let _sobreEl = document.getElementById('sobre')

function abreManual() {
    if (_manualEl) _manualEl.classList.remove('oculto')
}
function fechaManual() {
    if (_manualEl) _manualEl.classList.add('oculto')
}
function abreSobre() {
    if (_sobreEl) { _sobreEl.classList.remove('oculto'); _sobreEl.scrollTop = 0 }
}
function fechaSobre() {
    if (_sobreEl) _sobreEl.classList.add('oculto')
}
// true se algum overlay está por cima do canvas
function overlayAberto() {
    return (_manualEl && !_manualEl.classList.contains('oculto')) ||
           (_sobreEl && !_sobreEl.classList.contains('oculto'))
}

// ícones do manual: animam (cicla os quadros do spritesheet, ou uma lista de imagens)
let _iconesManual = []
document.querySelectorAll('#manual .ico').forEach((el) => {
    let lista = el.getAttribute('data-imgs')
    let frames = parseInt(el.getAttribute('data-frames') || '1', 10)
    let arq = el.getAttribute('data-img')
    if (lista) {
        let arr = lista.split(',')
        el.style.backgroundImage = "url('assets/" + arr[0] + "')"
        _iconesManual.push({ el: el, imgs: arr, i: 0 })
    } else if (frames > 1) {
        el.style.backgroundImage = "url('assets/" + arq + "')"
        el.style.backgroundSize = (frames * 100) + '% 100%'
        el.style.backgroundPosition = '0% center'
        _iconesManual.push({ el: el, frames: frames, i: 0 })
    } else {
        el.style.backgroundImage = "url('assets/" + arq + "')"
    }
})
setInterval(() => {
    if (!_manualEl || _manualEl.classList.contains('oculto')) return
    _iconesManual.forEach((ic) => {
        if (ic.imgs) {
            ic.i = (ic.i + 1) % ic.imgs.length
            ic.el.style.backgroundImage = "url('assets/" + ic.imgs[ic.i] + "')"
        } else {
            ic.i = (ic.i + 1) % ic.frames
            ic.el.style.backgroundPosition = (ic.i / (ic.frames - 1) * 100) + '% center'
        }
    })
}, 450)

let _fecharBtn = document.getElementById('fecharManual')
if (_fecharBtn) _fecharBtn.addEventListener('click', () => { tocaSom(SONS.click); fechaManual() })

let _fecharSobreBtn = document.getElementById('fecharSobre')
if (_fecharSobreBtn) _fecharSobreBtn.addEventListener('click', () => { tocaSom(SONS.click); fechaSobre() })

// ============================================================
//  GAME OVER
// ============================================================
function desGameOver() {
    des.fillStyle = 'rgba(20, 0, 0, 0.78)'
    des.fillRect(0, 0, LARG, ALT)
    let t = new Texto()
    t.des_text('A CRIPTA OS CONSUMIU...', LARG / 2, ALT / 2 - 30, '#d63a3a', 'bold 42px serif', 'center')
    t.des_text('As pragas avan\u00E7am sobre o mundo.', LARG / 2, ALT / 2 + 10, '#f3e9d2', '17px monospace', 'center')
    piscaTimer += 1
    if (Math.floor(piscaTimer / 35) % 2 === 0) {
        t.des_text('ENTER para tentar a fase novamente', LARG / 2, ALT / 2 + 70, '#ffd84d', 'bold 18px monospace', 'center')
    }
}

// ============================================================
//  CENA FINAL — camelo ao pôr do sol + créditos subindo
//  (cena desenhada em código; substituível por assets depois)
// ============================================================
let cenaFinal = {
    t: 0,
    creditos: [
        'A CRIPTA PERDIDA',
        '',
        'As 10 pragas foram seladas.',
        'O mundo segue em paz... por enquanto.',
        '',
        '\u2014 PROGRAMA\u00C7\u00C3O \u2014',
        'Bello, Rafael, Mario e Rech',
        '',
        '\u2014 IMAGENS \u2014',
        'Bello',
        '',
        '\u2014 M\u00DASICAS (AUTORAIS) \u2014',
        'Mario',
        '',
        '\u2014 PROFESSOR ORIENTADOR \u2014',
        'Carlos Roberto',
        '',
        '\u2014 ESCOLA \u2014',
        'SESI SENAI \u2014 Tijucas',
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
    // true quando o último crédito já saiu por cima da tela
    creditosAcabaram() {
        return ALT + 80 - this.t * 0.55 + (this.creditos.length - 1) * 36 < -20
    },
    des() {
        // arte final pronta (assets/cenaFinal.png) — desenhada por cima do fallback
        let arte = pegaImg('assets/cenaFinal.png')
        if (arte.complete && arte.naturalWidth > 0) {
            // zoom bem lento enquanto os créditos passam (efeito Ken Burns)
            let z = Math.min(1.15, 1 + this.t * 0.00009)
            let dw = LARG * z, dh = ALT * z
            des.drawImage(arte, (LARG - dw) / 2, (ALT - dh) / 2, dw, dh)
            this.desCreditos()
            return
        }
        // céu do pôr do sol
        let grad = des.createLinearGradient(0, 0, 0, ALT)
        grad.addColorStop(0, '#2a1a4a')
        grad.addColorStop(0.45, '#c4502a')
        grad.addColorStop(0.7, '#ffb347')
        grad.addColorStop(1, '#d49a4a')
        des.fillStyle = grad
        des.fillRect(0, 0, LARG, ALT)

        // sol
        des.fillStyle = '#ffdf8a'
        des.beginPath()
        des.arc(LARG / 2, ALT * 0.62, 70, 0, Math.PI * 2)
        des.fill()

        // pirâmides no horizonte
        des.fillStyle = '#7a4a22'
        des.beginPath()
        des.moveTo(140, ALT * 0.72); des.lineTo(330, ALT * 0.40); des.lineTo(520, ALT * 0.72)
        des.closePath(); des.fill()
        des.fillStyle = '#653a18'
        des.beginPath()
        des.moveTo(480, ALT * 0.72); des.lineTo(640, ALT * 0.48); des.lineTo(800, ALT * 0.72)
        des.closePath(); des.fill()

        // areia
        des.fillStyle = '#caa05a'
        des.fillRect(0, ALT * 0.72, LARG, ALT * 0.28)
        des.fillStyle = '#b8904e'
        des.beginPath()
        des.ellipse(LARG * 0.3, ALT * 0.85, 260, 30, 0, 0, Math.PI * 2)
        des.fill()

        this.desCamelo()
        this.desCreditos()
    },
    desCamelo() {
        let camX = Math.min(LARG - 220, -80 + this.t * 0.55)

        // arte pronta (assets/camelo_sheet.png, 2 quadros)
        let img = pegaImg('assets/camelo_sheet.png')
        if (img.complete && img.naturalWidth > 0) {
            let quadro = Math.floor(this.t / 12) % 2
            let dh = 130, dw = dh * (img.naturalWidth / 2) / img.naturalHeight
            desSprite('assets/camelo_sheet.png', 2, quadro, camX, ALT * 0.70, dw, dh)
            return
        }

        // fallback: camelo com os dois amigos se afastando (silhueta)
        let camY = ALT * 0.74
        des.fillStyle = '#2a1a0c'
        des.fillRect(camX, camY, 90, 34)                 // corpo
        des.beginPath()                                   // corcovas
        des.arc(camX + 28, camY, 16, Math.PI, 0)
        des.arc(camX + 62, camY, 16, Math.PI, 0)
        des.fill()
        des.fillRect(camX + 82, camY - 18, 10, 26)       // pescoço
        des.fillRect(camX + 80, camY - 28, 18, 12)       // cabeça
        let passo = Math.sin(this.t / 8) * 4
        des.fillRect(camX + 10, camY + 32, 7, 26 + passo) // pernas
        des.fillRect(camX + 34, camY + 32, 7, 26 - passo)
        des.fillRect(camX + 56, camY + 32, 7, 26 + passo)
        des.fillRect(camX + 78, camY + 32, 7, 26 - passo)
        // os 2 amigos montados
        des.fillStyle = '#3aa0ff'
        des.fillRect(camX + 18, camY - 22, 14, 20)
        des.fillStyle = '#37d67a'
        des.fillRect(camX + 50, camY - 22, 14, 20)
    },
    desCreditos() {
        // créditos subindo
        let baseY = ALT + 80 - this.t * 0.55
        des.textAlign = 'center'
        this.creditos.forEach((linha, i) => {
            let y = baseY + i * 36
            if (y > -20 && y < ALT + 30) {
                des.fillStyle = i === 0 ? '#ffd84d' : '#fff6e0'
                des.font = i === 0 ? '26px "Press Start 2P", monospace'
                    : (linha.indexOf('\u2014') === 0 ? '13px "Press Start 2P", monospace' : '24px VT323, monospace')
                des.fillText(linha, LARG / 2, y)
            }
        })
        des.textAlign = 'left'

        if (this.creditosAcabaram()) {
            piscaTimer += 1
            if (Math.floor(piscaTimer / 35) % 2 === 0) {
                des.fillStyle = '#fff6e0'
                des.font = '10px "Press Start 2P", monospace'
                des.textAlign = 'center'
                des.fillText('ENTER para voltar ao in\u00EDcio', LARG / 2, ALT - 20)
                des.textAlign = 'left'
            }
        }
    }
}

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

function main() {
    des.clearRect(0, 0, LARG, ALT)
    atualizaAudio()

    if (estado === 'HOME') {
        desHome()
    }
    else if (estado === 'CARREGANDO') {
        telaDica.prog = Math.min(100, telaDica.prog + 0.7)
        telaDica.des()
    }
    else if (estado === 'CUTSCENE') {
        // desenha a fase atrás da cut-scene (se houver) pra dar contexto
        if (faseAtualObj) {
            faseAtualObj.des()
            desHUD()
        } else {
            desFundo(1)
        }
        cena.atual()
        cena.des()
        if (cena.terminou) avancaFluxo()
    }
    else if (estado === 'FASE') {
        faseAtualObj.atual()
        atualizaEfeitos()
        faseAtualObj.des()
        desEfeitos()
        desHUD()

        if (faseAtualObj.completa) {
            avancaFluxo()
        } else if (players.every((pl) => !pl.vivo)) {
            estado = 'GAMEOVER'
        }
    }
    else if (estado === 'GAMEOVER') {
        faseAtualObj.des()
        desHUD()
        desGameOver()
    }
    else if (estado === 'FINAL') {
        cenaFinal.atual()
        cenaFinal.des()
    }

    requestAnimationFrame(main)
}

main()
