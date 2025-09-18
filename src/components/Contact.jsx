export default function Contact({ lang }) {
  return (
    <form className="mx-auto grid max-w-2xl gap-4">
      <div className="grid gap-1">
        <label htmlFor="name" className="text-xs font-medium text-gray-700">{lang === 'fr' ? 'Nom' : 'Name'}</label>
        <input id="name" name="name" type="text" required className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10" placeholder="Votre nom" />
      </div>
      <div className="grid gap-1">
        <label htmlFor="email" className="text-xs font-medium text-gray-700">Email</label>
        <input id="email" name="email" type="email" required className="rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10" placeholder="vous@exemple.com" />
      </div>
      <div className="grid gap-1">
        <label htmlFor="message" className="text-xs font-medium text-gray-700">{lang === 'fr' ? 'Message' : 'Message'}</label>
        <textarea id="message" name="message" rows={5} required className="resize-y rounded-xl border border-black/10 px-3 py-2 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black/10" placeholder={lang === 'fr' ? 'Votre message' : 'Your message'} />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" className="inline-flex items-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20">{lang === 'fr' ? 'Envoyer' : 'Send'}</button>
        <a href="mailto:contact@zonzerigueleadership.com" className="text-sm text-gray-600 hover:text-gray-900">{lang === 'fr' ? 'ou nous écrire directement' : 'or write to us directly'}</a>
      </div>
    </form>
  )
}
