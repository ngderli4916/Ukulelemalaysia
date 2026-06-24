from pathlib import Path
import json, re
root=Path('/Users/derli/Documents/Codex/2026-05-01/github-plugin-github-openai-curated-inspect/Ukulelemalaysia')
json_path=root/'assets/js/wholesale-products.json'
html_path=root/'wholesale-promotion.html'
products=json.loads(json_path.read_text(encoding='utf-8'))
orig_values={
 'UMASUNSS1':213.5,
 'UMA04S':366.8,
 'UMA15SS':499.8,
 'UMA17SCEQ':640.5,
 'UMA20SS':581,
 'UMA20SCP':703.5,
 'UMA20SSP':581,
 'UMA20SCBK':703.5,
 'UMA20SCPBK':703.5,
 'UMA20STBK':738.5,
 'UMA20SCPBL':703.5,
 'UMA20SSPBL':581,
 'UMA20STBL':738.5,
 'UMAPULSEKC':1326.5,
 'UMAPULSESC':1186.5,
}

def money(v):
    return f"RM {float(v):,.2f}".replace('.00','') if float(v).is_integer() else f"RM {float(v):,.2f}"
for p in products:
    sku=p.get('sku','')
    if sku in orig_values:
        p['originalDealPrice']=money(orig_values[sku])
    else:
        p['originalDealPrice']=p.get('price','')
    # current dealerPrice is promotion dealer price
    p['promotionDealPrice']=p.get('dealerPrice','')
    p['dealerPrice']=p.get('promotionDealPrice','')
    p['dealerNote']='Promotion dealer price after wholesale discount'
    # Keep only four description specs requested.
    keep=[]
    for s in p.get('specs',[]):
        label=s.get('label','')
        if label in ('Size','Top','Back & Sides','Bag'):
            if label=='Back & Sides':
                s={'label':'Back and Side','value':s.get('value','')}
            keep.append(s)
    # ensure order Size, Top, Back and Side, Bag
    order={'Size':0,'Top':1,'Back and Side':2,'Bag':3}
    p['specs']=sorted(keep, key=lambda x: order.get(x.get('label',''), 99))
json_path.write_text(json.dumps(products, ensure_ascii=False, indent=2), encoding='utf-8')

html=html_path.read_text(encoding='utf-8')
# Replace embedded products.
start=html.index('const products = ')
end=html.index('const activeProducts = products;')
html=html[:start]+'const products = '+json.dumps(products, ensure_ascii=False, indent=2)+';\n\n'+html[end:]

# Filter order: size 21,23,26; construction Solid Top then Full Solid.
old_filters=re.search(r'<div class="filters" aria-label="Product filters">.*?</div>\s*      <div class="grid"', html, flags=re.S)
if old_filters:
    new_filters='''<div class="filters" aria-label="Product filters">
        <div class="filter-group"><span data-t="filterSize">Size</span><button type="button" class="filter-btn active" data-filter-group="size" data-filter-value="all" data-t="filterAll">All</button><button type="button" class="filter-btn" data-filter-group="size" data-filter-value="21">21寸</button><button type="button" class="filter-btn" data-filter-group="size" data-filter-value="23">23寸</button><button type="button" class="filter-btn" data-filter-group="size" data-filter-value="26">26寸</button></div>
        <div class="filter-group"><span data-t="filterWood">Construction</span><button type="button" class="filter-btn active" data-filter-group="wood" data-filter-value="all" data-t="filterAll">All</button><button type="button" class="filter-btn" data-filter-group="wood" data-filter-value="solid-top">Solid Top</button><button type="button" class="filter-btn" data-filter-group="wood" data-filter-value="full-solid">Full Solid</button></div>
      </div>
      <div class="grid"'''
    html=html[:old_filters.start()]+new_filters+html[old_filters.end():]

