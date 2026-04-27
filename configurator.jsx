/* Configurator — live engraving preview on a drawn ukulele */
const { useState, useEffect, useRef } = React;

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
  // Tweaks integration — engraving text + ukulele shape sliders, persisted
  const [tweaks, setTweak] = window.useTweaks(/*EDITMODE-BEGIN*/{
  "engravingText": "Ocean Blue",
  "engravingX": 187,
  "engravingY": 860,
  "engravingAngle": 0,
  "engravingSize": 28
}/*EDITMODE-END*/);

  const [fontId, setFontId] = useState("caveat");
  const [view, setView] = useState("front");

  const text = tweaks.engravingText ?? "";
  const font = FONTS.find(f => f.id === fontId) || FONTS[0];

  function onTextChange(e) {
    setTweak("engravingText", e.target.value);
  }

  // Broadcast text to non-React parts of the page (name preview)
  useEffect(() => {
    document.dispatchEvent(new CustomEvent("engrave:text-change", { detail: text }));
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
          <button className={view === "front" ? "on" : ""} onClick={() => setView("front")}>Front</button>
          <button className={view === "back"  ? "on" : ""} onClick={() => setView("back")}>Back</button>
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
              <div className="step-num">STEP 01</div>
              <h3 className="step-title">Your text</h3>
            </div>
            <div className="step-value">{text.length}/24</div>
          </div>
          <div className="text-input">
            <input
              value={text}
              onChange={onTextChange}
              placeholder="Type a name, date, or line…"
              maxLength={24}
            />
            <div className="hint">
              <span>Letters, numbers, punctuation — emoji-free</span>
              <span>Free</span>
            </div>
          </div>
        </div>

        <div className="step">
          <div className="step-head">
            <div>
              <div className="step-num">STEP 02</div>
              <h3 className="step-title">Typeface</h3>
            </div>
            <div className="step-value">{font.name}</div>
          </div>
          <div className="font-grid">
            {FONTS.map(f => (
              <div
                key={f.id}
                className={"font-chip" + (f.id === fontId ? " on" : "")}
                onClick={() => setFontId(f.id)}
              >
                <div
                  className="sample"
                  style={{
                    fontFamily: f.family,
                    fontWeight: f.weight,
                    fontStyle: f.style,
                  }}
                >{f.sample}</div>
                <div className="label">{f.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="step">
          <div className="step-head">
            <div>
              <div className="step-num">STEP 03</div>
              <h3 className="step-title">Position & angle</h3>
            </div>
            <div className="step-value">{tweaks.engravingAngle}°</div>
          </div>
          <div className="pos-controls">
            <label className="pos-row">
              <span className="pos-label">X position <em>{tweaks.engravingX}</em></span>
              <input
                type="range" min={50} max={325} step={1}
                value={tweaks.engravingX}
                onChange={e => setTweak("engravingX", +e.target.value)}
              />
            </label>
            <label className="pos-row">
              <span className="pos-label">Y position <em>{tweaks.engravingY}</em></span>
              <input
                type="range" min={50} max={920} step={1}
                value={tweaks.engravingY}
                onChange={e => setTweak("engravingY", +e.target.value)}
              />
            </label>
            <label className="pos-row">
              <span className="pos-label">Angle <em>{tweaks.engravingAngle}°</em></span>
              <input
                type="range" min={-180} max={180} step={1}
                value={tweaks.engravingAngle}
                onChange={e => setTweak("engravingAngle", +e.target.value)}
              />
            </label>
            <label className="pos-row">
              <span className="pos-label">Size <em>{tweaks.engravingSize}px</em></span>
              <input
                type="range" min={10} max={80} step={1}
                value={tweaks.engravingSize}
                onChange={e => setTweak("engravingSize", +e.target.value)}
              />
            </label>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted)", fontFamily: '"Space Mono", monospace' }}>
            Drag the sliders to move and rotate your inscription anywhere on the ukulele.
          </div>
        </div>

        <div className="price-row">
          <div className="price">
            <b>¥ 268</b>
            <span>Engraving included</span>
          </div>
          <button className="btn btn-primary">Continue ›</button>
        </div>
      </div>
    </>
  );
}

// Mount
const mount = document.getElementById("configurator");
if (mount) ReactDOM.createRoot(mount).render(<Configurator />);
