// ============================================================
//  A CRIPTA PERDIDA — Util.js
//  Classes base e helpers (mesma arquitetura do jogo base:
//  Obj com des_obj() e colid() AABB, subclasses com mov())
// ============================================================
class Coletavel extends Obj {
    constructor(x, y, tipo, cai) {
        super(x, y, 30, 30, 'assets/coletavel.png')
        this.tipo = tipo          // 'vida' | 'forca' | 'amuleto'
        this.cai = !!cai
        this.t = Math.random() * 6
    }

    mov() {
        this.t += 0.08
        if (this.cai) this.y += 2.2
    }

    des_obj() {
        let flutua = Math.sin(this.t) * 3
        des.drawImage(pegaImg(this.at), this.x, this.y + flutua, this.w, this.h)
        des.fillStyle = '#000'
        des.font = 'bold 13px monospace'
        des.textAlign = 'center'
        let letra = this.tipo === 'vida' ? 'V' : (this.tipo === 'forca' ? 'F' : 'A')
        des.fillText(letra, this.x + this.w / 2, this.y + this.h / 2 + 5 + flutua)
        des.textAlign = 'left'
    }
}

class Parede extends Obj {
    constructor(x, y, w, h) {
        super(x, y, w, h, null)
    }

    des_obj() {
        des.fillStyle = '#2c2c33'
        des.fillRect(this.x, this.y, this.w, this.h)
        des.strokeStyle = '#55555f'
        des.lineWidth = 1
        if (this.w > this.h) {
            for (let i = this.x + 8; i < this.x + this.w; i += 16) {
                des.beginPath()
                des.moveTo(i, this.y)
                des.lineTo(i, this.y + this.h)
                des.stroke()
            }
        } else {
            for (let i = this.y + 8; i < this.y + this.h; i += 16) {
                des.beginPath()
                des.moveTo(this.x, i)
                des.lineTo(this.x + this.w, i)
                des.stroke()
            }
        }
    }
}

let des = null 

// ---------- cache de imagens ----------
const _imgs = {}
function pegaImg(src) {
    if (!src) return null
    if (!_imgs[src]) {
        const i = new Image()
        i.src = src
        _imgs[src] = i
    }
    return _imgs[src]
}

const SONS = {
    tiro:   novoAudio('assets/audios/tiro.wav'),
    dano:   novoAudio('assets/audios/dano.wav'),
    item:   novoAudio('assets/audios/item.wav'),
    quebra: novoAudio('assets/audios/quebra.wav'),
    porta:  novoAudio('assets/audios/porta.wav'),
    erro:   novoAudio('assets/audios/erro.wav')
}
function tocaSom(a) {
    if (!a) return
    try {
        a.currentTime = 0
        a.play().catch(() => {})
        duckMusica(18)
    } catch (e) { /* sem áudio, segue o jogo */ }
}
// ---------- sistema de som ----------
function novoAudio(src) {
    try { return new Audio(src) } catch (e) { return null }
}

// ============================================================
//  CLASSE BASE
// ============================================================
class Obj {
    constructor(x, y, w, h, at) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.at = at
    }

    des_obj() {
        des.drawImage(pegaImg(this.at), this.x, this.y, this.w, this.h)
    }

    colid(objeto) {
        if ((this.x < objeto.x + objeto.w) &&
            (this.x + this.w > objeto.x) &&
            (this.y < objeto.y + objeto.h) &&
            (this.y + this.h > objeto.y)) {
            return true
        } else {
            return false
        }
    }
}

class Porta extends Obj {
    constructor(x, y, w, h) {
        super(x, y, w, h, null)
        this.t = 0
    }

    des_obj() {
        this.t += 0.08
        des.fillStyle = '#6e5524'
        des.fillRect(this.x, this.y, this.w, this.h)
        des.fillStyle = '#ffd84d'
        des.globalAlpha = 0.5 + Math.sin(this.t) * 0.3
        des.fillRect(this.x + 6, this.y + 6, this.w - 12, this.h - 12)
        des.globalAlpha = 1
    }
}

