// ============================================================
//  A CRIPTA PERDIDA — Fases.js
//  As 8 fases das 10 pragas do Egito
// ============================================================

function desFundo(n) {
    des.drawImage(pegaImg('assets/fase' + n + '.png'), 0, 0, LARG, ALT)
}

function sorteiaDrop(x, y, grupo) {
    if (Math.random() < 0.18) {
        let tipo = Math.random() < 0.5 ? 'vida' : 'forca'
        grupo.push(new Coletavel(x, y, tipo, true))
    }
}

function aplicaColetavel(pl, c) {
    if (c.tipo === 'vida') {
        pl.cura(3)
        efeitoTexto('+3 VIDA', pl.x + pl.w / 2, pl.y - 10, '#37d67a')
    } else if (c.tipo === 'forca') {
        pl.forca = Math.min(3, pl.forca + 1)
        efeitoTexto('+1 FORCA', pl.x + pl.w / 2, pl.y - 10, '#ff9c2e')
    }
    tocaSom(SONS.item)
}

function atualizaColetaveis(grupo) {
    grupo.forEach((c) => { c.mov() })
    for (let i = grupo.length - 1; i >= 0; i--) {
        let c = grupo[i]
        if (c.y > ALT + 40) { grupo.splice(i, 1); continue }
        for (let j = 0; j < players.length; j++) {
            let pl = players[j]
            if (pl.vivo && pl.colid(c) && c.tipo !== 'amuleto') {
                aplicaColetavel(pl, c)
                grupo.splice(i, 1)
                break
            }
        }
    }
}

function fabricaFaseTiro(cfg) {
    return {
        nome: cfg.nome,
        init() {
            this.completa = false
            this.grupoTiros = []
            this.grupoInimigos = []
            this.grupoColetaveis = []
            this.timers = cfg.spawns.map(() => 0)
            this.mortes = 0
            p1.x = 280; p1.y = ALT - 110; p1.facing = 'dir'
            p2.x = 580; p2.y = ALT - 110; p2.facing = 'esq'
        },
        criaInimigo() {
            cfg.spawns.forEach((s, i) => {
                this.timers[i] += 1
                if (this.timers[i] >= s.intervalo) {
                    this.timers[i] = 0
                    let posX = Math.random() * (LARG - s.w - 20) + 10
                    let sprite = s.sprites[Math.floor(Math.random() * s.sprites.length)]
                    let vel = Math.random() * (s.vel[1] - s.vel[0]) + s.vel[0]
                    this.grupoInimigos.push(new Inimigo(posX, -s.h - 20, s.w, s.h, sprite, vel, s.hp || 1, s.sway))
                }
            })
        },
        destroiInimigo() {
            for (let i = this.grupoTiros.length - 1; i >= 0; i--) {
                let tiro = this.grupoTiros[i]
                for (let j = this.grupoInimigos.length - 1; j >= 0; j--) {
                    let ini = this.grupoInimigos[j]
                    if (tiro.colid(ini)) {
                        ini.hp -= tiro.dano
                        this.grupoTiros.splice(i, 1)
                        if (ini.hp <= 0) {
                            this.grupoInimigos.splice(j, 1)
                            this.mortes += 1
                            if (tiro.dono) tiro.dono.pts += 1
                            sorteiaDrop(ini.x, ini.y, this.grupoColetaveis)
                        }
                        break
                    }
                }
            }
        },
        atual() {
            let area = { x: 10, y: ALT - 230, w: LARG - 20, h: 220, vert: true }
            players.forEach((pl) => {
                pl.atualizaTimers()
                pl.mov(area)
                if (teclas[pl.teclas.tiro]) pl.atira(this.grupoTiros, 'cima')
            })

            this.criaInimigo()
            this.destroiInimigo()

            this.grupoTiros.forEach((t) => { t.mov() })
            this.grupoTiros = this.grupoTiros.filter((t) => !t.foraDaTela())

            for (let i = this.grupoInimigos.length - 1; i >= 0; i--) {
                let ini = this.grupoInimigos[i]
                ini.mov()
                if (ini.y > ALT + 30) { this.grupoInimigos.splice(i, 1); continue }
                for (let j = 0; j < players.length; j++) {
                    let pl = players[j]
                    if (pl.vivo && pl.colid(ini)) {
                        pl.levaDano(1)
                        this.grupoInimigos.splice(i, 1)
                        break
                    }
                }
            }

            atualizaColetaveis(this.grupoColetaveis)
            if (this.mortes >= cfg.meta) this.completa = true
        },
        des() {
            desFundo(cfg.fundo)
            this.grupoInimigos.forEach((i) => { i.des_obj() })
            this.grupoColetaveis.forEach((c) => { c.des_obj() })
            this.grupoTiros.forEach((t) => { t.des_tiro() })
            players.forEach((pl) => { pl.des_obj() })
            let t = new Texto()
            t.des_text('Eliminados: ' + this.mortes + ' / ' + cfg.meta, LARG / 2, 88, '#f3e9d2', 'bold 18px monospace', 'center')
        }
    }
}

