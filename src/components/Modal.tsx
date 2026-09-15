import{Crown,UserRound}from'lucide-react';
import{DialogShell}from'./DialogShell';
export type ModalContent={kind:'account'|'membership'};
export function Modal({content,onClose}:{content:ModalContent;reduced?:boolean;onClose:()=>void}){return <DialogShell title={content.kind==='account'?'账号功能即将开放':'会员服务即将开放'} onClose={onClose}><div className="notice-icon">{content.kind==='account'?<UserRound size={30}/>:<Crown size={30}/>}</div><button className="primary-button" onClick={onClose}>继续逛逛</button></DialogShell>;}
