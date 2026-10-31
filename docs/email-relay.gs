function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents)
    var secret = PropertiesService.getScriptProperties().getProperty('SECRET')
    if (!secret || body.secret !== secret) return reply({ ok: false, error: 'unauthorized' })
    if (!body.to || !body.subject || !body.text) return reply({ ok: false, error: 'missing fields' })

    var options = { to: body.to, subject: body.subject, body: body.text }
    if (body.name) options.name = body.name
    if (body.reply_to) options.replyTo = body.reply_to
    MailApp.sendEmail(options)
    return reply({ ok: true })
  } catch (error) {
    console.error(error)
    return reply({ ok: false, error: 'send failed' })
  }
}

function reply(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON)
}
