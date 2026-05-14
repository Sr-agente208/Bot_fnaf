/* =========================
   MESSAGES
========================= */

sock.ev.on('messages.upsert', async ({ messages, type }) => {

try {

if (type !== 'notify') return

const m = messages[0]

if (!m) return
if (!m.message) return
if (m.key.fromMe) return

const jid = m.key.remoteJid

/* =========================
   PEGAR TEXTO
========================= */

const message =
m.message.conversation ||

m.message.extendedTextMessage?.text ||

m.message.imageMessage?.caption ||

m.message.videoMessage?.caption ||

m.message.buttonsResponseMessage?.selectedButtonId ||

m.message.listResponseMessage?.singleSelectReply?.selectedRowId ||

m.message.templateButtonReplyMessage?.selectedId ||

''

const text = message.trim().toLowerCase()

if (!text) return

console.log(`📨 COMANDO RECEBIDO: ${text}`)

const user = getUser(jid)

/* =========================
   MENU
========================= */

if (text === '!menu' || text === 'menu') {

await sock.sendMessage(jid, {
text: menu(user)
})

}

/* =========================
   PROFILE
========================= */

else if (
text === '!profile' ||
text === '!perfil'
) {

await sock.sendMessage(jid, {
text: profile(user)
})

}

/* =========================
   PING
========================= */

else if (text === '!ping') {

await sock.sendMessage(jid, {
text: '🏓 pong'
})

}

/* =========================
   WORK
========================= */

else if (text === '!work') {

const result = work(user)

let response =
`💰 Você trabalhou e ganhou ${result.reward} moedas`

if (result.levelUp) {
response += '\n⭐ LEVEL UP!'
}

await sock.sendMessage(jid, {
text: response
})

}

/* =========================
   CASINO
========================= */

else if (text.startsWith('!casino')) {

const bet =
parseInt(text.split(' ')[1])

const result =
casino(user, bet)

await sock.sendMessage(jid, {
text: result
})

}

/* =========================
   BANK
========================= */

else if (text === '!bank') {

await sock.sendMessage(jid, {
text:
`🏦 BANCO

💰 Carteira: ${user.money}
🏦 Banco: ${user.bank}`
})

}

/* =========================
   DADO
========================= */

else if (text === '!dado') {

const dice =
Math.floor(Math.random() * 6) + 1

await sock.sendMessage(jid, {
text: `🎲 dado: ${dice}`
})

}

/* =========================
   COINFLIP
========================= */

else if (text === '!coinflip') {

const flip =
Math.random() > 0.5
? 'cara'
: 'coroa'

await sock.sendMessage(jid, {
text: `🪙 ${flip}`
})

}

} catch (err) {

console.log('❌ ERRO NAS MENSAGENS:')
console.log(err)

}

})