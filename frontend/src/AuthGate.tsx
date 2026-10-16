import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {BrandLogo} from './BrandLogo';
import {requestJSON} from './authApi';
import {flushStore,initializeStore} from './studentStorage';
import {storageKey} from './draft';
import {StudentRoom} from './StudentRoom';
interface Account {id:string;role:'teacher'|'student';name:string;email?:string}
const Context=createContext<Account>({id:'',role:'teacher',name:''});
export const useAccount=()=>useContext(Context);
export function AuthGate({children}:{children:ReactNode}){
 const [account,setAccount]=useState<Account|null>(null);const [loading,setLoading]=useState(true);
 const [mode,setMode]=useState<'teacher'|'student'|'register'>('teacher');const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [saveStatus,setSaveStatus]=useState('');
 async function enter(user:Account){
  if(user.role==='teacher')await initializeStore();
  if(sessionStorage.getItem('draft-owner')!==user.id){sessionStorage.removeItem(storageKey);sessionStorage.setItem('draft-owner',user.id);}
  setAccount(user);
 }
 useEffect(()=>{void requestJSON<Account>('/api/auth/me').then(enter).catch(e=>{setAccount(null);if(!String(e).includes('Sesi berakhir'))setError(String(e));}).finally(()=>setLoading(false));
 const listener=(e:Event)=>setSaveStatus((e as CustomEvent<string>).detail);window.addEventListener('store-status',listener);return()=>window.removeEventListener('store-status',listener);},[]);
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError('');const data=new FormData(event.currentTarget);
  try{const user=await requestJSON<Account>(`/api/auth/${mode==='student'?'student':mode==='register'?'register':'login'}`,'POST',mode==='student'?{code:data.get('code')}:{email:data.get('email'),password:data.get('password'),name:data.get('name')||'Guru'});await enter(user);}
  catch(e){setError(e instanceof Error?e.message:'Gagal masuk.');}finally{setBusy(false);}
 }
 async function logout(){setError('');setBusy(true);try{if(account?.role==='teacher'){try{await flushStore();}catch{if(!window.confirm('Perubahan belum tersimpan. Keluar sekarang akan membuang perubahan yang belum terkirim. Tetap keluar?'))return;}}await requestJSON('/api/auth/logout','POST');sessionStorage.removeItem(storageKey);sessionStorage.removeItem('draft-owner');setAccount(null);setSaveStatus('');location.hash='';}catch(e){setError(String(e));}finally{setBusy(false);}}
 if(loading)return <main className="auth-shell"><p role="status">Membuka ruang belajar…</p></main>;
 if(account)return <Context.Provider value={account}><div className="session-strip"><span>{account.role==='teacher'?'Ruang Guru':'Ruang Murid'} · {account.name}</span><span role="status">{saveStatus}</span><button disabled={busy} onClick={()=>void logout()}>Keluar</button></div>{error&&<p role="alert">{error}</p>}{account.role==='teacher'?children:<StudentRoom name={account.name}/>}</Context.Provider>;
 return <main className="auth-shell"><section className="welcome-art"><span className="eyebrow">READEASE / RUANG BELAJAR</span><h1>Satu bacaan.<br/>Banyak cara<br/><em>untuk belajar.</em></h1><p>Ruang kecil untuk langkah besar. Belajar sesuai ritmemu, bersama guru yang mendampingi.</p><img className="welcome-portrait" src="/assets/avatars/pilihan-1.png" alt=""/><span className="welcome-badge">Setiap langkah berarti</span></section><section className="auth-form"><BrandLogo/><span className="eyebrow">SELAMAT DATANG</span><h2>{mode==='student'?'Halo, siap membaca?':mode==='register'?'Buat ruang gurumu':'Senang bertemu kembali'}</h2><p>{mode==='student'?'Masukkan kode pribadi yang diberikan gurumu.':'Siapkan bacaan dan dampingi perkembangan setiap murid.'}</p><div className="auth-tabs"><button aria-pressed={mode!=='student'} onClick={()=>{setMode('teacher');setError('');}}>Saya guru</button><button aria-pressed={mode==='student'} onClick={()=>{setMode('student');setError('');}}>Saya murid</button></div><form onSubmit={e=>void submit(e)}>
 {mode==='student'?<label>Kode dari guru<input name="code" placeholder="ABCD-EFGH-JKLM" maxLength={40} autoComplete="off" required autoCapitalize="characters" spellCheck={false}/></label>:<>{mode==='register'&&<label>Nama guru<input name="name" maxLength={100} required autoComplete="name"/></label>}<label>Email<input name="email" type="email" maxLength={254} required autoComplete="username"/></label><label>Kata sandi<input name="password" type="password" minLength={12} maxLength={128} required autoComplete={mode==='register'?'new-password':'current-password'}/></label><small>Minimal 12 karakter. Akun demo ini belum menyediakan pemulihan lewat email.</small></>}
 {error&&<p role="alert" className="account-error">{error}</p>}<button className="account-primary" disabled={busy}>{busy?'Sebentar…':mode==='student'?'Masuk ruang belajarku →':mode==='register'?'Buat akun guru →':'Masuk sebagai guru →'}</button></form>{mode!=='student'&&<button className="account-link" onClick={()=>{setMode(mode==='register'?'teacher':'register');setError('');}}>{mode==='register'?'Sudah punya akun? Masuk':'Belum punya akun? Daftar guru'}</button>}<p className="auth-footnote">Murid tidak perlu email. Kode pribadi hanya membuka materi miliknya.</p></section></main>;
}