// ============================================================
//  FASE 1 — ÁGUA EM SANGUE (harpa)
//  Escala harmônica egípcia (dominante frígio):
//  Dó - Ré bemol - Mi - Fá - Sol - Lá bemol - Si
// ============================================================
const NOTAS = [
    { id: 'c',      nome: 'D\u00F3',     audio: novoAudio('./audios/nota1.wav') },
    { id: 'rbemol', nome: 'R\u00E9\u266D', audio: novoAudio('./audios/nota2.wav') },
    { id: 'e',      nome: 'Mi',          audio: novoAudio('./audios/nota3.wav') },
    { id: 'f',      nome: 'F\u00E1',     audio: novoAudio('./audios/nota4.wav') },
    { id: 'g',      nome: 'Sol',         audio: novoAudio('./audios/nota5.wav') },
    { id: 'lbemol', nome: 'L\u00E1\u266D', audio: novoAudio('./audios/nota6.wav') },
    { id: 'b',      nome: 'Si',          audio: novoAudio('./audios/nota7.wav') }
]
// Teclas das notas — P1 usa 1..7, P2 usa Q..U
const TECLAS_NOTAS_P1 = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6 }
const TECLAS_NOTAS_P2 = { 'q': 0, 'w': 1, 'e': 2, 'r': 3, 't': 4, 'y': 5, 'u': 6 }

