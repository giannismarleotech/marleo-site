// Gebruik: cd social/_template && npm i @fontsource/inter @fontsource/space-grotesk && node render.js 1 9 ../2026-10
const {chromium}=require(process.env.PW||'playwright');
const [a,b,out]=[+process.argv[2]||1,+process.argv[3]||9,process.argv[4]||'.'];
(async()=>{const br=await chromium.launch();const p=await br.newPage({viewport:{width:1080,height:1350}});
for(let i=a;i<=b;i++){await p.goto('file://'+__dirname+'/post.html#'+i);await p.reload();await p.waitForTimeout(500);await p.screenshot({path:out+'/post-'+String(i).padStart(2,'0')+'.png'})}
await br.close()})();
