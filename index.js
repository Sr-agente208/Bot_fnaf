const qrcode = require('qrcode-terminal')

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

/* =========================
   👑 ADMINS
========================= */

const ADMINS = [
"seu_numero@s.whatsapp.net"
]

function isAdmin(jid) {
return ADMINS.includes(jid)
}

/* =========================
   ⏰ MENU DINÂMICO POR HORÁRIO
========================= */

function getTimeMenu() {
const h = new Date().getHours()

if (h >= 6 && h < 12) {
return "🌅 MANHÃ DO HORROR"
}
if (h >= 12 && h < 18) {
return "☀️ TARDE INSTÁVEL"
}
if (h >= 18 && h < 23) {
return "🌙 NOITE FNAF ATIVA"
}
return "💀 MADRUGADA — ENTIDADES ATIVAS"
}

/* =========================
   🧠 SISTEMA DE PERMISSÃO
========================= */

function checkPerm(jid, sock) {
return {
admin: isAdmin(jid),
user: true
}
}

/* =========================
   🎬 MENU ANIMADO (TERMINAL)
========================= */

async function animatedMenu(sock, jid) {

const frames = [
"💀 iniciando sistema...",
"📡 conectando pizzaria...",
"👁️ detectando animatronics...",
"🔋 energia estabilizando...",
"🎮 carregando menu..."
]

for (let i = 0; i < frames.length; i++) {

await sock.sendMessage(jid, {
text: frames[i]
})

await new Promise(r => setTimeout(r, 600))
}

/* MENU FINAL */

await sock.sendMessage(jid, {
text: `
💀 FNAF SYSTEM ONLINE

⏰ STATUS: ${getTimeMenu()}

🎮 COMANDOS:

!start - jogo
!cam - câmeras
!door - porta
!mp3 link - download
!panel - painel
!admin - painel secreto
`
})

}

/* =========================
   🔐 PAINEL ADMIN SECRETO
========================= */

async function adminPanel(sock, jid) {

if (!isAdmin(jid)) {
return sock.sendMessage(jid, {
text: "🚫 acesso negado"
})
}

await sock.sendMessage(jid, {
text: `
👑 PAINEL ADMIN

📊 sistema:
!status
!broadcast texto
!addvip user
!reset
`
})

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
browser: ['FNAF LIVING MENU', 'Chrome', '1.0']
})

sock.ev.on('connection.update', ({ connection, qr, lastDisconnect }) => {

if (qr) qrcode.generate(qr, { small: true })

if (connection === 'close') {
const shouldReconnect =
lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

if (shouldReconnect) startBot()
}
})

sock.ev.on('messages.upsert', async ({ messages }) => {

const m = messages[0]
if (!m.message) return

const jid = m.key.remoteJid

const body =
(
m.message.conversation ||
m.message.extendedTextMessage?.text ||
m.message.buttonsResponseMessage?.selectedButtonId ||
''
).trim().toLowerCase()

const perm = checkPerm(jid, sock)

/* =========================
   📺 MENU VIVO
========================= */

if (body === '!menu') {
return animatedMenu(sock, jid)
}

/* =========================
   🔐 ADMIN PANEL
========================= */

if (body === '!admin') {
return adminPanel(sock, jid)
}

/* =========================
   🎮 COMANDOS BÁSICOS
========================= */

if (body === '!start') {
return sock.sendMessage(jid, {
text: "🎮 jogo iniciado..."
})
}

if (body === '!cam') {
return sock.sendMessage(jid, {
text: "📺 câmeras online..."
})
}

if (body === '!door') {
return sock.sendMessage(jid, {
text: "🚪 porta alternada..."
})
}

if (body.startsWith('!mp3')) {
return sock.sendMessage(jid, {
text: "📥 download iniciado..."
})
}

/* =========================
   👁️ SISTEMA VIVO (EVENTOS)
========================= */

if (Math.random() < 0.03) {
sock.sendMessage(jid, {
text: "👁️ Freddy está te observando..."
})
}

})

}

startBot()