import * as THREE from './vendor/three.module.min.js';
import {SVGRenderer} from './vendor/SVGRenderer.js';
// One persistent scene; polling updates state without restarting animation or camera.
export function createOffice(host,onOpen){
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-9,9,6,-6,.1,90);
 let renderer,software=false;try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch{renderer=new SVGRenderer();software=true;renderer.setQuality('high');renderer.setClearColor(0x100d17,1);host.classList.add('ap-software');}
 renderer.setPixelRatio?.(Math.min(devicePixelRatio||1,1.6));if(renderer.shadowMap){renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;}renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
 renderer.domElement.setAttribute('aria-label','Draaibare 3D-werkvloer van Marleo. Opdrachtstatussen staan onder de werkvloer.');renderer.domElement.setAttribute('role','img');host.append(renderer.domElement);
 const hemi=new THREE.HemisphereLight(0xe8ddff,0x312131,2.5);scene.add(hemi);
 const key=new THREE.DirectionalLight(0xffe7d6,4);key.position.set(-6,14,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-10,right:10,top:9,bottom:-9});key.shadow.normalBias=.04;scene.add(key);
 const pink=new THREE.PointLight(0xff347f,28,18,2);pink.position.set(6,4,-3);scene.add(pink);const orange=new THREE.PointLight(0xff8a36,25,17,2);orange.position.set(-6,4,-4);scene.add(orange);if(software){key.intensity=.8;pink.intensity=.04;orange.intensity=.04;scene.add(new THREE.AmbientLight(0xded4ed,1.2));}
 const mats=new Map();function mat(c,metal=0){const k=c+':'+metal;if(!mats.has(k))mats.set(k,new THREE.MeshStandardMaterial({color:c,roughness:.58,metalness:metal}));return mats.get(k);}
 const geometries=[];function mesh(g,m,parent,x=0,y=0,z=0){geometries.push(g);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 function box(w,h,d,c,p,x,y,z){return mesh(new THREE.BoxGeometry(w,h,d),mat(c),p,x,y,z);}
 function ball(r,c,p,x,y,z,sx=1,sy=1,sz=1){const o=mesh(new THREE.SphereGeometry(r,software?8:16,software?5:10),mat(c),p,x,y,z);o.scale.set(sx,sy,sz);return o;}
 function pill(w,d,h,r,c,p,x,y,z){const s=new THREE.Shape(),a=-w/2,b=-d/2;s.moveTo(a+r,b);s.lineTo(a+w-r,b);s.quadraticCurveTo(a+w,b,a+w,b+r);s.lineTo(a+w,b+d-r);s.quadraticCurveTo(a+w,b+d,a+w-r,b+d);s.lineTo(a+r,b+d);s.quadraticCurveTo(a,b+d,a,b+d-r);s.lineTo(a,b+r);s.quadraticCurveTo(a,b,a+r,b);const g=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelThickness:.035,bevelSize:.035,bevelSegments:software?1:3,steps:1,curveSegments:software?2:8});g.rotateX(-Math.PI/2);return mesh(g,mat(c),p,x,y,z);}
 function cylinder(r,h,c,p,x,y,z){return mesh(new THREE.CylinderGeometry(r,r,h,software?6:16),mat(c),p,x,y,z);}
 function limb(a,b,r,c,p){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const o=mesh(new THREE.CylinderGeometry(r,r*.92,delta.length(),software?6:12),mat(c),p,...av.clone().add(bv).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());ball(r,c,p,...a);ball(r*.92,c,p,...b);return o;}
 const room=new THREE.Group();scene.add(room);
 pill(12.3,9,.22,.45,0x282333,room,0,-.23,0);
 box(12,.035,.045,0xf36b57,room,0,.02,-4.18);box(.045,.035,8.2,0xc83f78,room,-5.9,.02,0);
 box(12.2,1.15,.12,0x292231,room,0,.48,-4.4);box(.12,1.15,8.8,0x211e2c,room,-6.1,.48,0);
 for(let x=-5;x<=5;x++)box(.012,.005,8.2,0x393141,room,x,.005,0);
 for(let z=-4;z<=4;z++)box(11.8,.005,.012,0x393141,room,0,.005,z);
 // Brand wall, rendered locally without sending company data to an external service.
 const brand=document.createElement('canvas');brand.width=1024;brand.height=200;const bc=brand.getContext('2d');bc.clearRect(0,0,1024,200);const grad=bc.createLinearGradient(0,0,1024,0);grad.addColorStop(0,'#ff8b2d');grad.addColorStop(1,'#f32283');bc.strokeStyle=grad;bc.lineWidth=9;bc.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i-Math.PI/2;const x=95+65*Math.cos(a),y=100+65*Math.sin(a);i?bc.lineTo(x,y):bc.moveTo(x,y);}bc.closePath();bc.stroke();bc.fillStyle='#fff';bc.font='bold 53px monospace';bc.fillText('</>',45,119);bc.font='bold 102px Arial';bc.fillText('marleo',200,138);bc.fillStyle=grad;bc.fillText('.tech',535,138);const bt=new THREE.CanvasTexture(brand);bt.colorSpace=THREE.SRGBColorSpace;const bm=new THREE.MeshBasicMaterial({map:bt,transparent:true,side:THREE.DoubleSide});if(!software)mesh(new THREE.PlaneGeometry(4.4,.86),bm,room,0,1.13,-4.31);
 function plant(x,z){cylinder(.24,.48,0x665063,room,x,.24,z);for(let i=0;i<7;i++){const a=i*2.4;const leaf=ball(.26,i%2?0x38645e:0x4f8071,room,x+Math.cos(a)*.17,.65+i*.045,z+Math.sin(a)*.17,.38,1.6,.7);leaf.rotation.z=Math.cos(a)*.6;}}
 plant(-5.35,-3.65);plant(5.35,-3.65);plant(5.35,3.5);
 let rows=[];const agents=[],hit=[],positions=[[-3.6,-2],[0,-2],[3.6,-2],[-3.6,1.9],[0,1.9],[3.6,1.9]],shirts=[0x655a82,0x8b5578,0x416d75,0x8c6857,0x695b8e,0x456877];
 const overlay=document.createElement('div');overlay.className='ap-3d-labels';host.append(overlay);
 positions.forEach(([x,z],i)=>{
  const g=new THREE.Group();g.position.set(x,0,z);room.add(g);
  pill(2.65,1.35,.12,.18,0x524657,g,0,1.02,0);
  for(const xx of [-1.05,1.05])for(const zz of [-.43,.43])cylinder(.045,1,0x222333,g,xx,.5,zz);
  const screenGroup=new THREE.Group();screenGroup.position.set(0,1.52,-.34);screenGroup.rotation.x=-.09;g.add(screenGroup);
  const chassis=box(1.24,.77,.085,0x141421,screenGroup,0,0,0);chassis.userData.station=i;hit.push(chassis);
  const screenMat=new THREE.MeshStandardMaterial({color:0x18232d,emissive:0x2c3860,emissiveIntensity:.16,roughness:.3});mesh(new THREE.PlaneGeometry(1.12,.65),screenMat,screenGroup,0,0,.045);
  const bars=[];for(let k=0;k<5;k++){const bar=mesh(new THREE.BoxGeometry(.47+(k%3)*.16,.018,.008),new THREE.MeshBasicMaterial({color:k===0?0xe59777:0x7f809e}),screenGroup,-.13+k%2*.09,.19-k*.09,.053);bars.push(bar);}
  cylinder(.035,.28,0x292537,g,0,1.2,-.35);pill(.45,.3,.035,.07,0x262231,g,0,1.1,-.35);
  pill(.76,.28,.025,.035,0x252232,g,-.08,1.18,.27);for(let k=0;k<3;k++)box(.6,.007,.015,0x68576e,g,-.08,1.213,.18+k*.065);
  ball(.095,0x9c899e,g,.53,1.19,.27,1,.4,1.3);cylinder(.08,.19,0xa87666,g,-1,1.24,-.2);
  // Ergonomic chair and softly rounded, jointed figure.
  cylinder(.06,.45,0x30303d,g,0,.32,.86);pill(.66,.57,.1,.16,0x33323f,g,0,.58,.85);pill(.64,.22,.5,.12,0x353441,g,0,.65,1.12);
  for(let k=0;k<5;k++){const a=k*Math.PI*2/5;limb([0,.11,.86],[Math.cos(a)*.4,.08,.86+Math.sin(a)*.4],.023,0x44404e,g);ball(.055,0x191923,g,Math.cos(a)*.4,.065,.86+Math.sin(a)*.4);}
  limb([-.16,.69,.79],[-.19,.42,.38],.095,0x29293c,g);limb([.16,.69,.79],[.19,.42,.38],.095,0x29293c,g);limb([-.19,.42,.38],[-.19,.12,.4],.07,0x29293c,g);limb([.19,.42,.38],[.19,.12,.4],.07,0x29293c,g);ball(.11,0x171722,g,-.19,.09,.3,1,.55,1.5);ball(.11,0x171722,g,.19,.09,.3,1,.55,1.5);
  const body=new THREE.Group();body.position.set(0,.72,.79);g.add(body);ball(.27,shirts[i],body,0,.28,0,1,1.45,.72);
  const head=new THREE.Group();head.position.set(0,.84,-.035);body.add(head);ball(.21,0xcaa18b,head,0,0,0,.92,1.08,.92);ball(.212,i%2?0x352a2b:0x282536,head,0,.10,.035,1,.72,.95);ball(.055,0xcaa18b,head,0,-.025,-.195,.5,.7,.7);
  const hands=[];for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.23,.48,-.025);body.add(arm);limb([0,0,0],[side*.07,-.19,-.18],.065,shirts[i],arm);limb([side*.07,-.19,-.18],[side*.015,-.07,-.42],.05,0xcaa18b,arm);ball(.065,0xcaa18b,arm,side*.015,-.07,-.42,1,.55,1.2);hands.push(arm);}
  const ringMat=new THREE.MeshBasicMaterial({color:0x6b536c,transparent:true,opacity:.4});const ring=mesh(new THREE.TorusGeometry(.47,.012,software?3:6,software?12:50),ringMat,g,0,.025,.86);ring.rotation.x=-Math.PI/2;
  const label=document.createElement('button');label.type='button';label.className='ap-3d-label';label.innerHTML='<span></span><small></small>';label.onclick=()=>{if(rows[i]?.job)onOpen(rows[i].job.id);};overlay.append(label);
  agents.push({g,body,head,hands,bars,screenMat,ringMat,label,state:'waiting',phase:i*1.87});
 });
 let animated=true;let angle=.48,targetAngle=.48,zoom=1,disposed=false,visible=true,lastFrame=0,frame=0,drag=null,dragged=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function resize(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);const aspect=width/height,span=Math.max(5.8,7.6/aspect)/zoom;camera.left=-span*aspect;camera.right=span*aspect;camera.top=span;camera.bottom=-span;camera.updateProjectionMatrix();}
 const observer=new ResizeObserver(resize);observer.observe(host);const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;});io.observe(host);
 const point=new THREE.Vector3();
 function draw(ms){if(disposed)return;frame=requestAnimationFrame(draw);if(!host.isConnected||document.hidden||!visible||ms-lastFrame<(software?500:32))return;lastFrame=ms;const t=ms/1000;angle+=(targetAngle-angle)*.09;camera.position.set(Math.sin(angle)*20,17,Math.cos(angle)*20);camera.lookAt(0,.4,0);
  agents.forEach((a,i)=>{const active=a.state==='working',motion=animated&&!reduced.matches;const f=t+a.phase;
   a.body.rotation.z=motion?Math.sin(f*.8)*.025:0;a.body.rotation.y=motion&&!active?Math.sin(f*.4)*.1:0;a.head.rotation.y=motion?Math.sin(f*(active?1.3:.3))*(active?.045:.07):0;
   a.hands.forEach((h,k)=>{h.rotation.x=!motion?0:active?Math.sin(f*7+k*2)*.09:Math.sin(f*.6+k)*.07;h.rotation.z=active&&motion?Math.sin(f*6+k)*.04:0;});
   a.bars.forEach((b,k)=>{b.scale.x=active&&motion?.6+.4*(.5+.5*Math.sin(f*1.7+k)):1;b.material.color.set(active?(k%2?0xf2829d:0xffb273):0x667087);});
   point.set(a.g.position.x,.12,a.g.position.z+1.6).project(camera);a.label.style.left=((point.x*.5+.5)*100)+'%';a.label.style.top=((-point.y*.5+.5)*100)+'%';
  });renderer.render(scene,camera);
 }
 renderer.domElement.addEventListener('pointerdown',ev=>{drag={x:ev.clientX,angle:targetAngle};dragged=false;renderer.domElement.setPointerCapture(ev.pointerId);});
 renderer.domElement.addEventListener('pointermove',ev=>{if(drag){const dx=ev.clientX-drag.x;if(Math.abs(dx)>5)dragged=true;targetAngle=Math.max(-.75,Math.min(.95,drag.angle+dx*.004));}});
 renderer.domElement.addEventListener('pointerup',()=>{drag=null;});renderer.domElement.addEventListener('pointercancel',()=>{drag=null;});
 renderer.domElement.addEventListener('webglcontextlost',ev=>{ev.preventDefault();host.classList.add('ap-3d-unavailable');host.setAttribute('data-error','3D onderbroken. Je opdrachten blijven beschikbaar hieronder.');});
 resize();frame=requestAnimationFrame(draw);
 return {update(next){rows=next;agents.forEach((a,i)=>{const s=rows[i];a.state=s.state;a.label.querySelector('span').textContent=s.name;a.label.querySelector('small').textContent=s.state==='working'?'Aan het werk':s.state==='done'?'Afgerond':s.state==='failed'?'Aandacht nodig':s.state==='unknown'?'Update ontbreekt':'Beschikbaar';a.label.className='ap-3d-label '+s.state;a.label.disabled=!s.job;a.screenMat.emissive.set(s.state==='working'?0xff7964:0x344269);a.screenMat.emissiveIntensity=s.state==='working'?.65:.15;a.ringMat.color.set(s.state==='working'?0xff795d:s.state==='failed'?0xe14f6e:0x6b536c);a.ringMat.opacity=s.state==='working'?.9:.3;});},isAnimating(){return animated;},toggleMotion(){animated=!animated;return animated;},rotate(d){targetAngle=Math.max(-.75,Math.min(.95,targetAngle+d));},reset(){targetAngle=.48;zoom=1;resize();},dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();io.disconnect();geometries.forEach(g=>g.dispose());scene.traverse(o=>{if(o.material){[].concat(o.material).forEach(m=>{m.map?.dispose();m.dispose();});}});renderer.dispose?.();host.replaceChildren();}};
}
