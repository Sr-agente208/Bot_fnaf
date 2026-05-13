const qrcode = require('qrcode-terminal')
const axios = require('axios')

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

/* =========================
   🧠 ANTI CRASH (IMORTAL MODE)
========================= */

process.on('uncaughtException', (err) => {
console.log('⚠️ ERRO IGNORADO:', err)
})

process.on('unhandledRejection', (err) => {
console.log('⚠️ PROMISE ERROR:', err)
})

/* =========================
   👁️ ASSETS
========================= */

const gifs = [
'https://media.tenor.com/T6dLJx9n8qUAAAAC/golden-freddy.gif',
'https://media.tenor.com/IHdlTRsmcS4AAAAC/fnaf-jumpscare.gif'
]

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

/* =========================
   🎮 GAME STATE
========================= */

const game = {}

function createPlayer(jid) {
if (!game[jid]) {
game[jid] = {
energy: 100,
night: 1,
door: false
}
}
return game[jid]
}

/* =========================
   🎮 MENU (SEGURO)
========================= */

async function sendMenu(sock, jid) {

const s = createPlayer(jid)
const gif = gifs[Math.floor(Math.random() * gifs.length)]

try {

await sock.sendMessage(jid, {
image: { url: gif },
caption: `
💀👁️ FNAF SYSTEM ONLINE 👁️💀

🌙 Noite: ${s.night}
🔋 Energia: ${s.energy}%

Escolha:
`,
footer: "Fazbear System",
buttonText: "MENU",
sections: [

{
title: "🎮 SURVIVAL",
rows: [
{ title: "🔥 Iniciar", rowId: "START" },
{ title: "📺 Câmeras", rowId: "CAM" },
{ title: "🚪 Porta", rowId: "DOOR" }
]
},

{
title: "📥 MEDIA (SAFE)",
rows: [
{ title: "📺 YouTube", rowId: "!YT" },
{ title: "🎬 TikTok", rowId: "!TIKTOK" }
]
},

{
title: "👁️ HORROR",
rows: [
{ title: "🦊 Foxy", rowId: "!FOXY" },
{ title: "☠️ Jumpscare", rowId: "!JUMP" }
]
}

]
})

} catch (e) {
console.log("MENU ERROR:", e)
}
}

/* =========================
   🎮 GAME LOOP (ESTÁVEL)
========================= */

function startGame(sock, jid) {
const s = createPlayer(jid)

if (s.loop) return

s.loop = setInterval(() => {

try {

s.energy -= 5

if (Math.random() < 0.25 && !s.door) {
s.energy -= 15
sock.sendMessage(jid, { text: "☠️ algo está no corredor..." })
}

if (s.door) s.energy -= 2

if (Math.random() < 0.12) {
sock.sendMessage(jid, { text: "⚡ BLACKOUT..." })
s.energy -= 8
}

if (s.energy <= 0) {
clearInterval(s.loop)
s.loop = null
sock.sendMessage(jid, { text: "💀 GAME OVER" })
}

if (Math.random() < 0.1) {
s.night++
sock.sendMessage(jid, { text: `🌙 6AM... noite ${s.night - 1}` })
}

} catch (e) {
console.log("GAME ERROR:", e)
}

}, 12000)
}

/* =========================
   📥 MEDIA SAFE (SEM DOWNLOAD REAL)
========================= */

async function fakeDownload(sock, jid, type) {
try {
await sock.sendMessage(jid, {
text: `📥 processando ${type}...\n⚠️ modo seguro ativo`
})
} catch (e) {
console.log("MEDIA ERROR:", e)
}
}

/* =========================
   🚀 BOT
========================= */

async function startBot() {

const { state, saveCreds } = await useMultiFileAuthState('./auth')
const { version } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
auth: state,
version,
printQRInTerminal: true,
browser: ['FNAF IMORTAL', 'Chrome', '1.0']
})

sock.ev.on('connection.update', ({ connection, qr, lastDisconnect }) => {

if (qr) qrcode.generate(qr, { small: true })

if (connection === 'open') {
console.log("💀 BOT ONLINE IMORTAL")
}

if (connection === 'close') {
const shouldReconnect =
lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

if (shouldReconnect) startBot()
}
})

sock.ev.on('creds.update', saveCreds)

sock.ev.on('messages.upsert', async ({ messages }) => {

try {

const m = messages[0]
if (!m.message) return

const jid = m.key.remoteJid

const body =
(
m.message.conversation ||
m.message.extendedTextMessage?.text ||
''
).trim().toUpperCase()

const s = createPlayer(jid)

/* =========================
   🎮 MENU
========================= */

if (body === '!MENU') return sendMenu(sock, jid)

/* =========================
   🎮 GAME
========================= */

if (body === 'START') return startGame(sock, jid)

if (body === 'CAM') {
return sock.sendMessage(jid, { text: "📺 câmeras instáveis..." })
}

if (body === 'DOOR') {
s.door = !s.door
return sock.sendMessage(jid, {
text: s.door ? "🚪 FECHADO" : "🚪 ABERTO"
})
}

/* =========================
   📥 MEDIA SAFE
========================= */

if (body.startsWith('!YT')) {
return fakeDownload(sock, jid, "YouTube")
}

if (body.startsWith('!TIKTOK')) {
return fakeDownload(sock, jid, "TikTok")
}

if (body.startsWith('!FOXY')) {
return sock.sendMessage(jid, { text: "🦊 Foxy correu pelo corredor..." })
}

if (body.startsWith('!JUMP')) {
return sock.sendMessage(jid, { text: "☠️ BOO!" })
}

} catch (e) {
console.log("GLOBAL ERROR:", e)
}

})

}

startBot()