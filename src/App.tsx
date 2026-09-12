import { useLayoutEffect, useState } from 'react';
import { HomePage } from './HomePage';
import { PlayPage } from './components/PlayPage';
import { Modal } from './components/Modal';
import type { ModalContent } from './components/Modal';
import { Router, useRouter } from './navigation/Router';
import { useReducedMotion } from './hooks/useReducedMotion';

function Pages() {
  const {route}=useRouter();
  const [modal,setModal]=useState<ModalContent|null>(null);
  useLayoutEffect(()=>setModal(null),[route.key]);
  const reduced=useReducedMotion();
  const onAccount=()=>setModal({kind:'account'}), onMembership=()=>setModal({kind:'membership'});
  const match=route.path.match(/^\/play\/([^/]+)\/?$/);
  let id=''; try { id=match?decodeURIComponent(match[1]):''; } catch { /* malformed ID gets the not-found page */ }
  return <>{route.path==='/'?<HomePage onAccount={onAccount} onMembership={onMembership} blocked={!!modal}/>:<PlayPage key={id} id={id} onAccount={onAccount} onMembership={onMembership}/>}{modal&&<Modal content={modal} reduced={reduced} onClose={()=>setModal(null)}/>}</>;
}
export default function App(){return <Router><Pages/></Router>;}
