const qrcode = require('qrcode-terminal')
const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason
} = require('@whiskeysockets/baileys')

async function startBot() {

const { state, saveCreds } =
await useMultiFileAuthState('auth')

const sock = makeWASocket({
auth: state
})

sock.ev.on('connection.update' if (qr) 
qrcode.generate(qr, { small: true })
)}

sock.ev.on('connection.update', async ({
connection,
lastDisconnect,
qr
}) => 

if (qr) {
qrcode.generate(qr, { small: true })
console.log('📱 Escaneie o QR Code')

})

sock.ev.on('creds.update', saveCreds)

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
'🔋 Sua energia está acabando...'
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