let fase1 = {
    nome: 'PRAGA I \u2014 \u00C1gua em Sangue',
    init() {
        this.completa = false
        this.prog = [0, 0]        // progresso na sequência de cada player
        this.erro = [0, 0]        // timer de flash de erro
        this.notasVisuais = []
        this.harpas = [new Harpa(150, 300, 150, 170), new Harpa(600, 300, 150, 170)]
        this.fimTimer = 0
        // players parados ao lado das harpas
        p1.x = 90;  p1.y = 360; p1.facing = 'dir'
        p2.x = 770; p2.y = 360; p2.facing = 'esq'
    },
    // chamado pelo keydown em cripta.js
    nota(jogador, idx) {
        if (this.completa || this.prog[jogador] >= NOTAS.length) return
        let pl = players[jogador]
        if (!pl.vivo) return
        let harpa = this.harpas[jogador]
        harpa.tocando = 25
        tocaSom(NOTAS[idx].audio)
        this.notasVisuais.push(new NotaMusical(harpa.x + Math.random() * harpa.w, harpa.y))
        if (idx === this.prog[jogador]) {
            this.prog[jogador] += 1
            if (this.prog[jogador] >= NOTAS.length) {
                efeitoTexto('PURIFICADO!', harpa.x + harpa.w / 2, harpa.y - 20, '#5db8ff')
            }
        } else {
            this.prog[jogador] = 0
            this.erro[jogador] = 30
            tocaSom(SONS.erro)
        }
    },
    atual() {
        this.harpas.forEach((h) => { h.atual() })
        this.notasVisuais.forEach((n) => { n.mov() })
        this.notasVisuais = this.notasVisuais.filter((n) => n.alpha > 0)
        this.erro = this.erro.map((e) => Math.max(0, e - 1))
        players.forEach((pl) => { pl.atualizaTimers() })
        if (this.prog[0] >= NOTAS.length && this.prog[1] >= NOTAS.length) {
            this.fimTimer += 1
            if (this.fimTimer > 90) this.completa = true
        }
    },
    des() {
        desFundo(1)

        // água no fundo: vai do vermelho (sangue) ao azul conforme o progresso
        let pureza = (this.prog[0] + this.prog[1]) / (NOTAS.length * 2)
        let r = Math.floor(160 - 130 * pureza)
        let g = Math.floor(20 + 90 * pureza)
        let b = Math.floor(30 + 180 * pureza)
        des.fillStyle = 'rgb(' + r + ',' + g + ',' + b + ')'
        des.fillRect(0, ALT - 90, LARG, 90)
        des.fillStyle = 'rgba(255,255,255,0.12)'
        for (let i = 0; i < 6; i++) {
            des.fillRect(i * 160 + (Date.now() / 40 % 160), ALT - 80 + (i % 3) * 22, 60, 4)
        }

        this.harpas.forEach((h) => { h.des_obj() })
        players.forEach((pl) => { pl.des_obj() })
        this.notasVisuais.forEach((n) => { n.des_obj() })

        // UI da sequência de notas de cada player
        this.desSequencia(0, 70, 100, TECLAS_NOTAS_P1)
        this.desSequencia(1, LARG - 70 - 7 * 52, 100, TECLAS_NOTAS_P2)

        let t = new Texto()
        t.des_text('Toquem a escala sagrada para purificar a \u00E1gua!', LARG / 2, 88, '#f3e9d2', 'bold 17px monospace', 'center')
    },
    desSequencia(jogador, x, y, mapaTeclas) {
        let teclasNota = Object.keys(mapaTeclas)
        let prog = this.prog[jogador]
        let nomeP = jogador === 0 ? NOMES.p1 : NOMES.p2
        des.fillStyle = this.erro[jogador] > 0 ? '#ff5050' : (jogador === 0 ? '#3aa0ff' : '#37d67a')
        des.font = 'bold 14px monospace'
        des.fillText(nomeP + (prog >= NOTAS.length ? ' \u2713 COMPLETO' : ''), x, y - 12)
        NOTAS.forEach((n, i) => {
            let nx = x + i * 52
            des.fillStyle = i < prog ? '#37d67a' : (i === prog ? '#ffd84d' : 'rgba(255,255,255,0.15)')
            des.fillRect(nx, y, 46, 46)
            des.fillStyle = '#000'
            des.font = 'bold 14px monospace'
            des.textAlign = 'center'
            des.fillText(n.nome, nx + 23, y + 22)
            des.font = '11px monospace'
            des.fillText('[' + teclasNota[i].toUpperCase() + ']', nx + 23, y + 38)
            des.textAlign = 'left'
        })
    }
}

let fase2 = fabricaFaseTiro({
    nome: 'PRAGAS II–IV — Rãs, Piolhos e Moscas',
    fundo: 2,
    meta: 20,
    spawns: [
        { sprites: ['assets/ra1.png', 'assets/ra2.png', 'assets/ra3.png'], w: 48, h: 42, vel: [2, 3.2], intervalo: 55, sway: 0 },
        { sprites: ['assets/moscas1.png', 'assets/moscas2.png', 'assets/moscas3.png'], w: 36, h: 30, vel: [3, 5], intervalo: 80, sway: 1.6 }
    ]
})

