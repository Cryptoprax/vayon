import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
const require = createRequire(import.meta.url), output = resolve('test-results/trial-enforcement'), fixture = resolve('tests/fixtures/trial-enforcement');
await mkdir(`${output}/screenshots`,{recursive:true});
const compiled=require('next/dist/compiled/webpack/webpack');
await new Promise((done,reject)=>compiled.webpack({mode:'development',devtool:false,entry:`${fixture}/entry.jsx`,output:{path:output,filename:'fixture.js'},resolve:{extensions:['.tsx','.ts','.jsx','.js','.mjs'],alias:{'next/link$':resolve('tests/fixtures/workspace-unification/link.jsx'),'next/navigation$':`${fixture}/navigation.mjs`,'@/features/platform/design-system$':resolve('features/platform/design-system/components/core/Actions.tsx'),'@':process.cwd()}},plugins:[new compiled.webpack.NormalModuleReplacementPlugin(/(?:subscription-center|billing)\.actions$/,resource=>{resource.request=resolve('tests/fixtures/commercial-lifecycle/actions.mjs');})],module:{rules:[{test:/\.[jt]sx?$/,exclude:/node_modules/,use:resolve('tests/fixtures/members/loader.mjs')},{test:/\.css$/,type:'asset/source'}]}},(error,stats)=>error||stats.hasErrors()?reject(error||new Error(stats.toString({all:false,errors:true}))):done()));
const css=await require('postcss')([require('@tailwindcss/postcss')()]).process(await readFile('app/globals.css','utf8'),{from:resolve('app/globals.css')});
await writeFile(`${output}/fixture.css`,css.css+'\n'+await readFile('features/platform/design-system/layout/workspace.css','utf8'));
const server=createServer(async(req,res)=>{if(['/fixture.js','/fixture.css'].includes(req.url)){res.setHeader('Content-Type',req.url.endsWith('.css')?'text/css':'text/javascript');res.end(await readFile(output+req.url));}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en" data-vds-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Commercial lifecycle QA</title><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>');}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true});
const evidence={environment:'Local Chromium, actual SubscriptionCenter and response handler, mocked billing transport and QA state. No deployed authentication or payment verification.',screens:[],interactions:[],errors:[]};
try {
 const page=await browser.newPage({reducedMotion:'reduce'}),url=`http://127.0.0.1:${server.address().port}`;
 page.on('pageerror',error=>evidence.errors.push(error.message));
 for(const width of [320,375,768,1024,1280,1440,1600,1920,2560]) {
  await page.setViewportSize({width,height:900});
  await page.goto(`${url}/vayon/settings/billing?subscription=expired&resource=write&expired`);
  const dialog=page.getByRole('dialog',{name:'Subscription Center'});await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('status').filter({hasText:'workspace is read-only'})).toBeVisible();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await dialog.evaluate(el=>el.scrollWidth>el.clientWidth+1),false);
  for(let index=0;index<15;index++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('dialog[open]')),true);}
  await page.screenshot({path:`${output}/screenshots/expired-${width}.png`});
  await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();
  evidence.screens.push({width,overflow:false,focusContained:true,escapeDismisses:true});
 }
 await page.goto(url);await page.getByRole('button',{name:'Test blocked invitation response'}).click();
 await page.waitForURL('**/vayon/settings/billing?subscription=limit&resource=members');
 await expect(page.getByRole('dialog',{name:'Subscription Center'})).toBeVisible();
 await expect(page.getByText("You've reached your trial limit. Upgrade your workspace to add more team members.",{exact:true})).toBeVisible();
 evidence.interactions.push({api402:'opens in-app center automatically',destination:new URL(page.url()).pathname});
 await page.screenshot({path:`${output}/screenshots/blocked-invitation.png`});
 await page.goto(`${url}/vayon/settings/billing?subscription=verify&unconfigured`);
 await expect(page.getByRole('dialog',{name:'Subscription Center'})).toBeVisible();
 await expect(page.getByText(/We could not confirm your workspace subscription/)).toBeVisible();
 assert.equal(await page.getByRole('button',{name:'Upgrade to Starter'}).count(),0);
 await page.screenshot({path:`${output}/screenshots/unverified.png`});
 evidence.interactions.push({unverified:'explains recovery, no unusable checkout'});
 assert.deepEqual(evidence.errors,[]);console.log('PASS subscription blocking browser checks');
} finally {await writeFile(`${output}/browser-evidence.json`,JSON.stringify(evidence,null,2));await browser.close();await new Promise(done=>server.close(done));await unlink(`${output}/fixture.js`);await unlink(`${output}/fixture.css`);}
