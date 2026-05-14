const readline = require('readline')

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

/* =========================
   TERMINAL
========================= */

const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
})

function question(text) {
return new Promise(resolve => rl.question(text, resolve))
}

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
   XP
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

const gain = Math.floor(Math.random() * 50) + 20

user.money += gain

const levelUp = addXP(user, 15)

return {
gain,
levelUp
}
}

/* =========================
   CASINO
========================= */

function casino(user, bet) {

if (isNaN(bet)) return '❌ aposta inválida'

if (bet <= 0) return '❌ aposta inválida'

if (user.money < bet) {
return '❌ dinheiro insuficiente'
}

const win = Math.random() > 0.5

if (win) {

user.money += bet

addXP(user, 10)

return `🎰 você ganhou +${bet} moedas`

} else {

user.money -= bet

return `💀 você perdeu -${bet} moedas`
}
}

/* =========================
   MENU
========================= */

function menu(user) {

return `
╔══════════════════╗
     💀 FNAF BOT 💀
╚══════════════════╝

👤 LEVEL: ${user.level}
💰 MONEY: ${user.money}
🏦 BANK: ${user.bank}
📊 XP: ${user.xp}/${user.level * 100}

🎮 ECONOMIA
!work
!casino 50
!bank
!deposit 50
!withdraw 50

📱 UTILIDADES
!menu
!profile
!ping

🎲 DIVERSÃO
!dado
!coinflip

⚡ STATUS
Bot Online ✅
`
}

function profile(user) {

return `
👤 PERFIL

💰 Carteira: ${user.money}
🏦 Banco: ${user.bank}
⭐ Level: ${user.level}
📊 XP: ${user.xp}/${user.level * 100}
`
}

/* =========================
   BOT
========================= */

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

/* =========================
   CONEXÃO
========================= */

sock.ev.on(
'connection.update',
async ({ connection, lastDisconnect }) => {

if (connection === 'open') {

console.clear()

console.log('🤖 BOT ONLINE')
console.log('✅ conectado no WhatsApp')
}

if (connection === 'close') {

const code =
lastDisconnect?.error?.output?.statusCode

console.log('❌ conexão fechada:', code)

if (code !== DisconnectReason.loggedOut) {

console.log('🔄 reconectando...')

setTimeout(() => {
startBot()
}, 5000)

}
}
}
)

sock.ev.on('creds.update', saveCreds)

/* =========================
   PAIRING CODE
========================= */

if (!sock.authState.creds.registered) {

const number =
await question('\n📱 DIGITE SEU NÚMERO COM DDI:\n')

setTimeout(async () => {

try {

const code =
await sock.requestPairingCode(number)

console.log('\n🔐 CÓDIGO:\n')

console.log(code)

console.log('\n📲 coloque esse código no WhatsApp\n')

} catch (err) {

console.log('❌ erro ao gerar código')
console.log(err)

}

}, 5000)
}

/* =========================
   MENSAGENS
========================= */

sock.ev.on(
'messages.upsert',
async ({ messages }) => {

try {

const m = messages[0]

if (!m?.message) return
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

if (
text === '!menu' ||
text === 'menu'
) {

return await sock.sendMessage(jid, {
text: menu(user)
})
}

/* ================= PROFILE ================= */

if (
text === '!profile' ||
text === '!perfil'
) {

return await sock.sendMessage(jid, {
text: profile(user)
})
}

/* ================= PING ================= */

if (text === '!ping') {

return await sock.sendMessage(jid, {
text: '🏓 pong'
})
}

/* ================= WORK ================= */

if (text === '!work') {

const result = work(user)

let txt =
`💰 você ganhou ${result.gain} moedas`

if (result.levelUp) {
txt += '\n⭐ LEVEL UP!'
}

return await sock.sendMessage(jid, {
text: txt
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

/* ================= BANK ================= */

if (text === '!bank') {

return await sock.sendMessage(jid, {
text:
`🏦 BANCO\n\n💰 carteira: ${user.money}\n🏦 banco: ${user.bank}`
})
}

/* ================= DEPOSIT ================= */

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

/* ================= WITHDRAW ================= */

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

/* ================= DADO ================= */

if (text === '!dado') {

const dice =
Math.floor(Math.random() * 6) + 1

return sock.sendMessage(jid, {
text: `🎲 dado: ${dice}`
})
}

/* ================= COINFLIP ================= */

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

console.log('❌ erro:')
console.log(err)

}

})
}

startBot()