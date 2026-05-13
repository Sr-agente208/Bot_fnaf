const qrcode = require('qrcode-terminal')
const fetch = require('node-fetch')

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

// ===== CONEXÃO =====

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

sock.ev.on('creds.update', saveCreds)

// ===== MENSAGENS =====

sock.ev.on('messages.upsert', async ({ messages }) => {

const m = messages[0]

if (!m.message) return

const from = m.key.remoteJid

const body =
m.message.conversation ||
m.message.extendedTextMessage?.text || ''

console.log('📩 Mensagem:', body)

// ===== MENU =====

if (body === '!menu') {

await sock.sendMessage(from, {

image: {
url: 'https://i.imgur.com/WxNkK7J.jpeg'
},

caption: `
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
║ 📺 !camera
║ 💀 !glitch
║ 🎶 !play
║ 🐦 !twitter
║
╚═══════════
`
})

}

// ===== FNAF =====

if (body === '!fnaf') {

const frases = [
'👁️ Freddy está te observando...',
'🎭 Os animatronics ficaram agressivos.',
'🕰️ 5 AM... sobreviva.',
'📺 As câmeras falharam.',
'🔋 Energia acabando...',
'⚠️ Movimento detectado no CAM 2B.',
'🌙 Você ouviu passos atrás de você.'
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
image: {
url: 'https://i.imgur.com/6XQJv8x.jpeg'
},
caption: '🦊 FOXY CORREU PELO CORREDOR!'
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

const jumpscares = [

{
gif: 'https://media.tenor.com/IHdlTRsmcS4AAAAC/fnaf-jumpscare.gif',
texto: '☠️ Freddy te pegou.'
},

{
gif: 'https://media.tenor.com/akG7iJx2jWAAAAAC/foxy-fnaf.gif',
texto: '🦊 Foxy atacou do corredor.'
},

{
gif: 'https://media.tenor.com/cK9HcJ6p8x8AAAAC/springtrap-fnaf.gif',
texto: '🔪 Springtrap apareceu.'
},

{
gif: 'https://media.tenor.com/6K0wS6Sx9sAAAAAC/fnaf.gif',
texto: '👻 Golden Freddy surgiu.'
}

]

const scare =
jumpscares[Math.floor(Math.random() * jumpscares.length)]

await sock.sendMessage(from, {
video: { url: scare.gif },
gifPlayback: true,
caption: scare.texto
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

// ===== CAMERA =====

if (body === '!camera') {

const cameras = [
'📺 CAM 1A: Palco principal.',
'📺 CAM 2B: Movimento detectado.',
'📺 CAM 4A: Corredor vazio.',
'📺 CAM 5: Pirate Cove aberta.',
'📺 CAM 6: Sinal perdido.'
]

const cam =
cameras[Math.floor(Math.random() * cameras.length)]

await sock.sendMessage(from, {
text: cam
})

}

// ===== GLITCH =====

if (body === '!glitch') {

await sock.sendMessage(from, {
text: '̷Y̷O̷U̷ ̷C̷A̷N̷\'̷T̷ ̷S̷A̷V̷E̷'
})

}

// ===== PLAY =====

if (body.startsWith('!play ')) {

const query = body.slice(6)

if (!query) {

return sock.sendMessage(from, {
text: '🎶 Digite o nome da música.'
})

}

await sock.sendMessage(from, {
text: `🔎 Procurando: ${query}`
})

await sock.sendMessage(from, {
image: {
url: 'https://i.imgur.com/WxNkK7J.jpeg'
},
caption: `
🎵 Música encontrada

🔎 Pesquisa: ${query}

⚠️ Sistema em desenvolvimento.
`
})

}

// ===== TWITTER =====

if (body.startsWith('!twitter ')) {

const q = body.slice(9)

if (!q) {

return sock.sendMessage(from, {
text: '❌ Envie um link do Twitter/X.'
})

}

await sock.sendMessage(from, {
text: '⏳ Baixando vídeo do Twitter...'
})

try {

let autor = 'Desconhecido'

const match =
q.match(/twitter\.com\/([^\/]+)|x\.com\/([^\/]+)/)

if (match) {
autor = match[1] || match[2]
}

const api =
`https://api.vreden.my.id/api/twitter?url=${encodeURIComponent(q)}`

const response = await fetch(api)

const json = await response.json()

if (!json.result || !json.result.media) {

return sock.sendMessage(from, {
text: '❌ Não foi possível baixar.'
})

}

const video = json.result.media[0].url

await sock.sendMessage(from, {

video: { url: video },

mimetype: 'video/mp4',

caption: `
✅ Vídeo baixado

👤 Criador: @${autor}
`

})

} catch (e) {

console.log(e)

await sock.sendMessage(from, {
text: '❌ Erro ao baixar vídeo.'
})

}

}

})

}

startBot()