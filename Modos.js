// ============================================================
//  A CRIPTA PERDIDA — Modos.js (sobrevivência e 1v1)
//  Mesmo estilo dos models do jogo base: mover/desenhar/reiniciar
// ============================================================

// LIMITES DA ARENA (área do chão dos cenários)
const ARENA_TOPO = 340
const ARENA_BASE = 580

// ============================================================
//  SOBREVIVÊNCIA — ondas infinitas alternando os cenários
// ============================================================

// CENÁRIOS (rotação por onda; a cada volta completa a dificuldade sobe)
const ONDAS = [
    {
        nome: 'PRAGAS', fundo: 2, tipo: 'tiro', meta: 15,
        spawns: [
            { sheet: 'assets/ra_sheet.png', frames: 3, w: 84, h: 44, vel: [3, 4.5], intervalo: 100, sway: 0 },
            { sheet: 'assets/mosquito_sheet.png', frames: 3, w: 62, h: 56, vel: [4, 6], intervalo: 75, sway: 2.2 },
            { sheet: 'assets/mosca_sheet.png', frames: 3, w: 68, h: 72, vel: [3, 4.5], intervalo: 95, sway: 1.4 }
        ]
    },
    { nome: 'GRANIZO', fundo: 5, tipo: 'chuva', tempo: 1200 },
    {
        nome: 'GAFANHOTOS', fundo: 6, tipo: 'tiro', meta: 18,
        spawns: [
            { sheet: 'assets/gafanhoto_sheet.png', frames: 3, w: 66, h: 48, vel: [4, 6], intervalo: 36, sway: 1.6, anim: 0.05 },
            { sheet: 'assets/gafanhoto_sheet.png', frames: 3, w: 80, h: 58, vel: [3, 4.5], intervalo: 85, sway: 0.8, hp: 2, anim: 0.05 }
        ]
    }
]

