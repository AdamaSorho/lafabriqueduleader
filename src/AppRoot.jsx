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
import logo from "./assets/logo.png";
import AuthorSection from "./components/AuthorSection";
import BeyondTheBook from "./components/BeyondTheBook";
import KeynoteModal from "./components/KeynoteModal";
import CoachingModal from "./components/CoachingModal";
import Audience from "./components/Audience";
import GiftGroup from "./components/GiftGroup";
import OrderOptions from "./components/OrderOptions";

export default function AppRoot() {
  const { lang, setLang, strings } = useLang();
  const [excerptOpen, setExcerptOpen] = useState(false);
  const [keynoteRequest, setKeynoteRequest] = useState(null);
  const [coachingOpen, setCoachingOpen] = useState(false);
  const resolvePage = () => {
    const rawPath = window.location.pathname || "/";
    const path = rawPath.replace(/\/+$/, "") || "/";
    if (path === "/beyond-the-book" || path === "/au-dela-du-livre") {
      return "beyond";
    }
    return "home";
  };
  const [page, setPage] = useState(resolvePage);

  // Ensure favicon uses our logo
  useEffect(() => {
    try {
      const existing = document.querySelector('link[rel="icon"]');
      const link = existing || document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      link.href = logo;
      if (!existing) document.head.appendChild(link);
    } catch (err) {
      console.log(err);
    }
  }, []);

  // Redirect helpers: route legacy order URLs to the internal order section.
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const path = (url.pathname || "").replace(/\/+$/, "");
      const isPreorderPath = /^\/(pre-?order|precommande|pre-commande|order|commander)$/i.test(
        path
      );
      const isPreorderQuery = url.searchParams.has("preorder") || url.searchParams.has("order");
      if (isPreorderPath || isPreorderQuery) {
        url.pathname = "/";
        url.searchParams.delete("preorder");
        url.searchParams.delete("order");
        url.hash = "commander";
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
        setPage("home");
      }
    } catch (err) {
      console.log(err);
    }
  }, []);

  useEffect(() => {
    const onPop = () => {
      setPage(resolvePage());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

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
    const search = window.location.search || "";
    const hash = options.hash || "";
    const homePath = "/";
    const beyondPath = lang === "fr" ? "/au-dela-du-livre" : "/beyond-the-book";
    const nextPath = nextPage === "home" ? homePath : beyondPath;
    const url = `${nextPath}${search}${hash || ""}`;
    if (`${window.location.pathname}${search}${window.location.hash}` !== url) {
      window.history.pushState({}, "", url);
    } else {
      window.history.replaceState({}, "", url);
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

  return (
    <div className="min-h-full bg-white text-gray-900 font-sans">
      <Nav
        lang={lang}
        setLang={setLang}
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
