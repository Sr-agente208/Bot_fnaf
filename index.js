const qrcode = require('qrcode-terminal')
const sqlite3 = require('sqlite3').verbose()
const express = require('express')

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

/* =========================
   🧠 SQLITE (MEMÓRIA + ECONOMIA)
========================= */

const db = new sqlite3.Database('./fnaf.db')

db.run(`
CREATE TABLE IF NOT EXISTS users (
jid TEXT PRIMARY KEY,
memory TEXT DEFAULT '',
money INTEGER DEFAULT 100,
xp INTEGER DEFAULT 0,
level INTEGER DEFAULT 1
)
`)

function getUser(jid, cb) {
db.get("SELECT * FROM users WHERE jid=?", [jid], (err, row) => {
if (!row) {
db.run("INSERT INTO users (jid) VALUES (?)", [jid])
return cb({ jid, memory: "", money: 100, xp: 0, level: 1 })
}
cb(row)
})
}

function saveUser(u) {
db.run(
"UPDATE users SET memory=?, money=?, xp=?, level=? WHERE jid=?",
[u.memory, u.money, u.xp, u.level, u.jid]
)
}

/* =========================
   👁️ FREDDY IA COM MEMÓRIA
========================= */

function freddyReply(user, text) {

if (text.includes("oi")) {
return "👁️ eu lembro de você..."
}

if (user.memory.includes("medo")) {
return "💀 você ainda sente o medo... eu lembro."
}

const replies = [
"🎭 Freddy observa silenciosamente...",
"📺 as câmeras nunca esquecem...",
"🔪 você já esteve aqui antes...",
"👁️ sua memória não pode ser apagada..."
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
return `🎰 você ganhou +${bet}`
} else {
user.money -= bet
return `💀 você perdeu -${bet}`
}
}

/* =========================
   🛒 LOJA
========================= */

function shop(user) {
return `
🛒 LOJA

1 - energia (+50) = 50$
2 - skin Freddy = 200$
3 - memória limpa = 500$
`
}

/* =========================
   🌐 WEB DASHBOARD (HACKER PANEL)
========================= */

const app = express()

app.get('/', (req, res) => {
res.send(`
<html>
<body style="background:black;color:lime;font-family:monospace">
<h1>💀 FNAF DASHBOARD</h1>
<p>👁️ sistema online</p>
<p>📊 monitoramento ativo</p>
</body>
</html>
`)
})

app.listen(3000, () => console.log("🌐 dashboard http://localhost:3000"))

/* =========================
   🌍 EVENTOS GLOBAIS
========================= */

setInterval(() => {

const events = [
"👁️ Freddy se moveu nas câmeras...",
"🔪 animatronic detectado...",
"📺 sistema instável...",
"💀 energia global diminuindo..."
]

console.log(events[Math.floor(Math.random() * events.length)])

}, 30000)

/* =========================
   🤖 BOT WHATSAPP
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

/* =========================
   👤 USER LOAD
========================= */

getUser(jid, async (user) => {

/* =========================
   💰 WORK
========================= */

if (body === '!work') {
work(user)
saveUser(user)

return sock.sendMessage(jid, {
text: `💰 você trabalhou\nsaldo: ${user.money}`
})
}

/* =========================
   🎰 CASINO
========================= */

if (body.startsWith('!casino')) {
const bet = parseInt(body.split(' ')[1])
const result = casino(user, bet)
saveUser(user)

return sock.sendMessage(jid, { text: result })
}

/* =========================
   🛒 SHOP
========================= */

if (body === '!shop') {
return sock.sendMessage(jid, { text: shop(user) })
}

/* =========================
   👁️ FREDDY AI
========================= */

if (body.startsWith('!freddy')) {

user.memory += " " + body
saveUser(user)

return sock.sendMessage(jid, {
text: freddyReply(user, body)
})
}

})

})

}

startBot()