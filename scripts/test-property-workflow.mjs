import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';
const require = createRequire(import.meta.url);
const { webpack } = require('next/dist/compiled/webpack/webpack');
const dir = fs.mkdtempSync(path.join(process.cwd(), '.property-workflow-'));
try {
    fs.writeFileSync(path.join(dir, "entry.tsx"), "import React from 'react';import {createRoot} from 'react-dom/client';import {PropertyWizard} from '../features/vayon/property/components/PropertyWizard';\nconst root=createRoot(document.getElementById('root')!);let revision=0;window.testSubmissions=[];window.resetWizard=()=>root.render(<PropertyWizard key={++revision} action={async form=>{window.testSubmissions.push(Object.fromEntries(form.entries()));}}/>);window.resetWizard();\r\n");
    fs.writeFileSync(path.join(dir, "loader.cjs"), "const ts=require('typescript');module.exports=function(source){return ts.transpileModule(source,{fileName:this.resourcePath,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;};\r\n");
    fs.writeFileSync(path.join(dir, "link.tsx"), "import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}\r\n");
    fs.writeFileSync(path.join(dir, "image.tsx"), "import React from 'react';export default function Image({fill,unoptimized,...props}){return <img {...props}/>}\r\n");
    await new Promise((resolve, reject) => webpack({ mode: 'production', devtool: false, entry: path.join(dir, 'entry.tsx'), output: { path: dir, filename: 'bundle.js' }, resolve: { extensions: ['.tsx', '.ts', '.js', '.json'], alias: { '@/features/platform/design-system$': path.resolve('features/platform/design-system/components/core/Actions.tsx'), '@': process.cwd(), 'next/link$': path.join(dir, 'link.tsx'), 'next/image$': path.join(dir, 'image.tsx') } }, module: { rules: [{ test: /\.tsx?$/, exclude: /node_modules/, use: path.join(dir, 'loader.cjs') }] }, optimization: { minimize: false } }, (err, stats) => { if (err || stats.hasErrors())
        reject(err || new Error(stats.toString({ all: false, errors: true })));
    else
        resolve(); }));
    const server = http.createServer((req, res) => { if (req.url === '/bundle.js') {
        res.setHeader('Content-Type', 'text/javascript');
        res.end(fs.readFileSync(path.join(dir, 'bundle.js')));
    }
    else {
        res.setHeader('Content-Type', 'text/html');
        res.end('<html><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
    } });
    await new Promise(r => server.listen(3135, '127.0.0.1', r));
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage();
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        await page.goto('http://127.0.0.1:3135');
        const heading = () => page.locator('form h2').first();
        const step = async (n) => assert.equal(await page.locator('[aria-current="step"]').getAttribute('aria-label'), `Step ${n} of 10, ${['Basic', 'Location', 'Pricing', 'Property Features', 'Media', 'Amenities', 'Ownership', 'Documents', 'Search Details', 'Review & Save'][n - 1]}`);
        const next = () => page.getByRole('button', { name: 'Continue', exact: true }).click();
        await step(1);
        assert.equal(await page.getByRole('button', { name: 'Step 10 of 10, Review & Save', exact: true }).isDisabled(), true);
        await next();
        await step(1);
        assert.ok(await page.getByRole('alert').count());
        await page.locator('[name=title]').fill('Workflow QA Property');
        await page.locator('[name=reference]').fill('QA-WORKFLOW');
        await page.locator('[name=reference]').press('Enter');
        await step(1);
        await next();
        await step(2);
        await next();
        await step(2);
        await page.getByRole('button', { name: 'State / Province' }).click();
        await page.getByRole('option', { name: /California/ }).click();
        await page.getByRole('button', { name: 'City', exact: false }).click();
        await page.getByRole('option', { name: /Los Angeles/ }).click();
        await page.locator('[name=address]').fill('123 Test Street');
        await next();
        await step(3);
        await next();
        await step(3);
        assert.match(await page.getByRole('alert').innerText(), /sale or rental price/);
        await page.locator('[name=salePrice]').fill('250000.50');
        await next();
        await step(4);
        await page.locator('[name=area]').fill('1200.5');
        const visited = [1, 2, 3, 4];
        for (let i = 5; i <= 10; i++) {
            await next();
            await step(i);
            visited.push(i);
        }
        assert.equal(await heading().innerText(), 'Review & Save');
        for (let i = 9; i >= 1; i--) {
            await page.getByRole('button', { name: 'Back', exact: true }).click();
            await step(i);
        }
        for (let i = 2; i <= 10; i++) {
            await next();
            await step(i);
        }
        await page.getByRole('button', { name: 'Step 1 of 10, Basic', exact: true }).click();
        await page.locator('[name=title]').fill('');
        await page.getByRole('button', { name: 'Step 10 of 10, Review & Save', exact: true }).click();
        await step(1);
        await page.locator('[name=title]').fill('Workflow QA Property');
        await page.getByRole('button', { name: 'Step 10 of 10, Review & Save', exact: true }).click();
        await step(10);
        await page.evaluate(() => document.querySelector('[name=title]').value = '');
        await page.getByRole('button', { name: 'Create property', exact: true }).click();
        await step(1);
        assert.equal(await page.evaluate(() => window.testSubmissions.length), 0);
        await page.locator('[name=title]').fill('Workflow QA Property');
        await page.getByRole('button', { name: 'Step 10 of 10, Review & Save', exact: true }).click();
        await page.getByRole('button', { name: 'Create property', exact: true }).click();
        await page.waitForFunction(() => window.testSubmissions.length === 1);
        const payload = await page.evaluate(() => window.testSubmissions[0]);
        assert.equal(payload.salePrice, '250000.50');
        assert.equal(payload.city, 'Los Angeles');
        assert.deepEqual(errors, []);
        fs.mkdirSync('test-results/property-workflow', { recursive: true });
        fs.writeFileSync('test-results/property-workflow/browser-audit.json', JSON.stringify({ scope: 'Real PropertyWizard, native browser validation, actual location selectors and VDS Button; action is a test callback, not a database mutation', visited, backPath: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1], earlyReviewPrevented: true, missingPriceStoppedAtStep3: true, invalidHiddenFieldRevealed: true, actionCalls: 1, errors }, null, 2));
        console.log('Wizard navigation and submission checks passed');
    }
    finally {
        await browser.close();
        await new Promise(r => server.close(r));
    }
}
finally {
    for (const name of ['entry.tsx', 'loader.cjs', 'link.tsx', 'image.tsx', 'bundle.js']) {
        const file = path.join(dir, name);
        if (fs.existsSync(file))
            fs.unlinkSync(file);
    }
    fs.rmdirSync(dir);
}
