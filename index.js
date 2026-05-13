const qrcode = require('qrcode-terminal')
const sqlite3 = require('sqlite3').verbose()
const axios = require('axios')

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

/* =========================
   🧠 SQLITE DATABASE
========================= */

const db = new sqlite3.Database('./fnaf.db')

db.run(`
CREATE TABLE IF NOT EXISTS users (
jid TEXT PRIMARY KEY,
money INTEGER DEFAULT 0,
xp INTEGER DEFAULT 0,
level INTEGER DEFAULT 1,
skin TEXT DEFAULT 'default'
)
`)

function getUser(jid, cb) {
db.get("SELECT * FROM users WHERE jid=?", [jid], (err, row) => {
if (!row) {
db.run("INSERT INTO users (jid) VALUES (?)", [jid])
return cb({ jid, money: 0, xp: 0, level: 1, skin: "default" })
}
cb(row)
})
}

function updateUser(jid, data) {
db.run(`
UPDATE users
SET money=?, xp=?, level=?, skin=?
WHERE jid=?
`, [data.money, data.xp, data.level, data.skin, jid])
}

/* =========================
   💰 ECONOMIA
========================= */

function addMoney(user, amt) {
user.money += amt
user.xp += amt

if (user.xp >= user.level * 100) {
user.xp = 0
user.level++
}

return user
}

/* =========================
   🏆 MEDALHAS / SKINS
========================= */

function getRankEmoji(level) {
if (level >= 20) return "👑"
if (level >= 10) return "💀"
if (level >= 5) return "🔥"
return "👶"
}

/* =========================
   👁️ FREDDY AI SIMPLES
========================= */

async function freddyAI(text) {
const replies = [
"👁️ eu estou observando você...",
"💀 a pizzaria nunca dorme...",
"🔪 você não deveria ter falado isso...",
"🎭 estou atrás de você...",
"📺 as câmeras não mentem..."
]

if (text.includes("oi")) return "👁️ olá... você está seguro?"
return replies[Math.floor(Math.random() * replies.length)]
}

/* =========================
   📺 MENU (FALLBACK SEGURO)
========================= */

async function sendMenu(sock, jid) {

getUser(jid, async (u) => {

try {

await sock.sendMessage(jid, {
text: `
💀 FNAF SYSTEM

💰 Dinheiro: $${u.money}
⭐ Level: ${u.level} ${getRankEmoji(u.level)}
🎭 Skin: ${u.skin}

MENU:
1 - Trabalhar
2 - Loja
3 - Rank
4 - Freddy AI
`
})

} catch (e) {

// fallback (nunca morre)
await sock.sendMessage(jid, {
text: "💀 MENU OFFLINE\n\n1 START\n2 LOJA\n3 RANK"
})
}

})
}

/* =========================
   🛒 LOJA
========================= */

function shop(sock, jid) {
sock.sendMessage(jid, {
text: `
🛒 LOJA FNAF

skins:
- freddy (100$)
- foxy (200$)
- golden (500$)

use: !buy skin
`
})
}

/* =========================
   🏆 RANK GLOBAL
========================= */

function rank(sock, jid) {

db.all("SELECT * FROM users ORDER BY level DESC LIMIT 5", (err, rows) => {

let txt = "🏆 RANK GLOBAL\n\n"

rows.forEach((r, i) => {
txt += `#${i+1} @${r.jid.split('@')[0]} | LVL ${r.level} ${getRankEmoji(r.level)}\n`
})

sock.sendMessage(jid, { text: txt })
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

/* =========================
   📺 MENU
========================= */

if (body === '!menu') return sendMenu(sock, jid)

/* =========================
   💰 TRABALHAR
========================= */

if (body === '1') {

getUser(jid, (u) => {
addMoney(u, 50)
updateUser(jid, u)

sock.sendMessage(jid, {
text: `💰 você trabalhou e ganhou $50\nTotal: $${u.money}`
})
})

}

/* =========================
   🛒 LOJA
========================= */

if (body === '2') return shop(sock, jid)

/* =========================
   🏆 RANK
========================= */

if (body === '3') return rank(sock, jid)

/* =========================
   👁️ FREDDY AI
========================= */

if (body === '4') {
const resp = await freddyAI(body)

sock.sendMessage(jid, { text: resp })
}

/* =========================
   🤖 IA AUTOMÁTICA (chance)
========================= */

if (Math.random() < 0.03) {
sock.sendMessage(jid, {
text: await freddyAI("auto")
})
}

})

}

startBot()