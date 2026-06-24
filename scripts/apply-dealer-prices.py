from pathlib import Path
import csv, json, re, shutil, subprocess
root=Path('/Users/derli/Documents/Codex/2026-05-01/github-plugin-github-openai-curated-inspect/Ukulelemalaysia')
src=Path('/Users/derli/Library/CloudStorage/Dropbox/UKUNILI SDN BHD/UKUNILI B OperationsHub/2330 New Version/uma new arrive')
json_path=root/'assets/js/wholesale-products.json'
html_path=root/'wholesale-promotion.html'
price_path=root/'data-wholesale-dealer-prices.tsv'
img_dir=root/'assets/images/wholesale'
products=json.loads(json_path.read_text(encoding='utf-8'))

def key(s):
    return re.sub(r'[^A-Z0-9]+','',str(s).upper().replace('UMA',''))

def slug(s):
    return re.sub(r'[^a-z0-9]+','-',str(s).lower()).strip('-')

rows={}
with price_path.open(encoding='utf-8') as f:
    for row in csv.DictReader(f, delimiter='\t'):
        rows[key(row['SKU'])]=row

# model->canonical SKU key mappings
model_map={
    'UK-SUN SS1':'UMA-SUNSS1','UK-SUN-SS1':'UMA-SUNSS1','UK-04S':'UMA-04S','UK-15SS':'UMA-15SS','UK-17SC E':'UMA-17SC-EQ',
    'UK-20SS NA':'UMA-20SS','UK-20SCP NA':'UMA-20SCP','UK-20SSP NA':'UMA-20SSP','UK-20SC BK':'UMA-20SC-BK',
    'UK-20SCP BK':'UMA-20SCP-BK','UK-20SCP BL':'UMA-20SCP-BL','UK-20SSP BL':'UMA-20SSP-BL','UK-20ST BL':'UMA-20ST-BL',
    'PULSE KC':'UMA-PULSEKC','PULSE SC':'UMA-PULSESC','UK-20ST BK':'UMA-20ST-BK'
}

available_map={
    'UMA-SUNSS1':4,'UMA-04S':1,'UMA-15SS':4,'UMA-17SC-EQ':14,'UMA-20SS':5,'UMA-20SCP':12,'UMA-20SSP':6,
    'UMA-20SC-BK':6,'UMA-20SCP-BK':9,'UMA-20ST-BK':2,'UMA-20SCP-BL':2,'UMA-20SSP-BL':3,'UMA-20ST-BL':3,
    'UMA-PULSEKC':4,'UMA-PULSESC':6
}

