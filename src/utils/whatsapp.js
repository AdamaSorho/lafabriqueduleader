const DEFAULT_WHATSAPP_NUMBER = '2250506925745'

function normalizeNumber(value) {
  return String(value || '').replace(/\D/g, '')
}

function normalizeQuantity(value) {
  return Math.max(1, Math.min(5000, Number(value) || 1))
}

export function buildWhatsAppOrderUrl({ lang = 'fr', orderType, title, quantity }) {
  const whatsappNumber = normalizeNumber(
    import.meta.env?.VITE_WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER
  )
  const qty = normalizeQuantity(quantity)
  const packageTitle = String(title || orderType || '').trim()
  const packageCode = String(orderType || '').trim()

  const message = lang === 'en'
    ? [
        'Hello La Fabrique du Leader,',
        '',
        'I would like to place an order:',
        `- Package: ${packageTitle}`,
        `- Quantity: ${qty} ${qty === 1 ? 'copy' : 'copies'}`,
        `- Package code: ${packageCode}`,
        '',
        'Please send me the Wave QR code to complete the payment.',
      ].join('\n')
    : [
        'Bonjour La Fabrique du Leader,',
        '',
        'Je souhaite passer une commande :',
        `- Offre : ${packageTitle}`,
        `- Quantité : ${qty} ${qty === 1 ? 'exemplaire' : 'exemplaires'}`,
        `- Code offre : ${packageCode}`,
        '',
        'Merci de me transmettre le QR code Wave pour finaliser le paiement.',
      ].join('\n')

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`
}