let sobrevivencia = {
    nome: 'SOBREVIVÊNCIA',
    onda: 0,
    ciclo: 1,
    pontos: 0,
    mortes: 0,
    timer: 0,
    avisoTimer: 0,
    fim: false,
    grupoTiros: [],
    grupoInimigos: [],
    grupoGranizos: [],
    timers: [],

    // dificuldade cresce a cada volta completa nos cenários
    dificuldade() {
        return 1 + (this.ciclo - 1) * 0.18
    },

    cenario() {
        return ONDAS[this.onda % ONDAS.length]
    },

    init() {
        this.onda = 0
        this.ciclo = 1
        this.pontos = 0
        this.fim = false
        p1.vivo = true; p1.vida = p1.maxVida; p1.pts = 0
        p2.vivo = true; p2.vida = p2.maxVida; p2.pts = 0
        this.preparaOnda()
    },

    preparaOnda() {
        let c = this.cenario()
        this.mortes = 0
        this.timer = c.tempo || 0
        this.avisoTimer = 120
        this.grupoTiros = []
        this.grupoInimigos = []
        this.grupoGranizos = []
        this.timers = (c.spawns || []).map(() => 0)
        // quem caiu na onda passada volta com metade da vida
        players.forEach((pl) => {
            if (!pl.vivo) { pl.vivo = true; pl.vida = Math.ceil(pl.maxVida / 2) }
            pl.invul = 0
            pl.tiroTimer = 0
            pl.cooldown = 0
            pl.vel = 4
        })
        p1.x = 130; p1.y = ARENA_TOPO + 20; p1.facing = 'dir'
        p2.x = 130; p2.y = ARENA_TOPO + 150; p2.facing = 'dir'
    },

    proximaOnda() {
        this.onda += 1
        if (this.onda % ONDAS.length === 0) this.ciclo += 1
        tocaSom(SONS.porta)
        this.preparaOnda()
    },

    criaInimigo() {
        let c = this.cenario()
        let d = this.dificuldade()
        c.spawns.forEach((s, i) => {
            this.timers[i] += 1
            if (this.timers[i] >= Math.max(18, s.intervalo / d)) {
                this.timers[i] = 0
                let posY = ARENA_TOPO + Math.random() * (ARENA_BASE - ARENA_TOPO - s.h)
                let vel = (Math.random() * (s.vel[1] - s.vel[0]) + s.vel[0]) * d
                this.grupoInimigos.push(new Inimigo(LARG + 20, posY, s.w, s.h, null, vel, s.hp || 1, s.sway, s.sheet, s.frames, s.anim))
            }
        })
    },

    criaGranizo() {
        let d = this.dificuldade()
        if (Math.random() < 0.09 * d) {
            let n = Math.floor(Math.random() * 3) + 1
            let tam = 26 + Math.random() * 30
            let posX = Math.random() * (LARG - tam - 10) + 5
            let vel = (Math.random() * (8 - 4.5) + 4.5) * d
            this.grupoGranizos.push(new Granizo(posX, -tam - 10, tam, tam, 'assets/granizo' + n + '.png', vel))
        }
    },

    atual() {
        if (this.fim) return
        let c = this.cenario()
        let area = { x: 10, y: ARENA_TOPO, w: LARG - 20, h: ARENA_BASE - ARENA_TOPO + 8, vert: true }

        players.forEach((pl) => {
            pl.atualizaTimers()
            pl.mov(area)
            if (c.tipo === 'tiro' && teclas[pl.teclas.tiro]) pl.atira(this.grupoTiros, 'lado')
        })

        if (c.tipo === 'tiro') {
            this.criaInimigo()

            this.grupoTiros.forEach((t) => { t.mov() })
            this.grupoTiros = this.grupoTiros.filter((t) => !t.foraDaTela())

            for (let i = this.grupoInimigos.length - 1; i >= 0; i--) {
                let ini = this.grupoInimigos[i]
                ini.mov()
                if (ini.y < ARENA_TOPO) ini.y = ARENA_TOPO
                if (ini.y + ini.h > ARENA_BASE + 8) ini.y = ARENA_BASE + 8 - ini.h
                if (ini.x < -70) { this.grupoInimigos.splice(i, 1); continue }
                let saiu = false
                for (let j = 0; j < players.length; j++) {
                    let pl = players[j]
                    if (pl.vivo && pl.colid(ini)) {
                        pl.levaDano(1)
                        this.grupoInimigos.splice(i, 1)
                        saiu = true
                        break
                    }
                }
                if (saiu) continue
                for (let j = this.grupoTiros.length - 1; j >= 0; j--) {
                    let tiro = this.grupoTiros[j]
                    if (tiro.colid(ini)) {
                        ini.hp -= tiro.dano
                        this.grupoTiros.splice(j, 1)
                        if (ini.hp <= 0) {
                            this.grupoInimigos.splice(i, 1)
                            this.mortes += 1
                            this.pontos += this.ciclo
                            if (tiro.dono) tiro.dono.pts += 1
                        }
                        break
                    }
                }
            }
            if (this.mortes >= c.meta) this.proximaOnda()
        }

        if (c.tipo === 'chuva') {
            this.criaGranizo()
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
            this.timer -= 1
            if (this.timer <= 0) {
                this.pontos += 5 * this.ciclo
                this.proximaOnda()
            }
        }

        if (this.avisoTimer > 0) this.avisoTimer -= 1
        if (!p1.vivo && !p2.vivo) this.fim = true
    },

    des() {
        let c = this.cenario()
        desFundo(c.fundo)
        this.grupoInimigos.forEach((i) => { i.des_obj() })
        this.grupoGranizos.forEach((g) => { g.des_obj() })
        this.grupoTiros.forEach((t) => { t.des_tiro() })
        players.forEach((pl) => { pl.des_obj() })

        let t = new Texto()
        t.des_text('ONDA ' + (this.onda + 1) + ' — ' + c.nome + '   |   Pontos: ' + this.pontos, LARG / 2, 88, '#f3e9d2', 'bold 16px monospace', 'center')
        if (c.tipo === 'tiro') {
            t.des_text('Eliminados: ' + this.mortes + ' / ' + c.meta, LARG / 2, 110, '#c4943a', '14px monospace', 'center')
        } else {
            t.des_text('Sobrevivam por ' + Math.ceil(this.timer / 60) + 's!', LARG / 2, 110, '#9dd3ff', '14px monospace', 'center')
        }
        if (this.avisoTimer > 0 && Math.floor(this.avisoTimer / 12) % 2 === 0) {
            t.des_text(c.nome + '!', LARG / 2, ALT / 2 - 40, '#ffd84d', 'bold 42px monospace', 'center')
        }

        if (this.fim) {
            des.fillStyle = 'rgba(10, 4, 4, 0.82)'
            des.fillRect(0, 0, LARG, ALT)
            t.des_text('A CRIPTA OS CONSUMIU...', LARG / 2, ALT / 2 - 40, '#ff5050', 'bold 34px monospace', 'center')
            t.des_text('Ondas vencidas: ' + this.onda + '   |   Pontos: ' + this.pontos, LARG / 2, ALT / 2 + 4, '#f3e9d2', '18px monospace', 'center')
            t.des_text('ENTER para voltar ao menu', LARG / 2, ALT / 2 + 46, '#c4943a', '14px monospace', 'center')
        }
    }
}

