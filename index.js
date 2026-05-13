const qrcode = require('qrcode-terminal')

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const game = {}

function createPlayer(jid) {
if (!game[jid]) {
game[jid] = {
night: 1,
energy: 100,
alive: true,
door: false,
cameraFail: false,
interval: null
}
}
return game[jid]
}

function bar(v) {
const total = 10
const fill = Math.max(0, Math.round((v / 100) * total))
return "█".repeat(fill) + "░".repeat(total - fill)
}

function hud(s) {
return `
💀 FNAF — MODO IMPOSSÍVEL

🌙 NOITE: ${s.night}/6
🔋 ENERGIA: ${s.energy}%
[${bar(s.energy)}]

🚪 PORTA: ${s.door ? "FECHADA" : "ABERTA"}
📺 CÂMERA: ${s.cameraFail ? "FALHANDO ⚠️" : "ONLINE"}

⚠️ ELES ESTÃO MAIS RÁPIDOS...
`
}

function sendMenu(sock, jid) {
const s = createPlayer(jid)

sock.sendMessage(jid, {
text: hud(s),
footer: "☠️ SISTEMA QUEBRADO",
buttonText: "MENU",
sections: [
{
title: "AÇÕES (sobreviver)",
rows: [
{ title: "🎮 Iniciar inferno", rowId: "START" },
{ title: "📺 Câmeras", rowId: "CAM" },
{ title: "🚪 Porta", rowId: "DOOR" }
]
}
]
})
}

function startGame(sock, jid) {
const s = createPlayer(jid)

if (s.interval) return

s.interval = setInterval(() => {

if (!s.alive) return

// 🔥 dificuldade absurda
s.energy -= 7

// 👁️ IA agressiva (ataque alto)
const attackChance = Math.random()

if (attackChance < 0.40 && !s.door) {
s.energy -= 25
sock.sendMessage(jid, { text: "☠️ ELE ESTÁ NO CORREDOR!" })
}

// 🚪 porta drena energia MUITO mais
if (s.door) {
s.energy -= 5
}

// 📺 câmera falha aleatoriamente
if (Math.random() < 0.20) {
s.cameraFail = true
} else {
s.cameraFail = false
}

// 👁️ blackout aleatório (terror)
if (Math.random() < 0.08) {
sock.sendMessage(jid, {
text: "⚡ BLACKOUT... algo se moveu..."
})
s.energy -= 10
}

// 💀 GAME OVER
if (s.energy <= 0) {
s.energy = 0
s.alive = false
clearInterval(s.interval)

sock.sendMessage(jid, {
text: "💀 GAME OVER — você não sobreviveu ao modo impossível"
})

return
}

// 🌙 progressão de noite mais rápida
if (Math.random() < 0.18) {
s.night++

sock.sendMessage(jid, {
text: `🌙 6AM... você sobreviveu à noite ${s.night - 1}`
})

if (s.night > 6) {
s.alive = false
clearInterval(s.interval)

sock.sendMessage(jid, {
text: "🏆 VOCÊ VENCEU O MODO IMPOSSÍVEL?! IMPOSSÍVEL MESMO..."
})

return
}
}

}, 10000) // mais rápido = mais difícil
}

async function startBot() {

const { state, saveCreds } = await useMultiFileAuthState('./auth')
const { version } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
auth: state,
version,
printQRInTerminal: false,
browser: ['FNAF IMPOSSIBLE', 'Chrome', '1.0']
})

sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {

if (qr) qrcode.generate(qr, { small: true })

if (connection === 'open') {
console.log('☠️ MODO IMPOSSÍVEL ATIVADO')
}

if (connection === 'close') {
const shouldReconnect =
lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

if (shouldReconnect) startBot()
}
})

sock.ev.on('creds.update', saveCreds)

sock.ev.on('messages.upsert', async ({ messages }) => {

const m = messages[0]
if (!m.message) return

const jid = m.key.remoteJid

const body =
(
m.message.conversation ||
m.message.extendedTextMessage?.text ||
m.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
''
).trim().toUpperCase()

const s = createPlayer(jid)

// 🎮 MENU
if (body === '!MENU') {
sendMenu(sock, jid)
return
}

// 🔥 START
if (body === 'START') {
startGame(sock, jid)

sock.sendMessage(jid, {
text: "☠️ Você escolheu sofrer... boa sorte"
})
return
}

// 📺 CÂMERAS
if (body === 'CAM') {
sock.sendMessage(jid, {
text: `
📺 SISTEMA FALHANDO

1A - MOVIMENTO DETECTADO
2B - SINAL INSTÁVEL
5 - ALGO ESTÁ AQUI
`
})
return
}

// 🚪 PORTA
if (body === 'DOOR') {
s.door = !s.door

sock.sendMessage(jid, {
text: s.door ? "🚪 FECHADO (energia drenando)" : "🚪 ABERTO (perigo máximo)"
})
return
}

})

}

startBot()