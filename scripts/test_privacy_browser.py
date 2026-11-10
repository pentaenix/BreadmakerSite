#!/usr/bin/env python3
"""Browser QA of static legal pages only. Never queries the hosted application."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
import json,os
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(os.environ.get('QA_OUT','/tmp/breadmaker-privacy-qa'));OUT.mkdir(parents=True,exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start();base=f'http://127.0.0.1:{server.server_port}'
report={'scope':'Synthetic static-page browser QA; no publication, consent capture, hosted data or legal certification','checks':[]}
try:
 with sync_playwright() as p:
  opts={'headless':True}
  if os.environ.get('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
  browser=p.chromium.launch(**opts)
  try:
   for lang in ['en','es']:
    route='/privacy/es/' if lang=='es' else '/privacy/'
    for width in [1280,768,390,320]:
     page=browser.new_page(viewport={'width':width,'height':900},java_script_enabled=False)
     errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
     response=page.goto(base+route,wait_until='networkidle');page.evaluate('document.fonts.ready')
     assert response.status==200
     assert not page.evaluate('document.documentElement.scrollWidth>innerWidth+1')
     assert page.locator('article h1').count()==1 and page.locator('article section').count()==10
     assert '[[' not in page.locator('article').inner_text()
     page.screenshot(path=str(OUT/f'{lang}-{width}-top.png'))
     page.keyboard.press('Tab');assert page.locator('.skip-link').evaluate('(e)=>e===document.activeElement')
     page.keyboard.press('Enter');assert page.locator('#main').evaluate('(e)=>e===document.activeElement')
     for section,label in [(6,'retention'),(9,'end')]:
      page.locator('article section').nth(section).scroll_into_view_if_needed();page.screenshot(path=str(OUT/f'{lang}-{width}-{label}.png'))
     page.locator('article a[href*="age-requirements"]').click()
     assert '/age-requirements/' in page.url and page.locator('h1').count()==1
     page.go_back();assert page.locator('article').get_attribute('lang')==lang
     page.locator('header nav a').first.click();assert page.locator('article').get_attribute('lang')!=lang
     assert not errors
     report['checks'].append({'language':lang,'width':width,'no_horizontal_overflow':True,'skip_focus':'passed','age_back_and_language':'passed','javascript_disabled':True})
     page.close()
   page=browser.new_page()
   for alias,target in [('/privacy-policy/','/privacy/'),('/privacy-policy/es/','/privacy/es/')]:
    page.goto(base+alias);page.wait_for_url(base+target);assert page.locator('article').count()==1
   page.close();report['passed']=True
  finally:browser.close()
except Exception as e:
 report['passed']=False;report['failure']=str(e);raise
finally:
 server.shutdown();server.server_close();(OUT/'report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
