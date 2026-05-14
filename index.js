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

users[jid] = {
money: 100,
xp: 0,
level: 1,
bank: 0
}

}

return users[jid]
}

/* =========================
   XP SYSTEM
========================= */

function addXP(user, amount) {

user.xp += amount

if (user.xp >= user.level * 100) {

user.level++
user.xp = 0

return true
}

return false
}

/* =========================
   WORK
========================= */

function work(user) {

const reward =
Math.floor(Math.random() * 50) + 20

user.money += reward

const levelUp = addXP(user, 15)

return {
reward,
levelUp
}
}

/* =========================
   CASINO
========================= */

function casino(user, bet) {

if (isNaN(bet)) {
return "❌ aposta inválida"
}

if (bet <= 0) {
return "❌ aposta inválida"
}

if (user.money < bet) {
return "❌ dinheiro insuficiente"
}

const win = Math.random() > 0.5

if (win) {

user.money += bet

addXP(user, 10)

return `🎰 VOCÊ GANHOU +${bet} moedas`

} else {

user.money -= bet

return `💀 VOCÊ PERDEU -${bet} moedas`
}
}

/* =========================
   PROFILE
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
   MENU
========================= */

function menu(user) {

return `
╔════════════════════╗
      💀 FNAF BOT 💀
╚════════════════════╝

👤 LEVEL: ${user.level}
💰 MONEY: ${user.money}
📊 XP: ${user.xp}

━━━━━━━━━━━━━━━

🎮 ECONOMIA
!work
!casino 50
!bank
!deposit 50
!withdraw 50

━━━━━━━━━━━━━━━

📱 UTILIDADES
!ping
!profile
!menu

━━━━━━━━━━━━━━━

🎲 DIVERSÃO
!dado
!coinflip

━━━━━━━━━━━━━━━

🤖 STATUS
Bot Online ✅
`
}

/* =========================
   START BOT
========================= */

let sock

async function startBot() {

const { state, saveCreds } =
await useMultiFileAuthState('./auth')

const { version } =
await fetchLatestBaileysVersion()

sock = makeWASocket({

auth: state,
version,

printQRInTerminal: false,

browser: [
'FNAF BOT',
'Chrome',
'1.0'
]

})

/* =========================
   CONNECTION
========================= */

sock.ev.on(
'connection.update',
async ({ connection, qr, lastDisconnect }) => {

if (qr) {

console.clear()

console.log('📱 ESCANEIE O QR CODE:\n')

qrcode.generate(qr, {
small: true
})
}

if (connection === 'open') {

console.clear()

console.log('🤖 BOT ONLINE COM SUCESSO')
}

if (connection === 'close') {

const code =
lastDisconnect?.error?.output?.statusCode

console.log('❌ DESCONECTOU:', code)

if (
code === DisconnectReason.loggedOut
) {

console.log('⚠️ sessão desconectada')
return
}

console.log('🔄 RECONECTANDO EM 5s...')

setTimeout(() => {
startBot()
}, 5000)

}
}
)

sock.ev.on(
'creds.update',
saveCreds
)

/* =========================
   MESSAGES
========================= */

sock.ev.on(
'messages.upsert',
async ({ messages }) => {

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

const text =
body.trim().toLowerCase()

if (!text) return

console.log('📨 COMANDO:', text)

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
   PROFILE
========================= */

if (
text === '!profile' ||
text === '!perfil'
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

const result = work(user)

let response =
`💰 Você trabalhou e ganhou ${result.reward} moedas`

if (result.levelUp) {
response += '\n⭐ LEVEL UP!'
}

return await sock.sendMessage(jid, {
text: response
})
}

/* =========================
   CASINO
========================= */

if (text.startsWith('!casino')) {

const bet =
parseInt(text.split(' ')[1])

const result =
casino(user, bet)

return await sock.sendMessage(jid, {
text: result
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

return sock.sendMessage(jid, {
text: '❌ valor inválido'
})
}

if (amount > user.money) {

return sock.sendMessage(jid, {
text: '❌ dinheiro insuficiente'
})
}

user.money -= amount
user.bank += amount

return sock.sendMessage(jid, {
text: `🏦 depositou ${amount}`
})
}

/* =========================
   WITHDRAW
========================= */

if (text.startsWith('!withdraw')) {

const amount =
parseInt(text.split(' ')[1])

if (isNaN(amount)) {

return sock.sendMessage(jid, {
text: '❌ valor inválido'
})
}

if (amount > user.bank) {

return sock.sendMessage(jid, {
text: '❌ banco insuficiente'
})
}

user.bank -= amount
user.money += amount

return sock.sendMessage(jid, {
text: `💰 sacou ${amount}`
})
}

/* =========================
   DADO
========================= */

if (text === '!dado') {

const dice =
Math.floor(Math.random() * 6) + 1

return sock.sendMessage(jid, {
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

return sock.sendMessage(jid, {
text: `🪙 ${flip}`
})
}

} catch (err) {

console.log('❌ ERRO:')
console.log(err)

}

})

}

/* =========================
   START
========================= */

startBot()