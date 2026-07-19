const DEFAULT_WHATSAPP_NUMBER = '2250506925745'

const ORDER_MESSAGES = {
  fr: {
    single: [
      'Bonjour,',
      'Je souhaite commander 1 exemplaire de La Fabrique du Leader au prix de 10 000 FCFA.',
      '',
      'Nom et prénom :',
      'Commune / lieu de livraison ou de retrait :',
      '',
      'Merci de m’indiquer les modalités de livraison et de m’envoyer le numéro Wave pour le paiement.',
    ],
    duo: [
      'Bonjour,',
      'Je souhaite commander le Pack duo de La Fabrique du Leader, soit 2 exemplaires : un pour moi et un à offrir.',
      '',
      'Nom et prénom :',
      'Commune / lieu de livraison ou de retrait :',
      '',
      'Merci de me confirmer le montant total, les modalités de livraison et de m’envoyer le numéro Wave pour le paiement.',
    ],
    team: [
      'Bonjour,',
      'Je souhaite commander un Pack équipe de La Fabrique du Leader pour une lecture collective.',
      '',
      'Nombre d’exemplaires souhaité :',
      'Nom du groupe, club, association ou communauté :',
      'Nom du contact :',
      'Commune / lieu de livraison :',
      '',
      'Merci de me transmettre votre proposition, le montant total et les modalités de paiement par Wave.',
    ],
    enterprise: [
      'Bonjour,',
      'Je souhaite recevoir une proposition pour une commande de La Fabrique du Leader destinée à une entreprise ou une institution.',
      '',
      'Organisation :',
      'Nom et fonction du contact :',
      'Nombre estimatif d’exemplaires :',
      'Objectif de la commande : formation, programme interne, jeunes talents, école, événement ou autre :',
      '',
      'Merci de me recontacter afin d’échanger sur les modalités et les options disponibles.',
    ],
    special: [
      'Bonjour,',
      'Je souhaite discuter d’une commande spéciale autour de La Fabrique du Leader.',
      '',
      'Type de demande : commande en volume, exemplaires dédicacés, intervention de l’auteur, conférence, atelier ou accompagnement :',
      'Nombre estimatif d’exemplaires ou de participants :',
      'Organisation, le cas échéant :',
      'Nom et fonction du contact :',
      'Date ou période envisagée :',
      '',
      'Merci de me recontacter pour élaborer une proposition adaptée.',
    ],
  },
  en: {
    single: [
      'Hello,',
      'I would like to order 1 copy of La Fabrique du Leader for 10,000 FCFA.',
      '',
      'Full name:',
      'District / delivery or pickup location:',
      '',
      'Please let me know the delivery options and send me the Wave number for payment.',
    ],
    duo: [
      'Hello,',
      'I would like to order the La Fabrique du Leader Duo pack: 2 copies, one for me and one as a gift.',
      '',
      'Full name:',
      'District / delivery or pickup location:',
      '',
      'Please confirm the total amount and delivery options, and send me the Wave number for payment.',
    ],
    team: [
      'Hello,',
      'I would like to order a La Fabrique du Leader Team pack for a group reading.',
      '',
      'Desired number of copies:',
      'Name of the group, club, association, or community:',
      'Contact name:',
      'District / delivery location:',
      '',
      'Please send me your proposal, the total amount, and the Wave payment details.',
    ],
    enterprise: [
      'Hello,',
      'I would like to receive a proposal for a La Fabrique du Leader order for a company or institution.',
      '',
      'Organization:',
      'Contact name and role:',
      'Estimated number of copies:',
      'Purpose of the order: training, internal program, young talent, school, event, or other:',
      '',
      'Please contact me to discuss the available options and arrangements.',
    ],
    special: [
      'Hello,',
      'I would like to discuss a special order involving La Fabrique du Leader.',
      '',
      'Type of request: bulk order, signed copies, author intervention, keynote, workshop, or support program:',
      'Estimated number of copies or participants:',
      'Organization, if applicable:',
      'Contact name and role:',
      'Proposed date or period:',
      '',
      'Please contact me so we can develop a suitable proposal.',
    ],
  },
}

function normalizeNumber(value) {
  return String(value || '').replace(/\D/g, '')
}

function normalizeQuantity(value) {
  return Math.max(1, Math.min(5000, Number(value) || 1))
}

function buildFallbackMessage({ lang, orderType, title, quantity }) {
  const qty = normalizeQuantity(quantity)
  const packageTitle = String(title || orderType || '').trim()

  return lang === 'en'
    ? [
        'Hello,',
        `I would like to order ${qty} ${qty === 1 ? 'copy' : 'copies'} of ${packageTitle}.`,
        '',
        'Please send me the delivery and payment details.',
      ]
    : [
        'Bonjour,',
        `Je souhaite commander ${qty} ${qty === 1 ? 'exemplaire' : 'exemplaires'} de ${packageTitle}.`,
        '',
        'Merci de me transmettre les modalités de livraison et de paiement.',
      ]
}

export function buildWhatsAppOrderUrl({ lang = 'fr', orderType, title, quantity }) {
  const whatsappNumber = normalizeNumber(
    import.meta.env?.VITE_WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER
  )
  const locale = lang === 'en' ? 'en' : 'fr'
  const messageLines = ORDER_MESSAGES[locale][orderType] || buildFallbackMessage({
    lang: locale,
    orderType,
    title,
    quantity,
  })

  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(messageLines.join('\n'))}`
}
