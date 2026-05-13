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

function bar(v) {
const total = 10
const fill = Math.round((v / 100) * total)
return "█".repeat(fill) + "░".repeat(total - fill)
}

function hud(s) {
return `
💀 FNAF HYBRID SYSTEM

🌙 NOITE: ${s.night}/6
🔋 ENERGIA: ${s.energy}%
[${bar(s.energy)}]

🚪 PORTA: ${s.door ? "FECHADA" : "ABERTA"}

⚠️ SISTEMA ATIVO
`
}

function sendMenu(sock, jid) {
const s = createPlayer(jid)

sock.sendMessage(jid, {
text: hud(s),
footer: "🎭 Freddy Fazbear System",
buttonText: "MENU",
sections: [
{
title: "🎮 SURVIVAL",
rows: [
{ title: "🔥 Iniciar Jogo", rowId: "START" },
{ title: "📺 Câmeras", rowId: "CAM" },
{ title: "🚪 Porta", rowId: "DOOR" }
]
},
{
title: "👁️ CLÁSSICO",
rows: [
{ title: "🦊 Foxy", rowId: "!FOXY" },
{ title: "🧸 Bonnie", rowId: "!BONNIE" },
{ title: "🐤 Chica", rowId: "!CHICA" },
{ title: "☠️ Jumpscare", rowId: "!JUMPSCARE" }
]
}
]
})
}

// 📜 GUIA DE COMANDOS (NOVO)
function sendHelp(sock, jid) {
sock.sendMessage(jid, {
text: `
📜 FNAF BOT — GUIA DE COMANDOS

🎮 SURVIVAL MODE
!menu → abre menu principal
START → inicia o jogo
CAM → câmeras
DOOR → abre/fecha porta

👁️ CLÁSSICO
!foxy → Foxy aparece
!bonnie → Bonnie aparece
!chica → Chica aparece
!jumpscare → evento aleatório

⚠️ OBJETIVO
Sobreviver até 6AM sem zerar energia.

💡 DICA
Porta protege, mas drena energia.
`
})
}

// 🎮 LOOP DO JOGO
function startGame(sock, jid) {
const s = createPlayer(jid)

if (s.interval) return

s.interval = setInterval(() => {

if (!s.alive) return

s.energy -= 6

// IA agressiva
const attack = Math.random()

if (attack < 0.35 && !s.door) {
s.energy -= 22
sock.sendMessage(jid, { text: "☠️ ALGO ESTÁ NO CORREDOR..." })
}

// dreno porta aberta
if (!s.door) s.energy -= 2

// blackout
if (Math.random() < 0.10) {
sock.sendMessage(jid, { text: "⚡ BLACKOUT..." })
s.energy -= 10
}

// GAME OVER
if (s.energy <= 0) {
s.energy = 0
s.alive = false
clearInterval(s.interval)

sock.sendMessage(jid, {
text: "💀 GAME OVER — você morreu"
})

return
}

// noite avançando
if (Math.random() < 0.18) {
s.night++

sock.sendMessage(jid, {
text: `🌙 6AM... noite ${s.night - 1}`
})

if (s.night > 6) {
s.alive = false
clearInterval(s.interval)

sock.sendMessage(jid, {
text: "🏆 VOCÊ VENCEU O HÍBRIDO!"
})

return
}
}

}, 12000)
}

// 👁️ CLÁSSICO
function classic(sock, jid, cmd) {

const list = {
"!FOXY": "🦊 FOXY SAIU DA COVE!",
"!BONNIE": "🧸 BONNIE TE VIU!",
"!CHICA": "🐤 CHICA NA COZINHA!",
"!JUMPSCARE": [
"☠️ FREDDY TE PEGOU!",
"🦊 FOXY TE PEGOU!",
"🔪 SPRINGTRAP APARECEU!"
][Math.floor(Math.random() * 3)]
}

if (list[cmd]) {
sock.sendMessage(jid, { text: list[cmd] })
return true
}

return false
}

async function startBot() {

const { state, saveCreds } = await useMultiFileAuthState('./auth')
const { version } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
auth: state,
version,
printQRInTerminal: false,
browser: ['FNAF HYBRID', 'Chrome', '1.0']
})

sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {

if (qr) qrcode.generate(qr, { small: true })

if (connection === 'open') {
console.log('🎭 BOT HÍBRIDO ONLINE')
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

// 📜 HELP / COMANDOS
if (body === '!HELP' || body === '!COMANDOS') {
sendHelp(sock, jid)
return
}

// 🔥 START
if (body === 'START') {
startGame(sock, jid)

sock.sendMessage(jid, {
text: "🎮 JOGO INICIADO — sobreviva até 6AM"
})
return
}

// 📺 CAM
if (body === 'CAM') {
sock.sendMessage(jid, {
text: `
📺 CAMERAS

1A - MOVIMENTO
2B - INSTÁVEL
5 - ALGO TE OBSERVA
`
})
return
}

// 🚪 DOOR
if (body === 'DOOR') {
s.door = !s.door
s.energy -= 5

sock.sendMessage(jid, {
text: s.door ? "🚪 FECHADO" : "🚪 ABERTO"
})
return
}

// 👁️ CLÁSSICO
if (classic(sock, jid, body)) return

})

}

startBot()