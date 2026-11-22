// Add approved bilingual content here as it becomes available.
// Keep unpublished collections empty; the site displays an honest coming-soon state.
export const nexusUrl = ''

export const hubContent = {
  fr: {
    nav: {
      book: 'Le livre', resources: 'Ressources', media: 'Médiathèque',
      allResources: 'Toutes les ressources', allMedia: 'Toute la médiathèque',
      allBeyond: 'Découvrir les expériences', home: 'Accueil',
      why: 'Pourquoi ce livre ?', author: 'L’auteur', about: 'À propos', learn: 'Apprentissages',
      nexus: 'Nexus', soon: 'Bientôt', menu: 'Ouvrir le menu', close: 'Fermer le menu',
    },
    ticker: {
      label: 'À la une dans La Fabrique', pause: 'Mettre le bandeau en pause', play: 'Reprendre le bandeau',
      previous: 'Actualité précédente', next: 'Actualité suivante',
      items: [
        { category: 'Cette semaine dans La Fabrique', title: 'Les premiers contenus arrivent bientôt.', hash: '#cette-semaine' },
        { category: 'Vue d’ailleurs', title: 'Une sélection de lectures sur le leadership, bientôt ici.', hash: '#vue-ailleurs' },
        { category: 'À observer', title: 'Des réflexions pour prendre du recul, à découvrir prochainement.', hash: '#a-observer' },
      ],
    },
    home: {
      eyebrow: 'La Fabrique, au quotidien', title: 'Un livre. Une pratique. Des perspectives.',
      intro: 'Prolongez votre lecture avec des ressources pour agir, des regards pour réfléchir et des voix pour nourrir votre leadership.',
      cards: [
        { page: 'resources', number: '01', title: 'Passer à la pratique', body: 'Des pistes pour faire vivre votre leadership dans les situations du quotidien.', cta: 'Explorer les ressources' },
        { page: 'media', number: '02', title: 'Écouter, voir, approfondir', body: 'Podcasts, vidéos, interviews et conférences : les voix de La Fabrique.', cta: 'Découvrir la médiathèque' },
        { page: 'beyond', number: '03', title: 'Aller plus loin, ensemble', body: 'Masterclass, ateliers et parcours de lecture pour transformer l’expérience en action.', cta: 'Au-delà du livre' },
      ],
    },
    resources: {
      eyebrow: 'Ressources', title: 'Le leadership se pratique au quotidien.',
      intro: 'Deux chemins pour nourrir votre leadership : des ressources pour passer à la pratique et des regards pour comprendre les tendances du leadership.',
      empty: 'Les premiers contenus de cette rubrique seront disponibles prochainement.',
      groups: [
        { id: 'pratiquer-le-leadership', number: '01', title: 'Pratiquer le leadership', description: 'Des exercices, des pauses et des gestes concrets pour faire vivre votre leadership au quotidien.', categoryIds: ['pratiquer', 'la-pause', 'mon-leadership'] },
        { id: 'tendances-du-leadership', number: '02', title: 'Les tendances du leadership', description: 'Les actualités de La Fabrique, les recherches venues d’ailleurs et les évolutions à observer pour prendre du recul.', categoryIds: ['cette-semaine', 'vue-ailleurs', 'a-observer'] },
      ],
      categories: [
        { id: 'pratiquer', number: '01', title: 'Ce que je peux pratiquer', description: 'Des exercices et des pistes concrètes pour relier vos convictions à vos actions.' },
        { id: 'la-pause', number: '02', title: 'La Pause', description: 'Un temps de recul pour interroger votre posture et retrouver de la clarté.' },
        { id: 'mon-leadership', number: '03', title: 'Aujourd’hui, mon leadership', description: 'Une invitation à poser un geste conscient dans votre journée de leader.' },
        { id: 'cette-semaine', number: '04', title: 'Cette semaine dans La Fabrique', description: 'Les contenus de Zonzerigue Leadership International (ZLI) et de DS Zonzerigue.' },
        { id: 'vue-ailleurs', number: '05', title: 'Vue d’ailleurs', description: 'Des articles issus de la veille sur le leadership et ses pratiques.' },
        { id: 'a-observer', number: '06', title: 'À observer', description: 'Des réflexions sur les évolutions qui interrogent le rôle du leader.' },
      ],
      entries: [],
    },
    media: {
      eyebrow: 'Médiathèque', title: 'Des voix et des regards pour aller plus loin.',
      intro: 'Écouter une conversation, découvrir une idée, prolonger une réflexion. La médiathèque réunira les prises de parole et les rencontres autour de La Fabrique du Leader.',
      empty: 'Les premiers contenus seront ajoutés ici prochainement.',
      categories: [
        { id: 'podcasts', number: '01', title: 'Podcasts', description: 'Des conversations à écouter pour nourrir votre réflexion.' },
        { id: 'videos', number: '02', title: 'Vidéos', description: 'Des idées et des éclairages sur le leadership, en images.' },
        { id: 'interviews', number: '03', title: 'Interviews', description: 'Des échanges pour découvrir un parcours, une vision, une expérience.' },
        { id: 'conferences', number: '04', title: 'Conférences', description: 'Des prises de parole pour approfondir les thèmes de La Fabrique.' },
        { id: 'presse', number: '05', title: 'Presse / média', description: 'Les articles et les parutions consacrés au livre et à son auteur.' },
      ],
      entries: [],
    },
    common: {
      soon: 'Prochainement', available: 'Disponible dès maintenant',
      bookTitle: 'Commencez par le livre.',
      bookBody: 'Découvrez les premières pages de La Fabrique du Leader et les fondations d’un leadership lucide, enraciné et profondément humain.',
      excerpt: 'Lire un extrait gratuit', order: 'Commander le livre', read: 'Découvrir',
    },
  },
  en: {
    nav: {
      book: 'The book', resources: 'Resources', media: 'Media library',
      allResources: 'All resources', allMedia: 'All media',
      allBeyond: 'Explore the experiences', home: 'Home',
      why: 'Why this book?', author: 'The author', about: 'About the book', learn: 'What you’ll learn',
      nexus: 'Nexus', soon: 'Soon', menu: 'Open menu', close: 'Close menu',
    },
    ticker: {
      label: 'In the spotlight', pause: 'Pause the headlines', play: 'Resume the headlines',
      previous: 'Previous headline', next: 'Next headline',
      items: [
        { category: 'This week at La Fabrique', title: 'Our first features are coming soon.', hash: '#cette-semaine' },
        { category: 'Outside perspectives', title: 'A selection of leadership reading, coming soon.', hash: '#vue-ailleurs' },
        { category: 'Worth watching', title: 'New reflections to help you step back, coming soon.', hash: '#a-observer' },
      ],
    },
    home: {
      eyebrow: 'La Fabrique, every day', title: 'A book. A practice. New perspectives.',
      intro: 'Take your reading further with resources for action, perspectives for reflection, and voices to enrich your leadership.',
      cards: [
        { page: 'resources', number: '01', title: 'Put it into practice', body: 'Ideas to bring your leadership to life in everyday situations.', cta: 'Explore the resources' },
        { page: 'media', number: '02', title: 'Listen, watch, go deeper', body: 'Podcasts, videos, interviews, and keynotes: the voices of La Fabrique.', cta: 'Explore the media library' },
        { page: 'beyond', number: '03', title: 'Go further, together', body: 'Masterclasses, workshops, and reading journeys to turn experience into action.', cta: 'Beyond the book' },
      ],
    },
    resources: {
      eyebrow: 'Resources', title: 'Leadership is an everyday practice.',
      intro: 'Two ways to develop your leadership: resources to put ideas into practice and perspectives to understand leadership trends.',
      empty: 'The first resources in this section will be available soon.',
      groups: [
        { id: 'pratiquer-le-leadership', number: '01', title: 'Leadership in practice', description: 'Exercises, moments of reflection, and practical actions to bring your leadership to life every day.', categoryIds: ['pratiquer', 'la-pause', 'mon-leadership'] },
        { id: 'tendances-du-leadership', number: '02', title: 'Leadership trends', description: 'Updates from La Fabrique, research from elsewhere, and emerging developments to help you see the bigger picture.', categoryIds: ['cette-semaine', 'vue-ailleurs', 'a-observer'] },
      ],
      categories: [
        { id: 'pratiquer', number: '01', title: 'What I can practise', description: 'Exercises and practical ideas to connect your convictions with your actions.' },
        { id: 'la-pause', number: '02', title: 'The Pause', description: 'A moment to step back, question your approach, and find clarity.' },
        { id: 'mon-leadership', number: '03', title: 'My leadership today', description: 'An invitation to take one intentional action in your day as a leader.' },
        { id: 'cette-semaine', number: '04', title: 'This week at La Fabrique', description: 'Content from Zonzerigue Leadership International (ZLI) and DS Zonzerigue.' },
        { id: 'vue-ailleurs', number: '05', title: 'Outside perspectives', description: 'A curated selection of articles on leadership and its practices.' },
        { id: 'a-observer', number: '06', title: 'Worth watching', description: 'Reflections on the changes that challenge the role of a leader.' },
      ],
      entries: [],
    },
    media: {
      eyebrow: 'Media library', title: 'Voices and perspectives to take you further.',
      intro: 'Listen to a conversation, discover an idea, deepen a reflection. This library will bring together talks and encounters around The Leader’s Inner Forge.',
      empty: 'The first features will be added here soon.',
      categories: [
        { id: 'podcasts', number: '01', title: 'Podcasts', description: 'Conversations to listen to and enrich your thinking.' },
        { id: 'videos', number: '02', title: 'Videos', description: 'Ideas and insights on leadership, on screen.' },
        { id: 'interviews', number: '03', title: 'Interviews', description: 'Conversations exploring a journey, a vision, an experience.' },
        { id: 'conferences', number: '04', title: 'Keynotes', description: 'Talks that explore the themes of La Fabrique in depth.' },
        { id: 'presse', number: '05', title: 'Press / media', description: 'Articles and coverage of the book and its author.' },
      ],
      entries: [],
    },
    common: {
      soon: 'Coming soon', available: 'Available now', bookTitle: 'Start with the book.',
      bookBody: 'Explore the opening pages of The Leader’s Inner Forge and the foundations of lucid, grounded, and deeply human leadership.',
      excerpt: 'Read a free excerpt', order: 'Order the book', read: 'Explore',
    },
  },
}
