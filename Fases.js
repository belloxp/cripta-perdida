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