import { z } from 'zod';
import { config } from './config';
import {presets} from './presets';
export const storageKey = 'aksarainklusi.draft.v2';
const metrics = z.object({avg_words_per_sentence:z.number(),sentences_over_threshold:z.number(),threshold:z.number(),words_per_block:z.array(z.number())});
const cardSchema=z.object({id:z.string(),source_sentence_ids:z.array(z.string()),adapted_text:z.string(),rule_id:z.string().nullable().optional(),review_status:z.enum(['pending','accepted','edited','rejected','flagged']),warnings:z.array(z.string()).optional(),flagged_terms:z.array(z.string()).optional()});
export const exerciseSchema=z.object({id:z.string(),source_sentence_id:z.string(),answer:z.string(),blank_text:z.string(),start:z.number().int().nonnegative(),end:z.number().int().positive(),reviewed:z.boolean()});
export const worksheetSchema=z.object({candidates:z.array(z.object({id:z.string(),source_sentence_id:z.string(),keyword:z.string(),start:z.number().int(),end:z.number().int(),occurrence:z.number().int(),part_of_speech:z.string()})),exercises:z.array(exerciseSchema),warnings:z.array(z.string()),is_example:z.boolean()});
export const resultSchema = z.object({
 document:z.object({title:z.string(),sentences:z.array(z.object({id:z.string(),text:z.string(),word_count:z.number(),paragraph_id:z.string()})),metrics_before:metrics,metrics_after:metrics.nullable().optional()}),
 cards:z.array(cardSchema),exercises:z.array(exerciseSchema).default([]),
 proposals:z.array(cardSchema.extend({manual_only:z.boolean().default(false)})).default([]),
 decisions:z.array(z.object({proposal_id:z.string(),status:z.enum(['pending','accepted','edited','rejected','flagged']),edited_text:z.string().nullable().optional()})).default([]),
 important_terms:z.array(z.string()).default([]),
 summary:z.object({pending:z.number(),accepted:z.number(),edited:z.number(),rejected:z.number(),unchanged_sentences:z.number()}).optional(),
 warnings:z.array(z.string()).optional(),is_example:z.boolean()
});
export const preferencesSchema = z.object({fontFamily:z.enum(['sans','serif','dyslexie']).default('sans'),bionic:z.boolean().default(false),fontSize:z.number().min(16).max(32),letterSpacing:z.number().min(0).max(3),wordSpacing:z.number().min(0).max(12),lineHeight:z.number().min(1.4).max(2.6),width:z.number().min(320).max(900),contrast:z.enum(['light','cream','dark']),wpm:z.number().min(30).max(300)});
export type Preferences = z.infer<typeof preferencesSchema>;
export const defaultPreferences: Preferences = {...presets[0].preferences};
const draftSchema = z.object({maxSentencesPerCard:z.union([z.literal(1),z.literal(2)]).default(2),readingProfile:z.enum(['comfortable','focus','standard']).default('comfortable'),preset:z.enum(['comfortable','focus','standard','custom']).default('custom'),version:z.literal(2),worksheet:worksheetSchema.omit({exercises:true}).nullable().default(null),worksheetSelections:z.array(z.string()).default([]),importantTerms:z.string().default(''),editBuffers:z.record(z.string(),z.string()).default({}),text:z.string().max(config.max_text_characters),threshold:z.string(),result:resultSchema.nullable(),mode:z.enum(['comfortable','focus']),index:z.number().int().nonnegative(),completed:z.array(z.string()),preferences:preferencesSchema});
export type Draft = z.infer<typeof draftSchema>;
export const emptyDraft: Draft = {maxSentencesPerCard:2,readingProfile:'comfortable',preset:'comfortable',version:2,worksheet:null,worksheetSelections:[],importantTerms:'',editBuffers:{},text:'',threshold:String(config.sentence_threshold),result:null,mode:'comfortable',index:0,completed:[],preferences:defaultPreferences};
export function loadDraft(): {draft:Draft; warning:string} {
 try {
  const raw=sessionStorage.getItem(storageKey);
  if(!raw) return {draft:emptyDraft,warning:''};
  const parsed=draftSchema.safeParse(JSON.parse(raw));
  if(!parsed.success) return {draft:emptyDraft,warning:'Draf tersimpan tidak cocok atau rusak. Silakan masukkan teks kembali.'};
  const d=parsed.data;
  d.index=Math.min(d.index,Math.max(0,(d.result?.cards.length ?? 1)-1));
  d.completed=d.completed.filter(id=>d.result?.cards.some(c=>c.id===id));
  return {draft:d,warning:''};
 } catch { return {draft:emptyDraft,warning:'Draf tidak dapat dibaca. Aplikasi tetap dapat digunakan.'}; }
}
