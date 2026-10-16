import {config} from './config';
export function apiFetch(url:string,options:RequestInit) {
 return fetch(url,{...options,signal:AbortSignal.timeout(config.client_timeout_ms)});
}
export async function apiError(response:Response,fallback:string):Promise<string> {
 try {const body:unknown=await response.json();if(typeof body==='object'&&body!==null&&'detail' in body&&typeof body.detail==='string')return body.detail;}catch{/* Gateway dapat mengirim HTML; tampilkan pesan aman. */}
 return fallback;
}
