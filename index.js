const qrcode = require('qrcode-terminal')

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

/* =========================
   🧠 USUÁRIOS (MEMÓRIA SIMPLES)
========================= */

const users = {}

function getUser(jid) {
if (!users[jid]) {
users[jid] = {
money: 100,
xp: 0,
level: 1,
memory: ""
}
}
return users[jid]
}

function saveUser(jid, user) {
users[jid] = user
}

/* =========================
   💰 FUNÇÕES
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

function freddy(user, msg) {

user.memory += " " + msg

const replies = [
"👁️ eu estou te observando...",
"💀 Freddy nunca dorme...",
"📺 câmeras detectaram você...",
"🔪 algo está perto...",
"🎭 você já esteve aqui..."
]

return replies[Math.floor(Math.random() * replies.length)]
}

/* =========================
   📺 MENU FUNCIONAL
========================= */

async function sendMenu(sock, jid, user) {

const menu = `
💀 FNAF SYSTEM ONLINE

💰 Dinheiro: ${user.money}
⭐ Level: ${user.level}
📊 XP: ${user.xp}

🎮 COMANDOS:

!work → ganhar dinheiro
!casino 10 → apostar
!freddy texto → IA
!menu → abrir menu

👁️ Freddy está observando...
`

await sock.sendMessage(jid, { text: menu })
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
browser: ['FNAF FIXED BOT', 'Chrome', '1.0']
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
saveUser(jid, user)

return sock.sendMessage(jid, {
text: `💰 você ganhou dinheiro\nsaldo: ${user.money}`
})
}

/* =========================
   🎰 CASINO
========================= */

if (body.startsWith('!casino')) {

const bet = parseInt(body.split(' ')[1]) || 10
const result = casino(user, bet)

saveUser(jid, user)

return sock.sendMessage(jid, { text: result })
}

/* =========================
   👁️ FREDDY
========================= */

if (body.startsWith('!freddy')) {

const msg = body.replace('!freddy', '').trim()
const resp = freddy(user, msg)

saveUser(jid, user)

return sock.sendMessage(jid, {
text: resp
})
}

/* =========================
   👁️ EVENTO ALEATÓRIO
========================= */

if (Math.random() < 0.03) {
return sock.sendMessage(jid, {
text: "👁️ Freddy está te observando..."
})
}

})

}

startBot()