// ============================================================
//  FASE 3 — PESTE NO GADO (fórmula do antídoto)
//  ⚙️ MECÂNICA AJUSTÁVEL: a receita, os ingredientes e a dica
//  estão concentrados aqui em cima pra facilitar mudanças.
// ============================================================
let fase3 = {
    nome: 'PRAGAS V\u2013VI \u2014 Peste no Gado e \u00dalceras',
    INGREDIENTES: [
        { nome: 'Ervas Sagradas', cor: '#4f9e3a' },
        { nome: '\u00C1gua do Nilo', cor: '#3a7ddb' },
        { nome: 'Sal do Deserto', cor: '#e8e2cf' }
    ],
    receita: [1, 2, 0], // ordem correta: Água do Nilo → Sal do Deserto → Ervas Sagradas
    dica: '"Primeiro o rio que d\u00E1 vida, depois o sal que preserva, por fim a erva que cura."',
    init() {
        this.completa = false
        this.passo = 0
        this.feedback = ''
        this.feedbackTimer = 0
        this.fimTimer = 0
        this.borbulha = 0
        this.grupoTiros = []
        this.fontes = [new Fonte(100, 400), new Fonte(760, 400), new Fonte(430, 520)]
        p1.x = 240; p1.y = 440; p1.facing = 'dir'
        p2.x = 580; p2.y = 440; p2.facing = 'esq'
    },
    // chamado pelo keydown em cripta.js (idx 0..2)
    ingrediente(idx) {
        if (this.completa || this.passo >= this.receita.length) return
        if (idx === this.receita[this.passo]) {
            this.passo += 1
            this.feedback = this.INGREDIENTES[idx].nome + ' adicionado!'
            this.feedbackTimer = 90
            this.borbulha = 40
            tocaSom(SONS.item)
        } else {
            this.passo = 0
            this.feedback = 'Ingrediente errado! O caldeir\u00E3o ferveu em f\u00FAria!'
            this.feedbackTimer = 90
            players.forEach((pl) => { pl.levaDano(1) })
            tocaSom(SONS.erro)
        }
    },
    atual() {
        let area = { x: 20, y: 340, w: LARG - 40, h: ALT - 360, vert: true }
        players.forEach((pl) => {
            pl.atualizaTimers()
            pl.mov(area)
            if (teclas[pl.teclas.tiro]) pl.atira(this.grupoTiros, 'lado')
        })
        if (this.feedbackTimer > 0) this.feedbackTimer -= 1
        if (this.borbulha > 0) this.borbulha -= 1

        // tiros x fontes de infecção
        for (let i = this.grupoTiros.length - 1; i >= 0; i--) {
            let tiro = this.grupoTiros[i]
            tiro.mov()
            if (tiro.foraDaTela()) { this.grupoTiros.splice(i, 1); continue }
            for (let j = this.fontes.length - 1; j >= 0; j--) {
                let f = this.fontes[j]
                if (tiro.colid(f)) {
                    f.hp -= tiro.dano
                    if (f.hp <= 0) {
                        this.fontes.splice(j, 1)
                        efeitoTexto('FONTE DESTRUÍDA!', f.x + 27, f.y, '#9dff3a')
                        if (tiro.dono) tiro.dono.pts += 3
                    }
                    this.grupoTiros.splice(i, 1)
                    break
                }
            }
        }

        // vence quando a fórmula está pronta E todas as fontes destruídas
        if (this.passo >= this.receita.length && this.fontes.length === 0) {
            this.fimTimer += 1
            if (this.fimTimer > 60) this.completa = true
        } else {
            this.fimTimer = 0
        }
    },
    des() {
        desFundo(3)

        // gado ao fundo (silhuetas — substituível por asset depois)
        des.fillStyle = this.passo >= this.receita.length ? '#caa86a' : '#6b5a44'
        for (let i = 0; i < 4; i++) {
            let gx = 80 + i * 210
            des.fillRect(gx, 180, 90, 46)
            des.fillRect(gx + 70, 162, 30, 28)
            des.fillRect(gx + 8, 226, 10, 22)
            des.fillRect(gx + 70, 226, 10, 22)
        }

        // caldeirão (imagem estática — sem sheet, pra não "andar" de lado)
        let cx = LARG / 2 - 70, cy = 330
        let cald = pegaImg('assets/caldeirao.png')
        if (cald.complete && cald.naturalWidth > 0) {
            des.drawImage(cald, cx - 5, cy - 55, 150, 205)
        } else {
            des.fillStyle = '#222'
            des.beginPath()
            des.ellipse(cx + 70, cy + 70, 90, 60, 0, 0, Math.PI * 2)
            des.fill()
            des.fillStyle = this.passo > 0 ? '#7dd34a' : '#5d4a8a'
            des.beginPath()
            des.ellipse(cx + 70, cy + 30, 74, 22, 0, 0, Math.PI * 2)
            des.fill()
        }
        if (this.borbulha > 0) {
            des.fillStyle = 'rgba(255,255,255,0.5)'
            for (let i = 0; i < 5; i++) {
                des.beginPath()
                des.arc(cx + 30 + i * 22, cy + 20 - (40 - this.borbulha), 5, 0, Math.PI * 2)
                des.fill()
            }
        }

        this.fontes.forEach((f) => { f.des_obj() })
        this.grupoTiros.forEach((tr) => { tr.des_tiro() })
        players.forEach((pl) => { pl.des_obj() })

        // UI da fórmula
        let t = new Texto()
        t.des_text('Preparem o ant\u00EDdoto na ordem correta:', LARG / 2, 92, '#f3e9d2', 'bold 17px monospace', 'center')
        t.des_text(this.dica, LARG / 2, 118, '#c4943a', 'italic 15px monospace', 'center')

        this.INGREDIENTES.forEach((ing, i) => {
            let bx = LARG / 2 - 330 + i * 230
            des.fillStyle = ing.cor
            des.fillRect(bx, 140, 200, 52)
            des.fillStyle = '#000'
            des.font = 'bold 14px monospace'
            des.textAlign = 'center'
            des.fillText(ing.nome, bx + 100, 162)
            des.font = '12px monospace'
            des.fillText('P1: [' + (i + 1) + ']   P2: [' + ['8', '9', '0'][i] + ']', bx + 100, 182)
            des.textAlign = 'left'
        })

        // progresso da receita
        let barra = new BarraProgresso()
        barra.des(LARG / 2 - 120, 215, 240, 22, this.passo / this.receita.length, '#2a2118', '#7dd34a', 'F\u00F3rmula: ' + this.passo + '/' + this.receita.length)

        if (this.feedbackTimer > 0) {
            t.des_text(this.feedback, LARG / 2, 268, this.feedback.indexOf('errado') >= 0 ? '#ff5050' : '#7dd34a', 'bold 16px monospace', 'center')
        }
        if (this.passo >= this.receita.length && this.fontes.length === 0) {
            t.des_text('O GADO FOI SALVO!', LARG / 2, 300, '#ffd84d', 'bold 24px monospace', 'center')
        } else {
            t.des_text('Fontes de infecção restantes: ' + this.fontes.length + '  — atire nelas!', LARG / 2, 300, '#9dff3a', 'bold 15px monospace', 'center')
        }
    }
}

