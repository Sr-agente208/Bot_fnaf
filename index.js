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
╔════════════════╗
     💀 FNAF BOT
╚════════════════╝

💰 Money: ${user.money}
⭐ Level: ${user.level}
📊 XP: ${user.xp}

━━━━━━━━━━━━━━

🎮 COMANDOS

!menu
!ping
!work
!perfil

━━━━━━━━━━━━━━

🤖 ONLINE
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

printQRInTerminal: false,

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

return
}

if (text === '!ping') {

await sock.sendMessage(jid, {
text: '🏓 pong'
})

return
}

if (text === '!work') {

user.money += 20
user.xp += 10

if (user.xp >= 100) {

user.level++
user.xp = 0

await sock.sendMessage(jid, {
text:
`⭐ LEVEL UP!\n\nAgora você é level ${user.level}`
})

}

await sock.sendMessage(jid, {
text:
`💰 Você trabalhou\n\n+20 moedas\n+10 XP`
})

return
}

if (
text === '!perfil' ||
text === '!profile'
) {

await sock.sendMessage(jid, {
text:
`
👤 PERFIL

💰 Money: ${user.money}
⭐ Level: ${user.level}
📊 XP: ${user.xp}/100
`
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

startBot()