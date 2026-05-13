/* Plain JavaScript configurator so the page works from file:// and on the website. */
(function () {
  const mount = document.getElementById("configurator");
  if (!mount) return;

  const FONTS = [
    { id: "abril", name: "Abril Fatface", family: '"Abril Fatface", serif', weight: 400, style: "normal" },
    { id: "chicle", name: "Chicle", family: '"Chicle", cursive', weight: 400, style: "normal" },
    { id: "covered", name: "Covered", family: '"Covered By Your Grace", cursive', weight: 400, style: "normal" },
    { id: "damion", name: "Damion", family: '"Damion", cursive', weight: 400, style: "normal" },
    { id: "huifont", name: "HuiFont", family: '"HuiFont", cursive', weight: 400, style: "normal" },
    { id: "mouse", name: "Mouse", family: '"Mouse Memoirs", sans-serif', weight: 400, style: "normal" },
    { id: "snickles", name: "Snickles", family: '"Snickles", cursive', weight: 400, style: "normal" },
    { id: "rubik", name: "Rubik Mono", family: '"Rubik Mono One", sans-serif', weight: 400, style: "normal" },
    { id: "marker", name: "Marker", family: '"Permanent Marker", cursive', weight: 400, style: "normal" },
    { id: "dmserif", name: "DM Serif", family: '"DM Serif Display", serif', weight: 400, style: "normal" },
    { id: "caveat", name: "Caveat", family: '"Caveat", cursive', weight: 600, style: "normal" },
    { id: "dancing", name: "Dancing", family: '"Dancing Script", cursive', weight: 600, style: "normal" },
  ];

  const T = {
    front: { en: "Front", ms: "Depan", zh: "正面" },
    back: { en: "Back", ms: "Belakang", zh: "背面" },
    step: { en: "STEP 01", ms: "LANGKAH 01", zh: "步骤 01" },
    positionAngle: { en: "Position & angle", ms: "Kedudukan & sudut", zh: "位置与角度" },
    engraving: { en: "Engraving", ms: "Ukiran", zh: "刻字" },
    xPosition: { en: "Move Left/Right", ms: "Gerak Kiri/Kanan", zh: "左右移动" },
    yPosition: { en: "Move Up/Down", ms: "Gerak Atas/Bawah", zh: "上下移动" },
    angle: { en: "Angle", ms: "Sudut", zh: "角度" },
    size: { en: "Size Small/Big", ms: "Saiz Kecil/Besar", zh: "大小调整" },
    hint: {
      en: "Drag the sliders to move and rotate your inscription anywhere on the ukulele.",
      ms: "Tarik slider untuk menggerak dan memutar ukiran anda di mana-mana pada ukulele.",
      zh: "拖动滑块即可在尤克里里上任意移动、旋转你的刻字。"
    },
    shareNote: {
      en: "Step 1 sends your design to us. Step 2 shares the preview image to us.",
      ms: "Langkah 1 hantar reka bentuk kepada kami. Langkah 2 kongsi imej pratonton kepada kami.",
      zh: "步骤 1 先发给我们。步骤 2 把预览图分享给我们。"
    },
    stepOne: { en: "Step 1", ms: "Langkah 1", zh: "步骤 1" },
    stepTwo: { en: "Step 2", ms: "Langkah 2", zh: "步骤 2" },
    sendWhatsapp: { en: "Send via WhatsApp", ms: "Hantar melalui WhatsApp", zh: "通过 WhatsApp 发送" },
    sendDesign: { en: "Send design via WhatsApp", ms: "Hantar reka bentuk via WhatsApp", zh: "通过 WhatsApp 发送设计" },
    sharePreview: { en: "Share preview image", ms: "Kongsi imej pratonton", zh: "分享预览图" },
    shareButton: { en: "Share Preview", ms: "Kongsi Pratonton", zh: "分享预览图" },
    download: { en: "Download Preview", ms: "Muat Turun Pratonton", zh: "下载预览图" },
    samples: { en: "See more engraving samples", ms: "Lihat lebih banyak contoh ukiran", zh: "查看更多雕刻样本" },
    sampleEyebrow: { en: "Need ideas?", ms: "Perlu idea?", zh: "想找灵感？" },
    sampleTitle: { en: "Wonder how others design theirs?", ms: "Ingin tahu cara orang lain mereka bentuk ukiran?", zh: "想知道别人都是如何设计的吗？" },
    sampleText: {
      en: "Browse real engraving samples from our customers and find a style that makes your ukulele feel more personal.",
      ms: "Lihat contoh ukiran pelanggan kami dan cari gaya yang menjadikan ukulele anda lebih peribadi.",
      zh: "看看我们的真实雕刻样本，参考别人怎样放名字、字体和位置，让你的设计更有感觉。"
    },
    preparing: { en: "Preparing...", ms: "Sedang sedia...", zh: "准备中..." },
    downloadError: { en: "Sorry, the preview image could not be downloaded. Please try again.", ms: "Maaf, imej pratonton tidak dapat dimuat turun. Sila cuba lagi.", zh: "抱歉，预览图无法下载。请再试一次。" },
    shareError: { en: "Sorry, the preview image could not be shared. Please try Download Preview instead.", ms: "Maaf, imej pratonton tidak dapat dikongsi. Sila cuba Muat Turun Pratonton.", zh: "抱歉，预览图无法分享。请改用下载预览图。" }
  };

  const state = {
    text: "Ocean Blue",
    fontId: "dancing",
    view: "front",
    engravingX: 120,
    engravingY: 625,
    engravingAngle: -90,
    engravingSize: 27,
    busy: ""
  };

  function lang() {
    return document.body.getAttribute("data-lang") || "en";
  }

  function t(key) {
    return (T[key] && (T[key][lang()] || T[key].en)) || key;
  }

  function font() {
    return FONTS.find((item) => item.id === state.fontId) || FONTS[11];
  }

  function textShort() {
    return state.text.length > 18 ? state.text.slice(0, 18) + "..." : state.text;
  }

  function imgUrl() {
    return state.view === "front" ? "images/uke-front.webp" : "images/uke-back.webp";
  }

  function iconWhatsApp() {
    return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/></svg>';
  }

  function whatsappHref() {
    const message = `Hi Ukulele Malaysia, I want to order ukulele engraving.\n\nText: ${state.text}\nFont: ${font().name}\nView: ${state.view}\nX: ${state.engravingX}\nY: ${state.engravingY}\nAngle: ${state.engravingAngle}\nSize: ${state.engravingSize}px`;
    return `https://wa.me/60183877972?text=${encodeURIComponent(message)}`;
  }

  function render() {
    const f = font();
    mount.innerHTML = `
      <div class="config-preview">
        <div class="preview-view-toggle" role="tablist" aria-label="View">
          <button class="${state.view === "front" ? "on" : ""}" data-view="front">${t("front")}</button>
          <button class="${state.view === "back" ? "on" : ""}" data-view="back">${t("back")}</button>
        </div>
        <svg class="uke-svg" viewBox="0 0 375 963" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="engrave" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="0.4"></feGaussianBlur>
              <feOffset dx="0" dy="0.6" result="offset"></feOffset>
              <feComponentTransfer><feFuncA type="linear" slope="0.45"></feFuncA></feComponentTransfer>
              <feComposite in2="SourceGraphic" operator="in"></feComposite>
            </filter>
          </defs>
          <image href="${imgUrl()}" x="0" y="0" width="375" height="963" preserveAspectRatio="xMidYMid meet"></image>
          <text
            class="engraving-text"
            x="${state.engravingX}"
            y="${state.engravingY}"
            text-anchor="middle"
            dominant-baseline="middle"
            font-family='${f.family.replace(/'/g, "&apos;")}'
            font-weight="${f.weight}"
            font-style="${f.style}"
            font-size="${state.engravingSize}"
            fill="rgba(30,15,5,0.88)"
            style="mix-blend-mode:multiply;letter-spacing:.02em"
            transform="rotate(${state.engravingAngle} ${state.engravingX} ${state.engravingY})"
          >${textShort()}</text>
        </svg>
        <div class="side-name-preview">${state.text}</div>
        <div class="preview-caption">Live preview · ${f.name} · X ${state.engravingX} · Y ${state.engravingY} · ${state.engravingAngle}° · ${state.engravingSize}px</div>
      </div>

      <div class="config-controls">
        <div class="step">
          <div class="step-head">
            <div>
              <div class="step-num">${t("step")}</div>
              <h3 class="step-title">${t("positionAngle")}</h3>
            </div>
            <div class="step-value">${state.engravingAngle}°</div>
          </div>
          <div class="current-selection">
            <div class="cs-label">${t("engraving")}</div>
            <div class="cs-text">${state.text || "-"}</div>
            <div class="cs-meta">${f.name}</div>
          </div>
          <div class="pos-controls">
            ${slider("xPosition", "engravingX", 50, 325, "")}
            ${slider("yPosition", "engravingY", 50, 920, "")}
            ${slider("angle", "engravingAngle", -180, 180, "°")}
            ${slider("size", "engravingSize", 10, 80, "px")}
          </div>
          <div style="margin-top:14px;font-size:13px;color:var(--ink-mute);line-height:1.5">${t("hint")}</div>
        </div>
        <div class="submit-block">
          <div class="submit-note">${t("shareNote")}</div>
          <div class="submit-actions">
            <div class="submit-step">
              <div class="submit-step-label">${t("stepOne")}</div>
              <div class="submit-step-title">${t("sendWhatsapp")}</div>
              <a class="preview-action-btn whatsapp" href="${whatsappHref()}" target="_blank" rel="noopener">${iconWhatsApp()}${t("sendDesign")}</a>
            </div>
            <div class="submit-step">
              <div class="submit-step-label">${t("stepTwo")}</div>
              <div class="submit-step-title">${t("sharePreview")}</div>
              <button class="preview-action-btn" type="button" data-action="share">${shareIcon()}${state.busy === "share" ? t("preparing") : t("shareButton")}</button>
            </div>
          </div>
          <div class="submit-extra">
            <button class="preview-action-btn" type="button" data-action="download">${downloadIcon()}${state.busy === "download" ? t("preparing") : t("download")}</button>
          </div>
        </div>
      </div>
      <a class="sample-card sample-card-standalone" href="ukulele-engraving-sample.html" target="_blank" rel="noopener">
        <span class="sample-card-icon">${imageIcon()}</span>
        <span class="sample-card-copy">
          <span class="sample-card-eyebrow">${t("sampleEyebrow")}</span>
          <strong>${t("sampleTitle")}</strong>
          <span>${t("sampleText")}</span>
        </span>
        <span class="sample-card-action">${t("samples")} <span aria-hidden="true">→</span></span>
      </a>
    `;
    const sidePreview = mount.querySelector(".side-name-preview");
    const selectedText = mount.querySelector(".cs-text");
    [sidePreview, selectedText].forEach((element) => {
      if (!element) return;
      element.style.fontFamily = f.family;
      element.style.fontWeight = String(f.weight);
      element.style.fontStyle = f.style;
    });
    bind();
  }

  function slider(labelKey, key, min, max, unit) {
    const label = key === "engravingAngle" ? `${t(labelKey)} ${rotateIcon()}` : t(labelKey);
    return `
      <label class="pos-row">
        <span class="pos-label"><span class="pos-label-text">${label}</span> <em data-output="${key}" data-unit="${unit}">${state[key]}${unit}</em></span>
        <input type="range" min="${min}" max="${max}" step="1" value="${state[key]}" data-slider="${key}" aria-label="${t(labelKey)} ${state[key]}${unit}">
      </label>
    `;
  }

  function updateLivePreview() {
    const textElement = mount.querySelector(".engraving-text");
    const f = font();
    if (textElement) {
      textElement.setAttribute("x", String(state.engravingX));
      textElement.setAttribute("y", String(state.engravingY));
      textElement.setAttribute("font-size", String(state.engravingSize));
      textElement.setAttribute("transform", `rotate(${state.engravingAngle} ${state.engravingX} ${state.engravingY})`);
      textElement.textContent = textShort();
    }
    mount.querySelectorAll("[data-output]").forEach((output) => {
      const key = output.getAttribute("data-output");
      const unit = output.getAttribute("data-unit") || "";
      if (key && key in state) output.textContent = `${state[key]}${unit}`;
    });
    const stepValue = mount.querySelector(".step-value");
    if (stepValue) stepValue.textContent = `${state.engravingAngle}°`;
    const caption = mount.querySelector(".preview-caption");
    if (caption) {
      caption.textContent = `Live preview · ${f.name} · X ${state.engravingX} · Y ${state.engravingY} · ${state.engravingAngle}° · ${state.engravingSize}px`;
    }
    const whatsapp = mount.querySelector(".preview-action-btn.whatsapp");
    if (whatsapp) whatsapp.setAttribute("href", whatsappHref());
  }

  function bind() {
    mount.querySelectorAll("[data-view]").forEach((button) => {
      button.addEventListener("click", () => {
        state.view = button.dataset.view;
        render();
      });
    });
    mount.querySelectorAll("[data-slider]").forEach((input) => {
      input.addEventListener("input", () => {
        state[input.dataset.slider] = Number(input.value);
        updateLivePreview();
      });
    });
    const share = mount.querySelector('[data-action="share"]');
    const download = mount.querySelector('[data-action="download"]');
    if (share) share.addEventListener("click", shareLivePreview);
    if (download) download.addEventListener("click", downloadLivePreview);
  }

  function loadCanvasImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function drawRotatedText(ctx, text, x, y, angle, options) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle * Math.PI / 180);
    ctx.font = options.font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (options.strokeStyle && options.strokeWidth) {
      ctx.lineWidth = options.strokeWidth;
      ctx.strokeStyle = options.strokeStyle;
      ctx.strokeText(text, 0, 0);
    }
    ctx.fillStyle = options.fillStyle;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  async function createPreviewCanvas() {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const canvas = document.createElement("canvas");
    canvas.width = 750;
    canvas.height = 1926;
    const ctx = canvas.getContext("2d");
    const image = await loadCanvasImage(imgUrl());
    const scale = canvas.width / 375;
    const f = font();
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    drawRotatedText(ctx, textShort(), state.engravingX * scale, state.engravingY * scale, state.engravingAngle, {
      font: `${f.weight} ${state.engravingSize * scale}px ${f.family}`,
      fillStyle: "rgba(30,15,5,.9)",
      strokeStyle: "rgba(255,255,255,.52)",
      strokeWidth: 0.7 * scale
    });
    drawRotatedText(ctx, state.text, 284 * scale, 260 * scale, 90, {
      font: `${f.weight} ${46 * scale}px ${f.family}`,
      fillStyle: "#1f1a14",
      strokeStyle: "rgba(255,255,255,.86)",
      strokeWidth: 1.6 * scale
    });
    return canvas;
  }

  function filename() {
    const safe = (state.text || "ukulele").trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "ukulele";
    return `ukulele-engraving-preview-${safe}.png`;
  }

  async function downloadLivePreview() {
    state.busy = "download";
    render();
    try {
      const canvas = await createPreviewCanvas();
      const link = document.createElement("a");
      link.download = filename();
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert(t("downloadError"));
    } finally {
      state.busy = "";
      render();
    }
  }

  async function shareLivePreview() {
    state.busy = "share";
    render();
    let fallbackBlob = null;
    let fallbackName = filename();
    try {
      const canvas = await createPreviewCanvas();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Preview image could not be created.");
      fallbackBlob = blob;
      const file = new File([blob], fallbackName, { type: "image/png" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ title: "Ukulele engraving preview", text: "Ukulele engraving preview from Ukulele Malaysia", files: [file] });
      } else {
        downloadBlob(fallbackBlob, fallbackName);
      }
    } catch (error) {
      if (error && error.name === "AbortError") return;
      if (fallbackBlob) {
        downloadBlob(fallbackBlob, fallbackName);
      } else {
        alert(t("shareError"));
      }
    } finally {
      state.busy = "";
      render();
    }
  }

  function downloadBlob(blob, name) {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = name;
    link.href = objectUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  function shareIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98"/><path d="M15.41 6.51L8.59 10.49"/></svg>';
  }

  function downloadIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>';
  }

  function imageIcon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
  }

  function rotateIcon() {
    return '<svg class="pos-inline-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v7h-7"/></svg>';
  }

  document.addEventListener("engrave:font-select", (event) => {
    const detail = event.detail || {};
    if (detail.fontId && FONTS.some((item) => item.id === detail.fontId)) state.fontId = detail.fontId;
    if (typeof detail.text === "string") state.text = detail.text || "Ocean Blue";
    render();
  });

  document.addEventListener("engrave:np-input", (event) => {
    state.text = event.detail || "Ocean Blue";
    render();
  });

  new MutationObserver(render).observe(document.body, { attributes: true, attributeFilter: ["data-lang"] });
  render();
})();
