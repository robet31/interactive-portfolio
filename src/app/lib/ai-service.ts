// ═══════════════════════════════════════════
// OpenRouter AI Service for Daily Log
// ═══════════════════════════════════════════

const OPENROUTER_API_KEY = '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';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Free models with automatic fallback — ordered by preference
// All models use the :free tier on OpenRouter
interface FreeModel {
  id: string;
  name: string;
  provider: string;
  noSystemRole?: boolean;
  vision?: boolean;
}

export const FREE_MODELS: FreeModel[] = [
  { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B', provider: 'Meta', vision: true },
  { id: 'qwen/qwen3-4b:free', name: 'Qwen3 4B', provider: 'Alibaba' },
  { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1', provider: 'Mistral AI' },
  { id: 'google/gemma-3-4b-it:free', name: 'Gemma 3 4B', provider: 'Google', noSystemRole: true },
  { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B', provider: 'Meta' },
  { id: 'qwen/qwen3-8b:free', name: 'Qwen3 8B', provider: 'Alibaba' },
  { id: 'deepseek/deepseek-r1-distill-llama-8b:free', name: 'DeepSeek R1 8B', provider: 'DeepSeek' },
  { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B', provider: 'Google', noSystemRole: true, vision: true },
];

// Vision-capable models for image analysis
const VISION_MODELS = FREE_MODELS.filter(m => m.vision);

const SYSTEM_PROMPT = `Kamu adalah AI assistant bernama "LogBot" yang membantu membuat catatan log harian (Daily Log) yang terstruktur dan profesional. Kamu akan menerima catatan mentah dari user dan mengubahnya menjadi log harian yang rapi dalam format HTML.

ATURAN OUTPUT:
1. Gunakan bahasa yang sama dengan input user (Bahasa Indonesia atau Inggris).
2. Output HARUS berupa HTML valid yang bisa langsung dimasukkan ke editor TipTap.
3. Gunakan struktur berikut:
   - <h2> untuk judul utama log (contoh: "Log Harian - [tanggal/topik]")
   - <h3> untuk sub-bagian kegiatan
   - <p> untuk paragraf deskripsi
   - <ul>/<ol> untuk list
   - <blockquote> untuk catatan penting/refleksi
   - <strong> untuk penekanan

4. Untuk PLACEHOLDER GAMBAR, gunakan format ini (dalam HTML comment + visual placeholder):
   <blockquote><p><strong>📸 INSERT IMAGE:</strong> [Deskripsi gambar yang perlu ditambahkan]<br/><em>Caption: [Saran caption untuk gambar]</em></p></blockquote>

5. Untuk TEMPLATE CODE BLOCK, gunakan format ini:
   <pre><code class="language-[bahasa]">// 📝 PASTE YOUR [BAHASA] CODE HERE
// File: [nama_file_yang_disarankan]
// Deskripsi: [apa yang dilakukan code ini]
// ─────────────────────────────────
[contoh_struktur_code_jika_bisa_ditebak]</code></pre>

6. Jangan pernah menambahkan markdown. Hanya HTML murni.
7. Buat kalimat yang natural, profesional tapi tetap personal (seperti menulis di jurnal teknis).
8. Jika user menyebut sesuatu yang bisa divisualisasikan (screenshot, diagram, hasil output), SELALU tambahkan placeholder gambar.
9. Jika user menyebut coding/programming, SELALU tambahkan code block template dengan bahasa yang sesuai.
10. Di akhir log, tambahkan bagian "Catatan & To-Do" sebagai checklist untuk follow-up.

CONTOH INPUT: "hari ini belajar react hooks, bikin custom hook useLocalStorage, terus fix bug di form validation"

CONTOH OUTPUT:
<h2>Log Harian - Belajar React Hooks & Bug Fix</h2>
<p>Hari ini fokus pada pendalaman React Hooks, khususnya pembuatan custom hook, serta memperbaiki bug pada form validation.</p>

<h3>1. Custom Hook: useLocalStorage</h3>
<p>Membuat custom hook <code>useLocalStorage</code> yang berfungsi untuk menyimpan dan mengambil data dari localStorage secara reaktif. Hook ini memudahkan state persistence tanpa perlu menulis boilerplate berulang.</p>

<blockquote><p><strong>📸 INSERT IMAGE:</strong> Screenshot hasil implementasi useLocalStorage di browser (DevTools > Application > Local Storage)<br/><em>Caption: Demonstrasi data yang tersimpan di localStorage melalui custom hook</em></p></blockquote>

<pre><code class="language-typescript">// 📝 PASTE YOUR TYPESCRIPT CODE HERE
// File: hooks/useLocalStorage.ts
// Deskripsi: Custom hook untuk state persistence dengan localStorage
// ─────────────────────────────────
import { useState, useEffect } from 'react';

function useLocalStorage&lt;T&gt;(key: string, initialValue: T) {
  // Your implementation here
}

export default useLocalStorage;</code></pre>

<h3>2. Bug Fix: Form Validation</h3>
<p>Memperbaiki bug pada komponen form validation. Masalah utama: validasi tidak trigger saat field di-blur, hanya saat submit.</p>

<blockquote><p><strong>📸 INSERT IMAGE:</strong> Screenshot before/after bug fix pada form validation<br/><em>Caption: Perbandingan behavior form sebelum dan sesudah perbaikan</em></p></blockquote>

<h3>Catatan & To-Do</h3>
<ul>
<li><strong>Selesai:</strong> Custom hook useLocalStorage</li>
<li><strong>Selesai:</strong> Fix form validation bug</li>
<li><strong>Next:</strong> Tambahkan unit test untuk useLocalStorage</li>
<li><strong>Next:</strong> Explore useReducer untuk state management yang lebih kompleks</li>
</ul>

<blockquote><p>💡 <strong>Refleksi:</strong> Custom hooks sangat powerful untuk reusability. Perlu lebih banyak practice membuat hooks yang composable.</p></blockquote>`;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isGenerating?: boolean;
  modelUsed?: string;
}

/** Try each free model in order until one responds */
export async function generateLogEntry(
  messages: { role: string; content: string }[],
  onChunk?: (chunk: string) => void,
  onModelInfo?: (modelName: string) => void,
): Promise<string> {
  let lastError: Error | null = null;
  const MAX_RETRIES = 3;

  for (const model of FREE_MODELS) {
    let useNoSystemRole = 'noSystemRole' in model && model.noSystemRole;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        onModelInfo?.(model.name + (attempt > 0 ? ` (retry ${attempt})` : ''));
        const result = await callModel(model.id, messages, onChunk, useNoSystemRole);
        return result;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const errMsg = lastError.message;
        const isRateLimit = errMsg.includes('429');
        const isInvalidModel = errMsg.includes('404') || errMsg.includes('not a valid model');
        const isNoSystemRole = errMsg.includes('Developer instruction') || errMsg.includes('system role');

        // Model doesn't exist → skip immediately, no retry
        if (isInvalidModel) {
          console.warn(`⚠️ Model ${model.name} not found, skipping...`);
          break;
        }

        // Model doesn't support system role → retry same model without system role
        if (isNoSystemRole && !useNoSystemRole) {
          console.warn(`⚠️ Model ${model.name} doesn't support system role, retrying without...`);
          useNoSystemRole = true;
          continue;
        }

        // Rate-limited → wait and retry same model
        if (isRateLimit && attempt < MAX_RETRIES) {
          const delaySec = (attempt + 1) * 5;
          console.warn(`⚠️ Model ${model.name} rate-limited, retrying in ${delaySec}s...`);
          await wait(delaySec * 1000);
          continue;
        }
        
        // Otherwise move to next model
        console.warn(`⚠️ Model ${model.name} failed, trying next...`, errMsg);
        break;
      }
    }
  }

  throw new Error(
    `Semua model AI sedang tidak tersedia. Error terakhir: ${lastError?.message || 'Unknown'}`
  );
}

async function callModel(
  modelId: string,
  messages: { role: string; content: string }[],
  onChunk?: (chunk: string) => void,
  noSystemRole?: boolean,
): Promise<string> {
  // Build message list — some models (e.g. Gemma) don't support system role,
  // so we merge the system prompt into the first user message instead.
  let apiMessages: { role: string; content: string }[];
  if (noSystemRole) {
    const [first, ...rest] = messages;
    apiMessages = [
      { role: 'user', content: `[INSTRUCTIONS]\n${SYSTEM_PROMPT}\n[/INSTRUCTIONS]\n\n${first?.content || ''}` },
      ...rest,
    ];
  } else {
    apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ];
  }

  const body = {
    model: modelId,
    messages: apiMessages,
    stream: true,
    max_tokens: 4096,
    temperature: 0.7,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout per model

  try {
    const response = await fetch(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': "Api's Interactive Portfolio",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter((line) => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              onChunk?.(fullContent);
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }
    }

    if (!fullContent.trim()) {
      throw new Error('Empty response from model');
    }

    return fullContent;
  } finally {
    clearTimeout(timeout);
  }
}