// ============================================================
//  PLAYER
// ============================================================
class Player extends Obj {
    constructor(x, y, w, h, prefixo, rosto, mapaTeclas) {
        super(x, y, w, h, null)
        this.prefixo = prefixo
        this.rosto = rosto
        this.teclas = mapaTeclas
        this.facing = 'dir'
        this.frame = 0
        this.frameTimer = 0
        this.dirX = 0
        this.dirY = 0
        this.vel = 4
        this.forca = 1
        this.tiroTimer = 0
        this.cooldown = 0
        this.maxVida = 10
        this.vida = 10
        this.pts = 0
        this.invul = 0
        this.vivo = true
    }

    spriteAtual() {
        let lado = this.facing === 'esq' ? 'esq' : 'dir'
        let acao = this.tiroTimer > 0 ? 'tiro' + lado : lado
        let n = this.frame === 0 ? '001' : '002'
        return this.prefixo + acao + '_' + n + '.png'
    }

    des_obj() {
        if (!this.vivo) return
        if (this.invul > 0 && Math.floor(this.invul / 4) % 2 === 0) return
        des.drawImage(pegaImg(this.spriteAtual()), this.x, this.y, this.w, this.h)
    }

    mov(area, paredes) {
        if (!this.vivo) return
        this.dirX = 0
        this.dirY = 0
        if (teclas[this.teclas.esq]) { this.dirX = -this.vel; this.facing = 'esq' }
        if (teclas[this.teclas.dir]) { this.dirX = this.vel; this.facing = 'dir' }
        if (area.vert) {
            if (teclas[this.teclas.cima]) this.dirY = -this.vel
            if (teclas[this.teclas.baixo]) this.dirY = this.vel
        }

        this.x += this.dirX
        if (paredes && this.bateParede(paredes)) this.x -= this.dirX
        if (this.x < area.x) this.x = area.x
        if (this.x + this.w > area.x + area.w) this.x = area.x + area.w - this.w

        this.y += this.dirY
        if (paredes && this.bateParede(paredes)) this.y -= this.dirY
        if (this.y < area.y) this.y = area.y
        if (this.y + this.h > area.y + area.h) this.y = area.y + area.h - this.h

        if (this.dirX !== 0 || this.dirY !== 0) {
            this.frameTimer += 1
            if (this.frameTimer >= 10) {
                this.frameTimer = 0
                this.frame = this.frame === 0 ? 1 : 0
            }
        } else {
            this.frame = 0
            this.frameTimer = 0
        }
    }

    bateParede(paredes) {
        for (let i = 0; i < paredes.length; i++) {
            if (this.colid(paredes[i])) return true
        }
        return false
    }

    atualizaTimers() {
        if (this.cooldown > 0) this.cooldown -= 1
        if (this.tiroTimer > 0) this.tiroTimer -= 1
        if (this.invul > 0) this.invul -= 1
    }

    levaDano(n) {
        if (!this.vivo || this.invul > 0) return
        this.vida -= n
        this.invul = 60
        tocaSom(SONS.dano)
        if (this.vida <= 0) {
            this.vida = 0
            this.vivo = false
        }
    }

    cura(n) {
        if (!this.vivo) return
        this.vida = Math.min(this.maxVida, this.vida + n)
    }

    atira(grupo, modo) {
        if (!this.vivo || this.cooldown > 0) return
        this.cooldown = 18
        this.tiroTimer = 14
        if (modo === 'cima') {
            grupo.push(new Tiro(this.x + this.w / 2 - 4, this.y - 6, 8, 16, '#ffd84d', 0, -10, this.forca, this))
        } else {
            let dx = this.facing === 'esq' ? -10 : 10
            let tx = this.facing === 'esq' ? this.x - 14 : this.x + this.w - 2
            grupo.push(new Tiro(tx, this.y + this.h / 2 - 4, 16, 8, '#ffd84d', dx, 0, this.forca, this))
        }
        tocaSom(SONS.tiro)
    }
}

