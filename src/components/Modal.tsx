import { useLayoutEffect, useRef } from 'react';
import { Crown, UserRound, X } from 'lucide-react';
import { timing } from '../config';
import { useRouter } from '../navigation/Router';
export type ModalContent = { kind:'account'|'membership' };
export function Modal({content,reduced,onClose}:{content:ModalContent;reduced:boolean;onClose:()=>void}) {
  const dialogRef=useRef<HTMLDialogElement>(null), requestClose=useRef(()=>{}), done=useRef(onClose);
  const {route}=useRouter();done.current=onClose;
  useLayoutEffect(()=>{
    const dialog=dialogRef.current!, trigger=document.activeElement as HTMLElement|null, overflow=document.body.style.overflow;
    let disposed=false,closing=false; const animations:Animation[]=[];
    document.body.style.overflow='hidden';dialog.dataset.phase='open';dialog.showModal();
    requestClose.current=()=>{
      if(disposed||closing)return;closing=true;dialog.dataset.phase='closing';
      const finish=()=>{if(!disposed){dialog.close();done.current();}};
      if(reduced){finish();return;}
      const animation=dialog.animate([{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.97)'}],{duration:timing.modalClose,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'});
      animations.push(animation);void animation.finished.then(finish,()=>{});
    };
    return()=>{disposed=true;requestClose.current=()=>{};animations.forEach(animation=>animation.cancel());dialog.close();document.body.style.overflow=overflow;if(trigger?.isConnected)trigger.focus({preventScroll:true});};
  },[reduced,route.path]);
  return <dialog ref={dialogRef} className="modal notice-modal" style={{'--modal-close-duration':`${reduced?0:timing.modalClose}ms`} as React.CSSProperties} aria-labelledby="modal-title" onCancel={e=>{e.preventDefault();requestClose.current();}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)requestClose.current();}}}>
    <button className="modal-close icon-button" aria-label="关闭弹层" onClick={()=>requestClose.current()} autoFocus><X size={21}/></button>
    <div className="notice-content"><div className="notice-icon">{content.kind==='account'?<UserRound size={30}/>:<Crown size={30}/>}</div><span className="eyebrow">即将与你见面</span><h2 id="modal-title">{content.kind==='account'?'账号功能即将开放':'会员服务即将开放'}</h2><p>{content.kind==='account'?'属于你的故事空间，正在准备中。\n先去发现下一部心动短剧吧。':'更多精彩体验，正在用心筹备。\n期待与你一起，走进更多好故事。'}</p><button className="primary-button" onClick={()=>requestClose.current()}>继续逛逛</button></div>
  </dialog>;
}
