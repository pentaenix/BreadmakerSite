/* Optional browser QA: set PLAYWRIGHT_MODULE to an installed Playwright package. */
const {chromium, webkit} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs'), path = require('node:path'), {spawn} = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const base = process.env.SITE_URL || 'http://127.0.0.1:8798/';
const out = process.env.QA_OUT || '/tmp/breadmaker-guide-qa-20261107';
const report = {base, checks: [], errors: [], failedAssets: [], screenshots: []};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  let server, browser;
  fs.mkdirSync(out, {recursive: true});
  try {
    if (!process.env.SITE_URL) {
      server = spawn('python3', ['-m', 'http.server', '8798', '--bind', '127.0.0.1', '--directory', root], {stdio: 'ignore'});
      for (let i = 0; i < 50; i++) { try { if ((await fetch(base)).ok) break; } catch {} await wait(100); }
      assert.equal(server.exitCode, null, 'Our temporary preview server must be running');
    }
    for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
      browser = await engine.launch({headless: true, executablePath: process.env[name.toUpperCase() + '_PATH'] || undefined});
      const context = await browser.newContext({viewport: {width: 1440, height: 1000}});
      const page = await context.newPage();
      page.on('pageerror', error => report.errors.push(name + ': ' + error.message));
      page.on('response', response => { if (response.status() >= 400) report.failedAssets.push([response.status(), response.url()]); });
      await page.goto(base + 'guide/', {waitUntil: 'networkidle'});
      assert.equal(await page.locator('[data-guide-topic]').count(), 28);
      assert.equal(await page.locator('[data-guide-loop]').count(), 8);
      const input = page.locator('#guide-search-input');
      for (const [query, topic] of [['read out loud', 'narration'], ['naration', 'narration'], ['improt docx', 'import'], ['download audio', 'audio-export'], ['beta reader', 'reviews']]) {
        await input.fill(query);
        assert.equal(await page.locator('#guide-search-results a').first().getAttribute('href'), '#' + topic);
      }
      await input.fill('zzzzzzzzqqqq');
      assert.match(await page.locator('#guide-search-status').innerText(), /No close matches/);
      await input.fill('<img src=x onerror=alert(1)>');
      assert.equal(await page.locator('#guide-search-results img').count(), 0);
      await input.fill('read aloud');
      await input.press('ArrowDown');
      assert.equal(await page.evaluate(() => document.activeElement.hash), '#narration');
      await page.keyboard.press('Enter');
      await page.waitForURL('**#narration');
      await page.waitForTimeout(500);
      assert.equal(await page.evaluate(() => document.activeElement.tagName), 'H2');
      assert.equal(await page.evaluate(() => document.activeElement.closest('section').id), 'narration');
      await page.locator('#guide-find-link').click();
      await page.waitForTimeout(500);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'guide-search-input');
      await input.press('Escape');
      assert.equal(await input.inputValue(), '');
      assert.equal(new URL(page.url()).searchParams.has('q'), false);
      await page.locator('[data-guide-query="read aloud"]').click();
      await page.locator('#guide-search-results a').first().click();
      await page.waitForURL('**#narration');
      await page.goBack();
      assert.equal(await input.inputValue(), 'read aloud');
      await page.locator('#guide-topic-select').selectOption('audio-export');
      await page.waitForURL('**#audio-export');
      await page.waitForTimeout(500);
      const headingTop = await page.locator('#audio-export h2').evaluate(node => node.getBoundingClientRect().top);
      const barBottom = await page.locator('.guide-topic-bar').evaluate(node => node.getBoundingClientRect().bottom);
      assert.ok(headingTop >= barBottom - 2, 'Anchor heading must clear the fixed and sticky navigation');
      for (const width of [1440, 768, 390, 320]) {
        await page.setViewportSize({width, height: 900});
        await page.goto(base + 'guide/?q=naration', {waitUntil: 'networkidle'});
        assert.equal(await page.locator('#guide-search-results a').first().getAttribute('href'), '#narration');
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
        assert.equal(overflow, false, name + ' horizontal overflow at ' + width);
        for (const selector of ['#guide-search-input', '.site-header', '#guide-search-results']) {
          const box = await page.locator(selector).boundingBox();
          assert.ok(box.x >= -1 && box.x + box.width <= width + 1, selector + ' clipped at ' + width);
        }
        if (name === 'chromium' && [1440, 390, 320].includes(width)) {
          const file = path.join(out, name + '-' + width + '.png'); await page.screenshot({path: file}); report.screenshots.push(file);
        }
        await page.locator('#guide-search-results a').first().click();
        await page.waitForTimeout(500);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
        report.checks.push(name + ': search, anchor and layout at ' + width);
      }
      await context.close();
      const reduced = await browser.newContext({reducedMotion: 'reduce', viewport: {width: 390, height: 844}});
      const rp = await reduced.newPage(); await rp.goto(base + 'guide/#write');
      assert.equal(await rp.locator('video').evaluateAll(videos => videos.every(video => video.controls && !video.loop)), true);
      report.checks.push(name + ': reduced-motion videos retain controls'); await reduced.close();
      const nojs = await browser.newContext({javaScriptEnabled: false, viewport: {width: 390, height: 844}});
      const np = await nojs.newPage(); await np.goto(base + 'guide/#narration');
      assert.equal(await np.locator('#narration h2').evaluate(node => getComputedStyle(node.closest('.guide-copy')).opacity), '1');
      assert.equal(await np.locator('#search').isVisible(), false);
      assert.equal(await np.locator('.guide-jumps a[href="#narration"]').count(), 1);
      report.checks.push(name + ': all content and chapter links work without JavaScript'); await nojs.close();
      await browser.close(); browser = null;
    }
    assert.deepEqual(report.errors, []); assert.deepEqual(report.failedAssets, []);
    report.passed = true;
  } catch (error) { report.passed = false; report.failure = error.stack; process.exitCode = 1; }
  finally {
    if (browser) await browser.close();
    if (server && server.exitCode === null) { server.kill('SIGTERM'); await new Promise(resolve => server.once('exit', resolve)); }
    report.cleanup = {browserClosed: true, previewServerStopped: !server || server.exitCode !== null || server.signalCode !== null};
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  }
})();
