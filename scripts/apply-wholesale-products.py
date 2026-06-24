from pathlib import Path
import json, re
p=Path('/Users/derli/Documents/Codex/2026-05-01/github-plugin-github-openai-curated-inspect/Ukulelemalaysia/wholesale-promotion.html')
products_path=Path('/Users/derli/Documents/Codex/2026-05-01/github-plugin-github-openai-curated-inspect/Ukulelemalaysia/assets/js/wholesale-products.json')
html=p.read_text(encoding='utf-8')
products=json.loads(products_path.read_text(encoding='utf-8'))
# CSS additions
css='''
.price-stack{display:grid;gap:6px}.selling{font-size:13px;color:var(--muted);font-weight:800;text-transform:uppercase;letter-spacing:.06em}.dealer-box{margin-top:2px;padding:12px;border-radius:14px;background:#fff7ed;border:1px solid #f0d4b8}.dealer-label{display:block;color:#8d5c1f;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.07em}.dealer-price{display:block;color:#9a3412;font-size:24px;font-weight:950;line-height:1.1}.dealer-note{display:block;margin-top:4px;color:#8d6b4a;font-size:11px;font-weight:700}.specs{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:2px 0 4px}.spec{padding:8px 9px;border-radius:10px;background:#f8f5ef;border:1px solid #eee2d0}.spec b{display:block;color:#7a7167;font-size:10px;text-transform:uppercase;letter-spacing:.07em}.spec span{display:block;margin-top:2px;color:#1d1712;font-size:12px;font-weight:750}.photo-missing{height:100%;display:flex;align-items:center;justify-content:center;text-align:center;padding:22px;background:linear-gradient(135deg,#f5eee4,#fffaf3);color:#8d5c1f;font-weight:900}.model-chip{display:inline-flex;width:max-content;border:1px solid var(--line);border-radius:999px;padding:4px 8px;color:#534b42;background:#fff;font-size:12px;font-weight:850}.product[data-missing="true"]{border-style:dashed}.source-note{margin-top:12px;color:var(--muted);font-size:12px}.product h3{min-height:50px}.price-row{align-items:flex-start}.stock{white-space:nowrap}.stock strong{display:block;color:var(--ink);font-size:18px;line-height:1}.stock span{display:block;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.07em}@media(max-width:620px){.specs{grid-template-columns:1fr}.product h3{min-height:auto}}
'''
if '.price-stack{display:grid;gap:6px}' not in html:
    html=html.replace('</style>', css+'\n</style>', 1)
# Update section copy to mention dealer price temp
html=html.replace('Photos, promotion prices and available quantities are shown below. Final stock will be confirmed by our team after WhatsApp submission.', 'Photos, selling price, temporary dealer price and available quantities are shown below. Final stock and final dealer price will be confirmed by our team after WhatsApp submission.')
html=html.replace('<strong>Important:</strong> This promotion does not limit purchase quantity and is first come, first served. Discounted items may sell out at any time. Submitting this form sends your request to WhatsApp; it is not an automatic stock reservation until our team confirms.', '<strong>Important:</strong> This promotion does not limit purchase quantity and is first come, first served. Discounted items may sell out at any time. Dealer price shown now is temporary based on SLC / current price sheet and will be updated again. Submitting this form sends your request to WhatsApp; it is not an automatic stock reservation until our team confirms.')
# Replace products block with real products (idempotent)
end=html.index('const state = new Map();')
marker='const products = '
start=html.rfind(marker, 0, end)
if start == -1:
    start=html.index('/*\n  Add real wholesale products here')
products_js=json.dumps(products, ensure_ascii=False, indent=2)
new_block=f'''const products = {products_js};\n\nconst activeProducts = products;\n'''
html=html[:start]+new_block+html[end:]
# Replace productCard function body area
old=re.search(r'function productCard\(product\)\{.*?\n\}', html, flags=re.S).group(0)
new=r'''function productCard(product){
  const max = Number(product.available || 0);
  const imgHtml = product.imageMissing || !product.image
    ? `<div class="photo-missing">Photo pending<br>${escapeHtml(product.model || product.sku || product.id)}</div>`
    : `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" />`;
  const specs = Array.isArray(product.specs) ? product.specs.slice(0, 6) : [];
  const specsHtml = specs.length ? `<div class="specs">${specs.map(spec => `<div class="spec"><b>${escapeHtml(spec.label)}</b><span>${escapeHtml(spec.value)}</span></div>`).join("")}</div>` : "";
  return `<article class="product" data-missing="${product.imageMissing ? "true" : "false"}" data-name="${escapeHtml(product.name).toLowerCase()} ${escapeHtml(product.model || '').toLowerCase()}" data-sku="${escapeHtml(product.sku || product.id).toLowerCase()}">
    <div class="photo">${imgHtml}<span class="badge">${escapeHtml(product.discount || "Promotion")}</span></div>
    <div class="product-body">
      <div class="sku">${escapeHtml(product.sku || product.id)}</div>
      <span class="model-chip">${escapeHtml(product.model || product.sku || product.id)}</span>
      <h3>${escapeHtml(product.name)}</h3>
      <div class="price-row">
        <div class="price-stack"><span class="selling">Selling Price</span><div class="price">${escapeHtml(product.price)}</div></div>
        <div class="stock"><strong>${max}</strong><span>Available</span></div>
      </div>
      <div class="dealer-box"><span class="dealer-label">Dealer Price</span><span class="dealer-price">${escapeHtml(product.dealerPrice || "TBC")}</span><span class="dealer-note">${escapeHtml(product.dealerNote || "Temporary price, final confirmation by WhatsApp")}</span></div>
      ${product.note ? `<p class="note">${escapeHtml(product.note)}</p>` : ""}
      ${specsHtml}
      <div class="qty-row"><label for="qty-${escapeHtml(product.id)}">Quantity</label><input class="qty" id="qty-${escapeHtml(product.id)}" data-id="${escapeHtml(product.id)}" type="number" min="0" max="${max}" step="1" value="0" inputmode="numeric" ${max <= 0 ? "disabled" : ""} /></div>
    </div>
  </article>`;
}'''
html=html.replace(old,new)
# Enhance WhatsApp lines
html=html.replace('    lines.push(`   SKU: ${product.sku || product.id}`);\n    lines.push(`   Price: ${product.price}`);\n    lines.push(`   Qty: ${qty}`);', '    lines.push(`   Model: ${product.model || "-"}`);\n    lines.push(`   SKU: ${product.sku || product.id}`);\n    lines.push(`   Selling Price: ${product.price}`);\n    lines.push(`   Dealer Price: ${product.dealerPrice || "TBC"} (temporary)`);\n    lines.push(`   Qty: ${qty}`);')
html=html.replace('  lines.push("Promotion: Wholesale Promotion Discount 5% - 15%");', '  lines.push("Promotion: Wholesale Promotion Discount 5% - 15%");\n  lines.push("Note: Dealer price shown is temporary; please confirm final dealer price.");')
html=re.sub(r'(  lines\.push\("Note: Dealer price shown is temporary; please confirm final dealer price\."\);\n)+', '  lines.push("Note: Dealer price shown is temporary; please confirm final dealer price.");\n', html)
p.write_text(html, encoding='utf-8')
print(f'updated {p} with {len(products)} products')
