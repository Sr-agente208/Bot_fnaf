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

video: {
url: 'https://media.tenor.com/IHdlTRsmcS4AAAAC/fnaf-jumpscare.gif'
},

gifPlayback: true,

caption: `
╔══════════════════╗
║ 🎮 𝗕𝗢𝗧 𝗙𝗡𝗔𝗙 🎮
╠══════════════════╣
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
╚══════════════════╝

⚠️ Cuidado com os animatronics...
`
})

}

// ===== FNAF =====

if (body === '!fnaf') {

const respostas = [

{
gif: 'https://media.tenor.com/6K0wS6Sx9sAAAAAC/fnaf.gif',
texto: '👁️ Freddy está te observando...'
},

{
gif: 'https://media.tenor.com/IHdlTRsmcS4AAAAC/fnaf-jumpscare.gif',
texto: '🎭 Os animatronics ficaram agressivos.'
},

{
gif: 'https://media.tenor.com/fD5p6Rk2W5AAAAAC/freddy-fazbear.gif',
texto: '🕰️ 5 AM... sobreviva.'
}

]

const escolha =
respostas[Math.floor(Math.random() * respostas.length)]

await sock.sendMessage(from, {

video: { url: escolha.gif },

gifPlayback: true,

caption: escolha.texto

})

}

// ===== FOXY =====

if (body === '!foxy') {

await sock.sendMessage(from, {

video: {
url: 'https://media.tenor.com/akG7iJx2jWAAAAAC/foxy-fnaf.gif'
},

gifPlayback: true,

caption: `
🦊 FOXY SAIU DA PIRATE COVE!

⚠️ Corra para a porta!
`
})

}

// ===== BONNIE =====

if (body === '!bonnie') {

await sock.sendMessage(from, {

video: {
url: 'https://media.tenor.com/vpN4bD5z0f8AAAAC/bonnie-fnaf.gif'
},

gifPlayback: true,

caption: `
🧸 BONNIE APARECEU.

👁️ Ele está atrás de você.
`
})

}

// ===== CHICA =====

if (body === '!chica') {

await sock.sendMessage(from, {

video: {
url: 'https://media.tenor.com/eTFEuQJwScMAAAAC/chica-fnaf.gif'
},

gifPlayback: true,

caption: `
🐤 CHICA ESTÁ NA COZINHA.

🔪 Você ouviu panelas...
`
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

caption: `
${scare.texto}

⚠️ VOCÊ MORREU
`

})

}

// ===== ENERGIA =====

if (body === '!energia') {

const energia =
Math.floor(Math.random() * 100)

await sock.sendMessage(from, {

video: {
url: 'https://media.tenor.com/LQ1vlPj8cX0AAAAC/fnaf-power.gif'
},

gifPlayback: true,

caption: `
🔋 ENERGIA RESTANTE

⚡ ${energia}%
`
})

}

// ===== NIGHT =====

if (body === '!night') {

const night =
Math.floor(Math.random() * 6) + 1

await sock.sendMessage(from, {

video: {
url: 'https://media.tenor.com/7M5D4R8V6WAAAAAC/fnaf-night.gif'
},

gifPlayback: true,

caption: `
🌙 NIGHT ${night}

👁️ Sobreviva até às 6AM.
`
})

}

// ===== MUSICA =====

if (body === '!musica') {

await sock.sendMessage(from, {

video: {
url: 'https://media.tenor.com/zpF2l2K9jQkAAAAC/freddy-music.gif'
},

gifPlayback: true,

caption: `
🎵 Har har har har har...
`
})

}

// ===== GOLDEN =====

if (body === '!golden') {

await sock.sendMessage(from, {

video: {
url: 'https://media.tenor.com/T6dLJx9n8qUAAAAC/golden-freddy.gif'
},

gifPlayback: true,

caption: `
👻 GOLDEN FREDDY APARECEU

📺 O sistema está falhando...
`
})

}

// ===== SPRINGTRAP =====

if (body === '!springtrap') {

await sock.sendMessage(from, {

video: {
url: 'https://media.tenor.com/cK9HcJ6p8x8AAAAC/springtrap-fnaf.gif'
},

gifPlayback: true,

caption: `
🔪 SPRINGTRAP ENTROU NA VENTILAÇÃO
`
})

}

// ===== CAMERA =====

if (body === '!camera') {

const cams = [

'📺 CAM 1A: Palco principal.',
'📺 CAM 2B: Movimento detectado.',
'📺 CAM 4A: Corredor vazio.',
'📺 CAM 5: Pirate Cove aberta.',
'📺 CAM 6: Sinal perdido.'

]

const cam =
cams[Math.floor(Math.random() * cams.length)]

await sock.sendMessage(from, {

video: {
url: 'https://media.tenor.com/l1sK6xT4zDMAAAAC/security-camera.gif'
},

gifPlayback: true,

caption: cam

})

}

// ===== GLITCH =====

if (body === '!glitch') {

await sock.sendMessage(from, {

video: {
url: 'https://media.tenor.com/Gx9sF7j9y9QAAAAC/glitch.gif'
},

gifPlayback: true,

caption: `
̷Y̷O̷U̷ ̷C̷A̷N̷'̷T̷ ̷S̷A̷V̷E̷
`
})

}

// ===== PLAY =====

if (body.startsWith('!play ')) {

const query = body.slice(6)

await sock.sendMessage(from, {

video: {
url: 'https://media.tenor.com/zpF2l2K9jQkAAAAC/freddy-music.gif'
},

gifPlayback: true,

caption: `
🎶 Procurando música...

🔎 ${query}
`
})

}

// ===== TWITTER =====

if (body.startsWith('!twitter ')) {

const q = body.slice(9)

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