(function () {
  const LANG_KEY = "ukm-lang";
  const LANGS = new Set(["en", "ms", "zh"]);

  function normaliseLang(lang) {
    if (!lang) return "en";
    const value = String(lang).toLowerCase();
    if (value.startsWith("zh")) return "zh";
    if (value.startsWith("ms") || value.startsWith("bm")) return "ms";
    if (value.startsWith("en")) return "en";
    return "en";
  }

  function findButtons() {
    return Array.from(document.querySelectorAll("button[data-set-lang], .lang-btn[data-lang]"))
      .filter((button) => {
        const lang = button.getAttribute("data-set-lang") || button.getAttribute("data-lang");
        return LANGS.has(lang);
      });
  }

  function setLanguage(lang, options = {}) {
    const nextLang = normaliseLang(lang);
    const htmlLang = nextLang === "zh" ? "zh-CN" : nextLang === "ms" ? "ms-MY" : "en";
    const body = document.body;
    const buttons = findButtons();

    document.documentElement.setAttribute("lang", htmlLang);
    body.setAttribute("lang", nextLang);
    body.setAttribute("data-lang", nextLang);
    body.classList.remove("lang-en", "lang-ms", "lang-zh");
    body.classList.add(`lang-${nextLang}`);

    buttons.forEach((button) => {
      const buttonLang = button.getAttribute("data-set-lang") || button.getAttribute("data-lang");
      const isActive = buttonLang === nextLang;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    if (!options.skipSave) {
      try {
        localStorage.setItem(LANG_KEY, nextLang);
      } catch (error) {
        /* Ignore private browsing storage errors. */
      }
    }

    window.dispatchEvent(new CustomEvent("ukm:languagechange", { detail: { lang: nextLang } }));
  }

  function getInitialLanguage() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (LANGS.has(saved)) return saved;
    } catch (error) {
      /* Ignore private browsing storage errors. */
    }

    const pageLang = document.body.getAttribute("data-lang") || document.body.getAttribute("lang");
    return normaliseLang(pageLang);
  }

  function init() {
    const buttons = findButtons();
    setLanguage(getInitialLanguage(), { skipSave: true });

    buttons.forEach((button) => {
      if (button.dataset.ukmLangBound === "true") return;
      button.dataset.ukmLangBound = "true";
      button.addEventListener("click", () => {
        const lang = button.getAttribute("data-set-lang") || button.getAttribute("data-lang");
        setLanguage(lang);
      });
    });
  }

  window.UKM = window.UKM || {};
  window.UKM.setLanguage = setLanguage;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
