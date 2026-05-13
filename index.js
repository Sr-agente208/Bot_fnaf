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

// ===== MENU (LIST MESSAGE - FUNCIONA DE VERDADE) =====
function sendMenu(sock, jid) {
const state = createPlayer(jid)

sock.sendMessage(jid, {
text: getMenuText(state),
title: "🎮 MENU FNAF",
footer: "⚠️ Freddy Fazbear System",
buttonText: "Abrir Menu",
sections: [
{
title: "⚙️ AÇÕES",
rows: [
{ title: "🎮 Jogar", rowId: "PLAY_GAME" },
{ title: "📺 Câmeras", rowId: "OPEN_CAM" },
{ title: "🚪 Porta", rowId: "TOGGLE_DOOR" }
]
}
]
})
}

// ===== LOOP DO JOGO =====
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
text: "☠️ Animatronic atacou!"
})
}

// GAME OVER
if (state.energy <= 0) {
state.alive = false
clearInterval(state.interval)

sock.sendMessage(jid, {
text: "💀 GAME OVER — você não sobreviveu"
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
text: "🏆 VOCÊ VENCEU! 6AM COMPLETADO"
})

return
}
}

}, 15000)
}

// ===== BOT =====
async function startBot() {

const { state, saveCreds } = await useMultiFileAuthState('./auth')
const { version } = await fetchLatestBaileysVersion()

const sock = makeWASocket({
auth: state,
version,
printQRInTerminal: false,
browser: ['FNAF BOT', 'Chrome', '1.0']
})

// conexão
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

// mensagens
sock.ev.on('messages.upsert', async ({ messages }) => {

const m = messages[0]
if (!m.message) return

const jid = m.key.remoteJid

const body =
(
m.message.conversation ||
m.message.extendedTextMessage?.text ||
m.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
''
).trim().toUpperCase()

const state = createPlayer(jid)

// ===== MENU =====
if (body === '!MENU') {
sendMenu(sock, jid)
return
}

// ===== JOGAR =====
if (body === 'PLAY_GAME') {
startGameLoop(sock, jid)

sock.sendMessage(jid, {
text: "🎮 Jogo iniciado... sobreviva até 6AM"
})
return
}

// ===== CÂMERAS =====
if (body === 'OPEN_CAM') {
sock.sendMessage(jid, {
text: `
📺 CAMERAS ONLINE

1A - Palco
2B - Corredor
5 - Pirate Cove (movimento detectado)
`
})
return
}

// ===== PORTA =====
if (body === 'TOGGLE_DOOR') {

state.door = !state.door
state.energy -= 5

sock.sendMessage(jid, {
text: state.door
? "🚪 PORTAS FECHADAS"
: "🚪 PORTAS ABERTAS"
})

return
}

})

}

startBot()