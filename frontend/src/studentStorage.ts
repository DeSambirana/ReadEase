import { z } from 'zod';
import type { StudentProfile, ReadingSessionLog, TeacherQuickNote } from './types/student';
import {requestJSON} from './authApi';
const text = z.string().max(10000);
const studentSchema = z.object({id:text,name:z.string().trim().min(1).max(100),nickname:text,gradeClass:text,avatarId:text,needsTag:text,secondaryTag:text.optional(),pedagogicalNotes:text,preferences:z.object({readingMode:z.enum(['focus','comfortable']),sentenceThreshold:z.number().int().min(1).max(200),fontSize:z.enum(['normal','large','xlarge']),bionicReading:z.boolean(),fontFamily:z.enum(['standard','dyslexic']),cardPacingMinutes:z.number().optional()}),lastSessionDate:text,lastTopic:text.optional(),completionRate:z.number().min(0).max(100),accentColor:z.enum(['yellow','blue','purple','green','pink'])});
const logSchema = z.object({id:text,studentId:text,studentName:text,materialTitle:text,date:text,formattedDate:text,cardCount:z.number().int().nonnegative(),avgWordsPerSentence:z.number().nonnegative(),exercisesCompleted:z.number().int().min(0),totalExercises:z.number().int().min(0),comprehensionScore:z.number().min(0).max(100).nullable(),status:z.enum(['completed','in_progress','printed']),teacherEvaluation:text}).refine(l=>l.exercisesCompleted<=l.totalExercises);
const noteSchema=z.object({id:text,studentId:text.optional(),studentName:text.optional(),content:text,createdAt:text,tag:text.optional()});
const schema=z.object({version:z.literal(2),legacyUnverified:z.boolean().default(false),students:z.array(studentSchema).max(500),logs:z.array(logSchema).max(5000),notes:z.array(noteSchema).max(2000)});
type Store=z.infer<typeof schema>;
let cache:Store={version:2,legacyUnverified:false,students:[],logs:[],notes:[]};
let revision=0;let queue:Promise<void>=Promise.resolve();let failure='';let pending=0;
window.addEventListener('beforeunload',event=>{if(pending||failure){event.preventDefault();event.returnValue='';}});
function announce(){window.dispatchEvent(new CustomEvent('store-status',{detail:failure || (pending?'Menyimpan perubahan…':'Semua perubahan tersimpan')}));}
export async function initializeStore(){
 const state=await requestJSON<{revision:number;body:string|null}>('/api/teacher/store');
 cache=state.body?schema.parse(JSON.parse(state.body)):{version:2,legacyUnverified:false,students:[],logs:[],notes:[]};
 revision=state.revision;failure='';pending=0;queue=Promise.resolve();
}
export async function flushStore(){await queue;if(failure)throw new Error(failure);}
export function getStorageWarning(){return failure || (cache.legacyUnverified?'Data impor versi sebelumnya belum diverifikasi; periksa profil dan nilai lama.':'');}
function load(){return cache;}
function commit(next:Store):void {
 if(failure)throw new Error(failure);
 const parsed=schema.parse(next);const body=JSON.stringify(parsed);
 if(new Set(parsed.students.map(s=>s.id)).size!==parsed.students.length)throw new Error('ID murid duplikat.');
 cache=parsed;pending++;announce();
 queue=queue.then(async()=>{
  if(failure)return;
  try{const result=await requestJSON<{revision:number}>('/api/teacher/store','PUT',{revision,body});revision=result.revision;}
  catch(e){failure=(e instanceof Error?e.message:'Penyimpanan gagal.')+' Perubahan terakhir belum tersimpan. Salin/cadangkan data sebelum memuat ulang.';}
 }).finally(()=>{pending--;announce();});
}
export function getStoredStudents():StudentProfile[]{return load().students;}
export function getStoredLogs():ReadingSessionLog[]{return load().logs;}
export function getStoredQuickNotes():TeacherQuickNote[]{return load().notes;}
export function saveStudent(s:StudentProfile):StudentProfile[]{const state=load();const students=state.students.some(x=>x.id===s.id)?state.students.map(x=>x.id===s.id?s:x):[...state.students,s];commit({...state,students});return getStoredStudents();}
export function deleteStudent(id:string):StudentProfile[]{const s=load();commit({...s,students:s.students.filter(x=>x.id!==id),logs:s.logs.filter(x=>x.studentId!==id),notes:s.notes.filter(x=>x.studentId!==id)});return getStoredStudents();}
export function saveReadingLogs(logs:ReadingSessionLog[]):void{commit({...load(),logs});}
export function addReadingLog(log:Omit<ReadingSessionLog,'id'>):ReadingSessionLog[]{saveReadingLogs([{...log,id:crypto.randomUUID()},...load().logs]);return getStoredLogs();}
export function updateReadingLog(log:ReadingSessionLog):ReadingSessionLog[]{saveReadingLogs(load().logs.map(x=>x.id===log.id?log:x));return getStoredLogs();}
export function addQuickNote(note:Omit<TeacherQuickNote,'id'|'createdAt'>):TeacherQuickNote[]{commit({...load(),notes:[{...note,id:crypto.randomUUID(),createdAt:new Date().toISOString()},...load().notes]});return getStoredQuickNotes();}
export function deleteQuickNote(id:string):TeacherQuickNote[]{commit({...load(),notes:load().notes.filter(x=>x.id!==id)});return getStoredQuickNotes();}
export function saveStudents(students:StudentProfile[]):void{commit({...load(),students});}
// Profil, log dan catatan disimpan dalam satu write agar kegagalan kuota tidak membuat data separuh tersimpan.
export function recordSession(student:StudentProfile,log:Omit<ReadingSessionLog,'id'>,note?:Omit<TeacherQuickNote,'id'|'createdAt'>):void {
 const s=load();
 if(!s.students.some(x=>x.id===student.id))throw new Error('Murid tidak tersedia. Muat ulang halaman.');
 commit({...s,students:s.students.map(x=>x.id===student.id?student:x),logs:[{...log,id:crypto.randomUUID()},...s.logs],notes:note?[{...note,id:crypto.randomUUID(),createdAt:new Date().toISOString()},...s.notes]:s.notes});
}

export async function importLegacyStore(){
 if(cache.students.length||cache.logs.length||cache.notes.length)throw new Error('Impor hanya untuk akun kosong agar data tidak tertimpa.');
 const raw=localStorage.getItem('aksarainklusi_store_v2');
 if(!raw)throw new Error('Data lokal versi sebelumnya tidak ditemukan pada browser/alamat ini.');
 const imported=schema.parse(JSON.parse(raw));commit({...imported,legacyUnverified:true});await flushStore();
}
