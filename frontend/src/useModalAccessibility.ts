import {useEffect,useRef} from 'react';
export function useModalAccessibility(open:boolean,onClose:()=>void,selector:string){
 const close=useRef(onClose);close.current=onClose;
 useEffect(()=>{
  if(!open)return;
  const previous=document.activeElement as HTMLElement|null;
  const modal=document.querySelector<HTMLElement>(selector);if(!modal)return;
  modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.tabIndex=-1;
  const targets=()=>Array.from(modal.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"],summary')).filter(e=>e.getClientRects().length>0);
  (targets()[0]??modal).focus();
  function key(e:KeyboardEvent){
   const dialogs=document.querySelectorAll('[role="dialog"]');if(dialogs[dialogs.length-1]!==modal)return;
   if(e.key==='Escape'){e.preventDefault();close.current();}
   if(e.key==='Tab'){const list=targets();const first=list[0]??modal;const last=list.at(-1)??modal;if(e.shiftKey&&(document.activeElement===first||!modal!.contains(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!modal!.contains(document.activeElement))){e.preventDefault();first.focus();}}
  }
  document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus();};
 },[open,selector]);
}