// Quick templates for common log types
export const LOG_TEMPLATES = [
  {
    id: 'coding',
    label: 'Coding Session',
    emoji: '💻',
    prompt: 'Buat log untuk sesi coding hari ini. Saya akan berikan detail kegiatan coding saya.',
  },
  {
    id: 'meeting',
    label: 'Meeting Notes',
    emoji: '📋',
    prompt: 'Buat log meeting/rapat hari ini. Saya akan berikan poin-poin yang dibahas.',
  },
  {
    id: 'research',
    label: 'Riset & Belajar',
    emoji: '📚',
    prompt: 'Buat log riset/belajar hari ini. Saya akan berikan topik yang dipelajari.',
  },
  {
    id: 'project',
    label: 'Project Update',
    emoji: '🚀',
    prompt: 'Buat log progress project hari ini. Saya akan berikan detail progress.',
  },
  {
    id: 'debug',
    label: 'Bug Fix / Debug',
    emoji: '🐛',
    prompt: 'Buat log debugging/bug fix hari ini. Saya akan berikan detail masalah dan solusinya.',
  },
  {
    id: 'general',
    label: 'Log Umum',
    emoji: '📝',
    prompt: 'Buat log harian umum. Saya akan berikan catatan kegiatan hari ini.',
  },
];

