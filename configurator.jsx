/* Configurator — live engraving preview on a drawn ukulele */
const { useState, useEffect, useRef } = React;

const FONTS = [
  { id: "instrument", name: "Instrument", sample: "Aa", family: '"Instrument Serif", serif',       weight: 400, style: "normal",  size: 34 },
  { id: "playfair",   name: "Playfair",   sample: "Aa", family: '"Playfair Display", serif',        weight: 500, style: "italic",  size: 32 },
  { id: "dancing",    name: "Dancing",    sample: "Aa", family: '"Dancing Script", cursive',        weight: 600, style: "normal",  size: 36 },
  { id: "caveat",     name: "Caveat",     sample: "Aa", family: '"Caveat", cursive',                weight: 600, style: "normal",  size: 36 },
  { id: "sf",         name: "SF",         sample: "Aa", family: '-apple-system, "SF Pro Display"',  weight: 500, style: "normal",  size: 30 },
  { id: "notoserif",  name: "Noto Serif", sample: "Aa", family: '"Noto Serif SC", serif',           weight: 600, style: "normal",  size: 32 },
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

function UkuleleSVG({ text, font, engravingX, engravingY, engravingAngle, engravingSize, shape, view }) {

  // Shape parameters — mirrored across x=200 center
  const s = shape;
  const upperBout = s.upperBout;       // right-side x of widest upper bout (default 280)
  const upperToWaist = s.upperToWaist; // right-side x of upper-to-waist curve (default 266)
  const waist = s.waist;               // right-side x at waist (default 250)
  const lowerBout = s.lowerBout;       // right-side x of widest lower bout (default 280)
  const bottomRound = s.bottomRound;   // right-side x of bottom-round (default 296)
  const bottomY = s.bottomY;           // y of bottom-center (default 600)
  const waistY = s.waistY;             // y of waist narrowest (default 450)
  const upperBoutY = s.upperBoutY;     // y of upper-bout-widest (default 348)
  const lowerBoutY = s.lowerBoutY;     // y of lower-bout-widest (default 504)
  const upperToWaistY = s.upperToWaistY; // y of upper-to-waist curve (default 422)
  const bottomRoundY = s.bottomRoundY; // y of bottom-round curve (default 562)

  // Mirror right-side x values onto the left
  const mUpperBout = 400 - upperBout;
  const mUpperToWaist = 400 - upperToWaist;
  const mWaist = 400 - waist;
  const mLowerBout = 400 - lowerBout;
  const mBottomRound = 400 - bottomRound;

  // Body silhouette — proper guitar/ukulele shape with two bouts and a waist.
  const bodyPath = `
    M 200 312
    C 240 312, ${upperBout - 12} 320, ${upperBout} ${upperBoutY}
    C ${upperBout + 10} ${upperBoutY + 24}, ${upperBout} ${upperBoutY + 52}, ${upperToWaist} ${upperToWaistY}
    C ${upperToWaist - 10} ${upperToWaistY + 14}, ${waist} ${waistY - 8}, ${waist} ${waistY}
    C ${waist} ${waistY + 16}, ${upperToWaist - 2} ${waistY + 28}, ${lowerBout} ${lowerBoutY}
    C ${bottomRound} ${bottomRoundY}, ${bottomRound} ${bottomY - 38}, ${bottomRound - 26} ${bottomY - 20}
    C ${lowerBout - 34} ${bottomY - 4}, 220 ${bottomY}, 200 ${bottomY}
    C 180 ${bottomY}, ${mLowerBout + 34} ${bottomY - 4}, ${mBottomRound + 26} ${bottomY - 20}
    C ${mBottomRound} ${bottomY - 38}, ${mBottomRound} ${bottomRoundY}, ${mLowerBout} ${lowerBoutY}
    C ${mUpperToWaist + 2} ${waistY + 28}, ${mWaist} ${waistY + 16}, ${mWaist} ${waistY}
    C ${mWaist} ${waistY - 8}, ${mUpperToWaist + 10} ${upperToWaistY + 14}, ${mUpperToWaist} ${upperToWaistY}
    C ${mUpperBout} ${upperBoutY + 52}, ${mUpperBout - 10} ${upperBoutY + 24}, ${mUpperBout} ${upperBoutY}
    C ${mUpperBout + 12} 320, 160 312, 200 312
    Z
  `;

  // Dynamic positions for soundhole + bridge (override-able via shape props)
  const holeY = s.holeY;
  const holeR = s.holeR;
  const bridgeY = s.bridgeY;
  const bridgeW = s.bridgeW;
  const bridgeH = s.bridgeH;
  const bridgeX = 200 - bridgeW / 2;

  return (
    <svg className="uke-svg" viewBox="0 0 400 620" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor="#fbe7d8" />
          <stop offset="50%" stopColor="#f2d6c1" />
          <stop offset="100%" stopColor="#dcb89c" />
        </linearGradient>
        <linearGradient id="neckWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#eecdb2" />
          <stop offset="100%" stopColor="#cba88c" />
        </linearGradient>
        <linearGradient id="headWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#f2d6c1" />
          <stop offset="100%" stopColor="#dcb89c" />
        </linearGradient>
        <linearGradient id="fretboard" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor="#3a2412" />
          <stop offset="100%" stopColor="#1f1409" />
        </linearGradient>
        <pattern id="grain" width="2" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(8)">
          <line x1="0" y1="0" x2="0" y2="14" stroke="rgba(120,75,40,0.10)" strokeWidth="0.5"/>
        </pattern>
        <radialGradient id="hole" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%"  stopColor="#000" />
          <stop offset="85%" stopColor="#0a0604" />
          <stop offset="100%" stopColor="#3a2412" />
        </radialGradient>
      </defs>

      {/* drop shadow */}
      <ellipse cx="200" cy="608" rx="105" ry="6" fill="rgba(0,0,0,0.10)" />

      {/* Headstock — tapered, slightly wider than neck */}
      <path
        d="M 174 24 L 226 24 L 234 92 L 166 92 Z"
        fill="url(#headWood)"
        stroke="#5a3415" strokeWidth="0.8"
      />
      {/* Tuning pegs (4) */}
      <g>
        {[[164, 38], [164, 76], [236, 38], [236, 76]].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r="3.6" fill="#1a1a1f" />
            <circle cx={cx} cy={cy} r="1.6" fill="#7a7a80" />
            <rect x={cx < 200 ? cx - 8 : cx} y={cy - 1.2} width="8" height="2.4" fill="#1a1a1f" rx="0.5"/>
          </g>
        ))}
      </g>
      {/* Brand mark on headstock */}
      <text x="200" y="62" textAnchor="middle"
        fontFamily='"Instrument Serif", serif' fontSize="9"
        fill="rgba(255,255,255,0.35)" letterSpacing="0.5">Ukunili</text>

      {/* Nut */}
      <rect x="178" y="92" width="44" height="3" fill="#e8d9b8" />

      {/* Neck — fretboard + frets only on front; back uses body wood */}
      {view === "front" ? (
        <>
          <rect x="184" y="95" width="32" height="200" fill="url(#neckWood)" />
          {/* Fretboard overlay */}
          <rect x="184" y="95" width="32" height="195" fill="url(#fretboard)" />
          {/* Frets */}
          {[110, 130, 152, 178, 208, 240, 274].map((y, i) => (
            <line key={i} x1="184" y1={y} x2="216" y2={y} stroke="#c8c8cc" strokeWidth="0.7"/>
          ))}
          {/* Fret dots */}
          <circle cx="200" cy="195" r="1.4" fill="rgba(255,255,255,0.5)" />
          <circle cx="200" cy="258" r="1.4" fill="rgba(255,255,255,0.5)" />
        </>
      ) : (
        // Back: neck matches body wood, no frets
        <rect x="184" y="95" width="32" height="200" fill="url(#wood)" />
      )}

      {/* Heel — connects neck to body */}
      <path
        d="M 180 290 L 220 290 L 224 312 L 176 312 Z"
        fill="url(#neckWood)"
        stroke="#5a3415" strokeWidth="0.5"
      />

      {/* Body */}
      <path d={bodyPath} fill="url(#wood)" stroke="#5a3415" strokeWidth="1" />
      <path d={bodyPath} fill="url(#grain)" />

      {/* Sound hole — front only */}
      {view === "front" && (
        <>
          <circle cx="200" cy={holeY} r={holeR} fill="url(#hole)" />
          <circle cx="200" cy={holeY} r={holeR} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="1" />
          <circle cx="200" cy={holeY} r={holeR + 4} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          {/* Rosette ring */}
          <circle cx="200" cy={holeY} r={holeR + 6} fill="none" stroke="rgba(40,20,10,0.35)" strokeWidth="0.6" strokeDasharray="1 1.5" />
        </>
      )}

      {/* Bridge / saddle — front only */}
      {view === "front" && (
        <>
          <rect x={bridgeX} y={bridgeY} width={bridgeW} height={bridgeH} rx="1.5" fill="#2a1a0c" />
          <rect x={bridgeX + 6} y={bridgeY - 2} width={bridgeW - 12} height="2" fill="#e8d9b8" />
          {/* Bridge pins */}
          {[-16, -8, 0, 8, 16].map((dx, i) => (
            <circle key={i} cx={200 + dx} cy={bridgeY + bridgeH / 2} r="1.2" fill="#e8d9b8" />
          ))}
        </>
      )}

      {/* Strings — front only */}
      {view === "front" && [-9, -3, 3, 9].map((dx, i) => (
        <line
          key={i}
          x1={200 + dx} y1={94}
          x2={200 + dx * 0.95} y2={bridgeY - 1}
          stroke={i < 2 ? "rgba(245,235,220,0.85)" : "rgba(220,200,170,0.85)"}
          strokeWidth="0.7"
        />
      ))}

      {/* Engraved text — position + angle controlled by user */}
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
          fill="rgba(20,12,4,0.92)"
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
  "engravingX": 157,
  "engravingY": 380,
  "engravingAngle": -90,
  "engravingSize": 22,
  "upperBout": 269,
  "upperToWaist": 265,
  "waist": 264,
  "lowerBout": 293,
  "bottomRound": 304,
  "upperBoutY": 350,
  "upperToWaistY": 417,
  "waistY": 400,
  "lowerBoutY": 483,
  "bottomRoundY": 515,
  "bottomY": 600,
  "holeY": 416,
  "holeR": 30,
  "bridgeY": 516,
  "bridgeW": 67,
  "bridgeH": 18
}/*EDITMODE-END*/);

  const [fontId, setFontId] = useState("caveat");
  const [view, setView] = useState("front");

  const text = tweaks.engravingText ?? "";
  const font = FONTS.find(f => f.id === fontId) || FONTS[0];

  const shape = {
    upperBout: tweaks.upperBout,
    upperToWaist: tweaks.upperToWaist,
    waist: tweaks.waist,
    lowerBout: tweaks.lowerBout,
    bottomRound: tweaks.bottomRound,
    upperBoutY: tweaks.upperBoutY,
    upperToWaistY: tweaks.upperToWaistY,
    waistY: tweaks.waistY,
    lowerBoutY: tweaks.lowerBoutY,
    bottomRoundY: tweaks.bottomRoundY,
    bottomY: tweaks.bottomY,
    holeY: tweaks.holeY,
    holeR: tweaks.holeR,
    bridgeY: tweaks.bridgeY,
    bridgeW: tweaks.bridgeW,
    bridgeH: tweaks.bridgeH,
  };

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
          <TweakSection title="Body shape · X axis (width)">
            <TweakSlider label="Upper bout"      min={240} max={310} step={1} value={tweaks.upperBout}    onChange={v => setTweak("upperBout", v)} />
            <TweakSlider label="Upper→waist"     min={240} max={300} step={1} value={tweaks.upperToWaist} onChange={v => setTweak("upperToWaist", v)} />
            <TweakSlider label="Waist (narrow)"  min={220} max={280} step={1} value={tweaks.waist}        onChange={v => setTweak("waist", v)} />
            <TweakSlider label="Lower bout"      min={250} max={320} step={1} value={tweaks.lowerBout}    onChange={v => setTweak("lowerBout", v)} />
            <TweakSlider label="Bottom round"    min={260} max={320} step={1} value={tweaks.bottomRound}  onChange={v => setTweak("bottomRound", v)} />
          </TweakSection>
          <TweakSection title="Body shape · Y axis (height)">
            <TweakSlider label="Upper bout Y"    min={320} max={380} step={1} value={tweaks.upperBoutY}    onChange={v => setTweak("upperBoutY", v)} />
            <TweakSlider label="Upper→waist Y"   min={390} max={460} step={1} value={tweaks.upperToWaistY} onChange={v => setTweak("upperToWaistY", v)} />
            <TweakSlider label="Waist Y"         min={400} max={470} step={1} value={tweaks.waistY}        onChange={v => setTweak("waistY", v)} />
            <TweakSlider label="Lower bout Y"    min={460} max={540} step={1} value={tweaks.lowerBoutY}    onChange={v => setTweak("lowerBoutY", v)} />
            <TweakSlider label="Bottom round Y"  min={350} max={620} step={1} value={tweaks.bottomRoundY}  onChange={v => setTweak("bottomRoundY", v)} />
            <TweakSlider label="Bottom Y"        min={580} max={620} step={1} value={tweaks.bottomY}       onChange={v => setTweak("bottomY", v)} />
          </TweakSection>
          <TweakSection title="Soundhole">
            <TweakSlider label="Position Y"      min={300} max={580} step={1} value={tweaks.holeY}         onChange={v => setTweak("holeY", v)} />
            <TweakSlider label="Radius"          min={10}  max={44}  step={1} value={tweaks.holeR}         onChange={v => setTweak("holeR", v)} />
          </TweakSection>
          <TweakSection title="Bridge / saddle">
            <TweakSlider label="Position Y"      min={420} max={600} step={1} value={tweaks.bridgeY}       onChange={v => setTweak("bridgeY", v)} />
            <TweakSlider label="Width"           min={30}  max={100} step={1} value={tweaks.bridgeW}       onChange={v => setTweak("bridgeW", v)} />
            <TweakSlider label="Height"          min={5}   max={24}  step={1} value={tweaks.bridgeH}       onChange={v => setTweak("bridgeH", v)} />
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
          shape={shape}
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
                type="range" min={120} max={280} step={1}
                value={tweaks.engravingX}
                onChange={e => setTweak("engravingX", +e.target.value)}
              />
            </label>
            <label className="pos-row">
              <span className="pos-label">Y position <em>{tweaks.engravingY}</em></span>
              <input
                type="range" min={60} max={590} step={1}
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
                type="range" min={8} max={64} step={1}
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
