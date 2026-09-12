import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
const require = createRequire(import.meta.url), output = resolve('test-results/commercial-lifecycle'), fixture = resolve('tests/fixtures/commercial-lifecycle');
await mkdir(`${output}/screenshots`,{recursive:true});
const compiled=require('next/dist/compiled/webpack/webpack');
await new Promise((done,reject)=>compiled.webpack({mode:'development',devtool:false,entry:`${fixture}/entry.jsx`,output:{path:output,filename:'fixture.js'},resolve:{extensions:['.tsx','.ts','.jsx','.js','.mjs'],alias:{'next/link$':resolve('tests/fixtures/workspace-unification/link.jsx'),'next/navigation$':`${fixture}/navigation.mjs`,'@/features/platform/design-system$':resolve('features/platform/design-system/components/core/Actions.tsx'),'@':process.cwd()}},plugins:[new compiled.webpack.NormalModuleReplacementPlugin(/(?:subscription-center|billing)\.actions$/,resource=>{resource.request=`${fixture}/actions.mjs`;})],module:{rules:[{test:/\.[jt]sx?$/,exclude:/node_modules/,use:resolve('tests/fixtures/members/loader.mjs')},{test:/\.css$/,type:'asset/source'}]}},(error,stats)=>error||stats.hasErrors()?reject(error||new Error(stats.toString({all:false,errors:true}))):done()));
const css=await require('postcss')([require('@tailwindcss/postcss')()]).process(await readFile('app/globals.css','utf8'),{from:resolve('app/globals.css')});
await writeFile(`${output}/fixture.css`,css.css+'\n'+await readFile('features/platform/design-system/layout/workspace.css','utf8'));
const server=createServer(async(req,res)=>{if(['/fixture.js','/fixture.css'].includes(req.url)){res.setHeader('Content-Type',req.url.endsWith('.css')?'text/css':'text/javascript');res.end(await readFile(output+req.url));}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><html lang="en" data-vds-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Commercial lifecycle QA</title><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>');}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true});
const evidence={environment:'Local Chromium; actual React components and CSS; explicit QA records, mocked checkout SDK, HTTP and server actions. No real payment, authentication or database certification.',screens:[],interactions:[],errors:[]};
try{
 const page=await browser.newPage({reducedMotion:'reduce'}),url=`http://127.0.0.1:${server.address().port}`;
 page.on('pageerror',error=>evidence.errors.push(error.message));
 for(const width of [320,375,768,1024,1280,1440,1600,1920,2560]){
  await page.setViewportSize({width,height:1000});await page.goto(url);await page.getByRole('heading',{name:'Subscription Center',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:`${output}/screenshots/billing-${width}.png`,fullPage:true});
  await page.getByRole('button',{name:'Compare Plans',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Subscription Center'});await expect(dialog).toBeVisible();
  assert.equal(await dialog.evaluate(el=>el.scrollWidth>el.clientWidth+1),false);
  for(const name of ['Starter','Professional','Enterprise'])await expect(dialog.getByRole('heading',{name,exact:true})).toBeVisible();
  await page.screenshot({path:`${output}/screenshots/comparison-${width}.png`});await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(page.getByRole('button',{name:'Compare Plans',exact:true})).toBeFocused();
  evidence.screens.push({width,documentOverflow:false,dialogOverflow:false,escapeAndFocusRestoration:true});
 }
 await page.goto(url);await page.getByRole('button',{name:'Compare Plans',exact:true}).click();await page.getByRole('button',{name:'Annual',exact:true}).click();await page.getByRole('button',{name:'Upgrade to Starter',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>window.billingCheckout.length)).toBe(1);
 assert.equal(page.url(),url+'/');assert.equal(await page.getByRole('dialog',{name:'Subscription Center'}).isVisible(),false);
 const request=await page.evaluate(()=>window.billingRequests[0]);assert.equal(request.body.billingPeriod,'annual');assert.equal(request.body.planCode,'starter');
 await page.evaluate(()=>window.Paddle.complete());await expect.poll(()=>page.evaluate(()=>window.billingRefreshes)).toBeGreaterThan(0);
 await expect(page.getByText('Your subscription is active. Continue working in VAYON.',{exact:true}).first()).toBeVisible();
 evidence.interactions.push({checkout:'overlay transaction ID; annual plan retained; no navigation; confirmation refreshes server state',request});
 await page.getByRole('button',{name:'Cancel subscription',exact:true}).click();await expect(page.getByRole('dialog',{name:'Cancel at the end of this billing period?'})).toBeVisible();await page.getByRole('button',{name:'Keep subscription',exact:true}).click();assert.equal((await page.evaluate(()=>window.billingSubmissions??[])).length,0);
 await page.getByRole('button',{name:'Cancel subscription',exact:true}).click();await page.getByRole('button',{name:'Confirm cancellation',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.billingSubmissions?.length)).toBe(1);assert.equal(await page.evaluate(()=>window.billingSubmissions[0].intent),'cancel');
 await page.getByRole('button',{name:'Update payment method',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.billingCheckout.length)).toBe(2);assert.equal(await page.evaluate(()=>window.billingCheckout[1].transactionId),'txn_payment_qa');
 evidence.interactions.push({cancelRequiresConfirmation:true,paymentMethodUsesOverlay:true});
 for(const mode of ['expired','unconfigured','failure']){await page.goto(`${url}/?${mode}`);if(mode==='expired')await expect(page.getByText('Trial Complete',{exact:true}).first()).toBeVisible();else{await page.getByRole('button',{name:'Compare Plans',exact:true}).click();if(mode==='unconfigured')assert.equal(await page.getByRole('button',{name:'Upgrade to Starter'}).count(),0);else{await page.getByRole('button',{name:'Upgrade to Starter',exact:true}).click();await expect(page.getByText('Checkout could not open. Your workspace and data are safe. Please try again.',{exact:true}).last()).toBeVisible();}}await page.screenshot({path:`${output}/screenshots/${mode}.png`});}
 await page.goto(url);await page.getByRole('button',{name:'Compare Plans',exact:true}).click();for(let index=0;index<25;index++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('dialog[open]')),true);}evidence.interactions.push({keyboardFocusContained:true,inputsLabelled:await page.getByLabel('Legal company name',{exact:true}).count()===1});

 for(const theme of ['light','dark']){
  await page.setViewportSize({width:375,height:812});await page.goto(url);await page.evaluate(theme=>document.documentElement.dataset.vdsTheme=theme,theme);
  await page.getByRole('button',{name:'Compare Plans',exact:true}).click();await page.evaluate(async()=>{await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));await Promise.all(document.getAnimations().filter(animation=>Number.isFinite(animation.effect?.getComputedTiming().endTime)).map(animation=>animation.finished.catch(()=>{})));});
  const contrast=await page.getByRole('dialog',{name:'Subscription Center'}).evaluate(dialog=>{
   const rgb=value=>(value.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
   const lum=value=>rgb(value).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;}).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
   const bg=lum(getComputedStyle(dialog).backgroundColor);
   return [...dialog.querySelectorAll('h2, section > p')].filter(el=>el.textContent.trim()).map(el=>{const fg=lum(getComputedStyle(el).color);return {text:el.textContent,color:getComputedStyle(el).color,background:getComputedStyle(dialog).backgroundColor,ratio:(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)};});
  });await page.screenshot({path:`${output}/screenshots/comparison-${theme}-375.png`});for(const item of contrast)assert.ok(item.ratio>=4.5,JSON.stringify({theme,...item}));
  await page.screenshot({path:`${output}/screenshots/comparison-${theme}-375.png`});evidence.interactions.push({theme,contrast});
 }
 await page.setViewportSize({width:320,height:568});await page.goto(url);const notice=page.getByRole('complementary',{name:'Workspace trial'});const before=(await notice.boundingBox()).y;
 await page.locator('.vds-workspace-main').evaluate(el=>el.scrollTop=el.scrollHeight);assert.equal((await notice.boundingBox()).y,before);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);evidence.interactions.push({shortViewport:'320x568',noticeRemainsVisibleWithoutCoveringContent:true});
 assert.deepEqual(evidence.errors,[]);console.log('PASS commercial lifecycle component browser checks');
}finally{await writeFile(`${output}/browser-evidence.json`,JSON.stringify(evidence,null,2));await browser.close();await new Promise(done=>server.close(done));await unlink(`${output}/fixture.js`);await unlink(`${output}/fixture.css`);}