// ============================================================
//  FASE 4 — ÚLCERAS E FERIDAS (labirinto de grades de ferro)
//  Poças de ácido dão dano. Atirar nas fontes de infecção.
//  3 amuletos escondidos em vasos (distribuição aleatória).
// ============================================================
let fase4 = {
    nome: 'PRAGA VI \u2014 \u00DAlceras e Feridas',
    init() {
        this.completa = false
        this.grupoTiros = []
        this.grupoColetaveis = []
        this.amuletos = 0

        // labirinto de grades de ferro
        this.paredes = [
            new Parede(0, 60, LARG, 12),
            new Parede(0, ALT - 12, LARG, 12),
            new Parede(0, 60, 12, ALT - 60),
            new Parede(LARG - 12, 60, 12, ALT - 60),
            new Parede(12, 195, 600, 12),
            new Parede(290, 330, LARG - 302, 12),
            new Parede(12, 465, 600, 12),
            new Parede(700, 72, 12, 80),
            new Parede(150, 342, 12, 80)
        ]

        // poças de pus/ácido
        this.pocas = [
            new Poca(200, 110, 70, 34), new Poca(520, 250, 70, 34),
            new Poca(700, 245, 70, 34), new Poca(360, 390, 70, 34),
            new Poca(740, 510, 70, 34), new Poca(120, 515, 70, 34)
        ]

        // fontes de infecção (alvos)
        this.fontes = [new Fonte(810, 105), new Fonte(80, 255), new Fonte(810, 395)]

        // vasos — 3 deles ganham amuleto, distribuído aleatoriamente
        this.vasos = [
            new Vaso(60, 130, 36, 46, 'assets/vaso1.png'),
            new Vaso(420, 130, 36, 46, 'assets/vaso2.png'),
            new Vaso(330, 250, 36, 46, 'assets/vaso3.png'),
            new Vaso(600, 400, 36, 46, 'assets/vaso1.png'),
            new Vaso(230, 525, 36, 46, 'assets/vaso2.png'),
            new Vaso(560, 525, 36, 46, 'assets/vaso3.png')
        ]
        // sorteio: embaralha os índices e marca 3 com amuleto
        let indices = this.vasos.map((v, i) => i)
        for (let i = indices.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1))
            let tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp
        }
        indices.slice(0, 3).forEach((i) => { this.vasos[i].temColetavel = true })

        p1.x = 40; p1.y = 100; p1.facing = 'dir'
        p2.x = 100; p2.y = 100; p2.facing = 'dir'
    },
    atual() {
        let area = { x: 12, y: 72, w: LARG - 24, h: ALT - 84, vert: true }
        players.forEach((pl) => {
            pl.atualizaTimers()
            pl.mov(area, this.paredes)
            if (teclas[pl.teclas.tiro]) pl.atira(this.grupoTiros, 'lado')
            // dano das poças
            this.pocas.forEach((poca) => {
                if (pl.vivo && pl.colid(poca)) pl.levaDano(1)
            })
        })

        // tiros
        for (let i = this.grupoTiros.length - 1; i >= 0; i--) {
            let tiro = this.grupoTiros[i]
            tiro.mov()
            if (tiro.foraDaTela() || tiro.dono && this.paredes.some((pa) => tiro.colid(pa))) {
                this.grupoTiros.splice(i, 1)
                continue
            }
            // tiro x fonte
            let acertou = false
            for (let j = this.fontes.length - 1; j >= 0; j--) {
                let f = this.fontes[j]
                if (tiro.colid(f)) {
                    f.hp -= tiro.dano
                    if (f.hp <= 0) {
                        this.fontes.splice(j, 1)
                        efeitoTexto('FONTE DESTRU\u00CDDA!', f.x + 27, f.y, '#9dff3a')
                        if (tiro.dono) tiro.dono.pts += 3
                    }
                    acertou = true
                    break
                }
            }
            if (!acertou) {
                // tiro x vaso
                for (let j = 0; j < this.vasos.length; j++) {
                    let v = this.vasos[j]
                    if (!v.quebrado && tiro.colid(v)) {
                        v.quebrado = true
                        tocaSom(SONS.quebra)
                        if (v.temColetavel) {
                            this.grupoColetaveis.push(new Coletavel(v.x + 3, v.y + 8, 'amuleto', false))
                        } else {
                            efeitoTexto('vazio...', v.x + 18, v.y, '#8a7a5a')
                        }
                        acertou = true
                        break
                    }
                }
            }
            if (acertou) this.grupoTiros.splice(i, 1)
        }

        // pegar amuletos
        for (let i = this.grupoColetaveis.length - 1; i >= 0; i--) {
            let c = this.grupoColetaveis[i]
            c.mov()
            for (let j = 0; j < players.length; j++) {
                let pl = players[j]
                if (pl.vivo && pl.colid(c)) {
                    if (c.tipo === 'amuleto') {
                        this.amuletos += 1
                        pl.cura(1)
                        efeitoTexto('AMULETO ' + this.amuletos + '/3', pl.x + pl.w / 2, pl.y - 10, '#ffd84d')
                        tocaSom(SONS.item)
                    } else {
                        aplicaColetavel(pl, c)
                    }
                    this.grupoColetaveis.splice(i, 1)
                    break
                }
            }
        }

        if (this.fontes.length === 0 && this.amuletos >= 3) this.completa = true
    },
    des() {
        desFundo(4)
        this.pocas.forEach((p) => { p.des_obj() })
        this.paredes.forEach((p) => { p.des_obj() })
        this.vasos.forEach((v) => { if (!v.quebrado) v.des_obj() })
        this.fontes.forEach((f) => { f.des_obj() })
        this.grupoColetaveis.forEach((c) => { c.des_obj() })
        this.grupoTiros.forEach((t) => { t.des_tiro() })
        players.forEach((pl) => { pl.des_obj() })
        let t = new Texto()
        t.des_text('Fontes restantes: ' + this.fontes.length + '   |   Amuletos: ' + this.amuletos + '/3', LARG / 2, 88, '#f3e9d2', 'bold 16px monospace', 'center')
        t.des_text('Cuidado com as po\u00E7as de \u00E1cido!', LARG / 2, ALT - 24, '#9dff3a', '13px monospace', 'center')
    }
}

