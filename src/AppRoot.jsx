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
import PreorderModal from "./components/PreorderModal";
import BookPreviewModal from "./components/BookPreviewModal";
import logo from "./assets/logo.png";
import AuthorSection from "./components/AuthorSection";
import BeyondTheBook from "./components/BeyondTheBook";
import KeynoteModal from "./components/KeynoteModal";
import CoachingModal from "./components/CoachingModal";

export default function AppRoot() {
  const { lang, setLang, strings } = useLang();
  const [excerptOpen, setExcerptOpen] = useState(false);
  const [preorderOpen, setPreorderOpen] = useState(false);
  const [bookPreviewOpen, setBookPreviewOpen] = useState(false);
  const [keynoteOpen, setKeynoteOpen] = useState(false);
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

  // Redirect helpers: open preorder modal when visiting /preorder or ?preorder
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const path = (url.pathname || "").replace(/\/+$/, "");
      const isPreorderPath = /^\/(pre-?order|precommande|pre-commande)$/i.test(
        path
      );
      const isPreorderQuery = url.searchParams.has("preorder");
      if (isPreorderPath || isPreorderQuery) {
        const langParam =
          url.searchParams.get("lang") || localStorage.getItem("lang");
        const next = new URL(url.origin + "/");
        if (langParam) next.searchParams.set("lang", langParam);
        next.hash = "#contact";
        window.history.replaceState({}, "", next.toString());
        setPreorderOpen(true);
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
        onOpenPreorder={() => setPreorderOpen(true)}
        onNavigate={handleNavigate}
        currentPage={page}
      />
      <main>
        {page === "home" ? (
          <>
            <Hero
              strings={strings}
              onOpenExcerpt={() => setExcerptOpen(true)}
              onOpenPreorder={() => setPreorderOpen(true)}
              onOpenBookPreview={() => setBookPreviewOpen(true)}
            />
            <Section
              id="why"
              eyebrow={strings.hero.brand}
              title={strings.why.title}
            >
              <Why
                strings={strings}
                onOpenPreorder={() => setPreorderOpen(true)}
              />
            </Section>
            <AuthorSection strings={strings} />
            <Section
              id="about"
              eyebrow={strings.hero.brand}
              title={strings.about.title}
            >
              <AboutBook
                strings={strings}
                onOpenPreorder={() => setPreorderOpen(true)}
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
              id="faq"
              eyebrow={strings.hero.brand}
              title={strings.faq.title}
            >
              <FAQ strings={strings} />
            </Section>
            <CTA
              strings={strings}
              onOpenExcerpt={() => setExcerptOpen(true)}
              onOpenPreorder={() => setPreorderOpen(true)}
              onOpenBookPreview={() => setBookPreviewOpen(true)}
            />
          </>
        ) : (
          <>
            <BeyondTheBook
              strings={strings}
              lang={lang}
              onOpenKeynote={() => setKeynoteOpen(true)}
              onOpenCoaching={() => setCoachingOpen(true)}
            />
          </>
        )}
        <Section
          id="contact"
          eyebrow={strings.footer.contact}
          title={strings.footer.contact}
        >
          <Contact lang={lang} />
        </Section>
      </main>
      <Footer strings={strings} lang={lang} />
      <ExcerptModal
        open={excerptOpen}
        onClose={() => setExcerptOpen(false)}
        lang={lang}
      />
      <BookPreviewModal
        open={bookPreviewOpen}
        onClose={() => setBookPreviewOpen(false)}
        lang={lang}
      />
      <PreorderModal
        open={preorderOpen}
        onClose={() => setPreorderOpen(false)}
        lang={lang}
      />
      <KeynoteModal
        open={keynoteOpen}
        onClose={() => setKeynoteOpen(false)}
        lang={lang}
      />
      <CoachingModal
        open={coachingOpen}
        onClose={() => setCoachingOpen(false)}
        lang={lang}
      />
    </div>
  );
}
