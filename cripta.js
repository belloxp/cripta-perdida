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
    let emCima = false
    if (estado === 'HOME') {
        if (menuConfirma >= 0) {
            [0, 1].forEach((n) => {
                if (dentroDe(mouseX, mouseY, confirmaRect(n))) { confirmaSel = n; emCima = true }
            })
        } else {
            menuItens().forEach((it, i) => {
                if (dentroDe(mouseX, mouseY, menuRect(it))) { menuSel = i; emCima = true }
            })
        }
    }
    _cv.style.cursor = emCima ? 'pointer' : 'default'
})
_cv.addEventListener('mouseleave', () => { mouseX = -1; mouseY = -1 })

_cv.addEventListener('click', (ev) => {
    iniciaMusica() // clique também é interação: libera o áudio
    let r = _cv.getBoundingClientRect()
    let mx = (ev.clientX - r.left) / r.width * LARG
    let my = (ev.clientY - r.top) / r.height * ALT
    if (estado === 'HOME') {
        if (menuConfirma >= 0) {
            [0, 1].forEach((n) => {
                if (dentroDe(mx, my, confirmaRect(n))) { confirmaSel = n; confirmaModal() }
            })
        } else {
            menuItens().forEach((it, i) => {
                if (dentroDe(mx, my, menuRect(it))) { menuSel = i; executaItem(i) }
            })
        }
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
    if (estado === 'HOME') {
        tocaFaixa('jogo') // saiu do menu: intro → trilha das fases
        faseAtualObj = null // senão a cutscene inicial desenha a última fase jogada no fundo
    }
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
    faseAtualObj = null
    fechaMenu()
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
        if (estado === 'HOME' && menuConfirma >= 0) { tocaSom(SONS.click); menuConfirma = -1; return }
        if (estado === 'HOME' && menuAberto) { tocaSom(SONS.click); fechaMenu(); return }
        if (estado === 'SOBREVIVE' || estado === 'PVP') { tocaSom(SONS.click); tocaFaixa('menu'); faseAtualObj = null; fechaMenu(); estado = 'HOME' }
        return
    }
    // com um overlay aberto, o jogo não recebe teclas
    if (overlayAberto()) return
    if (estado === 'HOME') {
        if (menuConfirma >= 0) {
            if (['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(k)) { tocaSom(SONS.click); confirmaSel = 1 - confirmaSel; return }
            if (k === 'Enter') { confirmaModal(); return }
            return
        }
        let n = menuItens().length
        if (k === 'ArrowUp' || k === 'w') { tocaSom(SONS.click); menuSel = (menuSel + n - 1) % n; return }
        if (k === 'ArrowDown' || k === 's') { tocaSom(SONS.click); menuSel = (menuSel + 1) % n; return }
        if (k === 'Enter') { executaItem(menuSel); return }
        if (k === 'm') { tocaSom(SONS.click); abreManual(); return }
        if (k === 'n') { tocaSom(SONS.click); abreSobre(); return }
        return
    }
    if (estado === 'SOBREVIVE') {
        if (sobrevivencia.fim && k === 'Enter') { tocaFaixa('menu'); faseAtualObj = null; estado = 'HOME' }
        return
    }
    if (estado === 'PVP') {
        if (pvp.vencedor > 0 && k === 'Enter') { tocaSom(SONS.click); pvp.init() }
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
// ---------- menu principal (JOGAR expande os modos; escolha pede confirmação) ----------
const MENU_MODOS = [
    { t: 'MODO HISTORIA', acao: () => avancaFluxo() },
    { t: 'SOBREVIVENCIA', acao: () => iniciaSobrevivencia() },
    { t: '1 VS 1', acao: () => iniciaPvp() }
]
let menuSel = 0
let menuAberto = false   // JOGAR aberto mostrando os modos embaixo
let menuAnim = 0         // 0 fechado → 1 aberto (easing no desHome, dá a transição)
let menuConfirma = -1    // modo esperando confirmação no modal (-1 = nenhum)
let confirmaSel = 0      // 0 = SIM | 1 = NAO
const MENU_X = 64

// lista atual do menu; posições consideram a animação de abertura do JOGAR
function menuItens() {
    let itens = [{ t: 'JOGAR', tipo: 'jogar' }]
    if (menuAberto) MENU_MODOS.forEach((m, i) => itens.push({ t: m.t, tipo: 'modo', modo: i, sub: true }))
    itens.push({ t: 'MANUAL', tipo: 'manual' })
    itens.push({ t: 'EQUIPE', tipo: 'equipe' })
    let blocoSub = (MENU_MODOS.length * 44 + 18) * menuAnim
    let extra = 0
    itens.forEach((it) => {
        if (it.tipo === 'jogar') {
            it.y = 272
        } else if (it.sub) {
            it.y = 272 + 54 + it.modo * 44 - (1 - menuAnim) * 16 // desliza de cima
            it.alpha = menuAnim
        } else {
            it.y = 272 + 54 + blocoSub + extra * 52
            extra += 1
        }
    })
    return itens
}
function menuRect(it) {
    return { x: MENU_X + (it.sub ? 30 : 0) - 24, y: it.y - 26, w: 330, h: 38 }
}
function fechaMenu() {
    menuAberto = false
    menuConfirma = -1
    menuSel = 0
}
// botões SIM/NAO do modal
function confirmaRect(n) {
    return { x: LARG / 2 - 155 + n * 180, y: ALT / 2 + 24, w: 130, h: 44 }
}

function executaItem(i) {
    let it = menuItens()[i]
    if (!it) return
    tocaSom(SONS.click)
    if (it.tipo === 'jogar') {
        menuAberto = !menuAberto
        if (menuAberto) menuSel = 1
    } else if (it.tipo === 'modo') {
        menuConfirma = it.modo
        confirmaSel = 0
    } else if (it.tipo === 'manual') {
        abreManual()
    } else {
        abreSobre()
    }
}

function confirmaModal() {
    tocaSom(SONS.click)
    if (confirmaSel === 0) {
        let m = MENU_MODOS[menuConfirma]
        fechaMenu()
        m.acao()
    } else {
        menuConfirma = -1
    }
}

function dentroDe(mx, my, b) {
    return mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h
}

function desHome() {
    // arte dedicada do menu (assets/menuFundo.png); cai pro home.png enquanto não existir
    let fundo = pegaImg('assets/menuFundo.png')
    let temFundoNovo = fundo.complete && fundo.naturalWidth > 0
    des.drawImage(temFundoNovo ? fundo : pegaImg('assets/home.png'), 0, 0, LARG, ALT)
    // véu de leitura: escuro na esquerda, transparente na direita (a arte aparece)
    let g = des.createLinearGradient(0, 0, LARG * 0.6, 0)
    g.addColorStop(0, 'rgba(5, 3, 1, 0.88)')
    g.addColorStop(1, 'rgba(5, 3, 1, 0)')
    des.fillStyle = g
    des.fillRect(0, 0, LARG, ALT)

    // logo no topo esquerdo (assets/icon.png); sem ela, o nome em pixel font
    let logo = pegaImg('assets/icon.png')
    des.textAlign = 'left'
    if (logo.complete && logo.naturalWidth > 0) {
        let lh = 175
        let lw = lh * logo.naturalWidth / logo.naturalHeight
        if (lw > 440) { lw = 440; lh = lw * logo.naturalHeight / logo.naturalWidth }
        des.drawImage(logo, 232 - lw / 2, 44, lw, lh) // centrado na coluna do menu
    } else if (temFundoNovo) {
        des.fillStyle = '#ffd84d'
        des.font = '26px "Press Start 2P", monospace'
        des.fillText('A CRIPTA', MENU_X, 104)
        des.fillText('PERDIDA', MENU_X, 144)
    }

    // easing da abertura do JOGAR
    let alvoAnim = menuAberto ? 1 : 0
    menuAnim += (alvoAnim - menuAnim) * 0.22
    if (Math.abs(alvoAnim - menuAnim) < 0.01) menuAnim = alvoAnim

    let itens = menuItens()
    itens.forEach((it, i) => {
        let sel = menuSel === i && menuConfirma < 0
        let x = MENU_X + (it.sub ? 26 : 0) + (sel ? 10 : 0)
        des.save()
        if (it.alpha !== undefined) des.globalAlpha = it.alpha
        des.font = (it.sub ? (sel ? '13px' : '11px') : (sel ? '15px' : '13px')) + ' "Press Start 2P", monospace'
        des.fillStyle = sel ? '#ffd84d' : (it.sub ? '#9c8c66' : '#b7a67e')
        let rotulo = it.tipo === 'jogar' ? (menuAberto ? 'JOGAR —' : 'JOGAR') : it.t
        des.fillText(rotulo, x, it.y)
        des.restore()
    })

    des.font = '8px "Press Start 2P", monospace'
    des.fillStyle = '#8a7a58'
    des.fillText('SETAS ESCOLHEM    ENTER CONFIRMA', MENU_X, ALT - 28)

    // modal de confirmação
    if (menuConfirma >= 0) {
        des.fillStyle = 'rgba(0, 0, 0, 0.62)'
        des.fillRect(0, 0, LARG, ALT)
        let bx = LARG / 2 - 220, by = ALT / 2 - 78, bw = 440, bh = 168
        des.fillStyle = '#171008'
        des.fillRect(bx, by, bw, bh)
        des.strokeStyle = '#8a6a33'
        des.lineWidth = 2
        des.strokeRect(bx, by, bw, bh)
        des.textAlign = 'center'
        des.fillStyle = '#d9c9a0'
        des.font = '10px "Press Start 2P", monospace'
        des.fillText('INICIAR', LARG / 2, by + 42)
        des.fillStyle = '#ffd84d'
        des.font = '17px "Press Start 2P", monospace'
        des.fillText(MENU_MODOS[menuConfirma].t, LARG / 2, by + 80)
        ;['SIM', 'NAO'].forEach((txt, n) => {
            let r = confirmaRect(n)
            let sel = confirmaSel === n
            des.fillStyle = sel ? '#33210f' : '#100a04'
            des.fillRect(r.x, r.y, r.w, r.h)
            des.strokeStyle = sel ? '#ffd84d' : '#5a4322'
            des.strokeRect(r.x, r.y, r.w, r.h)
            des.fillStyle = sel ? '#ffd84d' : '#9c8c66'
            des.font = '13px "Press Start 2P", monospace'
            des.fillText(txt, r.x + r.w / 2, r.y + 28)
        })
        des.textAlign = 'left'
    }
}

// ---------- entrada nos modos ----------// ---------- entrada nos modos ----------// ---------- entrada nos modos ----------

function iniciaSobrevivencia() {
    faseAtualObj = sobrevivencia
    sobrevivencia.init()
    tocaFaixa('jogo')
    estado = 'SOBREVIVE'
}
function iniciaPvp() {
    faseAtualObj = pvp
    pvp.init()
    tocaFaixa('jogo')
    estado = 'PVP'
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
    else if (estado === 'SOBREVIVE') {
        sobrevivencia.atual()
        atualizaEfeitos()
        sobrevivencia.des()
        desEfeitos()
        desHUD()
    }
    else if (estado === 'PVP') {
        pvp.atual()
        atualizaEfeitos()
        pvp.des()
        desEfeitos()
        desHUD()
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
