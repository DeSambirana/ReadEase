export interface AvatarPreset {id:string;name:string;description:string;bgGradient:string;image:string}
export const AVATAR_PRESETS:AvatarPreset[]=Array.from({length:6},(_,i)=>({
 id:`uploaded-${i+1}`,name:`Karakter ${i+1}`,description:`Avatar pilihan ${i+1}`,
 bgGradient:'#e5f4f3',image:`/assets/avatars/pilihan-${i+1}.png`,
}));
// Keep existing profiles readable without rewriting stored student data.
export function resolveAvatarId(avatarId:string):string {
 if(AVATAR_PRESETS.some(p=>p.id===avatarId))return avatarId;
 const legacy=['clay-michael','clay-alice','clay-peter','clay-julia','clay-john','clay-kameron','clay-george','clay-dave'];
 return `uploaded-${Math.max(0,legacy.indexOf(avatarId))%6+1}`;
}
export function AvatarClay({avatarId,size=80,className=''}:{avatarId:string;size?:number;className?:string;showCrown?:boolean}){
 const preset=AVATAR_PRESETS.find(p=>p.id===resolveAvatarId(avatarId))!;
 return <img src={preset.image} alt="" className={`uploaded-avatar ${className}`} style={{width:size,height:size,objectFit:'contain',flexShrink:0}}/>;
}
