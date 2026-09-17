const prefix='aiai:account-avatar:';
const listeners=new Set<()=>void>();
const key=(userId:string)=>`${prefix}${userId}`;
const emit=()=>listeners.forEach(listener=>listener());

export const avatarStore={
 subscribe(listener:()=>void){listeners.add(listener);return()=>listeners.delete(listener);},
 get(userId:string|null|undefined){if(!userId)return null;try{return localStorage.getItem(key(userId));}catch{return null;}},
 set(userId:string,value:string){localStorage.setItem(key(userId),value);emit();},
 remove(userId:string){localStorage.removeItem(key(userId));emit();},
 async fromFile(userId:string,file:File){
  if(!/^image\/(?:jpeg|png|webp)$/.test(file.type))throw new Error('请选择 JPG、PNG 或 WebP 图片。');
  if(file.size>5*1024*1024)throw new Error('图片不能超过 5MB。');
  const source=await createImageBitmap(file),side=Math.min(source.width,source.height),sx=(source.width-side)/2,sy=(source.height-side)/2,canvas=document.createElement('canvas');
  canvas.width=256;canvas.height=256;const context=canvas.getContext('2d');if(!context){source.close();throw new Error('当前浏览器无法处理这张图片。');}
  context.drawImage(source,sx,sy,side,side,0,0,256,256);source.close();const value=canvas.toDataURL('image/jpeg',.86);avatarStore.set(userId,value);return value;
 },
};

if(typeof window!=='undefined')window.addEventListener('storage',event=>{if(event.key?.startsWith(prefix))emit();});
