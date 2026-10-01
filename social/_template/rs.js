const {chromium}=require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch();
const p=await b.newPage({viewport:{width:1080,height:1350}});await p.goto('file://'+__dirname+'/post.html#11');await p.waitForTimeout(700);await p.screenshot({path:'/tmp/p11.png'});
const s=await b.newPage({viewport:{width:1080,height:1920}});await s.goto('file://'+__dirname+'/story.html');await s.waitForTimeout(700);await s.screenshot({path:'/tmp/s1.png'});
await b.close()})()
