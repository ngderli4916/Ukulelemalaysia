from pathlib import Path
import json, re
root=Path('/Users/derli/Documents/Codex/2026-05-01/github-plugin-github-openai-curated-inspect/Ukulelemalaysia')
html_path=root/'wholesale-promotion.html'
json_path=root/'assets/js/wholesale-products.json'
products=json.loads(json_path.read_text(encoding='utf-8'))
for p in products:
    p['discount']='Wholesale 45% - 55%'
    # stock sheet dealer price is temporary; user wants WhatsApp short. Keep displayed as Dealer Price.
    # Add filter metadata.
    size=''
    construction=''
    specs=[]
    for s in p.get('specs',[]):
        label=s.get('label','')
        val=s.get('value','')
        if label=='Size': size=val
        if label=='Construction': construction=val
        if label in ('Body','Finish'):
            continue
        specs.append(s)
    p['specs']=specs
    if '23' in size: p['sizeFilter']='23'
    elif '21' in size: p['sizeFilter']='21'
    elif '26' in size: p['sizeFilter']='26'
    else: p['sizeFilter']='other'
    if 'full solid' in construction.lower() or 'full solid' in p.get('name','').lower():
        p['woodFilter']='full-solid'
    elif 'solid' in ' '.join([p.get('name',''), p.get('note',''), ' '.join(x.get('value','') for x in specs)]).lower():
        p['woodFilter']='solid-top'
    else:
        p['woodFilter']='other'
    if p.get('model')=='UK-17SC E':
        p['name']='Uma Ukulele 23" Concert Full Solid Mahogany EQ UK-17SC'
        p['note']='All-solid mahogany Concert with EQ pickup — warm tone and comfortable 23" size.'
        # ensure specs has EQ
        if not any(x.get('label')=='Pickup' for x in p['specs']):
            p['specs'].append({'label':'Pickup','value':'EQ'})
    if p.get('model')=='UK-20SC BK':
        p['image']='assets/images/wholesale/uma-uk-20sc-bk.jpg'
        p['imageMissing']=False
json_path.write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding='utf-8')

