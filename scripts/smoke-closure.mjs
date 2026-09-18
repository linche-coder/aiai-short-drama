import{chromium}from'@playwright/test';
const browser=await chromium.launch({channel:process.env.PW_TEST_CHANNEL||'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const base=process.env.AIAI_PREVIEW_URL||'http://localhost:4173';
const checks=[];
async function visible(path,text){await page.goto(base+path);await page.getByText(text,{exact:false}).first().waitFor({state:'visible'});checks.push({path,text,ok:true});}
await visible('/account/login','账号服务待接入');
if(await page.getByRole('button',{name:/进入测试用户/}).count())throw new Error('production exposes demo identities');
await visible('/play/drama-05','片源待接入');
await visible('/admin/moderation','没有找到这个页面');
const media=await page.request.get(base+'/media/demo/landscape.mp4');
const contentType=media.headers()['content-type']||'';
if(contentType.startsWith('video/')||Number(media.headers()['content-length']||0)>100000)throw new Error(`demo media leaked with ${contentType}`);
checks.push({path:'/media/demo/landscape.mp4',status:media.status(),contentType,note:'SPA fallback only; no video bytes',ok:true});
console.log(JSON.stringify({ok:true,checks},null,2));
await browser.close();
