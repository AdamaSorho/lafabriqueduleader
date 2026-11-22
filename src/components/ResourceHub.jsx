import { hubContent } from '../hub-content'
import PageLink from './PageLink'

export default function ResourceHub({ lang, onNavigate }) {
  const copy = hubContent[lang].home
  return (
    <section className="resource-hub" aria-labelledby="resource-hub-title">
      <div className="hub-container">
        <p className="hub-eyebrow">{copy.eyebrow}</p>
        <div className="hub-intro-row">
          <h2 id="resource-hub-title">{copy.title}</h2>
          <p>{copy.intro}</p>
        </div>
        <div className="hub-card-grid">
          {copy.cards.map((card) => (
            <PageLink key={card.page} page={card.page} lang={lang} onNavigate={onNavigate} className="hub-card">
              <span className="hub-number" aria-hidden="true">{card.number}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
              <span className="hub-card-cta">{card.cta}<span aria-hidden="true">↗</span></span>
            </PageLink>
          ))}
        </div>
      </div>
    </section>
  )
}