# CSS grid/photo/deal box refinements. Append overrides at end of style to avoid fighting minified earlier CSS.
css='''
/* Wholesale refinements */
.grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}.photo{aspect-ratio:1/1}.product h3{font-size:17px;min-height:64px}.product-body{padding:14px;gap:10px}.price{font-size:22px}.dealer-box{display:grid;grid-template-columns:1fr;gap:10px}.deal-line{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding-bottom:8px;border-bottom:1px solid rgba(154,52,18,.14)}.deal-line:last-of-type{border-bottom:0;padding-bottom:0}.deal-title{display:block;color:#8d5c1f;font-size:11px;font-weight:950;text-transform:uppercase;letter-spacing:.06em}.deal-price{display:block;color:#9a3412;font-size:20px;font-weight:950;line-height:1.1;text-align:right}.deal-line.original .deal-price{color:#7a7167;text-decoration:line-through;text-decoration-thickness:2px}.dealer-note{grid-column:1/-1}.specs{grid-template-columns:1fr 1fr}.spec{padding:7px 8px}.spec b{font-size:9px}.spec span{font-size:11px}.qty{width:84px}@media(max-width:900px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:620px){.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.wrap{padding:0 12px}.product h3{font-size:14px;min-height:58px}.product-body{padding:10px;gap:8px}.price{font-size:18px}.dealer-box{padding:9px}.deal-title{font-size:9px}.deal-price{font-size:15px}.note{font-size:12px}.specs{grid-template-columns:1fr}.spec:nth-child(n+3){display:none}.qty{width:68px;padding:8px}.qty-row label{font-size:12px}.sku,.model-chip{font-size:10px}.badge{font-size:10px;padding:6px 8px}.section-head h2{font-size:34px}}
'''
if '/* Wholesale refinements */' not in html:
    html=html.replace('</style>', css+'\n</style>',1)
else:
    html=re.sub(r'/\* Wholesale refinements \*/.*?</style>', css+'\n</style>', html, flags=re.S)

# Product card dealer box: replace single price with original/promotion.
old='''<div class="dealer-box"><span class="dealer-label" data-label="dealerPrice">Dealer Price</span><span class="dealer-price">${escapeHtml(product.dealerPrice || "TBC")}</span><span class="dealer-note">${escapeHtml(product.dealerNote || i18n[currentLang].dealerNote)}</span></div>'''
new='''<div class="dealer-box"><div class="deal-line original"><span class="deal-title" data-label="originalDealPrice">Original Deal Price</span><span class="deal-price">${escapeHtml(product.originalDealPrice || product.price || "TBC")}</span></div><div class="deal-line promotion"><span class="deal-title" data-label="promotionDealPrice">Promotion Deal Price</span><span class="deal-price">${escapeHtml(product.promotionDealPrice || product.dealerPrice || "TBC")}</span></div><span class="dealer-note">${escapeHtml(product.dealerNote || i18n[currentLang].dealerNote)}</span></div>'''
html=html.replace(old,new)

# i18n add labels and update dealer note wording.
html=html.replace('dealerNote:"Temporary dealer price"', 'dealerNote:"Promotion dealer price", originalDealPrice:"Original Deal Price", promotionDealPrice:"Promotion Deal Price"')
html=html.replace('dealerNote:"暂时 dealer price"', 'dealerNote:"促销 dealer price", originalDealPrice:"Original Deal Price", promotionDealPrice:"Promotion Deal Price"')
html=html.replace('dealerNote:"Temporary dealer price"', 'dealerNote:"Promotion dealer price", originalDealPrice:"Original Deal Price", promotionDealPrice:"Promotion Deal Price"')
# Add applyLanguage support for new labels, keep old dealerPrice harmless.
needle="""document.querySelectorAll('[data-label=\"dealerPrice\"]').forEach(el => el.textContent = t('dealerPrice'));
  document.querySelectorAll('[data-label=\"available\"]').forEach(el => el.textContent = t('available'));"""
replacement="""document.querySelectorAll('[data-label=\"dealerPrice\"]').forEach(el => el.textContent = t('dealerPrice'));
  document.querySelectorAll('[data-label=\"originalDealPrice\"]').forEach(el => el.textContent = t('originalDealPrice'));
  document.querySelectorAll('[data-label=\"promotionDealPrice\"]').forEach(el => el.textContent = t('promotionDealPrice'));
  document.querySelectorAll('[data-label=\"available\"]').forEach(el => el.textContent = t('available'));"""
html=html.replace(needle,replacement)
# WhatsApp should use Promotion Deal Price.
html=html.replace('lines.push(`Dealer Price: ${product.dealerPrice || "TBC"}`);', 'lines.push(`Promotion Deal Price: ${product.promotionDealPrice || product.dealerPrice || "TBC"}`);')
html_path.write_text(html, encoding='utf-8')
print(json.dumps({'products':len(products),'first':products[0]['sku'],'original':products[0].get('originalDealPrice'),'promotion':products[0].get('promotionDealPrice'),'specs':products[0].get('specs')}, indent=2, ensure_ascii=False))