// ============================================================
//  1V1 — duelo na arena
// ============================================================
let pvp = {
    nome: 'DUELO 1V1',
    nomes: ['PLAYER 1', 'PLAYER 2'],
    entrada: -1,   // 0/1 = qual jogador está digitando o nome | -1 = lutando
    digitado: '',
    tAnim: 0,
    fimPlacar: 0,  // frames da telinha de placar final antes de voltar pro menu
    placar: [0, 0],
    vencedor: 0, // 0 = lutando
    grupoTiros: [],

    // entrada pelo menu: zera o placar e pede os nomes
    init() {
        this.placar = [0, 0]
        this.nomes = ['PLAYER 1', 'PLAYER 2']
        this.entrada = 0
        this.digitado = ''
        this.resetLuta()
    },

    // revanche: mantém nomes e placar
    resetLuta() {
        this.vencedor = 0
        this.grupoTiros = []
        players.forEach((pl) => {
            pl.vivo = true
            pl.vida = pl.maxVida
            pl.invul = 0
            pl.tiroTimer = 0
            pl.cooldown = 0
            pl.vel = 4
        })
        p1.x = 90;          p1.y = ARENA_TOPO + 80; p1.facing = 'dir'
        p2.x = LARG - 136;  p2.y = ARENA_TOPO + 80; p2.facing = 'esq'
    },

    confirmaNome() {
        let nome = this.digitado.trim().toUpperCase()
        if (nome) this.nomes[this.entrada] = nome
        this.digitado = ''
        this.entrada = this.entrada === 0 ? 1 : -1
    },

    // digitação dos nomes (chamada pelo aoApertar)
    tecla(k) {
        if (k === 'Enter') { tocaSom(SONS.click); this.confirmaNome(); return }
        if (k === 'Backspace') { this.digitado = this.digitado.slice(0, -1); return }
        if (k.length === 1 && this.digitado.length < 10 && /[a-z0-9 ]/i.test(k)) this.digitado += k.toUpperCase()
    },

    atual() {
        // telinha de despedida: mostra o placar final e fecha sozinha
        if (this.fimPlacar > 0) {
            this.fimPlacar -= 1
            if (this.fimPlacar <= 0) {
                tocaFaixa('menu')
                faseAtualObj = null
                fechaMenu()
                estado = 'HOME'
            }
            return
        }
        if (this.entrada >= 0 || this.vencedor > 0) return
        let area = { x: 10, y: ARENA_TOPO, w: LARG - 20, h: ARENA_BASE - ARENA_TOPO + 8, vert: true }
        players.forEach((pl) => {
            pl.atualizaTimers()
            pl.mov(area)
            if (teclas[pl.teclas.tiro]) pl.atira(this.grupoTiros, 'lado')
        })

        for (let i = this.grupoTiros.length - 1; i >= 0; i--) {
            let tiro = this.grupoTiros[i]
            tiro.mov()
            if (tiro.foraDaTela()) { this.grupoTiros.splice(i, 1); continue }
            for (let j = 0; j < players.length; j++) {
                let pl = players[j]
                if (pl !== tiro.dono && pl.vivo && tiro.colid(pl)) {
                    pl.levaDano(1)
                    pl.invul = 22 // invul curta no duelo: cada tiro espaçado conta
                    this.grupoTiros.splice(i, 1)
                    break
                }
            }
        }

        if (!p1.vivo) { this.vencedor = 2; this.placar[1] += 1 }
        else if (!p2.vivo) { this.vencedor = 1; this.placar[0] += 1 }
    },

    des() {
        des.drawImage(pegaImg('assets/arenaPvp.png'), 0, 0, LARG, ALT)
        this.grupoTiros.forEach((t) => { t.des_tiro() })
        players.forEach((pl) => { pl.des_obj() })

        let t = new Texto()
        this.tAnim += 1

        // placar final antes de sair
        if (this.fimPlacar > 0) {
            des.fillStyle = 'rgba(8, 4, 2, 0.85)'
            des.fillRect(0, 0, LARG, ALT)
            t.des_text('PLACAR FINAL', LARG / 2, 200, '#ffd84d', 'bold 32px monospace', 'center')
            t.des_text(this.nomes[0], LARG / 2 - 90, 280, '#3aa0ff', 'bold 22px monospace', 'center')
            t.des_text(this.nomes[1], LARG / 2 + 90, 280, '#37d67a', 'bold 22px monospace', 'center')
            t.des_text(this.placar[0] + '   x   ' + this.placar[1], LARG / 2, 330, '#f3e9d2', 'bold 40px monospace', 'center')
            let msg = this.placar[0] === this.placar[1] ? 'EMPATE NA SÉRIE!'
                : 'MELHOR DA SÉRIE: ' + this.nomes[this.placar[0] > this.placar[1] ? 0 : 1]
            t.des_text(msg, LARG / 2, 386, '#c4943a', 'bold 16px monospace', 'center')
            t.des_text('voltando ao menu...', LARG / 2, 440, '#8a7a58', '13px monospace', 'center')
            return
        }

        // telinha de escolha de nomes
        if (this.entrada >= 0) {
            des.fillStyle = 'rgba(8, 4, 2, 0.78)'
            des.fillRect(0, 0, LARG, ALT)
            let cor = this.entrada === 0 ? '#3aa0ff' : '#37d67a'
            t.des_text('DUELO 1V1', LARG / 2, 190, '#ffd84d', 'bold 30px monospace', 'center')
            t.des_text('JOGADOR ' + (this.entrada + 1) + ' — digite seu nome:', LARG / 2, 260, cor, 'bold 18px monospace', 'center')
            let cursor = Math.floor(this.tAnim / 24) % 2 === 0 ? '_' : ' '
            t.des_text((this.digitado || '') + cursor, LARG / 2, 320, '#f3e9d2', 'bold 34px monospace', 'center')
            t.des_text('ENTER confirma   (até 10 letras — vazio usa PLAYER ' + (this.entrada + 1) + ')', LARG / 2, 380, '#8a7a58', '13px monospace', 'center')
            return
        }

        // placar nas laterais, logo abaixo da HUD (o centro fica livre pro letreiro da arena)
        let v1 = '◆'.repeat(Math.min(5, this.placar[0])) + (this.placar[0] > 5 ? ' +' + (this.placar[0] - 5) : '')
        let v2 = '◆'.repeat(Math.min(5, this.placar[1])) + (this.placar[1] > 5 ? ' +' + (this.placar[1] - 5) : '')
        t.des_text(this.nomes[0], 14, 84, '#3aa0ff', 'bold 14px monospace')
        t.des_text(v1 || '—', 14, 104, '#ffd84d', '14px monospace')
        t.des_text(this.nomes[1], LARG - 14, 84, '#37d67a', 'bold 14px monospace', 'right')
        t.des_text(v2 || '—', LARG - 14, 104, '#ffd84d', '14px monospace', 'right')

        if (this.vencedor > 0) {
            des.fillStyle = 'rgba(10, 4, 4, 0.82)'
            des.fillRect(0, 0, LARG, ALT)
            let cor = this.vencedor === 1 ? '#3aa0ff' : '#37d67a'
            t.des_text(this.nomes[this.vencedor - 1] + ' VENCEU!', LARG / 2, ALT / 2 - 30, cor, 'bold 38px monospace', 'center')
            t.des_text(this.nomes[0] + '  ' + this.placar[0] + '  x  ' + this.placar[1] + '  ' + this.nomes[1], LARG / 2, ALT / 2 + 14, '#ffd84d', 'bold 22px monospace', 'center')
            t.des_text('ENTER revanche   |   ESC menu', LARG / 2, ALT / 2 + 54, '#c4943a', '14px monospace', 'center')
        }
    }
}
