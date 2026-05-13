const qrcode = require('qrcode-terminal')

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

/* =========================
   🧠 USUÁRIOS
========================= */

const users = {}

function getUser(jid) {
if (!users[jid]) {
users[jid] = {
money: 100,
xp: 0,
level: 1
}
}
return users[jid]
}

/* =========================
   💰 SISTEMA
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
   📺 MENU
========================= */

function menu(user) {
return `
💀 BOT FUNCIONANDO

💰 Dinheiro: ${user.money}
⭐ Level: ${user.level}
📊 XP: ${user.xp}

COMANDOS:
!menu
!work
!casino 10
`
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
browser: ['FIX BOT', 'Chrome', '1.0']
})

/* =========================
   🔌 CONEXÃO
========================= */

sock.ev.on('connection.update', ({ connection, qr, lastDisconnect }) => {

if (qr) qrcode.generate(qr, { small: true })

if (connection === 'close') {
const shouldReconnect =
lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

console.log("❌ conexão caiu, reconectando...")

if (shouldReconnect) startBot()
}

if (connection === 'open') {
console.log("🤖 BOT ONLINE")
}
})

sock.ev.on('creds.update', saveCreds)

/* =========================
   💬 MENSAGENS (CORRIGIDO)
========================= */

sock.ev.on('messages.upsert', async (data) => {

try {

const m = data.messages?.[0]
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

console.log("📨 BODY:", body)

const user = getUser(jid)

/* =========================
   📺 MENU
========================= */

if (body === '!menu') {
return sock.sendMessage(jid, { text: menu(user) })
}

/* =========================
   💰 WORK
========================= */

if (body === '!work') {
work(user)

return sock.sendMessage(jid, {
text: `💰 ganhou dinheiro\nsaldo: ${user.money}`
})
}

/* =========================
   🎰 CASINO
========================= */

if (body.startsWith('!casino')) {

const bet = parseInt(body.split(' ')[1]) || 10
const result = casino(user, bet)

return sock.sendMessage(jid, { text: result })
}

} catch (err) {
console.log("❌ ERRO:", err)
}

})

}

startBot()