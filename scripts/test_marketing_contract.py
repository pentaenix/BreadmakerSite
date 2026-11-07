#!/usr/bin/env python3
"""Keep reviewed marketing promises and entry destinations from regressing."""
from html.parser import HTMLParser
from pathlib import Path
import re
ROOT = Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self, source):
        super().__init__(); self.text=[]; self.anchors=[]; self.anchor=None; self.skip=0
        self.feed(source)
    def handle_starttag(self, tag, attrs):
        attrs=dict(attrs)
        if tag in ('script','style'): self.skip+=1
        if tag=='a': self.anchor=[attrs.get('href',''),[]]
    def handle_endtag(self, tag):
        if tag in ('script','style'): self.skip-=1
        if tag=='a' and self.anchor:
            self.anchors.append((self.anchor[0],''.join(self.anchor[1]).strip())); self.anchor=None
    def handle_data(self, data):
        if not self.skip: self.text.append(data)
        if self.anchor: self.anchor[1].append(data)
for file in ('index.html','guide/index.html','404.html','cloud/index.html'):
    source=(ROOT/file).read_text(); page=Page(source); text=' '.join(page.text)
    assert not re.search(r'\b(?:Word|Google Docs?|Scrivener|Plottr)\b',text),file
    assert 'Let your editor' not in text,file
    for href,label in page.anchors:
        if href=='https://app.breadmaker.studio/':
            assert label=='Open Breadmaker Cloud',(file,label)
cloud=(ROOT/'cloud/index.html').read_text()
assert 'https://breadmaker.studio/cloud/' in cloud
assert 'https://breadmaker.studio/cloud/' in (ROOT/'sitemap.xml').read_text()
assert 'approved alpha account' in cloud
assert 'Paid plans are not available yet.' in cloud
assert 'Changes do not sync automatically.' in cloud
assert 'compatible project copy' in cloud
assert '<th scope="col">' in cloud and '<th scope="row">' in cloud
assert '<form' not in cloud and '<script' not in cloud
assert not re.search(r'[$€£]\s*\d|>\s*(?:Buy|Subscribe|Start free trial)',cloud,re.I)
assert not re.search(r'Readers don.t need an account|They don.t need an account|Get feedback without reader accounts',(ROOT/'index.html').read_text())
print('OK: Cloud CTA names, public offer/access facts, comparison semantics, and reviewed copy safeguards.')
