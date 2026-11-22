// Illustrative local preview content only; never imported by the production site.
import { richTextToPlainText } from '../../shared/rich-text.mjs'

const examples = [
  ['preview-article', 'pratiquer', 'Clarifier son intention avant de décider', 'Un exercice pour distinguer ce qui compte vraiment et choisir une prochaine action cohérente.', 'Clarify your intention before deciding', 'An exercise to identify what matters and choose a coherent next step.'],
  ['preview-trends', 'a-observer', 'Observer les signaux faibles dans son équipe', 'Quelques questions pour remarquer les changements et ouvrir la conversation avant de tirer une conclusion.', 'Notice the early signals in your team', 'Questions to notice changes and start a conversation before reaching a conclusion.'],
  ['preview-resource-03', 'la-pause', 'Préparer une conversation difficile', 'Faire une pause pour nommer les faits, accueillir son ressenti et clarifier ce que l’on souhaite partager.', 'Prepare for a difficult conversation', 'Pause to identify the facts, acknowledge your feelings, and clarify what you want to share.'],
  ['preview-resource-04', 'pratiquer', 'Déléguer sans perdre le fil', 'Clarifier le résultat attendu, les marges de décision et les moments de suivi avec son équipe.', 'Delegate without losing track', 'Clarify the desired outcome, decision boundaries, and follow-up points with your team.'],
  ['preview-resource-05', 'pratiquer', 'Poser une question qui ouvre la discussion', 'Transformer une affirmation en invitation à réfléchir ensemble et à faire émerger d’autres perspectives.', 'Ask a question that opens the discussion', 'Turn a statement into an invitation to think together and discover other perspectives.'],
  ['preview-resource-06', 'la-pause', 'Réserver un temps de recul', 'Un rendez-vous avec soi pour relire sa semaine, reconnaître ce qui a fonctionné et ajuster sa posture.', 'Make time to step back', 'A moment to review your week, recognize what worked, and adjust your approach.'],
  ['preview-resource-07', 'pratiquer', 'Donner un feedback utile et précis', 'Partir d’une situation concrète pour construire un échange clair et convenir d’une prochaine étape.', 'Give useful, specific feedback', 'Start with a concrete situation to have a clear conversation and agree on a next step.'],
  ['preview-resource-08', 'la-pause', 'Écouter avant de proposer une solution', 'Se donner le temps de comprendre une demande et de reformuler ce que l’autre cherche à exprimer.', 'Listen before offering a solution', 'Take time to understand a request and reflect back what the other person is expressing.'],
  ['preview-resource-09', 'vue-ailleurs', 'Lire une étude sur le leadership avec discernement', 'Des repères pour examiner une source, son contexte et les limites de ce que l’on peut en retenir.', 'Read leadership research thoughtfully', 'Consider a source, its context, and the limits of the conclusions you can draw.'],
  ['preview-resource-10', 'a-observer', 'Une équipe hybride, des attentes à clarifier', 'Explorer les questions de coordination, de disponibilité et de confiance dans les habitudes de travail.', 'Clarify expectations in a hybrid team', 'Explore coordination, availability, and trust in your working habits.'],
  ['preview-resource-11', 'pratiquer', 'Du désaccord à une décision partagée', 'Rendre les points de vue explicites pour distinguer les désaccords utiles et avancer vers une décision.', 'Move from disagreement to a shared decision', 'Make different views explicit to understand useful disagreements and move toward a decision.'],
  ['preview-resource-12', 'vue-ailleurs', 'Questionner une pratique avant de l’adopter', 'Mettre une idée en perspective : à quel besoin répond-elle et dans quelles conditions serait-elle utile ?', 'Question a practice before adopting it', 'Put an idea in context: what need does it meet, and when would it be useful?'],
  ['preview-resource-13', 'pratiquer', 'Rendre les décisions plus lisibles', 'Expliquer les critères d’un choix et aider chacun à comprendre les prochaines étapes.', 'Make decisions easier to understand', 'Explain the criteria behind a choice and help everyone understand what comes next.'],
  ['preview-resource-14', 'vue-ailleurs', 'Prendre du recul sur un indicateur', 'Interroger ce qu’un chiffre rend visible, ce qu’il laisse de côté et les questions qu’il invite à poser.', 'Take a closer look at an indicator', 'Ask what a number reveals, what it leaves out, and which questions it raises.'],
]
const p = (text) => ({ type: 'paragraph', content: [{ type: 'text', text }] })
const heading = (text) => ({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] })
function translation(title, description, lang) {
  const fr = lang === 'fr'
  const bodyRich = { type: 'doc', content: [
    p(fr ? 'Exemple de ressource pour la prévisualisation locale. Ce texte illustre la présentation des articles et ne sera pas publié sur le site.' : 'Sample resource for the local preview. This text demonstrates the article layout and will not be published on the live site.'),
    heading(fr ? 'Observer la situation' : 'Observe the situation'),
    p(description),
    p(fr ? 'Prenez un moment pour décrire une situation récente. Commencez par les faits que vous avez observés, puis distinguez vos interprétations. Cette première étape peut ouvrir un espace pour regarder la situation autrement.' : 'Take a moment to describe a recent situation. Start with what you observed, then separate those facts from your interpretations. This first step can create space to see the situation differently.'),
    heading(fr ? 'Passer à la pratique' : 'Put it into practice'),
    { type: 'orderedList', attrs: { start: 1 }, content: (fr ? ['Décrivez une situation concrète sans chercher immédiatement une solution.', 'Identifiez une question à poser ou une hypothèse à vérifier.', 'Choisissez un petit geste à essayer puis revenez sur ce que vous avez appris.'] : ['Describe a concrete situation without immediately looking for a solution.', 'Identify a question to ask or an assumption to check.', 'Choose a small action to try, then reflect on what you learned.']).map((text) => ({ type: 'listItem', content: [p(text)] })) },
    { type: 'blockquote', content: [p(fr ? 'Quel prochain pas serait à la fois utile et réaliste dans votre contexte ?' : 'What next step would be both useful and realistic in your situation?')] },
  ] }
  return { title, description, body: richTextToPlainText(bodyRich), bodyRich, href: '' }
}
export const resourcePreviewEntries = examples.map(([id, category, titleFr, descriptionFr, titleEn, descriptionEn]) => ({
  id, category, type: 'resources', revision: 1, status: 'published', featured: id === 'preview-article',
  translations: { fr: translation(titleFr, descriptionFr, 'fr'), en: translation(titleEn, descriptionEn, 'en') },
}))