// ============================================================
//  INIMIGOS (rãs, moscas, gafanhotos)
// ============================================================
class Inimigo extends Obj {
    constructor(x, y, w, h, at, vel, hp, sway, sheet, frames, animVel) {
        super(x, y, w, h, at)
        this.vel = vel
        this.hp = hp
        this.sway = sway || 0          // balanço vertical enquanto anda pra esquerda
        this.fase = Math.random() * 6  // offset do seno
        this.sheet = sheet || null
        this.frames = frames || 1
        this.animT = Math.random() * 10
        this.animVel = animVel || 0.12 // velocidade da troca de frame
    }

    mov() {
        this.x -= this.vel             // vem da direita, anda pra esquerda
        if (this.sway > 0) {
            this.y += Math.sin(this.x / 28 + this.fase) * this.sway
        }
        this.animT += this.animVel
    }

    des_obj() {
        // espelha na horizontal (a arte aponta pra direita, mas o inimigo anda pra esquerda)
        des.save()
        des.translate(this.x + this.w, this.y)
        des.scale(-1, 1)
        if (this.sheet) {
            let f = Math.floor(this.animT) % this.frames
            if (desSprite(this.sheet, this.frames, f, 0, 0, this.w, this.h)) { des.restore(); return }
        }
        let img = pegaImg(this.at)
        if (img.complete && img.naturalWidth > 0) des.drawImage(img, 0, 0, this.w, this.h)
        des.restore()
    }
}



// ============================================================
//  TIRO DOS JOGADORES
// ============================================================
class Tiro extends Obj {
    constructor(x, y, w, h, cor, dx, dy, dano, dono) {
        super(x, y, w, h, null)
        this.cor = cor
        this.dx = dx
        this.dy = dy
        this.dano = dano
        this.dono = dono
    }

    des_tiro() {
        des.fillStyle = this.cor
        des.fillRect(this.x, this.y, this.w, this.h)
    }

    mov() {
        this.x += this.dx
        this.y += this.dy
    }

    foraDaTela() {
        return this.y < -30 || this.y > 700 || this.x < -30 || this.x > 950
    }
}

// ============================================================
//  TEXTO E BARRA DE PROGRESSO
// ============================================================
class Texto {
    des_text(texto, x, y, cor, font, alin) {
        des.font = font
        des.fillStyle = cor
        des.textAlign = alin || 'left'
        des.fillText(texto, x, y)
        des.textAlign = 'left'
    }
}

class BarraProgresso {
    des(x, y, w, h, frac, corFundo, corFrente, rotulo) {
        des.fillStyle = corFundo
        des.fillRect(x, y, w, h)
        des.fillStyle = corFrente
        des.fillRect(x + 2, y + 2, Math.max(0, (w - 4) * Math.min(1, frac)), h - 4)
        des.strokeStyle = '#000'
        des.strokeRect(x, y, w, h)
        if (rotulo) {
            des.fillStyle = '#fff'
            des.font = 'bold 12px monospace'
            des.textAlign = 'center'
            des.fillText(rotulo, x + w / 2, y + h - 5)
            des.textAlign = 'left'
        }
    }
}

// ---------- efeitos de texto flutuante ----------
let efeitos = []
function efeitoTexto(txt, x, y, cor) {
    efeitos.push({ txt: txt, x: x, y: y, t: 60, cor: cor || '#ffe9b0' })
}
function atualizaEfeitos() {
    efeitos.forEach((e) => {
        e.y -= 0.8
        e.t -= 1
    })
    efeitos = efeitos.filter((e) => e.t > 0)
}
function desEfeitos() {
    efeitos.forEach((e) => {
        des.globalAlpha = Math.min(1, e.t / 30)
        des.fillStyle = e.cor
        des.font = 'bold 16px monospace'
        des.textAlign = 'center'
        des.fillText(e.txt, e.x, e.y)
        des.textAlign = 'left'
        des.globalAlpha = 1
    })
}

