const qrcode = require('qrcode-terminal')

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const users = {}

function getUser(jid) {
if (!users[jid]) {
users[jid] = { money: 100, xp: 0, level: 1 }
}
return users[jid]
}

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

async function startBot() {

const { state, saveCreds } = await useMultiFileAuthState('./auth')
const { version } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
auth: state,
version,
printQRInTerminal: true,
browser: ['BOT FIX', 'Chrome', '1.0']
})

sock.ev.on('connection.update', ({ connection, qr, lastDisconnect }) => {

if (qr) qrcode.generate(qr, { small: true })

if (connection === 'close') {
const code = lastDisconnect?.error?.output?.statusCode
console.log("❌ caiu:", code)

if (code !== DisconnectReason.loggedOut) {
setTimeout(startBot, 3000)
}
}

if (connection === 'open') {
console.log("🤖 BOT ONLINE")
}
})

sock.ev.on('creds.update', saveCreds)

sock.ev.on('messages.upsert', async ({ messages }) => {

try {

const m = messages?.[0]
if (!m?.message || m.key.fromMe) return

const jid = m.key.remoteJid

const body =
(
m.message.conversation ||
m.message.extendedTextMessage?.text ||
m.message.imageMessage?.caption ||
m.message.videoMessage?.caption ||
m.message.buttonsResponseMessage?.selectedButtonId ||
''
).trim().toLowerCase()

if (!body) return

console.log("📨 BODY:", body)

const user = getUser(jid)

/* ================= MENU ================= */

if (body === '!menu') {
return sock.sendMessage(jid, { text: menu(user) })
}

/* ================= WORK ================= */

if (body === '!work') {
work(user)
return sock.sendMessage(jid, {
text: `💰 ganhou dinheiro\nsaldo: ${user.money}`
})
}

/* ================= CASINO ================= */

if (body.startsWith('!casino')) {
const bet = parseInt(body.split(' ')[1]) || 10
const result = casino(user, bet)
return sock.sendMessage(jid, { text: result })
}

} catch (e) {
console.log("❌ ERRO:", e)
}

})

}

startBot()