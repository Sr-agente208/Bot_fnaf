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
door: false
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
footer: '⚠️ Pizzaria Freddy Fazbear',
buttons: [
{ buttonId: 'play', buttonText: { displayText: '🎮 Jogar' }, type: 1 },
{ buttonId: 'camera', buttonText: { displayText: '📺 Câmeras' }, type: 1 },
{ buttonId: 'door', buttonText: { displayText: '🚪 Porta' }, type: 1 }
],
headerType: 1
})
}

function startGameLoop(sock, jid) {
const state = createPlayer(jid)

if (state.interval) return

// energia cai com o tempo
state.interval = setInterval(() => {

if (!state.alive) return

state.energy -= 5

// animatronics atacam aleatoriamente
const attack = Math.random() < 0.25

if (attack && !state.door) {
state.energy -= 20
sock.sendMessage(jid, {
text: '☠️ Animatronic atacou! Energia perdida...'
})
}

// avanço de noite
if (state.energy <= 0) {
state.alive = false
clearInterval(state.interval)

sock.sendMessage(jid, {
text: '💀 GAME OVER — você não sobreviveu...'
})

return
}

if (state.energy > 0 && Math.random() < 0.1) {
state.night++

sock.sendMessage(jid, {
text: `🌙 Você sobreviveu à Noite ${state.night - 1}!`
})

if (state.night > 6) {
state.alive = false
clearInterval(state.interval)

sock.sendMessage(jid, {
text: '🏆 VOCÊ VENCEU O JOGO! 6AM FINALIZADO'
})

return
}
}

}, 20000) // 20s = tick do jogo
}

async function startBot() {

const { state, saveCreds } = await useMultiFileAuthState('./auth')
const { version } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
auth: state,
version,
printQRInTerminal: false,
browser: ['FNAF GAME', 'Chrome', '1.0']
})

sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {

if (qr) qrcode.generate(qr, { small: true })

if (connection === 'open') {
console.log('🤖 FNAF BOT ONLINE')
}

if (connection === 'close') {
const shouldReconnect =
lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut

if (shouldReconnect) startBot()
}
})

sock.ev.on('messages.upsert', async ({ messages }) => {

const m = messages[0]
if (!m.message) return

const jid = m.key.remoteJid

const body =
(m.message.conversation ||
m.message.extendedTextMessage?.text ||
m.message.buttonsResponseMessage?.selectedButtonId ||
'').trim().toLowerCase()

const state = createPlayer(jid)

// MENU / START
if (body === 'play' || body === '!menu') {
sendMenu(sock, jid)
return
}

// START GAME LOOP
if (body === '🎮 jogar' || body === 'play') {
startGameLoop(sock, jid)

sock.sendMessage(jid, {
text: '🎮 Jogo iniciado... sobreviva até 6AM'
})
return
}

// CAMERA
if (body === '📺 câmeras' || body === 'camera') {
sock.sendMessage(jid, {
text: `
📺 CAMERAS ONLINE

1A - Palco
2B - Corredor
3C - Cozinha
5 - Pirate Cove (movimento detectado)
`
})
return
}

// DOOR TOGGLE
if (body === '🚪 porta' || body === 'door') {

state.door = !state.door

sock.sendMessage(jid, {
text: state.door
? '🚪 Portas FECHADAS — energia drenando mais rápido'
: '🚪 Portas ABERTAS — cuidado com ataques'
})

state.energy -= 5
return
}

// RANDOM CHAT RESPONSE (IMERSÃO)
if (Math.random() < 0.05) {
sock.sendMessage(jid, {
text: '👁️ Eles estão te observando...'
})
}

})

}

startBot()