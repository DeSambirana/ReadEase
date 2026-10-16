import React, { useEffect, useState, type CSSProperties } from 'react';
import {fontFamilies,loadDyslexie} from './fonts';
import {BionicText} from './BionicText';
import type { Draft, Preferences } from './draft';
export function ReadingSettings({preferences:p,onChange}:{preferences:Preferences;onChange:(p:Preferences)=>void}) {
 const [available,setAvailable]=useState<boolean|null>(null);
 useEffect(()=>{let active=true;void loadDyslexie().then(value=>{if(active)setAvailable(value);});return()=>{active=false;};},[]);
 const sliders: {key:keyof Omit<Preferences,'contrast'|'bionic'|'fontFamily'>;label:string;min:number;max:number;step:number}[]=[
  {key:'fontSize',label:'Ukuran huruf',min:16,max:32,step:1},
  {key:'letterSpacing',label:'Jarak huruf',min:0,max:3,step:.1},
  {key:'wordSpacing',label:'Jarak kata',min:0,max:12,step:1},
  {key:'lineHeight',label:'Jarak baris',min:1.4,max:2.6,step:.1},
  {key:'width',label:'Lebar kolom',min:320,max:900,step:20},
  {key:'wpm',label:'Kecepatan perkiraan (kata per menit)',min:30,max:300,step:10}];
 return <>{p.fontFamily==='dyslexie'&&<p role="status" className="font-status">{available===null?'Memeriksa font Dyslexie di perangkat…':available?'Font Dyslexie dari perangkat ini sedang digunakan.':'Font Dyslexie belum tersedia di browser ini. Bacaan memakai Arial dengan jarak yang sudah disesuaikan.'}</p>}<details className="settings"><summary>Pengaturan bacaan</summary><div className="settings-grid">
 <label>Jenis huruf<select aria-label="Jenis huruf" value={p.fontFamily} onChange={e=>onChange({...p,fontFamily:e.target.value as Preferences['fontFamily']})}><option value="sans">Arial / sans-serif</option><option value="serif">Georgia / serif</option><option value="dyslexie">Dyslexie (font lokal; alternatif Arial)</option></select></label>
 {sliders.map(s=><label key={s.key}>{s.label}: {p[s.key]}<input type="range" min={s.min} max={s.max} step={s.step} value={p[s.key]} onChange={e=>onChange({...p,[s.key]:Number(e.target.value)})}/></label>)}
 <label>Kontras<select aria-label="Kontras" value={p.contrast} onChange={e=>onChange({...p,contrast:e.target.value as Preferences['contrast']})}><option value="light">Hitam di atas putih</option><option value="cream">Hitam di atas krem</option><option value="dark">Putih di atas gelap</option></select></label></div>
 <label><input type="checkbox" checked={p.bionic} onChange={e=>onChange({...p,bionic:e.target.checked})}/>Bionic Reading (eksperimental)</label><p>Menebalkan awal kata, bukan suku kata. Manfaatnya belum terbukti untuk semua pembaca. Hanya untuk layar; PDF tetap tanpa penebalan awal kata.</p>
 <p>Kecepatan hanya untuk perkiraan waktu, bukan target atau penilaian kemampuan siswa.</p><p>Dyslexie hanya digunakan bila font berlisensi sudah terpasang dan dapat diakses browser. Pilihan font layar tidak mengubah font PDF.</p></details></>;
}
export function Reader({draft:d,update}:{draft:Draft;update:(change:Partial<Draft>)=>void}) {
 const result=d.result;
 if(!result || !result.cards.length) return null;
 const current=Math.min(d.index,result.cards.length-1);
 const cards=d.mode==='focus'?[result.cards[current]]:result.cards;
 const style:CSSProperties={fontFamily:fontFamilies[d.preferences.fontFamily],fontSize:d.preferences.fontSize,letterSpacing:d.preferences.letterSpacing,wordSpacing:d.preferences.wordSpacing,lineHeight:d.preferences.lineHeight};
 return <section aria-label="Bacaan" className={`reader ${d.preferences.contrast}`} style={{maxWidth:d.preferences.width}}>
 <h2>Bacaan</h2><div className="mode-buttons"><button aria-pressed={d.mode==='comfortable'} onClick={()=>update({mode:'comfortable',preset:'custom'})}>Semua kartu</button><button aria-pressed={d.mode==='focus'} onClick={()=>update({mode:'focus',preset:'custom'})}>Satu per satu</button></div>
 <ReadingSettings preferences={d.preferences} onChange={preferences=>update({preferences,preset:'custom'})}/>
 {d.mode==='focus'&& <><p role="status">Kartu {current+1} dari {result.cards.length} · Selesai {d.completed.length} dari {result.cards.length}</p>
 <nav aria-label="Navigasi kartu"><button disabled={current===0} onClick={()=>update({index:current-1})}>Sebelumnya</button><button disabled={current===result.cards.length-1} onClick={()=>update({index:current+1})}>Berikutnya</button></nav></>}
 {cards.map(card=>{const sources=result.document.sentences.filter(s=>card.source_sentence_ids.includes(s.id));const words=card.adapted_text.split(/\s+/u).filter(t=>/[\p{L}\p{N}]/u.test(t)).length;return <article key={card.id} aria-label={`Kartu ${card.id}`}>
 <p className="source-text reading-text" style={style}><MarkedText text={card.adapted_text} terms={card.flagged_terms??[]} bionic={d.preferences.bionic}/></p>
 {(card.flagged_terms??[]).length>0 && <p>Istilah perlu penjelasan: {(card.flagged_terms??[]).join(', ')}</p>}
 <p>{words} kata · Perkiraan waktu baca: ~{Math.max(1,Math.ceil(words/d.preferences.wpm*60))} detik</p>
 {(card.warnings??[]).map(w=><p className="card-warning" key={w}>{w}</p>)}
 {d.mode==='focus'&&<label className="check"><input type="checkbox" checked={d.completed.includes(card.id)} onChange={e=>update({completed:e.target.checked?[...d.completed,card.id]:d.completed.filter(id=>id!==card.id)})}/>Sudah dibaca</label>}
 <details><summary>Lihat sumber</summary>{sources.map(s=><p className="source-text" key={s.id}>{s.text}</p>)}<p>Aturan: {card.rule_id??'Tidak ada perubahan bahasa'}</p><p>Status: {{pending:'Menunggu',accepted:'Diterima',edited:'Diedit',rejected:'Ditolak',flagged:'Perlu ditinjau'}[card.review_status]}</p><p>Peringatan: {(card.warnings??[]).join('; ') || 'Tidak ada peringatan token yang terdeteksi.'}</p></details>
 </article>})}</section>;
}

function MarkedText({text,terms,bionic}:{text:string;terms:string[];bionic:boolean}) {
 if(!terms.length)return <BionicText text={text} enabled={bionic}/>;
 const escaped=terms.filter(Boolean).sort((a,b)=>b.length-a.length).map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
 if(!escaped.length)return <BionicText text={text} enabled={bionic}/>;
 const pattern=new RegExp('(?<![\\p{L}\\p{N}_])('+escaped.join('|')+')(?![\\p{L}\\p{N}_])','giu');
 return <>{text.split(pattern).map((part,i)=>i%2 ? <mark key={i}><BionicText text={part} enabled={bionic}/></mark> : <BionicText key={i} text={part} enabled={bionic}/>)}</>;
}
