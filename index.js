const qrcode = require('qrcode-terminal')
const fetch = require('node-fetch')
const ytdl = require('ytdl-core')
const axios = require('axios')
const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

/* =========================
   ⚙️ CONFIG
========================= */

const ADMIN_JIDS = ['SEU_NUMERO@s.whatsapp.net']

const spam = {}
const queue = []
let processing = false

const game = {}

/* =========================
   🚫 ANTI-SPAM
========================= */

function checkSpam(jid) {
const now = Date.now()

if (!spam[jid]) spam[jid] = { time: now, count: 0 }

if (now - spam[jid].time < 3000) spam[jid].count++
else spam[jid] = { time: now, count: 1 }

return spam[jid].count > 5
}

/* =========================
   📥 FILA DE DOWNLOAD
========================= */

function addQueue(task) {
queue.push(task)
processQueue()
}

async function processQueue() {
if (processing) return
processing = true

while (queue.length > 0) {
const task = queue.shift()
try {
await task.run()
} catch (e) {
console.log("Erro fila:", e)
}
}

processing = false
}

/* =========================
   🎮 GAME STATE
========================= */

function createPlayer(jid) {
if (!game[jid]) {
game[jid] = {
night: 1,
energy: 100,
alive: true,
door: false,
interval: null,
achievements: []
}
}
return game[jid]
}

function bar(v) {
const total = 10
const fill = Math.round((v / 100) * total)
return "█".repeat(fill) + "░".repeat(total - fill)
}

/* =========================
   🎮 MENUS
========================= */

function sendSurvivalMenu(sock, jid) {
const s = createPlayer(jid)

sock.sendMessage(jid, {
text: `
💀 FNAF SURVIVAL

🌙 NOITE: ${s.night}
🔋 ENERGIA: ${s.energy}%
[${bar(s.energy)}]

Comandos:
- START
- CAM
- DOOR
`
})
}

function sendMediaMenu(sock, jid) {
sock.sendMessage(jid, {
text: `
📥 MEDIA SYSTEM

📺 !yt link
🎬 !tiktok link
🔊 !audio link
🧩 !sticker link

⚡ sistema com fila ativa
`
})
}

function sendAdminPanel(sock, jid) {
sock.sendMessage(jid, {
text: `
🧠 ADMIN PANEL

📦 FILA: ${queue.length}
🚫 SPAM SYSTEM: ON

Comandos internos ativos
`
})
}

/* =========================
   🎮 FNAF LOOP
========================= */

function startGame(sock, jid) {
const s = createPlayer(jid)

if (s.interval) return

s.interval = setInterval(() => {

if (!s.alive) return

s.energy -= 6

// ataque IA
if (Math.random() < 0.35 && !s.door) {
s.energy -= 22
sock.sendMessage(jid, { text: "☠️ ALGO ESTÁ NO CORREDOR..." })
}

// porta drena energia
if (s.door) s.energy -= 3

// blackout
if (Math.random() < 0.1) {
sock.sendMessage(jid, { text: "⚡ BLACKOUT..." })
s.energy -= 10
}

// game over
if (s.energy <= 0) {
s.energy = 0
s.alive = false
clearInterval(s.interval)

sock.sendMessage(jid, {
text: "💀 GAME OVER"
})

return
}

// avanço de noite
if (Math.random() < 0.15) {
s.night++
sock.sendMessage(jid, { text: `🌙 6AM... noite ${s.night - 1}` })
}

}, 12000)
}

/* =========================
   📥 DOWNLOADS
========================= */

async function youtube(sock, jid, url) {
await sock.sendMessage(jid, { text: "⏳ YouTube baixando..." })

const info = await ytdl.getInfo(url)
const title = info.videoDetails.title

const stream = ytdl(url, { filter: 'audioandvideo' })

sock.sendMessage(jid, {
video: stream,
caption: `📺 ${title}`
})
}

async function tiktok(sock, jid, url) {
await sock.sendMessage(jid, { text: "⏳ TikTok baixando..." })

const res = await axios.get(
`https://api.tiklydown.me/api/download?url=${encodeURIComponent(url)}`
)

const video = res.data.video.noWatermark

await sock.sendMessage(jid, {
video: { url: video },
caption: "📱 TikTok baixado"
})
}

async function audio(sock, jid, url) {
await sock.sendMessage(jid, { text: "🎵 convertendo áudio..." })

const stream = ytdl(url, { filter: 'audioonly' })

sock.sendMessage(jid, {
audio: stream,
mimetype: 'audio/mp4'
})
}

/* =========================
   🧩 STICKER
========================= */

async function sticker(sock, jid, url) {
await sock.sendMessage(jid, { text: "🧩 criando figurinha..." })

const stream = ytdl(url, { filter: 'videoonly' })
const file = fs.createWriteStream('temp.mp4')

stream.pipe(file)

file.on('finish', () => {
ffmpeg('temp.mp4')
.output('temp.webp')
.videoFilters('scale=512:512')
.on('end', async () => {
await sock.sendMessage(jid, {
sticker: fs.readFileSync('temp.webp')
})

fs.unlinkSync('temp.mp4')
fs.unlinkSync('temp.webp')
})
.run()
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
printQRInTerminal: false,
browser: ['FNAF SYSTEM', 'Chrome', '1.0']
})

sock.ev.on('connection.update', ({ connection, qr }) => {
if (qr) qrcode.generate(qr, { small: true })
if (connection === 'open') console.log("💀 BOT ONLINE")
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

/* 🚫 ANTI-SPAM */
if (checkSpam(jid)) {
sock.sendMessage(jid, { text: "🚫 spam detectado" })
return
}

const s = createPlayer(jid)

/* =========================
   🎮 MENUS
========================= */

if (body === '!MENU') return sendSurvivalMenu(sock, jid)
if (body === '!MEDIA') return sendMediaMenu(sock, jid)
if (body === '!ADMIN') {
if (!ADMIN_JIDS.includes(jid)) return sock.sendMessage(jid, { text: "🚫 negado" })
return sendAdminPanel(sock, jid)
}

/* =========================
   🎮 GAME
========================= */

if (body === 'START') return startGame(sock, jid)
if (body === 'CAM') return sock.sendMessage(jid, { text: "📺 câmeras instáveis..." })
if (body === 'DOOR') {
s.door = !s.door
return sock.sendMessage(jid, { text: s.door ? "🚪 FECHADO" : "🚪 ABERTO" })
}

/* =========================
   📥 DOWNLOAD QUEUE
========================= */

if (body.startsWith('!YT ')) {
const url = body.replace('!YT', '').trim()

return addQueue({
run: async () => youtube(sock, jid, url)
})
}

if (body.startsWith('!TIKTOK ')) {
const url = body.replace('!TIKTOK', '').trim()

return addQueue({
run: async () => tiktok(sock, jid, url)
})
}

if (body.startsWith('!AUDIO ')) {
const url = body.replace('!AUDIO', '').trim()

return addQueue({
run: async () => audio(sock, jid, url)
})
}

if (body.startsWith('!STICKER ')) {
const url = body.replace('!STICKER', '').trim()

return addQueue({
run: async () => sticker(sock, jid, url)
})
}

})

}

startBot()