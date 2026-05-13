const qrcode = require('qrcode-terminal')
const fs = require('fs')
const path = require('path')
const ytdl = require('ytdl-core')

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

/* =========================
   💰 USERS (MOEDAS + VIP)
========================= */

const users = {}

function getUser(jid) {
if (!users[jid]) {
users[jid] = {
money: 100,
vip: false
}
}
return users[jid]
}

/* =========================
   📥 DOWNLOAD SYSTEM
========================= */

const queue = []
const activeDownloads = {}

function addQueue(job) {
queue.push(job)

// VIP PRIORITY SORT
queue.sort((a, b) => (b.vip ? 1 : 0) - (a.vip ? 1 : 0))

processQueue(job.sock)
}

async function processQueue(sock) {

if (activeDownloads.running) return
activeDownloads.running = true

while (queue.length > 0) {

const job = queue.shift()
await runDownload(sock, job)

}

activeDownloads.running = false
}

/* =========================
   👁️ FREDDY AI COMMENTS
========================= */

function freddySpeak() {
const msgs = [
"👁️ eu estou observando esse download...",
"💀 a pizzaria nunca dorme...",
"📺 câmeras detectaram atividade...",
"🔪 algo está se aproximando...",
"🎭 Freddy está curioso..."
]

return msgs[Math.floor(Math.random() * msgs.length)]
}

/* =========================
   📊 PANEL
========================= */

function sendPanel(sock, jid) {

const running = Object.values(activeDownloads).length

sock.sendMessage(jid, {
text: `
📊 DOWNLOAD PANEL

📥 fila: ${queue.length}
⚡ ativo: ${running}

comandos:
!cancel id
!vip
!panel
`
})

}

/* =========================
   🚫 CANCEL DOWNLOAD
========================= */

function cancelDownload(id) {
if (activeDownloads[id]) {
activeDownloads[id].cancel = true
return true
}
return false
}

/* =========================
   📥 DOWNLOAD ENGINE
========================= */

async function runDownload(sock, job) {

const id = Date.now().toString()
const user = getUser(job.jid)

activeDownloads[id] = {
cancel: false
}

try {

await sock.sendMessage(job.jid, {
text: `📥 iniciando download...\n🎭 ${freddySpeak()}`
})

const info = await ytdl.getInfo(job.url)
const title = info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, "_")

const filePath = path.join(__dirname, `${title}.mp3`)

const stream = ytdl(job.url, { filter: 'audioonly' })
const write = fs.createWriteStream(filePath)

let last = 0

stream.on('progress', (_, d, t) => {

if (activeDownloads[id].cancel) {
stream.destroy()
write.close()
fs.unlinkSync(filePath)
sock.sendMessage(job.jid, {
text: "🚫 download cancelado"
})
return
}

const p = Math.floor((d / t) * 100)

if (p - last >= 10) {
last = p

sock.sendMessage(job.jid, {
text: `📥 baixando... ${p}%\n🎭 ${freddySpeak()}`
})
}

})

stream.pipe(write)

write.on('finish', async () => {

if (activeDownloads[id].cancel) return

user.money += 10 // recompensa por download

await sock.sendMessage(job.jid, {
audio: fs.readFileSync(filePath),
mimetype: 'audio/mp4'
})

fs.unlinkSync(filePath)

sock.sendMessage(job.jid, {
text: `✅ download finalizado\n💰 +10 moedas`
})

delete activeDownloads[id]
})

} catch (e) {
console.log(e)
sock.sendMessage(job.jid, { text: "❌ erro no download" })
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
browser: ['FNAF SERVER', 'Chrome', '1.0']
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
''
).trim().toLowerCase()

const user = getUser(jid)

/* =========================
   📊 PANEL
========================= */

if (body === '!panel') return sendPanel(sock, jid)

/* =========================
   🎬 DOWNLOAD
========================= */

if (body.startsWith('!mp3 ')) {

const url = body.replace('!mp3', '').trim()

addQueue({
jid,
url,
sock,
vip: user.vip
})

}

/* =========================
   🚫 CANCEL
========================= */

if (body.startsWith('!cancel')) {
const ok = cancelDownload(body.split(' ')[1])
sock.sendMessage(jid, {
text: ok ? "🚫 cancelado" : "❌ não encontrado"
})
}

/* =========================
   💰 VIP SYSTEM
========================= */

if (body === '!vip') {
user.vip = true
sock.sendMessage(jid, {
text: "👑 você virou VIP (prioridade na fila)"
})
}

/* =========================
   📊 STATUS
========================= */

if (body === '!money') {
sock.sendMessage(jid, {
text: `💰 moedas: ${user.money}`
})
}

})

}

startBot()