/** Small delay helper */
function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════
// AI Generate for Forms (Experience, Certification, Project)
// ═══════════════════════════════════════════

export interface GeneratedExperience {
  title: string;
  organization: string;
  period: string;
  description: string;
  type: 'work' | 'internship' | 'education' | 'program' | 'organization' | 'volunteer';
  tags: string[];
}

export interface GeneratedCertification {
  name: string;
  organization: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  skills: string[];
}

export interface GeneratedProject {
  title: string;
  description: string;
  category: string;
  tags: string[];
}

const EXPERIENCE_SYSTEM_PROMPT = `Kamu adalah AI yang membantu mengisi form pengalaman (experience) dari gambar/screenshot dokumen atau info yang diberikan user. 
Kamu harus mengembalikan JSON dengan format:
{
  "title": "string - nama posisi/jabatan",
  "organization": "string - nama perusahaan/organisasi",
  "period": "string - periode kerja contoh: 'Jan 2024 - Present'",
  "description": "string - deskripsi tanggung jawab dan pencapaian",
  "type": "work|internship|education|program|organization|volunteer",
  "tags": ["array", "string", "skills"]
}

PENTING:
- Hanya kembalikan JSON saja, tanpa markdown atau text lain
- Gunakan bahasa Indonesia untuk deskripsi
- Ekstrak skills/technologies yang terlihat dari gambar
- type disesuaikan: kerja = 'work', magang = 'internship', pendidikan = 'education', bootcamp/program = 'program', organisasi = 'organization', sukarelawan = 'volunteer'`;

const CERTIFICATION_SYSTEM_PROMPT = `Kamu adalah AI yang membantu mengisi form sertifikasi dari gambar/screenshot sertifikat.
Kamu harus mengembalikan JSON dengan format:
{
  "name": "string - nama sertifikasi",
  "organization": "string - nama penerbit/lembaga",
  "issueDate": "string - bulan tahun penerbitan contoh: '2024-01'",
  "expiryDate": "string - bulan tahun kedaluwarsa contoh: '2026-01' (atau kosong jika tidak ada)",
  "credentialId": "string - ID credential jika ada",
  "skills": ["array", "string", "skills"]
}

PENTING:
- Hanya kembalikan JSON saja, tanpa markdown atau text lain
- Gunakan bahasa Indonesia untuk deskripsi
- Ekstrak skills yang tertera di sertifikat
- Jika tidak ada tanggal, gunakan null untuk fields tersebut`;

const PROJECT_SYSTEM_PROMPT = `Kamu adalah AI yang membantu填写项目表单来自图片/截图。
Kamu harus mengembalikan JSON dengan format:
{
  "title": "string - nama project",
  "description": "string - deskripsi project",
  "category": "Web Development|AI & IoT|Data Science|Data Analytics|Mobile Development|DevOps|Other",
  "tags": ["array", "string", "technologies"]
}

PENTING:
- Hanya kembalikan JSON saja, tanpa markdown atau text lain
- Gunakan bahasa Indonesia untuk deskripsi
- Ekstrak technologies/tools yang terlihat dari gambar
- category disesuaikan dengan isi project`;

