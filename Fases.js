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