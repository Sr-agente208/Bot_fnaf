sock.ev.on('messages.upsert', async ({ messages, type }) => {

try {

if (type !== 'notify') return

const m = messages[0]

if (!m.message) return
if (m.key.fromMe) return

const jid = m.key.remoteJid

const body =
m.message.conversation ||
m.message.extendedTextMessage?.text ||
m.message.imageMessage?.caption ||
m.message.videoMessage?.caption ||
''

const text = body.trim().toLowerCase()

console.log('📨 RECEBIDO:', text)

if (!text) return

const user = getUser(jid)

/* MENU */

if (text === '!menu') {

await sock.sendMessage(jid, {
text: menu(user)
})

}

/* PING */

if (text === '!ping') {

await sock.sendMessage(jid, {
text: '🏓 pong'
})

}

} catch (err) {

console.log(err)

}

})