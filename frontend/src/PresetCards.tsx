import {presets,type PresetId} from './presets';
export function PresetCards({selected,onSelect,disabled}:{selected:PresetId;onSelect:(id:PresetId)=>void;disabled:boolean}) {
 return <div className="choice-grid" aria-label="Pilihan bantuan membaca">{presets.map((p,i)=><button key={p.id} className={`choice-card choice-${p.id}`} disabled={disabled} onClick={()=>onSelect(p.id)} aria-label={`Pilih ${p.title}`}>
 <span className="choice-number" aria-hidden="true">0{i+1}</span><span className="preset-symbol" aria-hidden="true">{p.symbol}</span><strong>{p.title}</strong><span className="choice-description">{p.description}</span><span className="choice-action">Pilih bantuan ini <span aria-hidden="true">→</span></span>{selected===p.id&&<span className="sr-only">Pilihan saat ini</span>}
 </button>)}</div>;
}