// ============================================================
//  FASE 5 — CHUVA DE GRANIZO
//  Desviar das pedras + segurar ESPAÇO na zona do mecanismo
//  para encher a barra (portão abrindo)
// ============================================================
let fase5 = {
    nome: 'PRAGA VII \u2014 Chuva de Granizo',
    init() {
        this.completa = false
        this.grupoGranizos = []
        this.time1 = 0
        this.barra = 0 // 0..100
        this.zona = { x: 374, y: 440, w: 150, h: 130 }     // chão, centralizada na frente do portão
        this.portao = { x: 406, y: 246, w: 87, h: 188 }    // abertura exata da porta na arte do fundo
        p1.x = 240; p1.y = ALT - 120; p1.facing = 'dir'
        p2.x = 620; p2.y = ALT - 120; p2.facing = 'esq'
    },
    atual() {
        // players só andam na faixa do chão (a parede termina em ~y 435)
        let area = { x: 10, y: 390, w: LARG - 20, h: ALT - 402, vert: true }
        players.forEach((pl) => {
            pl.atualizaTimers()
            pl.mov(area)
            // dentro da zona segurando ESPAÇO → alimenta a barra
            if (pl.vivo && teclas[' '] &&
                pl.x + pl.w > this.zona.x && pl.x < this.zona.x + this.zona.w &&
                pl.y + pl.h > this.zona.y && pl.y < this.zona.y + this.zona.h) {
                this.barra += 0.28
            }
        })

        // spawn de granizo
        this.time1 += 1
        if (this.time1 >= 16) {
            this.time1 = 0
            let n = Math.floor(Math.random() * 3) + 1
            let tam = 26 + Math.random() * 30
            let posX = Math.random() * (LARG - tam - 10) + 5
            let vel = Math.random() * (8 - 4.5) + 4.5
            this.grupoGranizos.push(new Granizo(posX, -tam - 10, tam, tam, 'assets/granizo' + n + '.png', vel))
        }

        for (let i = this.grupoGranizos.length - 1; i >= 0; i--) {
            let g = this.grupoGranizos[i]
            g.mov()
            if (g.y > ALT + 40) { this.grupoGranizos.splice(i, 1); continue }
            for (let j = 0; j < players.length; j++) {
                let pl = players[j]
                if (pl.vivo && pl.colid(g)) {
                    pl.levaDano(1)
                    this.grupoGranizos.splice(i, 1)
                    break
                }
            }
        }

        if (this.barra >= 100) {
            this.barra = 100
            this.completa = true
            tocaSom(SONS.porta)
        }
    },
    des() {
        desFundo(5)

        // porta de pedra (imagem) sobe conforme a barra enche, presa dentro da abertura
        let porta = pegaImg('assets/portaoFase5.png')
        if (porta.complete && porta.naturalWidth > 0) {
            let p = this.portao
            des.save()
            des.beginPath()
            des.rect(p.x, p.y, p.w, p.h)
            des.clip()
            des.drawImage(porta, p.x, p.y - (this.barra / 100) * p.h, p.w, p.h)
            des.restore()
        }

        // zona do mecanismo
        des.strokeStyle = '#ffd84d'
        des.lineWidth = 2
        des.setLineDash([8, 6])
        des.strokeRect(this.zona.x, this.zona.y, this.zona.w, this.zona.h)
        des.setLineDash([])
        des.fillStyle = 'rgba(255, 216, 77, 0.12)'
        des.fillRect(this.zona.x, this.zona.y, this.zona.w, this.zona.h)
        des.fillStyle = '#ffd84d'
        des.font = 'bold 13px monospace'
        des.textAlign = 'center'
        des.fillText('SEGURE [ESPA\u00C7O]', this.zona.x + this.zona.w / 2, this.zona.y + this.zona.h / 2)
        des.textAlign = 'left'

        this.grupoGranizos.forEach((g) => { g.des_obj() })
        players.forEach((pl) => { pl.des_obj() })

        let barra = new BarraProgresso()
        barra.des(LARG / 2 - 150, 70, 300, 20, this.barra / 100, '#2a2118', '#c4943a', 'PORT\u00C3O: ' + Math.floor(this.barra) + '%')
    }
}

