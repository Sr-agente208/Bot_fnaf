const qrcode = require('qrcode-terminal')
const sqlite3 = require('sqlite3').verbose()

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

/* =========================
   🧠 BANCO DE DADOS
========================= */

const db = new sqlite3.Database('./fnaf.db')

db.run(`
CREATE TABLE IF NOT EXISTS users (
jid TEXT PRIMARY KEY,
money INTEGER DEFAULT 100,
xp INTEGER DEFAULT 0,
level INTEGER DEFAULT 1,
memory TEXT DEFAULT ''
)
`)

function getUser(jid, cb) {
db.get("SELECT * FROM users WHERE jid=?", [jid], (err, row) => {
if (!row) {
db.run("INSERT INTO users (jid) VALUES (?)", [jid])
return cb({ jid, money: 100, xp: 0, level: 1, memory: "" })
}
cb(row)
})
}

function saveUser(u) {
db.run(
"UPDATE users SET money=?, xp=?, level=?, memory=? WHERE jid=?",
[u.money, u.xp, u.level, u.memory, u.jid]
)
}

/* =========================
   👁️ FREDDY IA
========================= */

function freddyAI(user, text) {

user.memory += " " + text

const replies = [
"👁️ eu lembro de você...",
"💀 você não devia voltar aqui...",
"📺 as câmeras nunca mentem...",
"🔪 Freddy está perto...",
"🎭 você já esteve aqui antes..."
]

return replies[Math.floor(Math.random() * replies.length)]
}

/* =========================
   💰 ECONOMIA
========================= */

function work(user) {
user.money += 20
user.xp += 10

if (user.xp >= user.level * 100) {
user.level++
user.xp = 0
}

return user
}

/* =========================
   🎰 CASINO
========================= */

function casino(user, bet) {

if (user.money < bet) return "❌ sem dinheiro"

const win = Math.random() > 0.5

if (win) {
user.money += bet
return `🎰 ganhou +${bet}`
} else {
user.money -= bet
return `💀 perdeu -${bet}`
}
}

/* =========================
   💀 MENU VIVO 2.0
========================= */

async function sendMenu(sock, jid, user) {

const hour = new Date().getHours()

let fase = "NOITE"
if (hour < 12) fase = "MANHÃ"
if (hour >= 12 && hour < 18) fase = "TARDE"
if (hour >= 18) fase = "NOITE"

const freddyLines = [
"👁️ eu estou te observando...",
"💀 o sistema está vivo...",
"📺 movimento detectado...",
"🔪 algo está aqui..."
]

const freddy = freddyLines[Math.floor(Math.random() * freddyLines.length)]

const text = `
💀 FNAF SYSTEM LIVE

⏰ Fase: ${fase}
💰 Dinheiro: ${user.money}
⭐ Level: ${user.level}

🎮 COMANDOS:
!work
!casino valor
!shop
!freddy msg
!panel

👁️ ${freddy}
`

/* BOTÕES (SE SUPORTAR) */
try {
await sock.sendMessage(jid, {
text: "🎮 MENU VIVO",
footer: "FNAF SYSTEM",
buttons: [
{ buttonId: '!work', buttonText: { displayText: '💰 WORK' }, type: 1 },
{ buttonId: '!casino 10', buttonText: { displayText: '🎰 CASINO' }, type: 1 },
{ buttonId: '!shop', buttonText: { displayText: '🛒 SHOP' }, type: 1 }
]
})
return
} catch (e) {}

/* FALLBACK */
await sock.sendMessage(jid, { text })
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
browser: ['FNAF FINAL', 'Chrome', '1.0']
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
).toLowerCase()

getUser(jid, async (user) => {

/* =========================
   📺 MENU
========================= */

if (body === '!menu') {
return sendMenu(sock, jid, user)
}

/* =========================
   💰 WORK
========================= */

if (body === '!work') {
work(user)
saveUser(user)

return sock.sendMessage(jid, {
text: `💰 ganhou dinheiro\nTotal: ${user.money}`
})
}

/* =========================
   🎰 CASINO
========================= */

if (body.startsWith('!casino')) {
const bet = parseInt(body.split(' ')[1]) || 10
const result = casino(user, bet)
saveUser(user)

return sock.sendMessage(jid, { text: result })
}

/* =========================
   👁️ FREDDY IA
========================= */

if (body.startsWith('!freddy')) {

const msg = body.replace('!freddy', '')
const resp = freddyAI(user, msg)

saveUser(user)

return sock.sendMessage(jid, {
text: resp
})
}

/* =========================
   🛒 SHOP
========================= */

if (body === '!shop') {
return sock.sendMessage(jid, {
text: `
🛒 LOJA

- energia
- skin freddy
- boost xp
`
})
}

/* =========================
   📊 PANEL
========================= */

if (body === '!panel') {
return sock.sendMessage(jid, {
text: `
📊 SISTEMA

👥 ativo
💾 sqlite ok
👁️ Freddy online
`
})
}

})

})

}

startBot()