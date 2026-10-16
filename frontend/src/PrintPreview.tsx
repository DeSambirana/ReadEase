import {useEffect,useRef,useState} from 'react';
import {apiFetch,apiError} from './api';
import {requestJSON} from './authApi';
import {flushStore} from './studentStorage';
import {downloadPdf} from './pdfDownload';
import type {Draft} from './draft';
import type {StudentProfile} from './types/student';
interface Props {
 draft:Draft;update:(v:Partial<Draft>)=>void;busy:boolean;setBusy:(v:boolean)=>void;
 students?:StudentProfile[];targetStudentId?:string|null;onSelectTargetStudent?:(id:string|null)=>void;
 onWorksheetGenerated?:(student:StudentProfile,title:string,cards:number,avg:number,exerciseCount:number)=>boolean;
}
export function PrintPreview({draft,update,busy,setBusy,students=[],targetStudentId=null,onSelectTargetStudent,onWorksheetGenerated}:Props){
 const [reviewedForStudent,setReviewedForStudent]=useState(false);
 const [preview,setPreview]=useState<{key:string;html:string}|null>(null);
 const [error,setError]=useState('');const [status,setStatus]=useState('');
 // Notes must be explicitly chosen per recipient; observations are never copied automatically.
 const [notes,setNotes]=useState<Record<string,string>>({});
 const result=draft.result;const student=students.find(s=>s.id===targetStudentId);
 const teacherNotes=student?notes[student.id]??'':'';
 const payload=result?{document:result.document,cards:result.cards,exercises:result.exercises,student_name:student?.name??null,student_class:student?.gradeClass??null,teacher_notes:teacherNotes||null}:null;
 const key=JSON.stringify(payload);const currentKey=useRef(key);currentKey.current=key;
 useEffect(()=>setReviewedForStudent(false),[key]);
 if(!result)return null;
 const ready=result.exercises.every(e=>e.reviewed);
 async function request(download:boolean){
  if(!payload||!ready)return;setBusy(true);setError('');setStatus('');
  try{
   if(download){
    await downloadPdf(payload,`aksarainklusi-lkpd${student?`-${student.nickname||student.name}`:''}.pdf`);
    const saved=!student||!onWorksheetGenerated||onWorksheetGenerated(student,result!.document.title,result!.cards.length,result!.document.metrics_after?.avg_words_per_sentence??result!.document.metrics_before.avg_words_per_sentence,result!.exercises.length);
    setStatus(saved?'PDF dibuat dan unduhan dimulai. Ini belum berarti tugas murid selesai.':'Unduhan dimulai, tetapi riwayat belum tersimpan.');
   }else{
    const response=await apiFetch('/api/pdf/preview',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(!response.ok)throw new Error(await apiError(response,'Pratinjau gagal. Periksa backend dan Chromium.'));
    const html=await response.text();if(currentKey.current===key)setPreview({key,html});
   }
  }catch(e){setError(e instanceof Error?e.message:'PDF gagal dibuat. Periksa koneksi backend.');}finally{setBusy(false);}
 }
 async function share(){
  if(!student||!payload)return;setBusy(true);setError('');setStatus('');
  try{await flushStore();await requestJSON('/api/teacher/assignments','POST',{student_id:student.id,workspace:payload,reviewed:reviewedForStudent});setStatus('Materi dibagikan ke ruang murid. Murid bisa membuka bacaan dengan kode pribadinya.');setReviewedForStudent(false);}
  catch(e){setError(e instanceof Error?e.message:'Gagal membagikan materi.');}finally{setBusy(false);}
 }
 return <section className="print-section-card" aria-label="Profil Cetak Kelas">
  <h2>Profil Cetak Lembar Kerja (LKPD PDF A4)</h2>
  <label htmlFor="target-student-select">Tujukan Lembar Kerja untuk Murid:</label>
  <select id="target-student-select" value={student?.id??''} disabled={busy} onChange={e=>onSelectTargetStudent?.(e.target.value||null)}>
   <option value="">Lembar umum — nama dan kelas kosong</option>{students.map(s=><option key={s.id} value={s.id}>{s.name} ({s.gradeClass})</option>)}
  </select>
  {student&&<><p>Nama: <strong>{student.name}</strong> · Kelas: {student.gradeClass}</p><label htmlFor="print-notes">Catatan untuk halaman guru (opsional)</label><textarea id="print-notes" maxLength={1000} value={teacherNotes} disabled={busy} onChange={e=>setNotes({...notes,[student.id]:e.target.value})}/><p>Hanya catatan yang ditulis di sini yang dikirim untuk PDF. Catatan profil tidak disertakan otomatis.</p></>}
  <label htmlFor="lkpd-title">Judul Lembar Kerja</label><input id="lkpd-title" maxLength={200} disabled={busy} value={result.document.title} onChange={e=>update({result:{...result,document:{...result.document,title:e.target.value}}})}/>
  <p>A4 hitam-putih. Halaman guru terpisah di belakang; pisahkan sebelum membagikan lembar siswa. Nama, kelas, materi, dan catatan cetak diproses sementara oleh backend.</p>
  <p>{!ready?'Tinjau semua soal dan kunci sebelum ekspor.':result.exercises.length?`${result.exercises.length} soal sudah ditinjau.`:'PDF bacaan tanpa soal siap dibuat.'}</p>
  {!ready && result.exercises.length > 0 && (
    <div style={{ margin: '8px 0 12px', padding: '10px 14px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
      <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#92400e' }}>
        ⚠️ Ada {result.exercises.filter(e => !e.reviewed).length} soal latihan yang belum ditandai selesai ditinjau.
      </p>
      <button
        type="button"
        style={{ background: '#059669', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
        onClick={() => {
          update({
            result: {
              ...result,
              exercises: result.exercises.map(e => ({ ...e, reviewed: true })),
            },
          });
        }}
      >
        ✓ Tandai Semua ({result.exercises.length}) Soal Selesai Ditinjau
      </button>
    </div>
  )}
  <div className="print-actions-row"><button disabled={busy||!ready} onClick={()=>void request(false)}>Pratinjau Cetak A4</button><button disabled={busy||!ready} onClick={()=>void request(true)}>Unduh PDF A4</button></div>
  {student&&<div className="share-student"><h3>Bagikan bacaan secara daring</h3><p>Buat kode pada Daftar Murid terlebih dahulu. Materi ini akan tersimpan pada server untuk murid yang dipilih. Catatan guru dan kunci tidak dikirim ke ruang murid.</p><label><input type="checkbox" checked={reviewedForStudent} onChange={e=>setReviewedForStudent(e.target.checked)}/>Saya telah meninjau isi bacaan dan soal untuk {student.name}.</label><button disabled={busy||!ready||!reviewedForStudent} onClick={()=>void share()}>Bagikan ke ruang murid</button></div>}
  {error&&<p role="alert">{error}</p>}{status&&<p role="status">{status}</p>}
  {preview?.key===key&&<iframe className="print-preview-frame" title="Pratinjau halaman A4" sandbox="allow-same-origin" srcDoc={preview.html}/>}
 </section>;
}
