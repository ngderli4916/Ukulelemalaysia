/* Configurator — live engraving preview on a drawn ukulele */
const { useState, useEffect, useRef } = React;

// ────────── i18n helper ──────────
// The HTML has data-lang on body (set by the language switcher). We read it
// and re-render whenever it changes so configurator labels stay in sync.
function useLang() {
  const [lang, setLang] = useState(() => document.body.getAttribute("data-lang") || "en");
  useEffect(() => {
    const obs = new MutationObserver(() => {
      const v = document.body.getAttribute("data-lang") || "en";
      setLang(v);
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["data-lang"] });
    return () => obs.disconnect();
  }, []);
  return lang;
}

// String table for configurator UI — all three languages.
const T = {
  front:        { en: "Front",        ms: "Depan",       zh: "正面" },
  back:         { en: "Back",         ms: "Belakang",    zh: "背面" },
  step:         { en: "STEP 01",      ms: "LANGKAH 01",  zh: "步骤 01" },
  positionAngle:{ en: "Position & angle", ms: "Kedudukan & sudut", zh: "位置与角度" },
  engraving:    { en: "Engraving",    ms: "Ukiran",      zh: "刻字" },
  xPosition:    { en: "X position",   ms: "Kedudukan X", zh: "X 位置" },
  yPosition:    { en: "Y position",   ms: "Kedudukan Y", zh: "Y 位置" },
  angle:        { en: "Angle",        ms: "Sudut",       zh: "角度" },
  size:         { en: "Size",         ms: "Saiz",        zh: "尺寸" },
  hint:         { en: "Drag the sliders to move and rotate your inscription anywhere on the ukulele.",
                  ms: "Tarik slider untuk menggerak dan memutar ukiran anda di mana-mana pada ukulele.",
                  zh: "拖动滑块即可在尤克里里上任意移动、旋转你的刻字。" },
  submitNote:   { en: "Click submit to send your design",
                  ms: "Tekan hantar untuk menghantar reka bentuk anda",
                  zh: "点击提交，把你的设计发送给我们" },
  submit:       { en: "Submit",       ms: "Hantar",      zh: "提交" },
};

const FONTS = [
  { id: "abril",      name: "Abril Fatface", sample: "Aa", family: '"Abril Fatface", serif',           weight: 400, style: "normal", size: 32 },
  { id: "chicle",     name: "Chicle",        sample: "Aa", family: '"Chicle", cursive',                weight: 400, style: "normal", size: 32 },
  { id: "covered",    name: "Covered",       sample: "Aa", family: '"Covered By Your Grace", cursive', weight: 400, style: "normal", size: 34 },
  { id: "damion",     name: "Damion",        sample: "Aa", family: '"Damion", cursive',                weight: 400, style: "normal", size: 34 },
  { id: "huifont",    name: "HuiFont",       sample: "Aa", family: '"HuiFont", cursive',               weight: 400, style: "normal", size: 32 },
  { id: "mouse",      name: "Mouse",         sample: "Aa", family: '"Mouse Memoirs", sans-serif',      weight: 400, style: "normal", size: 32 },
  { id: "snickles",   name: "Snickles",      sample: "Aa", family: '"Snickles", cursive',              weight: 400, style: "normal", size: 32 },
  { id: "rubik",      name: "Rubik Mono",    sample: "Aa", family: '"Rubik Mono One", sans-serif',     weight: 400, style: "normal", size: 26 },
  { id: "marker",     name: "Marker",        sample: "Aa", family: '"Permanent Marker", cursive',      weight: 400, style: "normal", size: 30 },
  { id: "dmserif",    name: "DM Serif",      sample: "Aa", family: '"DM Serif Display", serif',        weight: 400, style: "normal", size: 32 },
  { id: "caveat",     name: "Caveat",        sample: "Aa", family: '"Caveat", cursive',                weight: 600, style: "normal", size: 36 },
  { id: "dancing",    name: "Dancing",       sample: "Aa", family: '"Dancing Script", cursive',        weight: 600, style: "normal", size: 36 },
];

const LOCATIONS = [
  { id: "headstock", name: "Headstock"   },
  { id: "body",      name: "Body front"  },
  { id: "back",      name: "Back panel"  },
  { id: "heel",      name: "Heel"        },
  { id: "side",      name: "Side"        },
];