html=html_path.read_text(encoding='utf-8')
# global text changes
html=html.replace('Wholesale Promotion Discount 5% - 15%', 'Wholesale Promotion Discount 45% - 55%')
html=html.replace('Wholesale Promotion Discount 5% - 15%. No minimum purchase quantity. First come, first served.', 'Wholesale Promotion Discount 45% - 55%. No minimum purchase quantity. First come, first served.')
html=html.replace('Wholesale Promotion Discount 5% - 15%. Submit selected quantities by WhatsApp.', 'Wholesale Promotion Discount 45% - 55%. Submit selected quantities by WhatsApp.')
html=html.replace('5% - 15%', '45% - 55%')
# nav language buttons
html=html.replace('<a class="nav-cta" href="https://wa.me/60183877972" target="_blank" rel="noopener">WhatsApp Us</a>', '<div class="nav-actions"><div class="lang-switch" aria-label="Language"><button type="button" data-lang="en" class="lang-btn active">EN</button><button type="button" data-lang="zh" class="lang-btn">中文</button><button type="button" data-lang="ms" class="lang-btn">BM</button></div><a class="nav-cta" href="https://wa.me/60183877972" target="_blank" rel="noopener" data-t="whatsappUs">WhatsApp Us</a></div>')
# replace static body chunk labels carefully
repls={
'Select the quantity you need, then click Submit. Your selected items will be sent to our WhatsApp team for confirmation.':'<span data-t="heroCopy">Select the quantity you need, then click Submit. Your selected items will be sent to our WhatsApp team for confirmation.</span>',
'Promotion Period':'<span data-t="periodLabel">Promotion Period</span>',
'From now until end of July':'<span data-t="periodValue">From now until end of July</span>',
'Discount':'<span data-t="discountLabel">Discount</span>',
'Rules':'<span data-t="rulesLabel">Rules</span>',
'No minimum purchase quantity. First come, first served.':'<span data-t="rulesValue">No minimum purchase quantity. First come, first served.</span>',
'Big stock clearance':'<span data-t="clearance">Big stock clearance</span>',
'Because the discount is very strong, items are available only while stocks last. Sold out means no restock for this promotion.':'<span data-t="soldoutCopy">Because the discount is very strong, items are available only while stocks last. Sold out means no restock for this promotion.</span>',
'Choose quantity directly on this page':'<span data-t="bulletQty">Choose quantity directly on this page</span>',
'Submit by WhatsApp for fast confirmation':'<span data-t="bulletWa">Submit by WhatsApp for fast confirmation</span>',
'Stock is reserved only after our team confirms':'<span data-t="bulletConfirm">Stock is reserved only after our team confirms</span>',
'Available Items':'<span data-t="availableItems">Available Items</span>',
'Choose your quantity':'<span data-t="chooseQty">Choose your quantity</span>',
'Photos, selling price, temporary dealer price and available quantities are shown below. Final stock and final dealer price will be confirmed by our team after WhatsApp submission.':'<span data-t="sectionCopy">Photos, selling price, temporary dealer price and available quantities are shown below. Final stock and final dealer price will be confirmed by our team after WhatsApp submission.</span>',
'Search product / SKU':'Search product / SKU',
'No item selected':'No item selected',
'Enter quantity for the items you want.':'Enter quantity for the items you want.',
'Submit via WhatsApp':'Submit via WhatsApp'
}
for a,b in repls.items(): html=html.replace(a,b)
html=html.replace('placeholder="Search product / SKU"','placeholder="Search product / SKU" data-placeholder="searchPlaceholder"')
html=html.replace('<strong id="summaryTitle">No item selected</strong><span id="summaryDesc">Enter quantity for the items you want.</span>', '<strong id="summaryTitle">No item selected</strong><span id="summaryDesc">Enter quantity for the items you want.</span>')
html=html.replace('<button class="submit" id="submitBtn" type="button" disabled>Submit via WhatsApp</button>', '<button class="submit" id="submitBtn" type="button" disabled data-t="submitBtn">Submit via WhatsApp</button>')
# toolbar filters insert
old='''      <div class="toolbar">\n        <input class="search" id="search" type="search" placeholder="Search product / SKU" data-placeholder="searchPlaceholder" aria-label="Search product" />\n        <span class="summary-pill" id="itemCount">0 items selected</span>\n      </div>'''
new='''      <div class="toolbar">\n        <input class="search" id="search" type="search" placeholder="Search product / SKU" data-placeholder="searchPlaceholder" aria-label="Search product" />\n        <span class="summary-pill" id="itemCount">0 items selected</span>\n      </div>\n      <div class="filters" aria-label="Product filters">\n        <div class="filter-group"><span data-t="filterSize">Size</span><button type="button" class="filter-btn active" data-filter-group="size" data-filter-value="all" data-t="filterAll">All</button><button type="button" class="filter-btn" data-filter-group="size" data-filter-value="23">23寸</button><button type="button" class="filter-btn" data-filter-group="size" data-filter-value="21">21寸</button><button type="button" class="filter-btn" data-filter-group="size" data-filter-value="26">26寸</button></div>\n        <div class="filter-group"><span data-t="filterWood">Construction</span><button type="button" class="filter-btn active" data-filter-group="wood" data-filter-value="all" data-t="filterAll">All</button><button type="button" class="filter-btn" data-filter-group="wood" data-filter-value="full-solid">Full Solid</button><button type="button" class="filter-btn" data-filter-group="wood" data-filter-value="solid-top">Solid Top</button></div>\n      </div>'''
if old in html: html=html.replace(old,new)
# CSS additions
css='''.nav-actions{display:inline-flex;align-items:center;gap:10px}.lang-switch{display:inline-flex;gap:5px;padding:4px;border:1px solid var(--line);border-radius:999px;background:#fff}.lang-btn{border:0;border-radius:999px;background:transparent;color:var(--soft);padding:7px 10px;font:inherit;font-size:12px;font-weight:900;cursor:pointer}.lang-btn.active{background:var(--ink);color:#fff}.filters{display:grid;gap:10px;margin:-8px 0 20px}.filter-group{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.filter-group>span{font-size:12px;font-weight:950;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;min-width:92px}.filter-btn{border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--soft);padding:8px 13px;font:inherit;font-size:13px;font-weight:850;cursor:pointer}.filter-btn.active{background:#1f7a4a;color:#fff;border-color:#1f7a4a}.hidden-by-filter{display:none!important}@media(max-width:620px){.nav-actions{gap:6px}.lang-btn{padding:6px 8px}.filter-group>span{width:100%;min-width:0}}'''
if '.lang-switch{display:inline-flex' not in html:
    html=html.replace('</style>', css+'\n</style>',1)