// ---------- quebra de texto (cut-scenes) ----------
function quebraTexto(texto, maxLarg, font) {
    des.font = font
    let palavras = texto.split(' ')
    let linhas = []
    let atual = ''
    palavras.forEach((p) => {
        let teste = atual === '' ? p : atual + ' ' + p
        if (des.measureText(teste).width > maxLarg) {
            linhas.push(atual)
            atual = p
        } else {
            atual = teste
        }
    })
    if (atual !== '') linhas.push(atual)
    return linhas
}

// tiro é repetitivo → mais baixo pra não cansar
const VOL_SONS = { tiro: 0.2, dano: 0.5, item: 0.5, quebra: 0.55, porta: 0.6, erro: 0.5 }

// trilha de fundo + música do boss (loop). "Ducking": a trilha abaixa quando toca um efeito.
const MUS_VOL = 0.45

let musica = novoAudio('audios/soundtrack.mp3')

let musicaBoss = novoAudio('assets/audios/boss.wav')

let musDuck = 0

let musicaComecou = false

function iniciaMusica() {
    musicaComecou = true
    if (musica && musica.paused && (!musicaBoss || musicaBoss.paused)) musica.play().catch(() => {})
}

function iniciaMusicaBoss() {
    if (musica) musica.pause()
    if (musicaBoss) { musicaBoss.currentTime = 0; musicaBoss.play().catch(() => {}) }
}

function paraMusicaBoss() {
    if (musicaBoss && !musicaBoss.paused) {
        musicaBoss.pause()
        if (musica && musicaComecou) musica.play().catch(() => {})
    }
}

function duckMusica(frames) {
    if (frames > musDuck) musDuck = frames
}

function atualizaAudio() {
    if (!musica) return
    let alvo = musDuck > 0 ? MUS_VOL * 0.28 : MUS_VOL
    if (musDuck > 0) musDuck -= 1
    musica.volume += (alvo - musica.volume) * 0.15
}

// ============================================================
//  BOSS — ANJO DA MORTE
// ============================================================
class Boss extends Obj {
    constructor(x, y, w, h) {
        super(x, y, w, h, 'assets/boss_001.png')
        this.maxVida = 150
        this.vida = 150
        this.frame = 0
        this.frameTimer = 0
        this.t = 0
        this.baseX = x
    }

    mov() {
        this.t += 1
        this.x = this.baseX + Math.sin(this.t / 60) * 280
        this.frameTimer += 1
        if (this.frameTimer >= 14) {
            this.frameTimer = 0
            this.frame = this.frame === 0 ? 1 : 0
        }
    }

    des_obj() {
        let img = pegaImg('assets/boss_' + (this.frame === 0 ? '001' : '002') + '.png')
        if (img.complete && img.naturalWidth > 0) des.drawImage(img, this.x, this.y, this.w, this.h)
    }
}

// ============================================================
//  TIRO DO BOSS (normal e especial — sprites animados)
// ============================================================
class TiroBoss extends Obj {
    constructor(x, y, w, h, dx, dy, dano, especial) {
        super(x, y, w, h, null)
        this.dx = dx
        this.dy = dy
        this.dano = dano
        this.especial = especial
        this.frame = 0
        this.frameTimer = 0
    }

    mov() {
        this.x += this.dx
        this.y += this.dy
        this.frameTimer += 1
        if (this.frameTimer >= 8) {
            this.frameTimer = 0
            this.frame = this.frame === 0 ? 1 : 0
        }
    }

    des_obj() {
        let base = this.especial ? 'assets/bossEspecial_' : 'assets/bossTiro_'
        des.drawImage(pegaImg(base + (this.frame === 0 ? '001' : '002') + '.png'), this.x, this.y, this.w, this.h)
    }
}

// desenha 1 quadro de um spritesheet horizontal (quadros lado a lado, esquerda→direita)
function desSprite(src, nFrames, frame, dx, dy, dw, dh) {
    let img = pegaImg(src)
    if (!img.complete || img.naturalWidth === 0) return false
    let fw = img.naturalWidth / nFrames
    des.drawImage(img, (frame % nFrames) * fw, 0, fw, img.naturalHeight, dx, dy, dw, dh)
    return true
}
