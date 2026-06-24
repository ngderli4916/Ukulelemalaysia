from pathlib import Path
import json, re, shutil, os, subprocess, openpyxl

src=Path('/Users/derli/Library/CloudStorage/Dropbox/UKUNILI SDN BHD/UKUNILI B OperationsHub/2330 New Version/uma new arrive')
dst=Path('/Users/derli/Documents/Codex/2026-05-01/github-plugin-github-openai-curated-inspect/Ukulelemalaysia')
img_dst=dst/'assets/images/wholesale'
img_dst.mkdir(parents=True, exist_ok=True)

def norm(s):
    s=str(s or '').upper().replace('UMA-','').replace('UMA ','').strip()
    s=re.sub(r'[^A-Z0-9]+',' ',s).strip()
    return s

def slug(s):
    return re.sub(r'[^a-z0-9]+','-',str(s).lower()).strip('-')

price_wb=openpyxl.load_workbook(src/'UMA Price Update 2025.xlsx', data_only=True)
ws=price_wb['UMA Price Update']
prices={}
for r in range(2, ws.max_row+1):
    model=ws.cell(r,2).value
    if not model or str(model).upper()=='TOTAL' or not ws.cell(r,6).value:
        continue
    prices[norm(model)]={
        'priceModel': str(model),
        'available': int(ws.cell(r,3).value or 0),
        'dealerUsd': float(ws.cell(r,4).value or 0),
        'dealerRm': float(ws.cell(r,5).value or 0),
        'selling': float(ws.cell(r,6).value or 0),
    }

wb=openpyxl.load_workbook(src/'Uma_New_Products.xlsx', data_only=True)
new_ws=wb['New Products']
desc_ws=wb['Descriptions']
ex_ws=wb['Existing in Shopify']
products_by_norm={}
for r in range(4, new_ws.max_row+1):
    model=new_ws.cell(r,2).value
    if not model:
        continue
    products_by_norm[norm(model)]={
        'model': str(model).strip(),
        'sku': str(new_ws.cell(r,3).value or '').strip(),
        'name': str(new_ws.cell(r,4).value or '').strip(),
        'size': str(new_ws.cell(r,5).value or '').strip(),
        'shape': str(new_ws.cell(r,6).value or '').strip(),
        'top': str(new_ws.cell(r,7).value or '').strip(),
        'backSides': str(new_ws.cell(r,8).value or '').strip(),
        'construction': str(new_ws.cell(r,9).value or '').strip(),
        'finish': str(new_ws.cell(r,10).value or '').strip(),
        'tuners': str(new_ws.cell(r,11).value or '').strip(),
        'fretboard': str(new_ws.cell(r,12).value or '').strip(),
    }
for r in range(4, ex_ws.max_row+1):
    model=ex_ws.cell(r,2).value
    if not model:
        continue
    title=str(ex_ws.cell(r,4).value or '').strip()
    products_by_norm.setdefault(norm(model),{
        'model': str(model).strip(),
        'sku': str(ex_ws.cell(r,3).value or '').strip(),
        'name': title,
        'size': str(ex_ws.cell(r,5).value or '').strip(),
        'shape': 'Standard',
        'top': '', 'backSides': '',
        'construction': 'Full Solid' if 'Full Solid' in title else '',
        'finish': '', 'tuners': '', 'fretboard': '',
    })
for r in range(3, desc_ws.max_row+1):
    model=desc_ws.cell(r,2).value
    if not model:
        continue
    key=norm(model)
    products_by_norm.setdefault(key, {
        'model':str(model).strip(), 'sku':str(desc_ws.cell(r,3).value or '').strip(),
        'name':str(model), 'size':'', 'shape':'', 'top':'', 'backSides':'',
        'construction':'', 'finish':'', 'tuners':'', 'fretboard':''
    })
    products_by_norm[key]['shortDescription']=str(desc_ws.cell(r,4).value or '').strip()
    products_by_norm[key]['fullDescription']=str(desc_ws.cell(r,5).value or '').strip()

def ensure(key, **kwargs):
    k=norm(key)
    products_by_norm.setdefault(k, kwargs.copy())
    for kk,v in kwargs.items():
        if not products_by_norm[k].get(kk):
            products_by_norm[k][kk]=v

