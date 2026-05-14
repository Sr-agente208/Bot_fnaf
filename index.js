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

users[jid] = {
money: 100,
xp: 0,
level: 1
}

}

return users[jid]
}

function menu(user) {

return `
╔════════════╗
   💀 FNAF BOT
╚════════════╝

💰 Money: ${user.money}
⭐ Level: ${user.level}
📊 XP: ${user.xp}

━━━━━━━━━━━━

!menu
!work
!ping
`
}

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
]

})

sock.ev.on(
'creds.update',
saveCreds
)

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

console.log('🤖 BOT ONLINE')
}

if (connection === 'close') {

const code =
lastDisconnect?.error?.output?.statusCode

console.log('❌ DESCONECTOU:', code)

if (code !== DisconnectReason.loggedOut) {

console.log('🔄 RECONECTANDO...')

setTimeout(() => {
startBot()
}, 5000)

}
}

}
)

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
''

const text =
body.trim().toLowerCase()

if (!text) return

console.log('📨', text)

const user = getUser(jid)

if (text === '!menu') {

await sock.sendMessage(jid, {
text: menu(user)
})

}

if (text === '!ping') {

await sock.sendMessage(jid, {
text: '🏓 pong'
})

}

if (text === '!work') {

user.money += 20
user.xp += 10

await sock.sendMessage(jid, {
text: '💰 você trabalhou'
})

}

} catch (err) {

console.log(err)

}

}
)

}

startBot()