// ============================================================
//  A CRIPTA PERDIDA — Cutscenes.js
//  Sistema de cut-scenes com falas entre os personagens
//  (rosto + nome + texto com efeito de máquina de escrever)
// ============================================================
const NOMES = {
    p1: 'PLAYER 1',
    p2: 'PLAYER 2',
    boss: 'ANJO DA MORTE'
}

const ROSTOS = {
    p1: 'assets/selecaoPlayer1.png',
    p2: 'assets/selecaoPlayer2.png',
    boss: 'assets/selecaoBoss1.png'
}

const CORES_FALA = {
    p1: '#3aa0ff',
    p2: '#37d67a',
    boss: '#b14dff'
}

// ------------------------------------------------------------
//  ROTEIRO — todas as falas do jogo
// ------------------------------------------------------------
const ROTEIRO = {
    intro: [
        { quem: 'p1', txt: 'Isso... isso não estava no roteiro da expedição.' },
        { quem: 'p2', txt: 'Eu FALEI pra não entrar por aquele túnel!' },
        { quem: 'p1', txt: 'A passagem desabou atrás da gente. A única saída agora é... pra dentro.' },
        { quem: 'p2', txt: 'Olha as paredes. Esses hieróglifos... são as 10 pragas do Egito!' },
        { quem: 'p1', txt: 'Se elas despertarem, não somos só nós que corremos perigo. É o mundo inteiro.' },
        { quem: 'p2', txt: 'Então vamos selar cada uma delas e achar a saída. Juntos.' }
    ],
    pre2: [
        { quem: 'p2', txt: 'A água voltou a correr limpa! A primeira praga foi selada.' },
        { quem: 'p1', txt: 'Ouviu isso? Esse coaxar... e um zumbido vindo do corredor...' },
        { quem: 'p2', txt: 'Rãs e moscas. MUITAS. Prepara a mira!' }
    ],
    pre3: [
        { quem: 'p1', txt: 'Desenhos de gado nas paredes... e um altar com um caldeirão no centro.' },
        { quem: 'p2', txt: 'A quinta praga: a peste nos animais. Precisamos preparar o antídoto.' },
        { quem: 'p1', txt: 'Tem uma inscrição com a receita. Lê com atenção. Sem errar.' }
    ],
    pre4: [
        { quem: 'p2', txt: 'Que cheiro horrível... o chão está coberto de feridas vivas.' },
        { quem: 'p1', txt: 'Úlceras. NÃO pisa nas poças! Temos que destruir as fontes da infecção.' },
        { quem: 'p2', txt: 'E procura nos vasos: os antigos selavam amuletos neles. Precisamos de 3.' }
    ],
    pre5: [
        { quem: 'p1', txt: 'O teto está rachando... PEDRA! É a chuva de granizo!' },
        { quem: 'p2', txt: 'Tem um mecanismo perto do portão. Chega nele e segura ESPAÇO pra abrir!' },
        { quem: 'p1', txt: 'Desvia das pedras! Se a gente cair aqui, acabou.' }
    ],
    pre6: [
        { quem: 'p2', txt: 'O portão abriu! Mas... por que o céu da cripta ficou preto?' },
        { quem: 'p1', txt: 'Não é o céu. São GAFANHOTOS. Milhares. ATIRA!' }
    ],
    pre7: [
        { quem: 'p1', txt: 'As tochas apagaram todas de uma vez. Não enxergo quase nada...' },
        { quem: 'p2', txt: 'A nona praga: as trevas. Fica perto de mim. Vamos achar a saída no escuro.' }
    ],
    pre8: [
        { quem: 'boss', txt: 'Vocês chegaram longe, mortais. Mas a última praga... SOU EU.' },
        { quem: 'p1', txt: 'O Anjo da Morte. Ele guarda o último portão.' },
        { quem: 'p2', txt: 'Se ele cair, as pragas se calam para sempre. SEM MEDO!' }
    ],
    final: [
        { quem: 'p1', txt: 'Acabou... o portão está aberto. Olha! A luz do sol!' },
        { quem: 'p2', txt: 'As 10 pragas foram seladas de novo. O mundo nem vai saber o que quase aconteceu.' },
        { quem: 'p1', txt: 'Da próxima vez... a gente segue o roteiro da expedição?' },
        { quem: 'p2', txt: 'Sem promessas.' }
    ]
}

// ------------------------------------------------------------
//  CENA DE DIÁLOGO
// ------------------------------------------------------------