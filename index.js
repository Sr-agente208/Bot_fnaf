const qrcode = require('qrcode-terminal')

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

async function startBot() {

const { state, saveCreds } =
await useMultiFileAuthState('./auth')

const { version } =
await fetchLatestBaileysVersion()

const sock = makeWASocket({
auth: state,
version,
printQRInTerminal: false,
browser: ['Bot FNAF', 'Chrome', '1.0.0']
})

sock.ev.on('creds.update', saveCreds)

sock.ev.on('connection.update', async ({
connection,
lastDisconnect,
qr
}) => {

if (qr) {

qrcode.generate(qr, { small: true })

console.log('📱 Escaneie o QR Code')

}

if (connection === 'open') {

console.log('🤖 BOT ONLINE')

}

if (connection === 'close') {

const shouldReconnect =
lastDisconnect?.error?.output?.statusCode !==
DisconnectReason.loggedOut

console.log('❌ Conexão fechada')

if (shouldReconnect) {
startBot()
}

}

})

sock.ev.on('messages.upsert', async ({ messages }) => {

const m = messages[0]

if (!m.message) return

const from = m.key.remoteJid

const body =
m.message.conversation ||
m.message.extendedTextMessage?.text || ''

// ===== MENU =====

if (body === '!menu') {

const menu = `
╔═══『 🎮 BOT FNAF 』
║
║ 👁️ !fnaf
║ 🦊 !foxy
║ 🧸 !bonnie
║ 🐤 !chica
║ ☠️ !jumpscare
║ 🔋 !energia
║ 🌙 !night
║ 🎵 !musica
║ 👻 !golden
║ 🔪 !springtrap
║
╚═══════════
`

await sock.sendMessage(from, {
text: menu
})

}

// ===== FNAF =====

if (body === '!fnaf') {

const frases = [
'👁️ Freddy está te observando...',
'🎭 Os animatronics ficaram agressivos.',
'🕰️ 5 AM... sobreviva.',
'📺 As câmeras falharam.',
'🔋 Energia acabando...'
]

const resultado =
frases[Math.floor(Math.random() * frases.length)]

await sock.sendMessage(from, {
text: resultado
})

}

// ===== FOXY =====

if (body === '!foxy') {

await sock.sendMessage(from, {
text: '🦊 FOXY CORREU PELO CORREDOR!'
})

}

// ===== BONNIE =====

if (body === '!bonnie') {

await sock.sendMessage(from, {
text: '🧸 Bonnie apareceu atrás de você.'
})

}

// ===== CHICA =====

if (body === '!chica') {

await sock.sendMessage(from, {
text: '🐤 Chica está na cozinha fazendo barulho.'
})

}

// ===== JUMPSCARE =====

if (body === '!jumpscare') {

const sustos = [
'☠️ BOO!',
'👹 VOCÊ MORREU.',
'🔪 Springtrap apareceu.',
'📺 Tela perdida.',
'🩸 Algo abriu a porta.'
]

const scare =
sustos[Math.floor(Math.random() * sustos.length)]

await sock.sendMessage(from, {
text: scare
})

}

// ===== ENERGIA =====

if (body === '!energia') {

const energia =
Math.floor(Math.random() * 100)

await sock.sendMessage(from, {
text: `🔋 Energia restante: ${energia}%`
})

}

// ===== NIGHT =====

if (body === '!night') {

const night =
Math.floor(Math.random() * 6) + 1

await sock.sendMessage(from, {
text: `🌙 Você está na Night ${night}`
})

}

// ===== MUSICA =====

if (body === '!musica') {

await sock.sendMessage(from, {
text: '🎵 Har har har har har...'
})

}

// ===== GOLDEN =====

if (body === '!golden') {

await sock.sendMessage(from, {
text: '👻 Golden Freddy apareceu na sua sala.'
})

}

// ===== SPRINGTRAP =====

if (body === '!springtrap') {

await sock.sendMessage(from, {
text: '🔪 Springtrap entrou na ventilação.'
})

}

})
}

startBot()