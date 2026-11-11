#!/usr/bin/env python3
"""Render reviewed legal fragments into the existing static-site branding.

This builds files only. It does not approve legal grounds, send notices, publish,
record consent, or activate processing. scripts/ is excluded from Pages output.
"""
from pathlib import Path
from datetime import date
from html import escape
import argparse,re,os
ROOT=Path(__file__).resolve().parents[1]
ADDRESS_TOKEN='{{PRIVACY_NOTICES_ADDRESS}}'
PREVIEW_ADDRESS='Example privacy-notice address, not for publication'
def configured_address(preview=False):
    if preview:
        return PREVIEW_ADDRESS
    value=os.environ.get('PRIVACY_NOTICES_ADDRESS','').strip()
    if not value or len(value)>600 or any(ord(c)<32 for c in value) or '{{' in value or '[[' in value or value==PREVIEW_ADDRESS:
        raise ValueError('A valid approved PRIVACY_NOTICES_ADDRESS is required; no address was rendered.')
    return value

def substitute_address(fragment,address):
    return fragment.replace(ADDRESS_TOKEN,escape(address,quote=True))


def render(lang,kind,updated,address):
    es=lang=='es'
    route=('privacy' if kind=='privacy' else 'age-requirements')+('/es' if es else '')
    other=('/privacy/' if es else '/privacy/es/') if kind=='privacy' else ('/age-requirements/' if es else '/age-requirements/es/')
    title=('Aviso de privacidad del servicio alojado' if es else 'Hosted service privacy notice') if kind=='privacy' else ('Requisitos de edad del servicio alojado' if es else 'Hosted account age requirements')
    fragment=substitute_address((ROOT/'scripts/legal-content'/f'{kind}.{lang}.html').read_text(),address)
    if kind=='age':
        fragment=re.sub(r'^.*?(?=<h1>)','',fragment,flags=re.S).replace('</html>','')
        fragment='<article lang="'+lang+'" aria-labelledby="age-title">'+fragment.replace('<h1>','<h1 id="age-title">',1)+'</article>'
    language='English' if es else 'Español'
    skip='Ir al contenido' if es else 'Skip to content'
    modified='Última actualización' if es else 'Last updated'
    cloud='Abrir Breadmaker Cloud' if es else 'Open Breadmaker Cloud'
    return f'''<!doctype html>
<html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{escape(title)} | Breadmaker</title><meta name="description" content="{escape(title)}">
<link rel="canonical" href="https://breadmaker.studio/{route}/"><meta name="robots" content="index,follow"><meta name="theme-color" content="#f5f3ee">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/brand.css"><link rel="stylesheet" href="/legal.css">
</head><body><a class="skip-link" href="#main">{skip}</a>
<header class="legal-header"><a class="brand-link" href="/"><img src="/assets/breadmaker-logo.svg" alt="" width="34" height="34"><span>Breadmaker</span></a><nav aria-label="{'Navegación' if es else 'Navigation'}"><a href="{other}" lang="{'en' if es else 'es'}">{language}</a><a href="https://app.breadmaker.studio/">{cloud}</a></nav></header>
<main id="main" class="legal-page" tabindex="-1"><p class="legal-version">{modified}: <time datetime="{updated}">{updated}</time> · v9</p>{fragment}</main>
<footer class="legal-footer"><a href="mailto:privacy@breadmaker.studio">privacy@breadmaker.studio</a> · <a href="{'/privacy/es/' if es else '/privacy/'}">{'Privacidad del servicio alojado' if es else 'Hosted privacy'}</a></footer></body></html>
'''

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--updated',required=True,type=date.fromisoformat);parser.add_argument('--preview',action='store_true');args=parser.parse_args()
    address=configured_address(args.preview)
    for kind in ('privacy','age'):
        for lang in ('en','es'):
            path=ROOT/('privacy' if kind=='privacy' else 'age-requirements')/('es' if lang=='es' else '')/'index.html'
            path.parent.mkdir(parents=True,exist_ok=True);path.write_text(render(lang,kind,args.updated.isoformat(),address))
    for lang in ('en','es'):
        fragment=substitute_address((ROOT/'scripts/legal-content'/f'signup.{lang}.html').read_text(),address)
        path=ROOT/'privacy'/'signup'/lang/'index.html';path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(f'<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Privacy | Breadmaker</title><link rel="stylesheet" href="/legal.css"></head><body><main>{fragment}</main></body></html>\n')
    for lang in ('en','es'):
        target='/privacy/es/' if lang=='es' else '/privacy/'
        path=ROOT/'privacy-policy'/('es' if lang=='es' else '')/'index.html';path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(f'<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><link rel="canonical" href="https://breadmaker.studio{target}"><meta http-equiv="refresh" content="0;url={target}"><title>Privacy | Breadmaker</title></head><body><p><a href="{target}">{"Aviso de privacidad" if lang=="es" else "Privacy notice"}</a></p></body></html>\n')
if __name__=='__main__':main()