def update_product(p, row, canonical_sku):
    size=row['Size']
    top=row['Top']
    back=row['BackSides']
    eq=row['EQ']
    if canonical_sku=='UMA-17SC-EQ':
        eq='EQ'
    p['sku']=canonical_sku.replace('-','')
    p['available']=available_map.get(canonical_sku, p.get('available', 0))
    # Preserve display model without UMA prefix, except EQ.
    display=canonical_sku.replace('UMA-','')
    p['model']=display
    p['price']=f"RM {float(row['SellingPrice']):,.0f}"
    p['dealerPrice']=f"RM {float(row['DealerPrice']):,.2f}"
    p['dealerNote']='Dealer price after wholesale discount'
    p['discount']=f"Wholesale {row['DiscountPercent']}% OFF"
    p['discountPercent']=int(float(row['DiscountPercent']))
    p['sizeFilter']=size
    joined=(top+' '+back).lower()
    p['woodFilter']='full-solid' if ('solid' in joined and top.lower().startswith('solid') and back.lower().startswith('solid')) else ('solid-top' if top.lower().startswith('solid') else 'other')
    # update name rough but clean
    inches=f'{size}\"'
    type_name='Soprano' if size=='21' else ('Concert' if size=='23' else 'Tenor')
    color=''
    if canonical_sku.endswith('-BK'): color=' Black'
    if canonical_sku.endswith('-BL'): color=' Blue'
    if canonical_sku.endswith('EQ'): color=' EQ'
    wood_name=top
    shape=' Pineapple' if 'SCP' in canonical_sku or 'SSP' in canonical_sku else ''
    if 'PULSE' in canonical_sku:
        p['name']=f'Uma Ukulele {inches} {type_name} {top} UMA-{display}'
    elif canonical_sku=='UMA-SUNSS1':
        p['name']='Uma Ukulele 21" Soprano Spruce Top Sapele UK-SUN-SS1'
    elif canonical_sku=='UMA-04S':
        p['name']='Uma Ukulele 21" Soprano Acacia Koa UK-04S'
    else:
        p['name']=f'Uma Ukulele {inches} {type_name} {wood_name}{shape}{color} UK-{display}'
    if canonical_sku=='UMA-17SC-EQ':
        p['name']='Uma Ukulele 23" Concert Solid Mahogany EQ UK-17SC'
        p['note']='Solid mahogany Concert with EQ pickup — warm tone and comfortable 23" size.'
    else:
        p['note']=f'{top} top, {back} back & sides. Includes {row["Bag"]}, {row["String"]}. {eq}.'
    p['specs']=[
        {'label':'Size','value':f'{size}" {type_name}'},
        {'label':'Top','value':top},
        {'label':'Back & Sides','value':back},
        {'label':'Bag','value':row['Bag']},
        {'label':'Strings','value':row['String']},
        {'label':'EQ','value':eq},
    ]
    return p

by_key={}
for p in products:
    canonical=model_map.get(p.get('model'), p.get('sku',''))
    by_key[key(canonical)]=p

# Known images available
image_map={
    'UMA-SUNSS1':'uma-uk-sun-ss1.png','UMA-04S':'uma-uk-04s.png','UMA-15SS':'uma-uk-15ss.png','UMA-17SC-EQ':'uma-uk-17sc-e.png',
    'UMA-20SS':'uma-uk-20ss-na.png','UMA-20SCP':'uma-uk-20scp-na.png','UMA-20SSP':'uma-uk-20ssp-na.png','UMA-20SC-BK':'uma-uk-20sc-bk.jpg',
    'UMA-20SCP-BK':'uma-uk-20scp-bk.png','UMA-20SCP-BL':'uma-uk-20scp-bl.png','UMA-20SSP-BL':'uma-uk-20ssp-bl.png','UMA-20ST-BL':'uma-uk-20st-bl.png',
    'UMA-PULSEKC':'uma-pulse-kc.png'
}
# Add missing image if source exists for 20ST BK or PULSESC (none known yet). Use pending placeholder.
new_products=[]
for canonical, row in rows.items():
    # canonical is stripped, find original SKU in row
    sku=row['SKU']
    p=by_key.get(key(sku))
    if not p:
        p={'id':slug(sku.replace('UMA-','')), 'available':0}
    p=update_product(p,row,sku)
    if sku in image_map:
        p['image']='assets/images/wholesale/'+image_map[sku]
        p['imageMissing']=not (root/p['image']).exists()
    else:
        p['image']=''
        p['imageMissing']=True
    new_products.append(p)

json_path.write_text(json.dumps(new_products, ensure_ascii=False, indent=2), encoding='utf-8')
html=html_path.read_text(encoding='utf-8')
start=html.index('const products = ')
end=html.index('const activeProducts = products;')
html=html[:start]+'const products = '+json.dumps(new_products, ensure_ascii=False, indent=2)+';\n\n'+html[end:]
# fix WhatsApp wording from Dealer Price only; keep short.
# ensure no old 45-55 generic is replacing individual product badges? Hero stays 45-55.
html_path.write_text(html, encoding='utf-8')
print(json.dumps({'updated':len(new_products),'missing_images':[p['model'] for p in new_products if p.get('imageMissing')]}, indent=2))
