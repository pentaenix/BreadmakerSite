#!/usr/bin/env python3
"""Non-legal static regression checks for the hosted notice release candidate."""
from pathlib import Path
from html.parser import HTMLParser
import re,unittest,os
from build_legal_pages import ADDRESS_TOKEN, PREVIEW_ADDRESS, substitute_address, configured_address
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self,source):
  super().__init__();self.ids=[];self.links=[];self.headings=0;self.sections=0;self.paragraphs=0;self.feed(source)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag=='a':self.links.append(a.get('href',''))
  self.headings+=tag=='h1';self.sections+=tag=='section';self.paragraphs+=tag=='p'
class PrivacyContract(unittest.TestCase):
 def test_routes_and_locale_structure(self):
  parsed=[]
  for lang,route in [('en','privacy'),('es','privacy/es')]:
   source=(ROOT/route/'index.html').read_text();page=Page(source);parsed.append(page)
   self.assertIn(f'<html lang="{lang}">',source);self.assertEqual(page.headings,1)
   self.assertEqual(len(page.ids),len(set(page.ids)));self.assertEqual(page.sections,10)
   self.assertNotIn('[[',source);self.assertNotIn('UNPUBLISHED',source)
   self.assertIn('/brand.css',source);self.assertIn('/legal.css',source)
   self.assertIn('tabindex="-1"',source)
   self.assertIn('/privacy/' if lang=='es' else '/privacy/es/',page.links)
   self.assertIn('/age-requirements/es/' if lang=='es' else '/age-requirements/',page.links)
  self.assertEqual(parsed[0].paragraphs,parsed[1].paragraphs)
 def test_exact_reviewed_fragments_are_embedded(self):
  for lang,route in [('en','privacy'),('es','privacy/es')]:
   fragment=(ROOT/'scripts/legal-content'/f'privacy.{lang}.html').read_text()
   source=(ROOT/route/'index.html').read_text()
   if ADDRESS_TOKEN in source:
    self.assertIn(fragment,source)
   else:
    before,after=fragment.split(ADDRESS_TOKEN)
    self.assertIn(before,source);self.assertIn(after,source)
    self.assertNotIn(ADDRESS_TOKEN,source)
 def test_private_configuration_fails_closed(self):
  with patch.dict(os.environ,{},clear=True):
   with self.assertRaises(ValueError):configured_address()
  with patch.dict(os.environ,{'PRIVACY_NOTICES_ADDRESS':PREVIEW_ADDRESS}):
   with self.assertRaises(ValueError):configured_address()
  self.assertEqual(substitute_address(ADDRESS_TOKEN,'A < B & "C"'),'A &lt; B &amp; &quot;C&quot;')
 def test_simplified_notice_source_coverage(self):
  for lang in ('en','es'):
   source=(ROOT/'scripts/legal-content'/f'signup.{lang}.html').read_text()
   self.assertIn(ADDRESS_TOKEN,source)
   self.assertIn('privacy@breadmaker.studio',source)
   self.assertIn('Targets',source)
   self.assertIn('https://breadmaker.studio/privacy/',source)
 def test_no_future_metric_or_anonymity_claim(self):
  en=(ROOT/'privacy/index.html').read_text()
  for text in ['does not collect word, character, canvas or presence totals','not end-to-end encrypted','Closing an account','IndexedDB','manuscript text','120 refresh attempts','15-minute cooldown','manual refresh','100,000','original observation time','designed to prevent overlapping refreshes']:
   self.assertIn(text,en)
  self.assertNotIn('all data is deleted',en)
 def test_spanish_safeguards(self):
  es=(ROOT/'privacy/es/index.html').read_text()
  for text in ['120 intentos de actualización','15 minutos','100,000','IndexedDB','texto de manuscritos','actualización manual','diseñados para evitar actualizaciones simultáneas']:
   self.assertIn(text,es)
 def test_age_rules_and_no_false_verification(self):
  for route in ['age-requirements','age-requirements/es']:
   source=(ROOT/route/'index.html').read_text();self.assertEqual(Page(source).headings,1)
   self.assertIn('1350409',source)
 def test_legacy_aliases_are_local_and_have_fallback_link(self):
  for route,target in [('privacy-policy','/privacy/'),('privacy-policy/es','/privacy/es/')]:
   source=(ROOT/route/'index.html').read_text()
   self.assertIn('noindex,follow',source);self.assertIn(f'content="0;url={target}"',source)
   self.assertIn(target,Page(source).links)
 def test_public_entry_links_and_sitemap(self):
  for route in ['index.html','guide/index.html','cloud/index.html']:
   self.assertIn('/privacy/',Page((ROOT/route).read_text()).links)
  sitemap=(ROOT/'sitemap.xml').read_text()
  for route in ['privacy','privacy/es','age-requirements','age-requirements/es']:
   self.assertIn(f'https://breadmaker.studio/{route}/',sitemap)
 def test_no_script_or_forms_collect_data(self):
  for route in ['privacy','privacy/es','age-requirements','age-requirements/es']:
   source=(ROOT/route/'index.html').read_text()
   self.assertNotRegex(source,r'<(?:script|form|iframe)\b')
if __name__=='__main__':unittest.main()