ensure('UK-20SS NA', model='UK-20SS NA', sku='UMA20SS', name='Uma Ukulele 21" Soprano Full Solid Mahogany Natural UK-20SS', size='21" Soprano', shape='Standard', top='Full Solid Mahogany', backSides='Full Solid Mahogany', construction='Full Solid', finish='Natural Satin', tuners='Chrome die-cast', fretboard='Rosewood', shortDescription='All-solid mahogany soprano — warm resonant tone that opens up over time.')
ensure('UK-20SCP NA', model='UK-20SCP NA', sku='UMA20SCPNA', name='Uma Ukulele 23" Concert Full Solid Mahogany Pineapple Natural UK-20SCP', size='23" Concert', shape='Pineapple', top='Full Solid Mahogany', backSides='Full Solid Mahogany', construction='Full Solid', finish='Natural Satin', tuners='Gold die-cast', fretboard='Rosewood', shortDescription='All-solid mahogany Concert pineapple — Natural finish, fuller projection.')
ensure('UK-20SSP NA', model='UK-20SSP NA', sku='UMA20SSPNA', name='Uma Ukulele 21" Soprano Full Solid Mahogany Pineapple Natural UK-20SSP', size='21" Soprano', shape='Pineapple', top='Full Solid Mahogany', backSides='Full Solid Mahogany', construction='Full Solid', finish='Natural Satin', tuners='Chrome die-cast', fretboard='Rosewood', shortDescription='All-solid mahogany Soprano pineapple — Natural finish, bigger sound in smaller body.')
ensure('UK-20SC BK', model='UK-20SC BK', sku='UMA20SCBK', name='Uma Ukulele 23" Concert Full Solid Mahogany Black UK-20SC', size='23" Concert', shape='Standard', top='Full Solid Mahogany', backSides='Full Solid Mahogany', construction='Full Solid', finish='Black Stain', tuners='Gold die-cast', fretboard='Rosewood', shortDescription='All-solid mahogany Concert — Black finish, warm and resonant tone.')
ensure('UK-15SS', model='UK-15SS', sku='UMA15SS', name='Uma Ukulele 21" Soprano Full Solid Acacia Koa UK-15SS', size='21" Soprano', shape='Standard', top='Full Solid Acacia Koa', backSides='Full Solid Acacia Koa', construction='Full Solid', finish='Natural Satin', tuners='Gold die-cast', fretboard='Rosewood', shortDescription='All-solid Acacia Koa soprano — bright tropical tone with premium projection.')
ensure('UK-17SC E', model='UK-17SC E', sku='UMA17SC', name='Uma Ukulele 23" Concert Full Solid Mahogany UK-17SC', size='23" Concert', shape='Standard', top='Full Solid Mahogany', backSides='Full Solid Mahogany', construction='Full Solid', finish='Natural Satin', tuners='Chrome die-cast', fretboard='Rosewood', shortDescription='All-solid mahogany Concert — warm tone, comfortable size, with pickup reference in price list.')
ensure('UK-20ST BL', model='UK-20ST BL', sku='UMA20STBL', name='Uma Ukulele 26" Tenor Full Solid Mahogany Blue UK-20ST', size='26" Tenor', shape='Standard', top='Full Solid Mahogany', backSides='Full Solid Mahogany', construction='Full Solid', finish='Blue Stain', tuners='Gold die-cast', fretboard='Rosewood', shortDescription='All-solid mahogany Tenor — Blue finish with fuller tenor projection.')
ensure('PULSE KC', model='PULSE KC', sku='UMAPULSEKC', name='Uma Ukulele 23" Concert Full Solid Taiwan Acacia UMA-PulseKC', size='23" Concert', shape='Standard', top='Full Solid Taiwan Acacia (相思木)', backSides='Full Solid Taiwan Acacia (相思木)', construction='Full Solid', finish='Natural Satin', tuners='Gold die-cast', fretboard='Ebony / Rosewood', shortDescription='Pulse series Concert — full solid Taiwan Acacia with rich, complex Koa-like tone.')

map_image_key={
 'UK 20SCP.png':'UK-20SCP NA',
 'UK SUN SS1.png':'UK-SUN SS1',
 'UK-04S.png':'UK-04S',
 'UK-15SS.png':'UK-15SS',
 'UK-17SC.png':'UK-17SC E',
 'UK-20SC BK.png':'UK-20SC BK',
 'UK-20SCP BK.png':'UK-20SCP BK',
 'UK-20SCP BL.png':'UK-20SCP BL',
 'UK-20SS.png':'UK-20SS NA',
 'UK-20SSP BL.png':'UK-20SSP BL',
 'UK-20SSP.png':'UK-20SSP NA',
 'UK-20ST BL.png':'UK-20ST BL',
 'UMA PULSE KC.png':'PULSE KC',
}
items=[]
bad_images=[]
for img in sorted(src.glob('*.png')):
    model_key=map_image_key.get(img.name, img.stem)
    key=norm(model_key)
    pdata=products_by_norm.get(key, {})
    price=prices.get(key)
    filetype=subprocess.run(['file','-b',str(img)], text=True, capture_output=True).stdout.strip()
    good=filetype.startswith('PNG image')
    img_name=f"uma-{slug(model_key)}.png"
    rel=f"assets/images/wholesale/{img_name}"
    if good:
        shutil.copy2(img, img_dst/img_name)
    else:
        bad_images.append(img.name)
        rel=''
    if not price:
        print('WARN no price for', img.name, key)
        price={'available':0,'dealerRm':0,'selling':0,'priceModel':model_key,'dealerUsd':0}
    short=pdata.get('shortDescription') or f"{pdata.get('construction','UMA')} {pdata.get('size','ukulele')} model with limited wholesale promotion stock."
    specs=[]
    for label, field in [('Size','size'),('Body','shape'),('Top','top'),('Back & Sides','backSides'),('Construction','construction'),('Finish','finish'),('Tuners','tuners'),('Fretboard','fretboard')]:
        val=pdata.get(field)
        if val:
            specs.append({'label':label,'value':val})
    items.append({
        'id': slug(key),
        'model': model_key,
        'sku': pdata.get('sku') or slug(key).upper().replace('-',''),
        'name': pdata.get('name') or f"Uma Ukulele {model_key}",
        'price': f"RM {price['selling']:,.0f}",
        'dealerPrice': f"RM {price['dealerRm']:,.2f}",
        'dealerNote': 'Temporary dealer price based on SLC / current price sheet',
        'available': int(price['available']),
        'discount': 'Wholesale 5% - 15%',
        'image': rel,
        'imageMissing': not good,
        'note': short,
        'specs': specs,
    })
order={norm(ws.cell(r,2).value): r for r in range(2, ws.max_row+1) if ws.cell(r,2).value}
items.sort(key=lambda x: order.get(norm(x['model']), 999))
(dst/'assets/js/wholesale-products.json').write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'count':len(items),'bad_images':bad_images,'models':[i['model'] for i in items]}, indent=2, ensure_ascii=False))
