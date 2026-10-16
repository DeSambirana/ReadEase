/** Penebalan visual saja, bukan pemenggalan suku kata. React tetap meng-escape teks. */
export function BionicText({text,enabled}:{text:string;enabled:boolean}) {
 if(!enabled)return <>{text}</>;
 return <>{text.split(/(\p{L}[\p{L}\p{M}]*)/gu).map((part,i)=>{
  if(i%2===0)return part;
  const letters=Array.from(part);
  const count=Math.min(3,Math.ceil(letters.length/2));
  return <span key={i}><b className="bionic-prefix">{letters.slice(0,count).join('')}</b>{letters.slice(count).join('')}</span>;
 })}</>;
}
