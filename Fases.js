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

// ============================================================
//  FÁBRICA DE FASES DE TIRO (fases 2 e 6)
//  Mesma lógica do jogo base: timers de spawn, grupoTiros,
//  splice ao colidir / sair da tela
// ============================================================
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
            let zT = cfg.zonaTopo != null ? cfg.zonaTopo : 90
            p1.x = 130; p1.y = zT + 20; p1.facing = 'dir'
            p2.x = 130; p2.y = zT + 150; p2.facing = 'dir'
        },
        criaInimigo() {
            let zTopo = cfg.zonaTopo != null ? cfg.zonaTopo : 90
            let zBase = cfg.zonaBase != null ? cfg.zonaBase : ALT - 20
            cfg.spawns.forEach((s, i) => {
                this.timers[i] += 1
                if (this.timers[i] >= s.intervalo) {
                    this.timers[i] = 0
                    let posY = zTopo + Math.random() * (zBase - zTopo - s.h)
                    let sprite = s.sprites[Math.floor(Math.random() * s.sprites.length)]
                    let vel = Math.random() * (s.vel[1] - s.vel[0]) + s.vel[0]
                    this.grupoInimigos.push(new Inimigo(LARG + 20, posY, s.w, s.h, sprite, vel, s.hp || 1, s.sway, s.sheet, s.frames, s.anim))
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
            // zona (igual RUA_TOPO/RUA_BASE); player fica na faixa esquerda e atira pra direita
            let zTopo = cfg.zonaTopo != null ? cfg.zonaTopo : 90
            let zBase = cfg.zonaBase != null ? cfg.zonaBase : ALT - 20
            let area = { x: 10, y: zTopo, w: LARG / 2 - 10, h: zBase - zTopo, vert: true }
            players.forEach((pl) => {
                pl.atualizaTimers()
                pl.mov(area)
                if (teclas[pl.teclas.tiro]) pl.atira(this.grupoTiros, 'lado')
            })

            this.criaInimigo()
            this.destroiInimigo()

            this.grupoTiros.forEach((t) => { t.mov() })
            this.grupoTiros = this.grupoTiros.filter((t) => !t.foraDaTela())

            for (let i = this.grupoInimigos.length - 1; i >= 0; i--) {
                let ini = this.grupoInimigos[i]
                ini.mov()
                // o sway não pode tirar o inimigo da faixa
                if (ini.y < zTopo) ini.y = zTopo
                if (ini.y + ini.h > zBase) ini.y = zBase - ini.h
                if (ini.x < -70) { this.grupoInimigos.splice(i, 1); continue }
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

// FASE 2 — Rãs e moscas
let fase2 = fabricaFaseTiro({
    nome: 'PRAGAS II\u2013IV \u2014 R\u00e3s, Moscas e Mosquitos',
    fundo: 2,
    meta: 20,
    zonaTopo: 340, zonaBase: 580, // faixa onde inimigos e players andam (340 = onde o chão do fundo começa)
    spawns: [
        { sprites: ['assets/ra1.png', 'assets/ra2.png', 'assets/ra3.png'], sheet: 'assets/ra_sheet.png', frames: 3, w: 84, h: 44, vel: [4.5, 6.5], intervalo: 110, sway: 0 },
        { sprites: ['assets/moscas1.png', 'assets/moscas2.png', 'assets/moscas3.png'], sheet: 'assets/mosquito_sheet.png', frames: 3, w: 62, h: 56, vel: [4, 6], intervalo: 80, sway: 2.2 },
        { sprites: ['assets/moscas1.png', 'assets/moscas2.png', 'assets/moscas3.png'], sheet: 'assets/mosca_sheet.png', frames: 3, w: 68, h: 72, vel: [3, 4.5], intervalo: 100, sway: 1.4 }
    ]
})

// FASE 6 — Gafanhotos
let fase6 = fabricaFaseTiro({
    nome: 'PRAGA VIII \u2014 Invas\u00E3o de Gafanhotos',
    fundo: 6,
    meta: 25,
    zonaTopo: 340, zonaBase: 580, // faixa onde inimigos e players andam (340 = onde o chão do fundo começa)
    spawns: [
        { sprites: ['assets/gafanhotos1.png', 'assets/gafanhotos2.png', 'assets/gafanhotos3.png'], sheet: 'assets/gafanhoto_sheet.png', frames: 3, w: 66, h: 48, vel: [4, 6], intervalo: 38, sway: 1.6, anim: 0.05 },
        { sprites: ['assets/gafanhotos1.png', 'assets/gafanhotos2.png', 'assets/gafanhotos3.png'], sheet: 'assets/gafanhoto_sheet.png', frames: 3, w: 80, h: 58, vel: [3, 4.5], intervalo: 90, sway: 0.8, hp: 2, anim: 0.05 }
    ]
})


// ============================================================
//  FASE 8 — MORTE DOS PRIMOGÊNITOS (boss: Anjo da Morte)
//  Tiro normal mirado + especial a cada X segundos (mais dano)
// ============================================================
let fase8 = {
    nome: 'PRAGA X \u2014 O Anjo da Morte',
    init() {
        this.completa = false
        this.boss = new Boss(LARG / 2 - 75, 95, 150, 160)
        this.grupoTiros = []      // tiros dos players
        this.grupoTirosBoss = []
        this.grupoColetaveis = []
        this.timeTiro = 0
        this.timeEspecial = 0
        this.timeDrop = 0
        p1.x = 280; p1.y = ALT - 110; p1.facing = 'dir'
        p2.x = 580; p2.y = ALT - 110; p2.facing = 'esq'
        iniciaMusicaBoss()
    },
    atual() {
        let area = { x: 10, y: ALT - 230, w: LARG - 20, h: 220, vert: true }
        players.forEach((pl) => {
            pl.atualizaTimers()
            pl.mov(area)
            if (teclas[pl.teclas.tiro]) pl.atira(this.grupoTiros, 'cima')
        })

        this.boss.mov()

        // tiro normal do boss: mira em um player vivo aleatório
        this.timeTiro += 1
        if (this.timeTiro >= 55) {
            this.timeTiro = 0
            let vivos = players.filter((pl) => pl.vivo)
            if (vivos.length > 0) {
                let alvo = vivos[Math.floor(Math.random() * vivos.length)]
                let bx = this.boss.x + this.boss.w / 2
                let by = this.boss.y + this.boss.h
                let dx = (alvo.x + alvo.w / 2) - bx
                let dy = (alvo.y + alvo.h / 2) - by
                let dist = Math.sqrt(dx * dx + dy * dy) || 1
                this.grupoTirosBoss.push(new TiroBoss(bx - 21, by - 10, 42, 42, dx / dist * 4.5, dy / dist * 4.5, 1, false))
            }
        }

        // ⚙️ ESPECIAL DO BOSS: a cada 8 segundos (480 frames), dano 3
        this.timeEspecial += 1
        if (this.timeEspecial >= 480) {
            this.timeEspecial = 0
            let bx = this.boss.x + this.boss.w / 2
            this.grupoTirosBoss.push(new TiroBoss(bx - 30, this.boss.y + this.boss.h - 10, 60, 60, 0, 3, 3, true))
            efeitoTexto('!!! ESPECIAL !!!', bx, this.boss.y - 10, '#ff3030')
        }

        // tiros dos players x boss
        for (let i = this.grupoTiros.length - 1; i >= 0; i--) {
            let tiro = this.grupoTiros[i]
            tiro.mov()
            if (tiro.foraDaTela()) { this.grupoTiros.splice(i, 1); continue }
            if (tiro.colid(this.boss)) {
                this.boss.vida -= tiro.dano
                if (tiro.dono) tiro.dono.pts += 1
                this.grupoTiros.splice(i, 1)
            }
        }

        // tiros do boss x players
        for (let i = this.grupoTirosBoss.length - 1; i >= 0; i--) {
            let tb = this.grupoTirosBoss[i]
            tb.mov()
            if (tb.y > ALT + 80 || tb.x < -80 || tb.x > LARG + 80) {
                this.grupoTirosBoss.splice(i, 1)
                continue
            }
            for (let j = 0; j < players.length; j++) {
                let pl = players[j]
                if (pl.vivo && pl.colid(tb)) {
                    pl.levaDano(tb.dano)
                    this.grupoTirosBoss.splice(i, 1)
                    break
                }
            }
        }

        // desafio final: sem coletáveis aqui

        if (this.boss.vida <= 0) {
            this.boss.vida = 0
            this.completa = true
        }
    },
    des() {
        desFundo(8)
        this.boss.des_obj()
        this.grupoTirosBoss.forEach((t) => { t.des_obj() })
        this.grupoColetaveis.forEach((c) => { c.des_obj() })
        this.grupoTiros.forEach((t) => { t.des_tiro() })
        players.forEach((pl) => { pl.des_obj() })

        // barra de vida do boss com rosto
        let bx = LARG / 2 - 180
        des.drawImage(pegaImg('assets/selecaoBoss1.png'), bx - 48, 66, 42, 42)
        let barra = new BarraProgresso()
        barra.des(bx, 76, 360, 22, this.boss.vida / this.boss.maxVida, '#2a1020', '#b14dff', 'ANJO DA MORTE: ' + Math.max(0, Math.ceil(this.boss.vida)))
    }
}
