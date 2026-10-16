import {useState} from 'react';
import type {ReadingSessionLog} from '../types/student';
export function LogProgressEditor({log,onSave}:{log:ReadingSessionLog;onSave:(log:ReadingSessionLog)=>boolean}){
 const [completed,setCompleted]=useState(log.exercisesCompleted);const [total,setTotal]=useState(log.totalExercises);
 const [score,setScore]=useState(log.comprehensionScore===null?'':String(log.comprehensionScore));const [status,setStatus]=useState(log.status);const [note,setNote]=useState(log.teacherEvaluation);const [message,setMessage]=useState('');
 return <details><summary>Catat hasil pengerjaan</summary><form onSubmit={e=>{e.preventDefault();if(completed>total){setMessage('Jumlah selesai tidak boleh melebihi jumlah soal.');return;}if(status==='completed'&&completed!==total){setMessage('Selesaikan semua soal sebelum menandai sesi selesai.');return;}const saved=onSave({...log,exercisesCompleted:completed,totalExercises:total,comprehensionScore:score===''?null:Number(score),status,teacherEvaluation:note});setMessage(saved?'Hasil tersimpan.':'Hasil belum tersimpan.');}}>
 <label>Jumlah soal<input type="number" min={0} max={100} required value={total} onChange={e=>setTotal(Number(e.target.value))}/></label>
 <label>Soal dikerjakan<input type="number" min={0} max={total} required value={completed} onChange={e=>setCompleted(Number(e.target.value))}/></label>
 <label>Nilai latihan (%) — boleh kosong<input type="number" min={0} max={100} value={score} onChange={e=>setScore(e.target.value)}/></label>
 <label>Status sesi<select value={status} onChange={e=>setStatus(e.target.value as ReadingSessionLog['status'])}><option value="printed">PDF dibuat / belum dikerjakan</option><option value="in_progress">Sedang dikerjakan</option><option value="completed">Selesai, dikonfirmasi guru</option></select></label>
 <label>Catatan evaluasi<textarea maxLength={10000} value={note} onChange={e=>setNote(e.target.value)}/></label><button>Simpan hasil pengerjaan</button><p role="status">{message}</p></form></details>;
}
