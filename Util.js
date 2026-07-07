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