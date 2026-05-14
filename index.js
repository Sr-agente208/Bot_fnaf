const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const readline = require('readline')

const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
})

const users = {}

/* ================= USERS ================= */

function getUser(jid) {

if (!users[jid]) {

users[jid] = {
money: 100,
xp: 0,
level: 1,
bank: 0
}

}

return users[jid]
}

/* ================= XP ================= */

function addXP(user, amount) {

user.xp += amount

if (user.xp >= user.level * 100) {

user.level++
user.xp = 0

return true
}

return false
}

/* ================= WORK ================= */

function work(user) {

const amount = Math.floor(Math.random() * 50) + 20

user.money += amount

const levelUp = addXP(user, 15)

return {
amount,
levelUp
}
}

/* ================= CASINO ================= */

function casino(user, bet) {

if (isNaN(bet) || bet <= 0) {
return '❌ aposta inválida'
}

if (bet > user.money) {
return '❌ dinheiro insuficiente'
}

const win = Math.random() > 0.5

if (win) {

user.money += bet

return `🎰 você ganhou ${bet} moedas`

} else {

user.money -= bet

return `💀 você perdeu ${bet} moedas`
}
}

/* ================= MENU ================= */

function menu(user) {

return `
╔══════════════╗
   💀 FNAF BOT 💀
╚══════════════╝

👤 LEVEL: ${user.level}
💰 MONEY: ${user.money}
📊 XP: ${user.xp}/${user.level * 100}

🎮 ECONOMIA
!work
!casino 50
!perfil

📱 UTILIDADES
!menu
!ping

🎲 DIVERSÃO
!dado
!coinflip

🤖 STATUS
ONLINE ✅
`
}

/* ================= BOT ================= */

async function startBot() {

const { state, saveCreds } =
await useMultiFileAuthState('./auth')

const { version } =
await fetchLatestBaileysVersion()

const sock = makeWASocket({
auth: state,
version,
browser: ['FNAF BOT', 'Chrome', '1.0']
})

/* ================= CONNECTION ================= */

sock.ev.on(
'connection.update',
async ({ connection, lastDisconnect }) => {

if (connection === 'open') {

console.clear()
console.log('🤖 BOT ONLINE')
}

if (connection === 'close') {

const code =
lastDisconnect?.error?.output?.statusCode

console.log('❌ DESCONECTOU:', code)

if (code !== DisconnectReason.loggedOut) {

console.log('🔄 RECONECTANDO...')
startBot()
}
}

/* ================= PAIRING CODE ================= */

if (!sock.authState.creds.registered) {

rl.question(
'📱 DIGITE SEU NÚMERO COM DDI:\n',
async (numero) => {

try {

const code =
await sock.requestPairingCode(numero)

console.log(`
╔════════════════╗
   📲 CÓDIGO:
   ${code}
╚════════════════╝
`)

} catch (err) {

console.log('❌ ERRO AO GERAR CÓDIGO')
console.log(err)
}

}
)

}

}
)

sock.ev.on('creds.update', saveCreds)

/* ================= MESSAGES ================= */

sock.ev.on(
'messages.upsert',
async ({ messages }) => {

try {

const m = messages[0]

if (!m.message) return
if (m.key.fromMe) return

const jid = m.key.remoteJid

const msg = m.message

const body =
msg.conversation ||
msg.extendedTextMessage?.text ||
msg.imageMessage?.caption ||
msg.videoMessage?.caption ||
''

const text = body.trim().toLowerCase()

if (!text) return

console.log('📨', text)

const user = getUser(jid)

/* ================= MENU ================= */

if (text === '!menu') {

return await sock.sendMessage(jid, {
text: menu(user)
})
}

/* ================= PING ================= */

if (text === '!ping') {

return await sock.sendMessage(jid, {
text: '🏓 pong'
})
}

/* ================= PERFIL ================= */

if (text === '!perfil') {

return await sock.sendMessage(jid, {
text: `
👤 PERFIL

💰 MONEY: ${user.money}
⭐ LEVEL: ${user.level}
📊 XP: ${user.xp}
`
})
}

/* ================= WORK ================= */

if (text === '!work') {

const result = work(user)

return await sock.sendMessage(jid, {
text: `
💰 você trabalhou

+${result.amount} moedas
`
})
}

/* ================= CASINO ================= */

if (text.startsWith('!casino')) {

const bet =
parseInt(text.split(' ')[1])

const result =
casino(user, bet)

return await sock.sendMessage(jid, {
text: result
})
}

/* ================= DADO ================= */

if (text === '!dado') {

const dice =
Math.floor(Math.random() * 6) + 1

return await sock.sendMessage(jid, {
text: `🎲 dado: ${dice}`
})
}

/* ================= COINFLIP ================= */

if (text === '!coinflip') {

const flip =
Math.random() > 0.5
? 'cara'
: 'coroa'

return await sock.sendMessage(jid, {
text: `🪙 ${flip}`
})
}

} catch (err) {

console.log('❌ ERRO:')
console.log(err)
}

}
)

}

startBot()