# update const products block from json
start=html.index('const products = ')
end=html.index('const activeProducts = products;')
products_js=json.dumps(products, ensure_ascii=False, indent=2)
html=html[:start]+f'const products = {products_js};\n\n'+html[end:]
# update product card: data attrs, labels, WhatsApp shorter, filter logic, i18n
html=html.replace('data-name="${escapeHtml(product.name).toLowerCase()} ${escapeHtml(product.model || \'\').toLowerCase()}" data-sku="${escapeHtml(product.sku || product.id).toLowerCase()}"', 'data-size="${escapeHtml(product.sizeFilter || \'other\')}" data-wood="${escapeHtml(product.woodFilter || \'other\')}" data-name="${escapeHtml(product.name).toLowerCase()} ${escapeHtml(product.model || \'\').toLowerCase()}" data-sku="${escapeHtml(product.sku || product.id).toLowerCase()}"')
html=html.replace('<span class="selling">Selling Price</span>', '<span class="selling" data-label="sellingPrice">Selling Price</span>')
html=html.replace('<span>Available</span>', '<span data-label="available">Available</span>')
html=html.replace('<span class="dealer-label">Dealer Price</span>', '<span class="dealer-label" data-label="dealerPrice">Dealer Price</span>')
html=html.replace('Temporary dealer price based on SLC / current price sheet', 'Temporary dealer price')
html=html.replace('product.dealerNote || "Temporary price, final confirmation by WhatsApp"', 'product.dealerNote || i18n[currentLang].dealerNote')
html=html.replace('Quantity</label>', '<span data-label="quantity">Quantity</span></label>')
# replace sendWhatsApp function block
send_start=html.index('function sendWhatsApp(){')
send_end=html.index('function filterProducts(){')
new_send='''function sendWhatsApp(){\n  const selected = selectedLines();\n  if (!selected.length) return;\n  const lines = [\n    "Wholesale Promotion Order"\n  ];\n  selected.forEach(({product, qty}, index) => {\n    lines.push("");\n    lines.push(`${index + 1}. SKU: ${product.sku || product.id}`);\n    lines.push(`Dealer Price: ${product.dealerPrice || "TBC"}`);\n    lines.push(`Qty: ${qty}`);\n  });\n  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\\n"))}`;\n  window.open(url, "_blank", "noopener");\n}\n'''
html=html[:send_start]+new_send+html[send_end:]
# replace filterProducts function through event bindings
fp_start=html.index('function filterProducts(){')
render_call=html.index('render();')
new_logic=r'''const filters = { size: "all", wood: "all" };
let currentLang = "en";
const i18n = {
  en: { whatsappUs:"WhatsApp Us", heroCopy:"Select the quantity you need, then click Submit. Your selected items will be sent to our WhatsApp team for confirmation.", periodLabel:"Promotion Period", periodValue:"From now until end of July", discountLabel:"Discount", rulesLabel:"Rules", rulesValue:"No minimum purchase quantity. First come, first served.", clearance:"Big stock clearance", soldoutCopy:"Because the discount is very strong, items are available only while stocks last. Sold out means no restock for this promotion.", bulletQty:"Choose quantity directly on this page", bulletWa:"Submit by WhatsApp for fast confirmation", bulletConfirm:"Stock is reserved only after our team confirms", availableItems:"Available Items", chooseQty:"Choose your quantity", sectionCopy:"Photos, selling price, temporary dealer price and available quantities are shown below. Final stock and final dealer price will be confirmed by our team after WhatsApp submission.", searchPlaceholder:"Search product / SKU", filterSize:"Size", filterWood:"Construction", filterAll:"All", submitBtn:"Submit via WhatsApp", noItem:"No item selected", enterQty:"Enter quantity for the items you want.", totalQty:"Total quantity", selectedProducts:"products selected", submitConfirm:"Submit to WhatsApp for confirmation.", itemsSelected:"items selected", sellingPrice:"Selling Price", dealerPrice:"Dealer Price", available:"Available", quantity:"Quantity", dealerNote:"Temporary dealer price" },
  zh: { whatsappUs:"WhatsApp 联系", heroCopy:"选择你要的数量，然后点击 Submit。系统会把你选择的产品发送到我们的 WhatsApp 确认。", periodLabel:"活动日期", periodValue:"即日起至 7 月底", discountLabel:"折扣", rulesLabel:"规则", rulesValue:"不限制购买数量，先到先得。", clearance:"大清仓折扣", soldoutCopy:"这次折扣力度很大，数量有限，卖完就没有了。", bulletQty:"直接在页面选择数量", bulletWa:"通过 WhatsApp 快速确认", bulletConfirm:"库存以我们团队确认为准", availableItems:"促销产品", chooseQty:"选择数量", sectionCopy:"以下显示照片、selling price、暂时 dealer price 和可用数量。最终库存和最终 dealer price 会通过 WhatsApp 确认。", searchPlaceholder:"搜索产品 / SKU", filterSize:"尺寸", filterWood:"木材结构", filterAll:"全部", submitBtn:"通过 WhatsApp 提交", noItem:"还没有选择产品", enterQty:"输入你要的产品数量。", totalQty:"总数量", selectedProducts:"个产品已选择", submitConfirm:"提交到 WhatsApp 确认。", itemsSelected:"把已选择", sellingPrice:"Selling Price", dealerPrice:"Dealer Price", available:"可用数量", quantity:"数量", dealerNote:"暂时 dealer price" },
  ms: { whatsappUs:"WhatsApp Kami", heroCopy:"Pilih kuantiti yang anda mahu, kemudian klik Submit. Item pilihan anda akan dihantar ke WhatsApp kami untuk pengesahan.", periodLabel:"Tempoh Promosi", periodValue:"Mulai sekarang hingga akhir Julai", discountLabel:"Diskaun", rulesLabel:"Syarat", rulesValue:"Tiada had kuantiti pembelian. Siapa cepat dia dapat.", clearance:"Clearance stok besar", soldoutCopy:"Diskaun sangat kuat, stok terhad. Bila habis, promosi ini tiada restock.", bulletQty:"Pilih kuantiti terus di halaman ini", bulletWa:"Submit melalui WhatsApp untuk pengesahan pantas", bulletConfirm:"Stok hanya reserved selepas team kami sahkan", availableItems:"Item Promosi", chooseQty:"Pilih kuantiti", sectionCopy:"Gambar, selling price, dealer price sementara dan kuantiti tersedia ditunjukkan di bawah. Stok akhir dan dealer price akhir akan disahkan melalui WhatsApp.", searchPlaceholder:"Cari produk / SKU", filterSize:"Saiz", filterWood:"Construction", filterAll:"Semua", submitBtn:"Submit melalui WhatsApp", noItem:"Belum pilih item", enterQty:"Masukkan kuantiti item yang anda mahu.", totalQty:"Jumlah kuantiti", selectedProducts:"produk dipilih", submitConfirm:"Submit ke WhatsApp untuk pengesahan.", itemsSelected:"items selected", sellingPrice:"Selling Price", dealerPrice:"Dealer Price", available:"Available", quantity:"Quantity", dealerNote:"Temporary dealer price" }
};
function t(key){ return (i18n[currentLang] && i18n[currentLang][key]) || i18n.en[key] || key; }
function applyLanguage(lang){
  currentLang = i18n[lang] ? lang : "en";
  document.documentElement.lang = currentLang === "zh" ? "zh-CN" : currentLang === "ms" ? "ms-MY" : "en";
  document.body.dataset.lang = currentLang;
  document.querySelectorAll('[data-t]').forEach(el => { const key = el.dataset.t; if (t(key)) el.textContent = t(key); });
  document.querySelectorAll('[data-placeholder]').forEach(el => { el.placeholder = t(el.dataset.placeholder); });
  document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.lang === currentLang));
  document.querySelectorAll('[data-label="sellingPrice"]').forEach(el => el.textContent = t('sellingPrice'));
  document.querySelectorAll('[data-label="dealerPrice"]').forEach(el => el.textContent = t('dealerPrice'));
  document.querySelectorAll('[data-label="available"]').forEach(el => el.textContent = t('available'));
  document.querySelectorAll('[data-label="quantity"]').forEach(el => el.textContent = t('quantity'));
  document.querySelectorAll('.dealer-note').forEach(el => el.textContent = t('dealerNote'));
  updateSummary();
}
function filterProducts(){
  const q = search.value.trim().toLowerCase();
  document.querySelectorAll(".product").forEach(card => {
    const textHit = !q || card.dataset.name.includes(q) || card.dataset.sku.includes(q);
    const sizeHit = filters.size === "all" || card.dataset.size === filters.size;
    const woodHit = filters.wood === "all" || card.dataset.wood === filters.wood;
    card.classList.toggle('hidden-by-filter', !(textHit && sizeHit && woodHit));
  });
}
search.addEventListener("input", filterProducts);
submitBtn.addEventListener("click", sendWhatsApp);
document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', () => {
  const group = btn.dataset.filterGroup;
  filters[group] = btn.dataset.filterValue;
  document.querySelectorAll(`.filter-btn[data-filter-group="${group}"]`).forEach(b => b.classList.toggle('active', b === btn));
  filterProducts();
}));
document.querySelectorAll('.lang-btn').forEach(btn => btn.addEventListener('click', () => applyLanguage(btn.dataset.lang)));
'''
html=html[:fp_start]+new_logic+html[render_call:]
# update updateSummary static phrases
html=html.replace('summaryDesc.textContent = activeProducts.length ? "Enter quantity for the items you want." : "Product list has not been uploaded yet.";', 'summaryDesc.textContent = activeProducts.length ? t("enterQty") : "Product list has not been uploaded yet.";')
html=html.replace('summaryTitle.textContent = "No item selected";', 'summaryTitle.textContent = t("noItem");')
html=html.replace('summaryTitle.textContent = `${selected.length} product${selected.length === 1 ? "" : "s"} selected`;', 'summaryTitle.textContent = `${selected.length} ${t("selectedProducts")}`;')
html=html.replace('summaryDesc.textContent = `Total quantity: ${totalQty}. Submit to WhatsApp for confirmation.`;', 'summaryDesc.textContent = `${t("totalQty")}: ${totalQty}. ${t("submitConfirm")}`;')
html=html.replace('itemCount.textContent = `${totalQty} item${totalQty === 1 ? "" : "s"} selected`;', 'itemCount.textContent = `${totalQty} ${t("itemsSelected")}`;')
html=html.replace('render();','render();\napplyLanguage("en");',1)
html_path.write_text(html, encoding='utf-8')
print('updated products/page', len(products))
