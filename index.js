const qrcode = require('qrcode-terminal')
const fetch = require('node-fetch')

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const menuState = {} // controle de página por chat

const MENU_PAGES = [
{
title: '🎮 HORROR MENU',
content: `
🦊 !foxy
🧸 !bonnie
🐤 !chica
👻 !golden
🔪 !springtrap
☠️ !jumpscare
`
},
{
title: '🎮 GAME MENU',
content: `
👁️ !fnaf
🌙 !night
🔋 !energia
📺 !camera
💀 !glitch
`
},
{
title: '🎵 MEDIA MENU',
content: `
🎶 !play nome
🐦 !twitter link
🎵 !musica
`
}
]

function getMenu(page = 0) {
const p = MENU_PAGES[page]
return `
┏━━━━━━━━━━━━━━━━━━━┓
┃ 🎮 BOT FNAF UI ┃
┗━━━━━━━━━━━━━━━━━━━┛

╭━━ ${p.title} ╾━━╮
${p.content}
╰━━━━━━━━━━━━━━━━━━╯

📄 Página ${page + 1}/${MENU_PAGES.length}

➡️ !next | ⬅️ !prev | 🎮 !menu
⚠️ Sobreviva até 6AM...
`
}

async function startBot() {

const { state, saveCreds } = await useMultiFileAuthState('./auth')
const { version } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
auth: state,
version,
printQRInTerminal: false,
browser: ['Bot FNAF', 'Chrome', '1.0.0']
})

// ===== CONEXÃO =====
sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {

if (qr) qrcode.generate(qr, { small: true })

if (connection === 'open') {
console.log('🤖 BOT ONLINE')
}

if (connection === 'close') {
const shouldReconnect =
lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

if (shouldReconnect) startBot()
}
})

sock.ev.on('creds.update', saveCreds)

// ===== MENSAGENS =====
sock.ev.on('messages.upsert', async ({ messages }) => {

const m = messages[0]
if (!m.message) return

const from = m.key.remoteJid

const body =
(m.message.conversation ||
m.message.extendedTextMessage?.text || '').trim().toLowerCase()

console.log('📩', body)

// ===== MENU =====
if (body === '!menu') {

menuState[from] = 0

await sock.sendMessage(from, {
video: { url: 'https://media.tenor.com/IHdlTRsmcS4AAAAC/fnaf-jumpscare.gif' },
gifPlayback: true,
caption: getMenu(0)
})

return
}

// ===== NEXT PAGE =====
if (body === '!next') {

menuState[from] = (menuState[from] || 0) + 1
if (menuState[from] >= MENU_PAGES.length) menuState[from] = 0

await sock.sendMessage(from, {
video: { url: 'https://media.tenor.com/6K0wS6Sx9sAAAAAC/fnaf.gif' },
gifPlayback: true,
caption: getMenu(menuState[from])
})

return
}

// ===== PREV PAGE =====
if (body === '!prev') {

menuState[from] = (menuState[from] || 0) - 1
if (menuState[from] < 0) menuState[from] = MENU_PAGES.length - 1

await sock.sendMessage(from, {
video: { url: 'https://media.tenor.com/zpF2l2K9jQkAAAAC/freddy-music.gif' },
gifPlayback: true,
caption: getMenu(menuState[from])
})

return
}

// ===== FOXY =====
if (body === '!foxy') {
await sock.sendMessage(from, {
video: { url: 'https://media.tenor.com/akG7iJx2jWAAAAAC/foxy-fnaf.gif' },
gifPlayback: true,
caption: '🦊 FOXY DETECTADO! CORRE.'
})
}

// ===== BONNIE =====
if (body === '!bonnie') {
await sock.sendMessage(from, {
video: { url: 'https://media.tenor.com/vpN4bD5z0f8AAAAC/bonnie-fnaf.gif' },
gifPlayback: true,
caption: '🧸 BONNIE NO CORREDOR.'
})
}

// ===== CHICA =====
if (body === '!chica') {
await sock.sendMessage(from, {
video: { url: 'https://media.tenor.com/eTFEuQJwScMAAAAC/chica-fnaf.gif' },
gifPlayback: true,
caption: '🐤 CHICA NA COZINHA... isso nunca é bom.'
})
}

// ===== JUMPSCARE =====
if (body === '!jumpscare') {

const list = [
'☠️ Freddy te pegou.',
'🦊 Foxy invadiu.',
'🔪 Springtrap apareceu.',
'👻 Golden Freddy bugou o sistema.'
]

const msg = list[Math.floor(Math.random() * list.length)]

await sock.sendMessage(from, {
video: { url: 'https://media.tenor.com/IHdlTRsmcS4AAAAC/fnaf-jumpscare.gif' },
gifPlayback: true,
caption: `${msg}\n\n💀 GAME OVER`
})
}

})
}

startBot()