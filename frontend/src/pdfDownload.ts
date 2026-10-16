import {apiFetch,apiError} from './api';
export async function downloadPdf(payload:unknown, filename:string):Promise<void>{
 const response=await apiFetch('/api/pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
 if(!response.ok)throw new Error(await apiError(response,'PDF gagal dibuat. Pastikan backend dan Chromium tersedia.'));
 const blob=await response.blob();
 if((await blob.slice(0,5).text())!=='%PDF-')throw new Error('Server tidak mengirim PDF yang valid. Periksa alamat backend.');
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename.replace(/[\\/:*?"<>|]/g,'-');document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
