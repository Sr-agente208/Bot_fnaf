const qrcode = require('qrcode-terminal')

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

/* =========================
   DATABASE SIMPLES
========================= */

const users = {}

function getUser(jid) {

if (!users[jid]) {

users[jid] = {
money: 100,
bank: 0,
xp: 0,
level: 1
}

}

return users[jid]
}

/* =========================
   XP SYSTEM
========================= */

function addXP(user, amount) {

user.xp += amount

const need = user.level * 100

if (user.xp >= need) {

user.level++
user.xp = 0

return true
}

return false
}

/* =========================
   MENU
========================= */

function menu(user) {

return `
╔══════════════════════╗
      💀 FNAF BOT 💀
╚══════════════════════╝

👤 LEVEL: ${user.level}
📊 XP: ${user.xp}/${user.level * 100}

💰 MONEY: ${user.money}
🏦 BANK: ${user.bank}

━━━━━━━━━━━━━━━━━━

🎮 ECONOMIA
!work
!casino 50
!deposit 50
!withdraw 50
!bank

━━━━━━━━━━━━━━━━━━

🎲 DIVERSÃO
!dado
!coinflip

━━━━━━━━━━━━━━━━━━

📱 UTILIDADES
!menu
!perfil
!ping

━━━━━━━━━━━━━━━━━━

🤖 STATUS
ONLINE ✅
`
}

/* =========================
   PERFIL
========================= */

function profile(user) {

return `
👤 PERFIL

💰 Dinheiro: ${user.money}
🏦 Banco: ${user.bank}

⭐ Level: ${user.level}
📊 XP: ${user.xp}/${user.level * 100}
`
}

/* =========================
   START BOT
========================= */

async function startBot() {

const { state, saveCreds } =
await useMultiFileAuthState('./auth')

const { version } =
await fetchLatestBaileysVersion()

const sock = makeWASocket({

auth: state,
version,

browser: [
'FNAF BOT',
'Chrome',
'1.0'
],

syncFullHistory: false,
markOnlineOnConnect: false

})

/* =========================
   SAVE CREDS
========================= */

sock.ev.on(
'creds.update',
saveCreds
)

/* =========================
   CONNECTION
========================= */

sock.ev.on(
'connection.update',
({ connection, qr, lastDisconnect }) => {

if (qr) {

console.clear()

console.log('📱 ESCANEIE O QR CODE:\n')

qrcode.generate(qr, {
small: true
})
}

if (connection === 'open') {

console.clear()

console.log('🤖 BOT ONLINE ✅')
}

if (connection === 'close') {

const code =
lastDisconnect?.error?.output?.statusCode

console.log('❌ DESCONECTOU:', code)

if (code !== DisconnectReason.loggedOut) {

console.log('🔄 RECONECTANDO EM 5s...')

setTimeout(() => {
startBot()
}, 5000)

}
}

}
)

/* =========================
   MESSAGES
========================= */

sock.ev.on(
'messages.upsert',
async ({ messages }) => {

try {

const m = messages[0]

if (!m?.message) return
if (m.key.fromMe) return

const jid = m.key.remoteJid

const body =
m.message.conversation ||
m.message.extendedTextMessage?.text ||
m.message.imageMessage?.caption ||
m.message.videoMessage?.caption ||
''

const text =
body.trim().toLowerCase()

if (!text) return

console.log('📨', text)

const user = getUser(jid)

/* =========================
   MENU
========================= */

if (
text === '!menu' ||
text === 'menu'
) {

return await sock.sendMessage(jid, {
text: menu(user)
})
}

/* =========================
   PERFIL
========================= */

if (
text === '!perfil' ||
text === '!profile'
) {

return await sock.sendMessage(jid, {
text: profile(user)
})
}

/* =========================
   PING
========================= */

if (text === '!ping') {

return await sock.sendMessage(jid, {
text: '🏓 pong'
})
}

/* =========================
   WORK
========================= */

if (text === '!work') {

const reward =
Math.floor(Math.random() * 50) + 20

user.money += reward

const levelUp =
addXP(user, 15)

let msg =
`💰 Você trabalhou e ganhou ${reward} moedas`

if (levelUp) {
msg += '\n⭐ LEVEL UP!'
}

return await sock.sendMessage(jid, {
text: msg
})
}

/* =========================
   BANK
========================= */

if (text === '!bank') {

return await sock.sendMessage(jid, {
text:
`🏦 BANCO

💰 Carteira: ${user.money}
🏦 Banco: ${user.bank}`
})
}

/* =========================
   DEPOSIT
========================= */

if (text.startsWith('!deposit')) {

const amount =
parseInt(text.split(' ')[1])

if (isNaN(amount)) {

return await sock.sendMessage(jid, {
text: '❌ valor inválido'
})
}

if (amount > user.money) {

return await sock.sendMessage(jid, {
text: '❌ dinheiro insuficiente'
})
}

user.money -= amount
user.bank += amount

return await sock.sendMessage(jid, {
text: `🏦 depositou ${amount} moedas`
})
}

/* =========================
   WITHDRAW
========================= */

if (text.startsWith('!withdraw')) {

const amount =
parseInt(text.split(' ')[1])

if (isNaN(amount)) {

return await sock.sendMessage(jid, {
text: '❌ valor inválido'
})
}

if (amount > user.bank) {

return await sock.sendMessage(jid, {
text: '❌ banco insuficiente'
})
}

user.bank -= amount
user.money += amount

return await sock.sendMessage(jid, {
text: `💰 sacou ${amount} moedas`
})
}

/* =========================
   CASINO
========================= */

if (text.startsWith('!casino')) {

const bet =
parseInt(text.split(' ')[1])

if (isNaN(bet) || bet <= 0) {

return await sock.sendMessage(jid, {
text: '❌ aposta inválida'
})
}

if (bet > user.money) {

return await sock.sendMessage(jid, {
text: '❌ dinheiro insuficiente'
})
}

const win =
Math.random() > 0.5

if (win) {

user.money += bet

addXP(user, 10)

return await sock.sendMessage(jid, {
text: `🎰 VOCÊ GANHOU +${bet} moedas`
})

} else {

user.money -= bet

return await sock.sendMessage(jid, {
text: `💀 VOCÊ PERDEU -${bet} moedas`
})
}

}

/* =========================
   DADO
========================= */

if (text === '!dado') {

const dice =
Math.floor(Math.random() * 6) + 1

return await sock.sendMessage(jid, {
text: `🎲 dado: ${dice}`
})
}

/* =========================
   COINFLIP
========================= */

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

/* =========================
   START
========================= */

startBot()