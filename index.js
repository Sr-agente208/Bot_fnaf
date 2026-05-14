const qrcode = require('qrcode-terminal')

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

/* =========================
   DATABASE FAKE
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
   LEVEL SYSTEM
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
💰 MONEY: ${user.money}
🏦 BANK: ${user.bank}
📊 XP: ${user.xp}/${user.level * 100}

━━━━━━━━━━━━━━━━━━

🎮 ECONOMIA

🛠 !work
🎰 !casino 50
🏦 !bank
💸 !deposit 50
💵 !withdraw 50

━━━━━━━━━━━━━━━━━━

🎲 DIVERSÃO

🎲 !dado
🪙 !coinflip
😂 !piada

━━━━━━━━━━━━━━━━━━

📱 UTILIDADES

📋 !menu
👤 !perfil
🏓 !ping
🧠 !level

━━━━━━━━━━━━━━━━━━

🤖 STATUS: ONLINE ✅
`
}

/* =========================
   PERFIL
========================= */

function profile(user) {

return `
╔══════════════╗
     👤 PERFIL
╚══════════════╝

💰 Money: ${user.money}
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

printQRInTerminal: false,

browser: [
'FNAF BOT',
'Chrome',
'1.0'
]

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

if (!m.message) return
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

await sock.sendMessage(jid, {
text: menu(user)
})

return
}

/* =========================
   PING
========================= */

if (text === '!ping') {

await sock.sendMessage(jid, {
text: '🏓 pong'
})

return
}

/* =========================
   PERFIL
========================= */

if (
text === '!perfil' ||
text === '!profile'
) {

await sock.sendMessage(jid, {
text: profile(user)
})

return
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
`💰 Você trabalhou\n\n+${reward} moedas\n+15 XP`

if (levelUp) {

msg +=
`\n\n⭐ LEVEL UP!\nAgora você é level ${user.level}`

}

await sock.sendMessage(jid, {
text: msg
})

return
}

/* =========================
   LEVEL
========================= */

if (text === '!level') {

await sock.sendMessage(jid, {
text:
`⭐ Seu level atual é ${user.level}\n📊 XP: ${user.xp}/${user.level * 100}`
})

return
}

/* =========================
   BANK
========================= */

if (text === '!bank') {

await sock.sendMessage(jid, {
text:
`
🏦 BANCO

💰 Carteira: ${user.money}
🏦 Banco: ${user.bank}
`
})

return
}

/* =========================
   DEPOSIT
========================= */

if (text.startsWith('!deposit')) {

const amount =
parseInt(text.split(' ')[1])

if (isNaN(amount)) {

await sock.sendMessage(jid, {
text: '❌ Digite um valor válido'
})

return
}

if (amount <= 0) {

await sock.sendMessage(jid, {
text: '❌ Valor inválido'
})

return
}

if (amount > user.money) {

await sock.sendMessage(jid, {
text: '❌ Dinheiro insuficiente'
})

return
}

user.money -= amount
user.bank += amount

await sock.sendMessage(jid, {
text: `🏦 Você depositou ${amount} moedas`
})

return
}

/* =========================
   WITHDRAW
========================= */

if (text.startsWith('!withdraw')) {

const amount =
parseInt(text.split(' ')[1])

if (isNaN(amount)) {

await sock.sendMessage(jid, {
text: '❌ Digite um valor válido'
})

return
}

if (amount <= 0) {

await sock.sendMessage(jid, {
text: '❌ Valor inválido'
})

return
}

if (amount > user.bank) {

await sock.sendMessage(jid, {
text: '❌ Banco insuficiente'
})

return
}

user.bank -= amount
user.money += amount

await sock.sendMessage(jid, {
text: `💵 Você sacou ${amount} moedas`
})

return
}

/* =========================
   CASINO
========================= */

if (text.startsWith('!casino')) {

const bet =
parseInt(text.split(' ')[1])

if (isNaN(bet)) {

await sock.sendMessage(jid, {
text: '❌ Digite uma aposta'
})

return
}

if (bet <= 0) {

await sock.sendMessage(jid, {
text: '❌ Valor inválido'
})

return
}

if (bet > user.money) {

await sock.sendMessage(jid, {
text: '❌ Você não tem dinheiro suficiente'
})

return
}

const win =
Math.random() > 0.5

if (win) {

user.money += bet

addXP(user, 10)

await sock.sendMessage(jid, {
text:
`🎰 VOCÊ GANHOU!\n\n+${bet} moedas`
})

} else {

user.money -= bet

await sock.sendMessage(jid, {
text:
`💀 VOCÊ PERDEU!\n\n-${bet} moedas`
})

}

return
}

/* =========================
   DADO
========================= */

if (text === '!dado') {

const dice =
Math.floor(Math.random() * 6) + 1

await sock.sendMessage(jid, {
text: `🎲 Você tirou ${dice}`
})

return
}

/* =========================
   COINFLIP
========================= */

if (text === '!coinflip') {

const flip =
Math.random() > 0.5
? '🪙 Cara'
: '🪙 Coroa'

await sock.sendMessage(jid, {
text: flip
})

return
}

/* =========================
   PIADA
========================= */

if (text === '!piada') {

const jokes = [

'💀 O Freddy abriu uma pizzaria… faliu porque dava susto nos clientes.',

'🤖 O Bonnie virou DJ. Agora ele só toca jumpscare remix.',

'👻 O Foxy corre tanto porque esqueceu o gás ligado.'

]

const random =
jokes[Math.floor(Math.random() * jokes.length)]

await sock.sendMessage(jid, {
text: random
})

return
}

} catch (err) {

console.log('❌ ERRO:')
console.log(err)

}

}
)

}

/* =========================
   START BOT
========================= */

startBot()