let fase6 = fabricaFaseTiro({
    nome: 'PRAGA VIII — Invasão de Gafanhotos',
    fundo: 6,
    meta: 25,
    spawns: [
        { sprites: ['assets/gafanhotos1.png', 'assets/gafanhotos2.png', 'assets/gafanhotos3.png'], w: 40, h: 32, vel: [3, 5.5], intervalo: 38, sway: 1.2 },
        { sprites: ['assets/gafanhotos1.png', 'assets/gafanhotos2.png', 'assets/gafanhotos3.png'], w: 52, h: 42, vel: [2.2, 3.5], intervalo: 95, sway: 0.6, hp: 2 }
    ]
})

// ============================================================
//  FASE 7 — TREVAS (labirinto com luz baixa)
//  Andar no escuro e achar a saída. Luz só ao redor dos players.
// ============================================================
let fase7 = {
    nome: 'PRAGA IX \u2014 Trevas',
    init() {
        this.completa = false
        // labirinto em grade 6x5: um caminho certo, dois falsos e becos curtos
        this.paredes = [
            new Parede(0, 60, LARG, 12),
            new Parede(0, ALT - 12, LARG, 12),
            new Parede(0, 60, 12, ALT - 60),
            new Parede(LARG - 12, 60, 12, ALT - 60),
            new Parede(140, 170, 14, 116),
            new Parede(140, 374, 14, 214),
            new Parede(280, 170, 14, 320),
            new Parede(420, 272, 14, 116),
            new Parede(560, 170, 14, 116),
            new Parede(560, 374, 14, 214),
            new Parede(700, 272, 14, 218),
            new Parede(140, 170, 748, 14),
            new Parede(420, 272, 154, 14),
            new Parede(560, 374, 154, 14),
            new Parede(280, 476, 154, 14)
        ]
        this.porta = new Porta(LARG - 95, ALT - 150, 76, 135)
        // GoldenCarlos escondido no fim do corredor-isca do topo
        this.grupoColetaveis = [new Coletavel(795, 95, 'goldencarlos', false)]
        this.fimTimer = 0
        // canvas de escuridão (criado uma vez)
        if (!this.escuro) {
            this.escuro = document.createElement('canvas')
            this.escuro.width = LARG
            this.escuro.height = ALT
        }
        p1.x = 30; p1.y = 95; p1.facing = 'dir'
        p2.x = 84; p2.y = 95; p2.facing = 'dir'
    },
    atual() {
        let area = { x: 12, y: 72, w: LARG - 24, h: ALT - 84, vert: true }
        players.forEach((pl) => {
            pl.atualizaTimers()
            pl.mov(area, this.paredes)
        })
        // pegar o GoldenCarlos escondido
        for (let i = this.grupoColetaveis.length - 1; i >= 0; i--) {
            let c = this.grupoColetaveis[i]
            c.mov()
            for (let j = 0; j < players.length; j++) {
                let pl = players[j]
                if (pl.vivo && pl.colid(c)) {
                    aplicaColetavel(pl, c)
                    this.grupoColetaveis.splice(i, 1)
                    break
                }
            }
        }
        // os dois (vivos) precisam chegar na porta
        let vivos = players.filter((pl) => pl.vivo)
        if (vivos.length > 0 && vivos.every((pl) => pl.colid(this.porta))) {
            this.fimTimer += 1
            if (this.fimTimer > 30) this.completa = true
        } else {
            this.fimTimer = 0
        }
    },
    des() {
        desFundo(7)
        this.paredes.forEach((p) => { p.des_obj() })
        this.porta.des_obj()
        this.grupoColetaveis.forEach((c) => { c.des_obj() }) // fica sob a escuridão: só aparece na luz
        players.forEach((pl) => { pl.des_obj() })

        // camada de escuridão com furos de luz ao redor dos players
        let ctx2 = this.escuro.getContext('2d')
        ctx2.clearRect(0, 0, LARG, ALT)
        ctx2.fillStyle = '#000'
        ctx2.fillRect(0, 0, LARG, ALT)
        ctx2.globalCompositeOperation = 'destination-out'
        players.forEach((pl) => {
            if (!pl.vivo) return
            let grad = ctx2.createRadialGradient(
                pl.x + pl.w / 2, pl.y + pl.h / 2, 10,
                pl.x + pl.w / 2, pl.y + pl.h / 2, 60)
            grad.addColorStop(0, 'rgba(0,0,0,1)')
            grad.addColorStop(1, 'rgba(0,0,0,0)')
            ctx2.fillStyle = grad
            ctx2.beginPath()
            ctx2.arc(pl.x + pl.w / 2, pl.y + pl.h / 2, 60, 0, Math.PI * 2)
            ctx2.fill()
        })
        ctx2.globalCompositeOperation = 'source-over'
        des.drawImage(this.escuro, 0, 0)

        let t = new Texto()
        t.des_text('Encontrem a sa\u00EDda na escurid\u00E3o...', LARG / 2, 88, 'rgba(243,233,210,0.6)', 'italic 15px monospace', 'center')
    }
}