// Realistic soprano ukulele on a 400×620 viewBox
// Anatomy: headstock (top, slightly flared), nut, long thin neck, body (hourglass).
const ZONES = {
  headstock: { x: 168, y: 22,  w: 64,  h: 70,  label: { x: 200, y: 60 },  fontScale: 0.28 },
  body:      { x: 130, y: 380, w: 140, h: 60,  label: { x: 200, y: 412 }, fontScale: 0.7 },
  back:      { x: 130, y: 470, w: 140, h: 60,  label: { x: 200, y: 502 }, fontScale: 0.7 },
  heel:      { x: 184, y: 290, w: 32,  h: 22,  label: { x: 200, y: 302 }, fontScale: 0.22 },
  side:      { x: 78,  y: 460, w: 26,  h: 80,  label: { x: 91,  y: 500 }, fontScale: 0.22, rotate: -90 },
};

function UkuleleSVG({ text, font, engravingX, engravingY, engravingAngle, engravingSize, view }) {
  // Photo-backed preview. The two photos (front + back) share identical canvas
  // dimensions and a centered ukulele, so the same viewBox + the same engraving
  // coordinates work for both views.
  //
  // Photo intrinsic size: 375 × 963. We mirror that exactly in the viewBox so
  // 1 SVG unit = 1 photo pixel. Engraving coordinates therefore map 1:1 to
  // pixel positions on the ukulele body.
  const imgUrl = view === "front"
    ? "images/uke-front.webp"
    : "images/uke-back.webp";

  return (
    <svg className="uke-svg" viewBox="0 0 375 963" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        {/* Subtle inset shadow to make engraved text look pressed-into-wood */}
        <filter id="engrave" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.4" />
          <feOffset dx="0" dy="0.6" result="offset" />
          <feComponentTransfer><feFuncA type="linear" slope="0.45"/></feComponentTransfer>
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>

      {/* The photo itself — fills the entire viewBox */}
      <image
        href={imgUrl}
        x="0" y="0" width="375" height="963"
        preserveAspectRatio="xMidYMid meet"
      />

      {/* Engraved text — multiply blend simulates real laser engraving on wood:
          the text darkens the wood underneath rather than sitting opaquely on top */}
      {text && (
        <text
          x={engravingX}
          y={engravingY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily={font.family}
          fontWeight={font.weight}
          fontStyle={font.style}
          fontSize={engravingSize}
          fill="rgba(30,15,5,0.88)"
          style={{ mixBlendMode: "multiply", letterSpacing: "0.02em" }}
          transform={`rotate(${engravingAngle} ${engravingX} ${engravingY})`}
        >
          {text.length > 18 ? text.slice(0, 18) + "…" : text}
        </text>
      )}
    </svg>
  );
}

function Configurator() {
  // Tweaks integration — engraving text + position, persisted
  const [tweaks, setTweak] = window.useTweaks(/*EDITMODE-BEGIN*/{
  "engravingText": "Ocean Blue",
  "engravingX": 120,
  "engravingY": 625,
  "engravingAngle": -90,
  "engravingSize": 27
}/*EDITMODE-END*/);

  // Default font is Dancing — used until customer picks one in Step 01 (Name Preview).
  const [fontId, setFontId] = useState("dancing");
  const [view, setView] = useState("front");
  const lang = useLang();
  const t = (key) => (T[key] && T[key][lang]) || (T[key] && T[key].en) || key;

  const text = tweaks.engravingText ?? "";
  const font = FONTS.find(f => f.id === fontId) || FONTS.find(f => f.id === "dancing") || FONTS[0];

  // Broadcast text changes to Name Preview (kept for backward compat)
  useEffect(() => {
    document.dispatchEvent(new CustomEvent("engrave:text-change", { detail: text }));
  }, [text]);

  // Listen for font/text selection from Step 01 (Name Preview).
  // When customer clicks "Select" on a typeface there, sync both into the live preview.
  useEffect(() => {
    function onFontSelect(e) {
      const { fontId: pickedId, text: pickedText } = e.detail || {};
      if (pickedId && FONTS.find(f => f.id === pickedId)) {
        setFontId(pickedId);
      }
      if (typeof pickedText === "string" && pickedText !== text) {
        setTweak("engravingText", pickedText);
      }
    }
    // Also keep text in sync when user types in the Name Preview input
    function onNpInput(e) {
      const newText = e.detail || "";
      if (newText !== text) setTweak("engravingText", newText);
    }
    document.addEventListener("engrave:font-select", onFontSelect);
    document.addEventListener("engrave:np-input", onNpInput);
    return () => {
      document.removeEventListener("engrave:font-select", onFontSelect);
      document.removeEventListener("engrave:np-input", onNpInput);
    };
  }, [text]);

  // Tweaks panel mounted via portal-like pattern — actually just render inline;
  // it floats absolutely positioned, so layout isn't affected.
  const { TweaksPanel, TweakSection, TweakText, TweakSlider } = window;

  return (
    <>
      {TweaksPanel && (
        <TweaksPanel title="Tweaks">
          <TweakSection title="Engraving">
            <TweakText
              label="Engraving text"
              value={text}
              onChange={(v) => setTweak("engravingText", v)}
              placeholder="Type to preview live"
            />
          </TweakSection>
        </TweaksPanel>
      )}
      {/* Preview */}
      <div className="config-preview">
        <div className="preview-view-toggle" role="tablist" aria-label="View">
          <button className={view === "front" ? "on" : ""} onClick={() => setView("front")}>{t("front")}</button>
          <button className={view === "back"  ? "on" : ""} onClick={() => setView("back")}>{t("back")}</button>
        </div>
        <UkuleleSVG
          text={text}
          font={font}
          engravingX={tweaks.engravingX}
          engravingY={tweaks.engravingY}
          engravingAngle={tweaks.engravingAngle}
          engravingSize={tweaks.engravingSize}
          view={view}
        />
        <div className="preview-caption">
          Live preview · {font.name} · X {tweaks.engravingX} · Y {tweaks.engravingY} · {tweaks.engravingAngle}° · {tweaks.engravingSize}px
        </div>
      </div>

      {/* Controls */}
      <div className="config-controls">

        <div className="step">
          <div className="step-head">
            <div>
              <div className="step-num">{t("step")}</div>
              <h3 className="step-title">{t("positionAngle")}</h3>
            </div>
            <div className="step-value">{tweaks.engravingAngle}°</div>
          </div>
          <div className="current-selection">
            <div className="cs-label">{t("engraving")}</div>
            <div className="cs-text" style={{ fontFamily: font.family, fontWeight: font.weight, fontStyle: font.style }}>
              {text || "—"}
            </div>
            <div className="cs-meta">{font.name}</div>
          </div>
          <div className="pos-controls">
            <label className="pos-row">
              <span className="pos-label">{t("xPosition")} <em>{tweaks.engravingX}</em></span>
              <input
                type="range" min={50} max={325} step={1}
                value={tweaks.engravingX}
                onChange={e => setTweak("engravingX", +e.target.value)}
              />
            </label>
            <label className="pos-row">
              <span className="pos-label">{t("yPosition")} <em>{tweaks.engravingY}</em></span>
              <input
                type="range" min={50} max={920} step={1}
                value={tweaks.engravingY}
                onChange={e => setTweak("engravingY", +e.target.value)}
              />
            </label>
            <label className="pos-row">
              <span className="pos-label">{t("angle")} <em>{tweaks.engravingAngle}°</em></span>
              <input
                type="range" min={-180} max={180} step={1}
                value={tweaks.engravingAngle}
                onChange={e => setTweak("engravingAngle", +e.target.value)}
              />
            </label>
            <label className="pos-row">
              <span className="pos-label">{t("size")} <em>{tweaks.engravingSize}px</em></span>
              <input
                type="range" min={10} max={80} step={1}
                value={tweaks.engravingSize}
                onChange={e => setTweak("engravingSize", +e.target.value)}
              />
            </label>
          </div>
          <div style={{ marginTop: 14, fontSize: 13, color: "var(--ink-mute)", lineHeight: 1.5 }}>
            {t("hint")}
          </div>
        </div>

        <div className="submit-block">
          <div className="submit-note">{t("submitNote")}</div>
          <button className="btn-submit" type="button">{t("submit")} ›</button>
        </div>
      </div>
    </>
  );
}

// Mount
const mount = document.getElementById("configurator");
if (mount) ReactDOM.createRoot(mount).render(<Configurator />);
