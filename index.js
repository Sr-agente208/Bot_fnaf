const qrcode = require('qrcode-terminal')

const {
default: makeWASocket,
useMultiFileAuthState,
DisconnectReason,
fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const gameState = {}

function createPlayer(jid) {
if (!gameState[jid]) {
gameState[jid] = {
night: 1,
energy: 100,
alive: true,
door: false,
interval: null
}
}
return gameState[jid]
}

function getMenuText(state) {
return `
🎮 FNAF SYSTEM ONLINE

🌙 Noite: ${state.night}/6
🔋 Energia: ${state.energy}%
🚪 Portas: ${state.door ? 'FECHADAS' : 'ABERTAS'}

👁️ Sobreviva até 6AM...
`
}

function sendMenu(sock, jid) {
const state = createPlayer(jid)

sock.sendMessage(jid, {
text: getMenuText(state),
footer: '⚠️ Freddy Fazbear System',
buttons: [
{ buttonId: 'PLAY_GAME', buttonText: { displayText: '🎮 Jogar' } },
{ buttonId: 'OPEN_CAM', buttonText: { displayText: '📺 Câmeras' } },
{ buttonId: 'TOGGLE_DOOR', buttonText: { displayText: '🚪 Porta' } }
],
headerType: 1
})
}

function startGameLoop(sock, jid) {
const state = createPlayer(jid)

if (state.interval) return

state.interval = setInterval(() => {

if (!state.alive) return

state.energy -= 5

// ataque aleatório
const attack = Math.random() < 0.25

if (attack && !state.door) {
state.energy -= 20

sock.sendMessage(jid, {
text: '☠️ Animatronic atacou!'
})
}

// game over
if (state.energy <= 0) {
state.alive = false
clearInterval(state.interval)

sock.sendMessage(jid, {
text: '💀 GAME OVER — você morreu na pizzaria'
})

return
}

// avanço de noite
if (Math.random() < 0.15) {
state.night++

sock.sendMessage(jid, {
text: `🌙 Você sobreviveu à Noite ${state.night - 1}`
})

if (state.night > 6) {
state.alive = false
clearInterval(state.interval)

sock.sendMessage(jid, {
text: '🏆 VOCÊ VENCEU! 6AM FINALIZADO'
})

return
}
}

}, 15000)
}

async function startBot() {

const { state, saveCreds } = await useMultiFileAuthState('./auth')
const { version } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
auth: state,
version,
printQRInTerminal: false,
browser: ['FNAF BOT', 'Chrome', '1.0']
})

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

sock.ev.on('messages.upsert', async ({ messages }) => {

const m = messages[0]
if (!m.message) return

const jid = m.key.remoteJid

const bodyRaw =
m.message.conversation ||
m.message.extendedTextMessage?.text ||
m.message.buttonsResponseMessage?.selectedButtonId ||
''

const body = bodyRaw.trim().toUpperCase()

const state = createPlayer(jid)

console.log('📩:', body)

// 🎮 MENU
if (body === '!MENU') {
sendMenu(sock, jid)
return
}

// 🎮 START GAME
if (body === 'PLAY_GAME') {
startGameLoop(sock, jid)

sock.sendMessage(jid, {
text: '🎮 Jogo iniciado... sobreviva até 6AM'
})

return
}

// 📺 CAMERAS
if (body === 'OPEN_CAM') {
sock.sendMessage(jid, {
text: `
📺 CÂMERAS ONLINE

1A - Palco
2B - Corredor
5 - Pirate Cove (movimento detectado)
`
})
return
}

// 🚪 PORTA
if (body === 'TOGGLE_DOOR') {

state.door = !state.door
state.energy -= 5

sock.sendMessage(jid, {
text: state.door
? '🚪 PORTAS FECHADAS'
: '🚪 PORTAS ABERTAS'
})

return
}

})

}

startBot()