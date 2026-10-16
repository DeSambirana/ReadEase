import type {Preferences} from './draft';
import {config} from './config';
export type PresetId='comfortable'|'focus'|'standard';
export const presets: {id:PresetId;title:string;description:string;symbol:string;mode:'comfortable'|'focus';preferences:Preferences}[]=[
 {id:'comfortable',title:'Disleksia',description:'Coba huruf lebih besar, jarak lapang, dan pilihan font.',symbol:'Aa',mode:'comfortable',preferences:{fontFamily:'dyslexie',fontSize:22,letterSpacing:.8,wordSpacing:3,lineHeight:1.9,width:680,contrast:'light',wpm:config.reading_wpm,bionic:false}},
 {id:'focus',title:'Fokus / ADHD',description:'Satu kartu dalam satu waktu. Baca dengan ritmemu.',symbol:'☷',mode:'focus',preferences:{fontFamily:'sans',fontSize:22,letterSpacing:.3,wordSpacing:1,lineHeight:1.8,width:640,contrast:'light',wpm:config.reading_wpm,bionic:false}},
 {id:'standard',title:'Bacaan Standar',description:'Tampilan sederhana dengan jarak tulisan biasa.',symbol:'Tt',mode:'comfortable',preferences:{fontFamily:'sans',fontSize:18,letterSpacing:0,wordSpacing:0,lineHeight:1.6,width:760,contrast:'light',wpm:config.reading_wpm,bionic:false}},
];
