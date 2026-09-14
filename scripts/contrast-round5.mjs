import fs from 'node:fs';
const colors=['#b84138','#bd2862','#8740ac'];
const rgb=colors.map(c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)));
const luminance=c=>c.map(v=>{v=Math.min(255,v)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
const contrast=(bg,factor)=>(luminance([255,255,255].map(v=>v*factor))+.05)/(luminance(bg.map(v=>v*factor))+.05);
const result={colors,samples:1001,normal:Infinity,hover:Infinity,active:Infinity,method:'WCAG sRGB luminance; CSS brightness applies to both background and foreground; white clips at 255 for hover.'};
for(let i=0;i<=1000;i++){const x=i/1000,segment=x<.56?0:1,t=segment===0?x/.56:(x-.56)/.44;const c=rgb[segment].map((v,k)=>v+(rgb[segment+1][k]-v)*t);result.normal=Math.min(result.normal,contrast(c,1));result.hover=Math.min(result.hover,contrast(c,1.04));result.active=Math.min(result.active,contrast(c,.94));}
fs.writeFileSync('docs/round-5/contrast.json',JSON.stringify(result,null,2));console.log(result);
const p='ROUND5-VERIFICATION.md';fs.writeFileSync(p,fs.readFileSync(p,'utf8').replace('active 6.01:1',`active ${result.active.toFixed(2)}:1`));
