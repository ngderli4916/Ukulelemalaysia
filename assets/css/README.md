Shared CSS files should live here when page styles are extracted from inline `<style>` blocks.

The public HTML filenames stay at the repository root so existing URLs do not change.

Current shared foundation:

- `site.css` keeps the common Ukulele Malaysia visual tokens, language visibility rules, shared logo/button safety styles, and page group variables.
- Page group markers live on `<body data-page-group="...">` so styles can be unified gradually without renaming public pages.

Page groups:

- `home`: homepage.
- `guide`: buying, sizing, tuning and product comparison guides.
- `brand`: brand/store landing pages.
- `service`: interactive customisation pages.
- `gallery`: sample/photo gallery pages.
- `learning`: lesson and video library pages.
- `info`: support and payment information pages.

Extracted shared rules:

- Logo image sizing: `.site-logo-icon`, `.brand-logo`, `.header-logo`.
- Header logo holder sizing: `.logo-holder`.
- Base language visibility and active language button state.
- Shared language visibility replaces duplicate inline `[data-i18n]`, `span[data-lang]`, and `.inline-lang` rules on grouped pages.
- Shared language switch styling for standard `.lang-switch` / `.lang-switcher` and `.lang-btn`.
- Shared standard header layout for `header`, `.nav-wrap`, `.brand`, and `.brand-name` on grouped pages.
- Shared page group background/card variables.

Extracted shared behavior:

- Standard language button handling now lives in `assets/js/site-lang.js`.
- Standard `.reveal` scroll animation trigger now lives in `assets/js/site-reveal.js`.
