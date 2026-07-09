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

const NOTAS = [
    { id: 'c',      nome: 'Dó',     audio: novoAudio('./audios/nota1.wav') },
    { id: 'rbemol', nome: 'Ré♭', audio: novoAudio('./audios/nota2.wav') },
    { id: 'e',      nome: 'Mi',          audio: novoAudio('./audios/nota3.wav') },
    { id: 'f',      nome: 'Fá',     audio: novoAudio('./audios/nota4.wav') },
    { id: 'g',      nome: 'Sol',         audio: novoAudio('./audios/nota5.wav') },
    { id: 'lbemol', nome: 'Lá♭', audio: novoAudio('./audios/nota6.wav') },
    { id: 'b',      nome: 'Si',          audio: novoAudio('./audios/nota7.wav') }
]
const TECLAS_NOTAS_P1 = { '1': 0, '2': 1, '3': 2, '4': 3, '5': 4, '6': 5, '7': 6 }
const TECLAS_NOTAS_P2 = { 'q': 0, 'w': 1, 'e': 2, 'r': 3, 't': 4, 'y': 5, 'u': 6 }

let fase1 = {
    nome: 'PRAGA I — Água em Sangue',
    init() {
        this.completa = false
        this.prog = [0, 0]
        this.erro = [0, 0]
        this.notasVisuais = []
        this.harpas = [new Harpa(150, 300, 150, 170), new Harpa(600, 300, 150, 170)]
        this.fimTimer = 0
        p1.x = 90;  p1.y = 360; p1.facing = 'dir'
        p2.x = 770; p2.y = 360; p2.facing = 'esq'
    },
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

        this.desSequencia(0, 70, 100, TECLAS_NOTAS_P1)
        this.desSequencia(1, LARG - 70 - 7 * 52, 100, TECLAS_NOTAS_P2)

        let t = new Texto()
        t.des_text('Toquem a escala sagrada para purificar a água!', LARG / 2, 88, '#f3e9d2', 'bold 17px monospace', 'center')
    },
    desSequencia(jogador, x, y, mapaTeclas) {
        let teclasNota = Object.keys(mapaTeclas)
        let prog = this.prog[jogador]
        let nomeP = jogador === 0 ? NOMES.p1 : NOMES.p2
        des.fillStyle = this.erro[jogador] > 0 ? '#ff5050' : (jogador === 0 ? '#3aa0ff' : '#37d67a')
        des.font = 'bold 14px monospace'
        des.fillText(nomeP + (prog >= NOTAS.length ? ' ✓ COMPLETO' : ''), x, y - 12)
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

let fase6 = fabricaFaseTiro({
    nome: 'PRAGA VIII — Invasão de Gafanhotos',
    fundo: 6,
    meta: 25,
    spawns: [
        { sprites: ['assets/gafanhotos1.png', 'assets/gafanhotos2.png', 'assets/gafanhotos3.png'], w: 40, h: 32, vel: [3, 5.5], intervalo: 38, sway: 1.2 },
        { sprites: ['assets/gafanhotos1.png', 'assets/gafanhotos2.png', 'assets/gafanhotos3.png'], w: 52, h: 42, vel: [2.2, 3.5], intervalo: 95, sway: 0.6, hp: 2 }
    ]
})