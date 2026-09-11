import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const dir='test-results/property-experience';
const html=fs.readFileSync(path.join(dir,'detail.html'),'utf8');
const css=fs.readdirSync('.next/static/chunks').filter(file=>file.endsWith('.css')).map(file=>fs.readFileSync(path.join('.next/static/chunks',file),'utf8')).join('\n');
assert.ok(css.length>0,'Production CSS required; run the production build first');
const browser=await chromium.launch({headless:true});
const results=[];
try {
 for(const width of [390,768,1440,1920]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.setContent(`<html lang="en"><head><title>Property experience fixture</title><style>${css}</style></head><body class="vayon-product"><main style="padding:64px 16px 0">${html}</main></body></html>`);
  await page.getByRole('heading',{name:'Broker QA Property',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow at ${width}`);
  assert.equal(await page.getByRole('navigation',{name:'Breadcrumb',exact:true}).count(),1);
  assert.equal(await page.getByRole('link',{name:'Insights',exact:true}).count(),0);
  for(const label of ['Complete property details','Generate Brochure','Match Buyers','Schedule Viewing'])assert.equal(await page.getByRole('link',{name:label,exact:false}).isVisible(),true,label);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement?.tagName),'A');
  await page.screenshot({path:path.join(dir,`detail-${width}.png`),fullPage:true});
  await page.evaluate(()=>{const description=document.createElement('p');description.textContent='Recorded property description. '.repeat(1500);document.querySelector('[aria-labelledby="property-details"]').append(description);});
  await page.evaluate(()=>scrollTo(0,500));
  const top=await page.locator('header').evaluate(el=>el.getBoundingClientRect().top);
  assert.ok(Math.abs(top-64)<2,`header detached at ${width}: ${top}`);
  results.push({width,noHorizontalOverflow:true,oneBreadcrumb:true,keyboardLinkFocus:true,actionsVisible:true,stickyHeaderTop:top});
  await page.close();
 }
 const inventory=fs.readFileSync(path.join(dir,'inventory.html'),'utf8');
 for(const width of [390,768,1440,1920]){
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.setContent(`<html lang="en"><head><title>Property inventory fixture</title><style>${css}</style></head><body class="vayon-product"><main style="padding:64px 16px 0">${inventory}</main></body></html>`);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`inventory overflow at ${width}`);
  assert.equal(await page.getByRole('heading',{name:'Needs attention on this page'}).isVisible(),true);
  assert.equal(await page.getByText('Unavailable',{exact:true}).count(),0);
  await page.screenshot({path:path.join(dir,`inventory-${width}.png`),fullPage:true});
  results.push({view:'inventory',width,noHorizontalOverflow:true,attentionVisible:true,noUnavailableCards:true});
  await page.close();
 }
 fs.writeFileSync(path.join(dir,'browser-audit.json'),JSON.stringify({scope:'Actual server page markup with fixture properties, actual VDS buttons and production CSS; Next links are native anchors; no authenticated shell or backend. Long description added to test scrolling.',results},null,2));
 console.log('Property experience browser audit passed at 390, 768, 1440 and 1920px');
}finally{await browser.close();}
