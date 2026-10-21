import * as THREE from '../assets/vendor/three.module.min.js';

// Aligned hand-drawn frames on a camera-facing sprite, without a character mesh.
const ATLAS_URL = new URL('../assets/media/avatar-anime-v1.png', import.meta.url).href;
// Boundaries follow the atlas's transparent gaps, not exact geometric thirds.
const ROW_EDGES = [0, .335, .657, 1];

export function createAvatar() {
  const root=new THREE.Group(),body=new THREE.Group();root.name='Sudarshan — 2D anime guide';root.add(body);root.userData.style='anime-2d';
  const textures=[],frames=[],previews=new Map();
  let loaded=false,currentRow=0,currentFrame=1,facingRight=false;
  // A small illustrated fallback keeps the lab usable if the asset cannot load.
  const placeholder=document.createElement('canvas');placeholder.width=256;placeholder.height=384;
  const ctx=placeholder.getContext('2d');ctx.strokeStyle='#182a27';ctx.lineWidth=6;ctx.lineJoin='round';
  ctx.fillStyle='#eea760';ctx.beginPath();ctx.roundRect(75,133,106,135,20);ctx.fill();ctx.stroke();
  ctx.fillStyle='#d59a70';ctx.beginPath();ctx.ellipse(128,91,48,59,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#20272a';ctx.beginPath();ctx.moveTo(76,78);ctx.lineTo(86,32);ctx.lineTo(113,17);ctx.lineTo(152,29);ctx.lineTo(181,58);ctx.lineTo(169,82);ctx.lineTo(143,62);ctx.lineTo(109,71);ctx.closePath();ctx.fill();
  for(const x of [94,137])ctx.strokeRect(x,86,30,23);ctx.beginPath();ctx.moveTo(124,96);ctx.lineTo(137,96);ctx.stroke();
  ctx.fillStyle='#343f43';ctx.fillRect(86,260,33,94);ctx.fillRect(137,260,33,94);ctx.fillStyle='#f2ecd4';ctx.fillRect(79,350,44,26);ctx.fillRect(133,350,44,26);
  const fallback=new THREE.CanvasTexture(placeholder);fallback.colorSpace=THREE.SRGBColorSpace;textures.push(fallback);
  const material=new THREE.SpriteMaterial({map:fallback,transparent:true,alphaTest:.05,depthWrite:false,toneMapped:false});
  const sprite=new THREE.Sprite(material);sprite.name='Animated anime illustration';sprite.center.set(.5,8/384);sprite.scale.set(2,3,1);body.add(sprite);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.38,32),new THREE.MeshBasicMaterial({color:0x041710,transparent:true,opacity:.24,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=.103;shadow.userData.noCastShadow=true;root.add(shadow);

  const image=new Image();image.decoding='async';
  const ready=new Promise(resolve=>{
    image.onload=()=>{
      const source=document.createElement('canvas');source.width=image.width;source.height=image.height;
      const sourceContext=source.getContext('2d',{willReadFrequently:true});sourceContext.drawImage(image,0,0);
      for(let row=0;row<3;row++){
        frames[row]=[];
        for(let col=0;col<4;col++){
          const x0=Math.round(col*image.width/4),x1=Math.round((col+1)*image.width/4),y0=Math.round(ROW_EDGES[row]*image.height),y1=Math.round(ROW_EDGES[row+1]*image.height);
          const pixels=sourceContext.getImageData(x0,y0,x1-x0,y1-y0),w=pixels.width,h=pixels.height;
          let left=w,right=0,top=h,bottom=0;
          for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pixels.data[(y*w+x)*4+3]>32){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
          const canvas=document.createElement('canvas');canvas.width=256;canvas.height=384;
          if(right>left&&bottom>top){const sw=right-left+1,sh=bottom-top+1,scale=Math.min(350/sh,242/sw),dw=sw*scale,dh=sh*scale;canvas.getContext('2d').drawImage(image,x0+left,y0+top,sw,sh,(256-dw)/2,376-dh,dw,dh);}
          const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=2;textures.push(texture);frames[row][col]=texture;
        }
      }
      loaded=true;setFrame(currentRow,currentFrame,facingRight);
      for(const [canvas,portrait]of previews)paintPreview(canvas,portrait);
      resolve(true);
    };
    image.onerror=()=>{root.userData.assetError=true;resolve(false);};
  });
  image.src=ATLAS_URL;
  function setFrame(row,frame,flip){
    currentRow=row;currentFrame=frame;facingRight=flip;
    const texture=loaded?frames[row][frame]:fallback;
    texture.repeat.x=flip?-1:1;texture.offset.x=flip?1:0;material.map=texture;
    root.userData.frame=['front','profile','back'][row]+'-'+frame+(flip?'-right':'');
  }
  function paintPreview(canvas,portrait=false){
    previews.set(canvas,portrait);const context=canvas.getContext('2d');context.clearRect(0,0,canvas.width,canvas.height);
    const source=loaded?frames[0][1].image:placeholder;
    if(portrait)context.drawImage(source,54,18,148,150,0,0,canvas.width,canvas.height);
    else{const scale=Math.min(canvas.width/256,canvas.height/384);context.drawImage(source,(canvas.width-256*scale)/2,(canvas.height-384*scale)/2,256*scale,384*scale);}
  }
  function pose(phase,amount=0,wave=0,time=phase,viewAngle=.45){
    const relative=Math.atan2(Math.sin(root.rotation.y-viewAngle),Math.cos(root.rotation.y-viewAngle));
    let row=currentRow;
    const facing=Math.cos(relative),threshold=currentRow===1?.64:.45;
    if(facing>threshold)row=0;else if(facing<-threshold)row=2;else if(Math.abs(facing)<.55)row=1;
    if(wave>.1)row=0;
    const moving=amount>.1,frame=moving?Math.floor(phase/(Math.PI*2)*4)%4:1;
    setFrame(row,frame,row===1&&Math.sin(relative)>0);
    body.position.y=.082+(moving?Math.abs(Math.sin(phase*2))*.025:Math.sin(time*1.8)*.005);
    material.rotation=moving?Math.sin(phase)*amount*.012:0;
    const height=Math.max(0,root.position.y+.082);shadow.position.y=.103-height;shadow.material.opacity=.24/(1+height*1.6);shadow.scale.setScalar(1/(1+height*.2));shadow.castShadow=false;
  }
  pose(0,0);
  return {root,body,pose,paintPreview,ready,get loaded(){return loaded;},dispose(){for(const texture of textures)texture.dispose();material.dispose();shadow.geometry.dispose();shadow.material.dispose();}};
}
