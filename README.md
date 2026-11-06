# Breadmaker website

The public marketing site and video guide at [breadmaker.studio](https://breadmaker.studio/), published from this repository through GitHub Pages. The author's original page, integrated product previews, and large-cursor walkthroughs are retained.

## Publish

Pushing `main` runs the **Deploy GitHub Pages** workflow. It validates local assets and packages the static site. Keep the existing Pages custom domain and HTTPS enforcement settings. DNS and the hosted app are managed separately.

## Preview and validate

Run `./run` to serve the site on loopback (`http://127.0.0.1:8775/`). Set `PORT` to choose another port. Alternatively:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
python3 scripts/check_site.py
```

There is no framework build or dependency installation.

## Missing pages

GitHub Pages uses the root `404.html` for missing URLs. Its assets and navigation
use root-relative paths so nested missing addresses work too. It has no automatic
redirect or JavaScript dependency. Preview the layout at `/404.html`; the simple
local server does not emulate GitHub Pages' fallback or HTTP status handling.
Verify an actually nonexistent deployed path returns HTTP 404 after changes.

## Product destinations and release availability

- **Open Breadmaker:** `https://app.breadmaker.studio/`. Link to the app root so it can handle account routing. Signed-out users are directed to sign-in.
- **Source:** the public `https://github.com/pentaenix/breadmaker` repository.
- **Local installers:** not yet public. The site deliberately shows their release-testing status. Enable download links only for approved public release assets, with verified platform, version, and checksums. Do not publish internal app archives in this repository or substitute a source archive for an installer.
- **Premium:** planned. Do not add prices, a working checkout, entitlement claims, or cloud-backup promises until they are actually available. The local editor remains free and accountless.

## Brand and media

`assets/breadmaker-logo.svg` uses the actual app's bread-shaped B paths, copied from `demos/current-ui/breadmaker_logo.svg`; editor metadata and hidden adjustment handles were omitted without changing the artwork. The favicon, touch icons, and share preview use that same mark. Instrument Sans is self-hosted under `assets/fonts/`; its SIL Open Font License is included there.

`demos/current-ui/source.json` and `guide/media/manifest.json` record the UI capture provenance. Guide clips remain muted, looping, inline, and without controls during normal browsing. Reduced-motion visitors receive a static poster with playback controls. Preserve the integrated framing, large cursor, text instructions, and captions when refreshing recordings.

## Search and sharing

The homepage and guide have distinct titles/descriptions, absolute canonical URLs, Open Graph/Twitter previews, and conservative JSON-LD describing visible content. `sitemap.xml` lists the two canonical pages, and `robots.txt` permits crawling. The app-preview wrapper is marked `noindex` because it is illustrative material within the marketing page.

Answer product questions in readable HTML and keep metadata consistent with the product. No special AI-targeted text files or ranking promises are required: [Google's AI search guidance](https://developers.google.com/search/docs/appearance/ai-features) applies the same useful-content, crawlability, and structured-data principles as ordinary search. Indexing/rankings require discovery and processing by search engines and are not guaranteed. Search Console/Bing Webmaster verification and sitemap submission should use the owner's existing accounts; this site does not add analytics or advertising trackers.
