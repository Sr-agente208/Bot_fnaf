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
m.message.conversation || ''

if (body === '!fnaf') {

const frases = [
'👁️ Freddy está te observando...',
'🦊 Foxy saiu da Pirate Cove!',
'🔋 Sua energia está acabando...',
'🎭 Os animatronics ficaram agressivos.'
]

const imagens = [
'https://i.imgur.com/WxNkK7J.jpeg',
'https://i.imgur.com/6XQJv8x.jpeg'
]

const resultado =
frases[Math.floor(Math.random() * frases.length)]

const imagem =
imagens[Math.floor(Math.random() * imagens.length)]

await sock.sendMessage(from, {
image: { url: imagem },
caption: resultado
})

}

})

}

startBot()