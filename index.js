const qrcode = require('qrcode-terminal')
const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const fs = require('fs')

/* =========================
   👁️ ASSETS HORROR
========================= */

const gifs = [
'https://media.tenor.com/T6dLJx9n8qUAAAAC/golden-freddy.gif',
'https://media.tenor.com/6K0wS6Sx9sAAAAAC/fnaf.gif',
'https://media.tenor.com/IHdlTRsmcS4AAAAC/fnaf-jumpscare.gif'
]

const horrorAudio = [
'https://files.catbox.moe/9k8x1k.mp3' // troca se quiser
]

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

/* =========================
   🎮 GAME STATE
========================= */

const game = {}

function createPlayer(jid) {
if (!game[jid]) {
game[jid] = {
night: 1,
energy: 100,
door: false
}
}
return game[jid]
}

/* =========================
   📺 CÂMERA FAKE
========================= */

async function fakeCamera(sock, jid) {
await sock.sendMessage(jid, { text: "📺 Conectando câmeras..." })
await sleep(700)

await sock.sendMessage(jid, { text: "📡 SINAL INSTÁVEL..." })
await sleep(700)

await sock.sendMessage(jid, { text: "📺 CAM 1A: movimento detectado" })
await sleep(700)

await sock.sendMessage(jid, { text: "📺 CAM 2B: sombra passou..." })
await sleep(700)

await sock.sendMessage(jid, { text: "⚠️ SISTEMA FALHANDO..." })
}

/* =========================
   🎮 MENU PRINCIPAL
========================= */

async function sendMenu(sock, jid) {

await sock.sendPresenceUpdate('composing', jid)

const gif = gifs[Math.floor(Math.random() * gifs.length)]

await sock.sendMessage(jid, {
image: { url: gif },
caption: "👁️ conectando sistema..."
})

await sleep(1000)

/* 🎵 áudio ambiente */
await sock.sendMessage(jid, {
audio: { url: horrorAudio[0] },
mimetype: 'audio/mp4'
})

await sleep(800)

/* 📺 câmera fake */
await fakeCamera(sock, jid)

await sleep(800)

const s = createPlayer(jid)

await sock.sendMessage(jid, {
image: { url: gif },
caption: `
💀👁️ FNAF SYSTEM ACTIVE 👁️💀

🌙 Noite: ${s.night}
🔋 Energia: ${s.energy}%

"Ele nunca desliga..."

Escolha:
`,
footer: "🏚 Freddy Fazbear System",
buttonText: "ABRIR",
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
title: "📥 MEDIA",
rows: [
{ title: "📺 YouTube", rowId: "!YT" },
{ title: "🎬 TikTok", rowId: "!TIKTOK" },
{ title: "🎵 Áudio", rowId: "!AUDIO" }
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
}

/* =========================
   🎮 LOOP GAME
========================= */

function startGame(sock, jid) {
const s = createPlayer(jid)

if (s.loop) return

s.loop = setInterval(() => {

s.energy -= 6

if (Math.random() < 0.3 && !s.door) {
sock.sendMessage(jid, {
text: "☠️ algo está no corredor..."
})
s.energy -= 20
}

if (s.door) s.energy -= 2

if (Math.random() < 0.12) {
sock.sendMessage(jid, { text: "⚡ BLACKOUT..." })
s.energy -= 10
}

if (s.energy <= 0) {
clearInterval(s.loop)
sock.sendMessage(jid, { text: "💀 GAME OVER" })
}

if (Math.random() < 0.15) {
s.night++
sock.sendMessage(jid, { text: `🌙 6AM... noite ${s.night - 1}` })
}

}, 12000)
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
browser: ['FNAF HORROR', 'Chrome', '1.0']
})

sock.ev.on('connection.update', ({ connection, qr, lastDisconnect }) => {
if (qr) qrcode.generate(qr, { small: true })

if (connection === 'open') {
console.log("💀 BOT ONLINE")
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

if (body === 'CAM') return fakeCamera(sock, jid)

if (body === 'DOOR') {
s.door = !s.door
return sock.sendMessage(jid, {
text: s.door ? "🚪 FECHADO" : "🚪 ABERTO"
})
}

/* =========================
   👁️ MEDIA PLACEHOLDER
========================= */

if (body.startsWith('!YT')) {
return sock.sendMessage(jid, { text: "📺 YouTube (integração aqui)" })
}

if (body.startsWith('!TIKTOK')) {
return sock.sendMessage(jid, { text: "🎬 TikTok (integração aqui)" })
}

if (body.startsWith('!AUDIO')) {
return sock.sendMessage(jid, { text: "🎵 Áudio (integração aqui)" })
}

})

}

startBot()