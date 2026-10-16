import {apiFetch,apiError} from './api';
export async function requestJSON<T>(url:string,method='GET',body?:unknown):Promise<T>{
 const response=await apiFetch(url,{method,headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 if(!response.ok)throw new Error(await apiError(response,'Permintaan gagal. Periksa koneksi dan coba kembali.'));
 return response.json() as Promise<T>;
}
