const qrcode = require('qrcode-terminal')

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

/* =========================
   USERS
========================= */

const users = {}

function getUser(jid) {
if (!users[jid]) {
users[jid] = { money: 100, xp: 0, level: 1 }
}
return users[jid]
}

/* =========================
   SYSTEM
========================= */

function work(u) {
u.money += 20
u.xp += 10

if (u.xp >= u.level * 100) {
u.level++
u.xp = 0
}

return u
}

function casino(u, bet) {
if (u.money < bet) return "❌ sem dinheiro"

const win = Math.random() > 0.5

if (win) {
u.money += bet
return `🎰 ganhou +${bet}`
} else {
u.money -= bet
return `💀 perdeu -${bet}`
}
}

/* =========================
   MENU
========================= */

function menu(u) {
return `
💀 BOT ONLINE

💰 Dinheiro: ${u.money}
⭐ Level: ${u.level}
📊 XP: ${u.xp}

COMANDOS:
!menu
!work
!casino 10
`
}

/* =========================
   BOT
========================= */

async function startBot() {

const { state, saveCreds } = await useMultiFileAuthState('./auth')
const { version } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
auth: state,
version,
printQRInTerminal: true,
browser: ['BOT FIX', 'Chrome', '1.0']
})

/* =========================
   CONNECTION
========================= */

sock.ev.on('connection.update', ({ connection, qr, lastDisconnect }) => {

if (qr) qrcode.generate(qr, { small: true })

if (connection === 'open') {
console.log("🤖 BOT ONLINE")
}

if (connection === 'close') {
const code = lastDisconnect?.error?.output?.statusCode
console.log("❌ caiu:", code)

if (code !== DisconnectReason.loggedOut) {
setTimeout(startBot, 3000)
}
}

})

sock.ev.on('creds.update', saveCreds)

/* =========================
   MESSAGES (FIX DEFINITIVO)
========================= */

sock.ev.on('messages.upsert', async ({ messages }) => {

try {

const m = messages?.[0]
if (!m?.message) return
if (m.key.fromMe) return

const jid = m.key.remoteJid
const msg = m.message

const body =
msg.conversation ||
msg.extendedTextMessage?.text ||
msg.imageMessage?.caption ||
msg.videoMessage?.caption ||
msg.buttonsResponseMessage?.selectedButtonId ||
msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
''

const text = body.trim().toLowerCase()

if (!text) return

console.log("📨 BODY:", text)

const user = getUser(jid)

/* ================= MENU ================= */

if (text === '!menu') {
return sock.sendMessage(jid, { text: menu(user) })
}

/* ================= WORK ================= */

if (text === '!work') {
work(user)
return sock.sendMessage(jid, {
text: `💰 ganhou dinheiro\nsaldo: ${user.money}`
})
}

/* ================= CASINO ================= */

if (text.startsWith('!casino')) {
const bet = parseInt(text.split(' ')[1]) || 10
const result = casino(user, bet)
return sock.sendMessage(jid, { text: result })
}

} catch (err) {
console.log("❌ ERRO:", err)
}

})

}

startBot()