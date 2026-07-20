import { useEffect, useState } from "react";
import { useLang } from "./hooks/useLang";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import Section from "./components/Section";
import Why from "./components/Why";
import AboutBook from "./components/AboutBook";
import Testimonials from "./components/Testimonials";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import FAQ from "./components/FAQ";
import Contact from "./components/Contact";
import ExcerptModal from "./components/ExcerptModal";
import AuthorSection from "./components/AuthorSection";
import BeyondTheBook from "./components/BeyondTheBook";
import KeynoteModal from "./components/KeynoteModal";
import CoachingModal from "./components/CoachingModal";
import Audience from "./components/Audience";
import GiftGroup from "./components/GiftGroup";
import OrderOptions from "./components/OrderOptions";
import {
  applyDocumentSeo,
  getLocalizedPath,
  getRouteContext,
  normalizeLang,
} from "./seo";

export default function AppRoot({ initialPath, initialPage, initialLang }) {
  const initialContext = getRouteContext(
    initialPath || (typeof window !== "undefined" ? window.location.pathname : "/"),
    initialLang
  );
  const { lang, setLang, strings } = useLang(initialLang || initialContext.lang);
  const [excerptOpen, setExcerptOpen] = useState(false);
  const [keynoteRequest, setKeynoteRequest] = useState(null);
  const [coachingOpen, setCoachingOpen] = useState(false);
  const [page, setPage] = useState(initialPage || initialContext.page);

  // Normalize legacy order and ?lang= URLs to their localized canonical paths.
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const path = (url.pathname || "").replace(/\/+$/, "");
      const requestedLang = url.searchParams.get("lang");
      const nextLang = requestedLang ? normalizeLang(requestedLang) : lang;
      const isPreorderPath = /^\/(pre-?order|precommande|pre-commande|order|commander)$/i.test(
        path
      );
      const isPreorderQuery = url.searchParams.has("preorder") || url.searchParams.has("order");
      if (isPreorderPath || isPreorderQuery) {
        url.pathname = getLocalizedPath("home", nextLang);
        url.searchParams.delete("preorder");
        url.searchParams.delete("order");
        url.searchParams.delete("lang");
        url.hash = "commander";
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        setPage("home");
        setLang(nextLang);
      } else if (requestedLang) {
        const context = getRouteContext(url.pathname, lang);
        url.pathname = getLocalizedPath(context.page, nextLang);
        url.searchParams.delete("lang");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        setPage(context.page);
        setLang(nextLang);
      }
    } catch (err) {
      console.log(err);
    }
  }, [lang, setLang]);

  useEffect(() => {
    const onPop = () => {
      const context = getRouteContext(window.location.pathname, lang);
      setPage(context.page);
      setLang(context.lang);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [lang, setLang]);

  useEffect(() => {
    applyDocumentSeo(page, lang);
  }, [page, lang]);

  useEffect(() => {
    if (page === "home") {
      const hash = window.location.hash;
      if (hash) {
        requestAnimationFrame(() => {
          const target = document.querySelector(hash);
          if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      } else {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [page]);

  const handleNavigate = (nextPage, options = {}) => {
    const nextUrl = new URL(window.location.href);
    const hash = options.hash || "";
    nextUrl.pathname = getLocalizedPath(nextPage, lang);
    nextUrl.searchParams.delete("lang");
    nextUrl.hash = hash;
    const nextLocation = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== nextLocation) {
      window.history.pushState({}, "", nextLocation);
    } else {
      window.history.replaceState({}, "", nextLocation);
    }
    setPage(nextPage);
    if (nextPage === "home") {
      requestAnimationFrame(() => {
        if (hash) {
          const el = document.querySelector(hash);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          window.scrollTo({ top: 0, behavior: "auto" });
        }
      });
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  };

  const handleLanguageChange = (nextLangValue) => {
    const nextLang = normalizeLang(nextLangValue);
    if (nextLang === lang) return;

    const nextUrl = new URL(window.location.href);
    nextUrl.pathname = getLocalizedPath(page, nextLang);
    nextUrl.searchParams.delete("lang");
    const nextLocation = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
    window.history.pushState({}, "", nextLocation);
    setLang(nextLang);
  };

  return (
    <div className="min-h-full bg-white text-gray-900 font-sans">
      <Nav
        lang={lang}
        setLang={handleLanguageChange}
        strings={strings}
        onNavigate={handleNavigate}
        currentPage={page}
      />
      <main>
        {page === "home" ? (
          <>
            <Hero
              strings={strings}
              lang={lang}
              onOpenExcerpt={() => setExcerptOpen(true)}
            />
            <Section
              id="why"
              eyebrow={strings.hero.brand}
              title={strings.why.title}
            >
              <Why
                strings={strings}
              />
            </Section>
            <Section
              id="pour-qui"
              eyebrow={strings.hero.brand}
              title={strings.audience.title}
            >
              <Audience strings={strings} />
            </Section>
            <AuthorSection strings={strings} />
            <Section
              id="about"
              eyebrow={strings.hero.brand}
              title={strings.about.title}
            >
              <AboutBook
                strings={strings}
              />
            </Section>
            <Section
              id="learn"
              eyebrow={strings.hero.brand}
              title={strings.learn.title}
            >
              <ul className="grid gap-3 sm:grid-cols-2">
                {strings.learn.bullets.map((b) => (
                  <li
                    key={b}
                    className="rounded-2xl border border-black/10 p-4 text-sm text-gray-800"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </Section>
            <Section
              id="offrir-lire-groupe"
              eyebrow={strings.hero.brand}
              title={strings.giftGroup.title}
            >
              <GiftGroup strings={strings} lang={lang} />
            </Section>
            <Section
              id="commander"
              eyebrow={strings.order.eyebrow}
              title={strings.order.title}
            >
              <OrderOptions strings={strings} lang={lang} />
            </Section>
            <Section
              id="contact"
              eyebrow={strings.contact.eyebrow}
              title={strings.contact.title}
            >
              <Contact strings={strings} lang={lang} />
            </Section>
            <Section
              id="testimonials"
              eyebrow={strings.hero.brand}
              title={strings.testimonials.title}
            >
              <Testimonials
                strings={strings}
                onOpenExcerpt={() => setExcerptOpen(true)}
              />
            </Section>
            <Section
              id="faq"
              eyebrow={strings.hero.brand}
              title={strings.faq.title}
            >
              <FAQ strings={strings} />
            </Section>
            <CTA
              strings={strings}
              lang={lang}
              onOpenExcerpt={() => setExcerptOpen(true)}
            />
          </>
        ) : (
          <>
            <BeyondTheBook
              strings={strings}
              onOpenKeynote={(section) => setKeynoteRequest(section)}
              onOpenCoaching={() => setCoachingOpen(true)}
            />
          </>
        )}
      </main>
      <Footer strings={strings} lang={lang} />
      <ExcerptModal
        open={excerptOpen}
        onClose={() => setExcerptOpen(false)}
        lang={lang}
      />
      <KeynoteModal
        key={keynoteRequest?.id || "keynote"}
        open={Boolean(keynoteRequest)}
        onClose={() => setKeynoteRequest(null)}
        lang={lang}
        requestContext={keynoteRequest}
      />
      <CoachingModal
        open={coachingOpen}
        onClose={() => setCoachingOpen(false)}
        lang={lang}
      />
    </div>
  );
}
