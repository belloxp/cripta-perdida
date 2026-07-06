// ============================================================
//  A CRIPTA PERDIDA — Util.js
//  Classes base e helpers (mesma arquitetura do jogo base:
//  Obj com des_obj() e colid() AABB, subclasses com mov())
// ============================================================

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
    tiro: null,
    dano: null,
    item: null,
    quebra: null,
    porta: null,
    erro: null,
    boss: null
}
function tocaSom(a) {
    if (!a) return
    try {
        a.currentTime = 0
        a.play().catch(() => {})
    } catch (e) { /* sem áudio, segue o jogo */ }
}
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
    }

    spriteAtual() {
        let lado = this.facing === 'esq' ? 'esq' : 'dir'
        let n = this.frame === 0 ? '001' : '002'
        return this.prefixo + lado + '_' + n + '.png'
    }

    des_obj() {
        des.drawImage(pegaImg(this.spriteAtual()), this.x, this.y, this.w, this.h)
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
