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
    assert not re.search(r'alpha|pricing not announced|pricing.*not.*announced|approved account|invited account|temporary access',source,re.I),file
    for href,label in page.anchors:
        if href=='https://app.breadmaker.studio/':
            assert label=='Open Breadmaker Cloud',(file,label)
cloud=(ROOT/'cloud/index.html').read_text()
assert 'https://breadmaker.studio/cloud/' in cloud
assert 'https://breadmaker.studio/cloud/' not in (ROOT/'sitemap.xml').read_text()
assert 'content="noindex,follow"' in cloud
assert '<strong>4.99</strong><span>/ month</span>' in cloud
assert 'Checkout isn’t connected.' in cloud
assert 'no subscription is created and no payment is taken' in cloud
assert 'Design preview' in cloud
assert 'Changes do not sync automatically.' in cloud
assert 'compatible project copy' in cloud
assert '<th scope="col">' in cloud and '<th scope="row">' in cloud
assert 'Included in both' in cloud and 'Cloud adds' in cloud
assert cloud.index('id="shared-tools"') < cloud.index('id="cloud-additions"')
shared=cloud.split('<tbody aria-labelledby="shared-tools">',1)[1].split('</tbody>',1)[0]
assert shared.count('class="included-label">Included</span>')==8
for feature in ('Manuscript','Canvas and Maps','Tasks and Checkpoints','PDF, DOCX'):
    assert feature in shared
assert 'See what Cloud adds' in cloud
assert 'Choose what fits' not in cloud and 'Choose the local editor when' not in cloud
assert 'Cloud needs an internet connection' in cloud
assert 'does not provide those local backup connections' in cloud
assert 'everything in local' not in cloud.lower()
assert 'comparison.css?v=' in cloud
assert '<form' not in cloud
assert cloud.count('data-checkout-preview aria-describedby="offer-preview-notice" disabled')==2
assert '<dialog' in cloud and 'preview.js?v=' in cloud
assert not re.search(r'[$€£]\s*\d|Start free trial',cloud,re.I)
assert not re.search(r'fetch\(|XMLHttpRequest|location\.|window.open|sendBeacon',(ROOT/'cloud/preview.js').read_text())
assert not re.search(r'Readers don.t need an account|They don.t need an account|Get feedback without reader accounts',(ROOT/'index.html').read_text())
print('OK: Cloud CTA names, currency-neutral offer preview and safe checkout, comparison semantics, and reviewed copy safeguards.')
