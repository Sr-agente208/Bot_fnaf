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
interval: null
}
}
return game[jid]
}

function bar(value) {
const total = 10
const filled = Math.round((value / 100) * total)
return "█".repeat(filled) + "░".repeat(total - filled)
}

function hud(state) {
return `
🎮 FNAF SYSTEM ACTIVE

🌙 NOITE: ${state.night}/6
🔋 ENERGIA: ${state.energy}%
[${bar(state.energy)}]

🚪 PORTAS: ${state.door ? "FECHADAS" : "ABERTAS"}

⚠️ Sobreviva até 6AM...
`
}

function sendMenu(sock, jid) {
const state = createPlayer(jid)

sock.sendMessage(jid, {
text: hud(state),
footer: "🏚 Freddy Fazbear System",
buttonText: "MENU",
sections: [
{
title: "AÇÕES",
rows: [
{ title: "🎮 Iniciar", rowId: "START" },
{ title: "📺 Câmeras", rowId: "CAM" },
{ title: "🚪 Porta", rowId: "DOOR" }
]
}
]
})
}

function startLoop(sock, jid) {
const state = createPlayer(jid)

if (state.interval) return

state.interval = setInterval(() => {

if (!state.alive) return

// consumo base
state.energy -= 4

// evento aleatório de terror
const events = Math.random()

// animatronic ataque
if (events < 0.20 && !state.door) {
state.energy -= 18
sock.sendMessage(jid, { text: "☠️ Algo está no corredor..." })
}

// porta aberta drena energia mais rápido
if (!state.door) state.energy -= 2

// game over
if (state.energy <= 0) {
state.energy = 0
state.alive = false
clearInterval(state.interval)

sock.sendMessage(jid, {
text: "💀 GAME OVER — você foi pego na pizzaria"
})

return
}

// avanço de noite
if (events > 0.85) {
state.night++

sock.sendMessage(jid, {
text: `🌙 6AM chegou... você sobreviveu à noite ${state.night - 1}`
})

if (state.night > 6) {
state.alive = false
clearInterval(state.interval)

sock.sendMessage(jid, {
text: "🏆 VOCÊ VENCEU O JOGO COMPLETO!"
})

return
}
}

}, 12000)
}

async function startBot() {

const { state, saveCreds } = await useMultiFileAuthState('./auth')
const { version } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
auth: state,
version,
printQRInTerminal: false,
browser: ['FNAF ULTRA', 'Chrome', '1.0']
})

sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {

if (qr) qrcode.generate(qr, { small: true })

if (connection === 'open') {
console.log('🤖 FNAF ULTRA ONLINE')
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

const state = createPlayer(jid)

// MENU
if (body === '!MENU') {
sendMenu(sock, jid)
return
}

// START
if (body === 'START') {
startLoop(sock, jid)

sock.sendMessage(jid, {
text: "🎮 Jogo iniciado... sobreviva até 6AM"
})
return
}

// CAMERA
if (body === 'CAM') {
sock.sendMessage(jid, {
text: `
📺 CÂMERAS

1A - Palco
2B - Corredor vazio
5 - MOVIMENTO DETECTADO
`
})
return
}

// DOOR
if (body === 'DOOR') {
state.door = !state.door

sock.sendMessage(jid, {
text: state.door ? "🚪 PORTAS FECHADAS" : "🚪 PORTAS ABERTAS"
})
return
}

})

}

startBot()