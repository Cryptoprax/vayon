import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';
const require=createRequire(import.meta.url),root=process.cwd(),output=resolve('test-results/layout-system');
await mkdir(`${output}/screenshots`,{recursive:true});
const webpack=require('next/dist/compiled/webpack/webpack');
await new Promise((done,reject)=>webpack.webpack({mode:'development',devtool:false,entry:resolve('tests/fixtures/layout-system/entry.jsx'),output:{path:output,filename:'fixture.js'},resolve:{extensions:['.tsx','.ts','.jsx','.js'],alias:{'@':root,'next/link$':resolve('tests/fixtures/workspace-unification/link.jsx'),'@/features/platform/design-system$':resolve('features/platform/design-system/components/core/Actions.tsx')}},module:{rules:[{test:/\.[jt]sx?$/,exclude:/node_modules/,use:resolve('tests/fixtures/layout-system/loader.mjs')}]}},(error,stats)=>error||stats.hasErrors()?reject(error||new Error(stats.toString({all:false,errors:true}))):done()));
const postcss=require('postcss'),tailwind=require('@tailwindcss/postcss');
const css=await postcss([tailwind()]).process(await readFile('app/globals.css','utf8'),{from:resolve('app/globals.css')});
await writeFile(`${output}/fixture.css`,css.css);
const html='<!doctype html><html lang="en" data-vds-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Layout system QA</title><link rel="stylesheet" href="/fixture.css"></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>';
const server=createServer(async(req,res)=>{if(req.url==='/fixture.js'||req.url==='/fixture.css'){res.setHeader('Content-Type',req.url.endsWith('.css')?'text/css':'text/javascript');res.end(await readFile(output+req.url));}else{res.setHeader('Content-Type','text/html');res.end(html);}});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true});
const evidence={environment:'Local Chromium; actual shared layouts and selected product components; explicit QA records. Not authenticated production certification.',screens:[],interactions:[],errors:[]};
try{
 const page=await browser.newPage({reducedMotion:'reduce'}),url=`http://127.0.0.1:${server.address().port}`;
 page.on('pageerror',e=>evidence.errors.push(e.message));
 for(const width of (process.argv.includes("--interactions-only")?[]:[320,375,768,1024,1280,1440,1600,1920,2560])){
  let reference;
  for(const workspace of ['properties','leads','clients','companies','growth','table','empty','form','pipeline','data']){
   await page.setViewportSize({width,height:1000});await page.goto(`${url}/?workspace=${workspace}`);await page.locator('h1').waitFor();
   const geometry=await page.evaluate(()=>{
    const header=document.querySelector('.vds-workspace-header'),table=document.querySelector('.vds-workspace-table'),main=document.querySelector('.vds-workspace-main'),dock=document.querySelector('[data-workspace-assistant]');
    const overflow=[...document.querySelectorAll('.vds-workspace-main *')].filter(e=>{const c=getComputedStyle(e);if(e.closest('thead')&&getComputedStyle(e.closest('thead')).position==='absolute')return false;return e.getBoundingClientRect().width>1&&c.position!=='absolute'&&c.position!=='fixed'&&!['INPUT','SELECT','OPTION','TEXTAREA','SVG','PATH'].includes(e.tagName)&&e.scrollWidth>e.clientWidth+2;}).map(e=>({tag:e.tagName,class:e.className})).slice(0,10);
    return{documentOverflow:document.documentElement.scrollWidth>innerWidth,overflow,headerLeft:header.getBoundingClientRect().left,headerWidth:header.getBoundingClientRect().width,titleSize:getComputedStyle(document.querySelector('h1')).fontSize,oneBreadcrumb:[...document.querySelectorAll('[aria-label="Breadcrumb"]')].filter(e=>e.getBoundingClientRect().height>0).length===1,tableOverflow:table?table.scrollWidth>table.clientWidth+1:false,assistantOverlap:dock.getBoundingClientRect().top<main.getBoundingClientRect().bottom-1};
   });
   assert.equal(geometry.documentOverflow,false,`${workspace}/${width}: document overflow`);
   assert.deepEqual(geometry.overflow,[],`${workspace}/${width}: clipped or scrolling content`);
   assert.equal(geometry.tableOverflow,false,`${workspace}/${width}: table overflow`);
   assert.equal(geometry.assistantOverlap,false,`${workspace}/${width}: assistant overlap`);
   assert.equal(geometry.oneBreadcrumb,true,`${workspace}/${width}: breadcrumb`);
   if(!reference)reference=geometry;
   assert.equal(geometry.headerLeft,reference.headerLeft,`${workspace}/${width}: header position`);
   assert.equal(geometry.headerWidth,reference.headerWidth,`${workspace}/${width}: header width`);
   assert.equal(geometry.titleSize,reference.titleSize,`${workspace}/${width}: title hierarchy`);
   const toggle=page.getByRole('button',{name:'Open assistant',exact:true});await toggle.focus();await page.keyboard.press('Enter');await page.getByLabel('Ask assistant',{exact:true}).waitFor();
   assert.equal(await page.evaluate(()=>document.querySelector('[data-workspace-assistant]').getBoundingClientRect().top<document.querySelector('.vds-workspace-main').getBoundingClientRect().bottom-1),false,'open assistant uses reserved space');
   await page.getByLabel('Ask assistant',{exact:true}).focus();await page.keyboard.press('Escape');assert.equal(await toggle.evaluate(e=>e===document.activeElement),true);
   await page.locator('.vds-workspace-main').evaluate(e=>e.scrollTop=e.scrollHeight);
   assert.equal(await page.getByRole('link',{name:'Next',exact:true}).isVisible(),true);
   await page.locator('.vds-workspace-main').evaluate(e=>e.scrollTop=0);
   const scroller=page.getByRole('region',{name:'Workspace content',exact:true});if(await scroller.evaluate(e=>e.scrollHeight>e.clientHeight+1)){await scroller.focus();await page.keyboard.press('PageDown');await expect.poll(()=>scroller.evaluate(e=>e.scrollTop)).toBeGreaterThan(0);await scroller.evaluate(e=>e.scrollTop=0);}
   const screenshot=`screenshots/${workspace}-${width}.png`;await page.screenshot({path:`${output}/${screenshot}`});evidence.screens.push({workspace,width,...geometry,screenshot,passed:true});
  }
 }
 await page.goto(`${url}/?workspace=table`);await page.getByRole('button',{name:'Add QA row'}).click();await page.locator('tbody tr').nth(3).waitFor();
 assert.equal(await page.locator('tbody tr').nth(3).locator('td').last().getAttribute('data-label'),'Actions');
 await page.getByRole('button',{name:'Update record 1',exact:true}).click();assert.deepEqual(await page.evaluate(()=>window.saved),{recordId:'0'});
 assert.equal(await page.getByRole('columnheader',{name:'Email',exact:true}).count(),1);
 assert.equal(await page.getByRole('rowheader',{name:'QA Record 1',exact:true}).count(),1);
 evidence.interactions.push({updatedRowLabels:true,existingFormPayload:true,nativeHeaderRoles:true});
 await page.goto(`${url}/?workspace=leads`);await page.getByRole('textbox',{name:'Quick search leads'}).fill('QA buyer');await page.getByRole('button',{name:'Apply filters'}).click();assert.ok(new URL(page.url()).searchParams.get('search')==='QA buyer');evidence.interactions.push({searchFormPreservesSubmission:true});
 await page.goto(`${url}/?workspace=data`);await page.getByRole('checkbox',{name:'Select row 1',exact:true}).check();assert.equal(await page.getByRole('checkbox',{name:'Select row 1',exact:true}).isChecked(),true);
 await page.locator('tbody tr').first().focus();await page.keyboard.press('ArrowDown');assert.equal(await page.locator('tbody tr').nth(1).evaluate(e=>e===document.activeElement),true);evidence.interactions.push({configurableTableSelection:true,keyboardRowNavigation:true});
 await page.setViewportSize({width:1920,height:1000});await page.goto(`${url}/?workspace=data`);const nameHeader=page.getByRole('columnheader',{name:'name Resize name column',exact:true});await nameHeader.waitFor();const initialWidth=await nameHeader.evaluate(e=>e.getBoundingClientRect().width);const handle=await page.getByRole('button',{name:'Resize name column',exact:true}).boundingBox();await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);await page.mouse.down();await page.mouse.move(handle.x+handle.width/2+90,handle.y+handle.height/2);await page.mouse.up();await expect.poll(()=>nameHeader.evaluate(e=>e.getBoundingClientRect().width)).toBeGreaterThan(initialWidth);assert.equal(await page.locator('table').evaluate(e=>e.scrollWidth>e.clientWidth+1),false);
 await page.getByText('Columns',{exact:true}).click();await page.getByRole('checkbox',{name:'email',exact:true}).uncheck();assert.equal(await page.getByRole('columnheader',{name:'email Resize email column',exact:true}).count(),0);await page.getByRole('checkbox',{name:'email',exact:true}).check();await page.getByText('Columns',{exact:true}).click();const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export CSV',exact:true}).click();assert.ok((await download).suggestedFilename().endsWith('.csv'));evidence.interactions.push({columnResizeWithinWidth:true,columnVisibility:true,existingCsvExport:true});
 for(const width of [375,1024]){await page.setViewportSize({width,height:1000});await page.goto(`${url}/?workspace=before`);await page.locator('table').waitFor();assert.equal(await page.locator('table').evaluate(e=>e.parentElement.scrollWidth>e.parentElement.clientWidth),true);await page.screenshot({path:`${output}/screenshots/before-table-${width}.png`});evidence.interactions.push({beforeWidth:width,originalTableHorizontalScroll:true});}
 for(const [width,height]of [[320,568],[375,667],[768,1024]]){await page.setViewportSize({width,height});await page.goto(`${url}/?workspace=properties`);await page.locator('h1').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.getByRole('button',{name:'Open assistant',exact:true}).click();assert.equal(await page.evaluate(()=>document.querySelector('[data-workspace-assistant]').getBoundingClientRect().top<document.querySelector('.vds-workspace-main').getBoundingClientRect().bottom-1),false);await page.getByRole('button',{name:'Close assistant',exact:true}).click();await page.screenshot({path:`${output}/screenshots/short-${width}-${height}.png`});evidence.interactions.push({width,height,shortViewportNoOverflow:true,assistantNoOverlap:true});}
 for(const [theme,width] of [['dark',375],['light',375],['dark',1440],['light',1440]]){
  await page.setViewportSize({width,height:1000});
  await page.goto(`${url}/?workspace=empty`);await page.locator('h1').waitFor();await page.evaluate(async t=>{document.documentElement.dataset.vdsTheme=t;await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));await Promise.all(document.getAnimations().filter(a=>a.effect?.getComputedTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));},theme);
  const ratios=await page.evaluate(()=>{const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number),lum=s=>rgb(s).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0),header=document.querySelector('.vds-workspace-header'),bg=lum(getComputedStyle(header).backgroundColor);return [...header.querySelectorAll('h1,.vds-workspace-description')].map(e=>{const fg=lum(getComputedStyle(e).color);return(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);});});
  assert.ok(ratios.every(x=>x>=4.5));await page.screenshot({path:`${output}/screenshots/empty-${theme}-${width}.png`});evidence.interactions.push({theme,width,headerContrastRatios:ratios});
 }
 await page.goto(`${url}/?workspace=properties`);await page.getByRole('button',{name:'Open assistant',exact:true}).waitFor();await page.evaluate(()=>{const dialog=document.createElement('dialog');dialog.id='qa-modal';dialog.textContent='QA modal';document.body.append(dialog);dialog.showModal();});await expect(page.locator('.vds-workspace-assistant')).toBeHidden();await page.evaluate(()=>{document.querySelector('#qa-modal').close();document.querySelector('#qa-modal').remove();});await page.getByRole('button',{name:'Open assistant',exact:true}).waitFor();await page.evaluate(()=>{const drawer=document.createElement('aside');drawer.id='qa-drawer';drawer.setAttribute('role','dialog');drawer.setAttribute('aria-modal','true');drawer.textContent='QA drawer';document.body.append(drawer);});await expect(page.locator('.vds-workspace-assistant')).toBeHidden();await page.evaluate(()=>document.querySelector('#qa-drawer').remove());await page.getByRole('button',{name:'Open assistant',exact:true}).waitFor();evidence.interactions.push({nativeModalHidesDock:true,portalDrawerHidesDock:true,dockRestoredAfterDismissal:true});
 assert.deepEqual(evidence.errors,[]);
}finally{await browser.close();server.close();await Promise.all([unlink(`${output}/fixture.js`),unlink(`${output}/fixture.css`)]);await writeFile(`${output}/browser-evidence.json`,JSON.stringify(evidence,null,2));}
console.log(`Passed ${evidence.screens.length} responsive presentations and keyboard/form/contrast checks.`);