async function generateFromImage(
  imageUrl: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  let lastError: Error | null = null;
  
  const modelsToTry = [
    ...VISION_MODELS,
    ...FREE_MODELS.filter(m => !VISION_MODELS.find(v => v.id === m.id))
  ];
  
  for (const model of modelsToTry) {
    try {
      const result = await callVisionModel(model, systemPrompt, userPrompt, imageUrl);
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Model ${model.name} failed:`, lastError.message);
      continue;
    }
  }
  
  throw new Error(`Semua model gagal: ${lastError?.message}`);
}

async function callVisionModel(
  model: FreeModel,
  systemPrompt: string,
  userPrompt: string,
  imageUrl: string
): Promise<string> {
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: [
      { type: 'text', text: userPrompt },
      { type: 'image_url', image_url: { url: imageUrl } }
    ]}
  ];

  const body = {
    model: model.id,
    messages,
    max_tokens: 2048,
    temperature: 0.3,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': "Api's Interactive Portfolio",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('Empty response from AI');
    }

    return content;
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonResponse<T>(content: string): T {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid JSON response');
  }
  return JSON.parse(jsonMatch[0]);
}

export async function generateExperienceFromImage(
  imageUrl: string,
  userContext?: string
): Promise<GeneratedExperience> {
  const userPrompt = userContext 
    ? `Berikut adalah info tambahan dari user: ${userContext}\n\nEkstrak informasi pengalaman dari gambar ini:`
    : 'Ekstrak informasi pengalaman dari gambar ini:';
  
  const content = await generateFromImage(imageUrl, EXPERIENCE_SYSTEM_PROMPT, userPrompt);
  return parseJsonResponse<GeneratedExperience>(content);
}

export async function generateCertificationFromImage(
  imageUrl: string,
  userContext?: string
): Promise<GeneratedCertification> {
  const userPrompt = userContext 
    ? `Berikut adalah info tambahan dari user: ${userContext}\n\nEkstrak informasi sertifikasi dari gambar ini:`
    : 'Ekstrak informasi sertifikasi dari gambar ini:';
  
  const content = await generateFromImage(imageUrl, CERTIFICATION_SYSTEM_PROMPT, userPrompt);
  return parseJsonResponse<GeneratedCertification>(content);
}

export async function generateProjectFromImage(
  imageUrl: string,
  userContext?: string
): Promise<GeneratedProject> {
  const userPrompt = userContext 
    ? `Berikut adalah info tambahan dari user: ${userContext}\n\nEkstrak informasi project dari gambar ini:`
    : 'Ekstrak informasi project dari gambar ini:';
  
  const content = await generateFromImage(imageUrl, PROJECT_SYSTEM_PROMPT, userPrompt);
  return parseJsonResponse<GeneratedProject>(content);
}

// ═══════════════════════════════════════════
// Text-based generation (fallback for PDFs)
// ═══════════════════════════════════════════

export async function generateExperienceFromText(
  text: string
): Promise<GeneratedExperience> {
  const prompt = `${EXPERIENCE_SYSTEM_PROMPT}

Berikut adalah teks dari sertifikat/dokumen:
${text}

Ekstrak informasi pengalaman dan kembalikan JSON:`;
  
  const result = await generateLogEntry([
    { role: 'user', content: prompt }
  ]);
  
  return parseJsonResponse<GeneratedExperience>(result);
}

export async function generateCertificationFromText(
  text: string
): Promise<GeneratedCertification> {
  const prompt = `${CERTIFICATION_SYSTEM_PROMPT}

Berikut adalah teks dari sertifikat:
${text}

Ekstrak informasi sertifikasi dan kembalikan JSON:`;
  
  const result = await generateLogEntry([
    { role: 'user', content: prompt }
  ]);
  
  return parseJsonResponse<GeneratedCertification>(result);
}

export async function generateProjectFromText(
  text: string
): Promise<GeneratedProject> {
  const prompt = `${PROJECT_SYSTEM_PROMPT}

Berikut adalah deskripsi project:
${text}

Ekstrak informasi project dan kembalikan JSON:`;
  
  const result = await generateLogEntry([
    { role: 'user', content: prompt }
  ]);
  
  return parseJsonResponse<GeneratedProject>(result);
}