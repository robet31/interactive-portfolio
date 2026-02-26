import type { Post, Experience, Project, Certification } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface CacheData<T> {
  data: T;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000;

const dataCache: {
  posts: CacheData<Post[]> | null;
  experiences: CacheData<Experience[]> | null;
  projects: CacheData<Project[]> | null;
  certifications: CacheData<Certification[]> | null;
} = {
  posts: null,
  experiences: null,
  projects: null,
  certifications: null,
};

function isCacheValid<T>(cache: CacheData<T> | null): boolean {
  if (!cache) return false;
  return Date.now() - cache.timestamp < CACHE_DURATION;
}

export async function preloadAllData(): Promise<void> {
  const promises = [
    getAllPostsFromDb(),
    getAllExperiencesFromDb(),
    getAllProjectsFromDb(),
    getAllCertificationsFromDb(),
  ];
  await Promise.all(promises);
}

export function getCachedPosts(): Post[] | null {
  return dataCache.posts?.data || null;
}

export function getCachedExperiences(): Experience[] | null {
  return dataCache.experiences?.data || null;
}

export function getCachedProjects(): Project[] | null {
  return dataCache.projects?.data || null;
}

export function getCachedCertifications(): Certification[] | null {
  return dataCache.certifications?.data || null;
}

export function clearCache(): void {
  dataCache.posts = null;
  dataCache.experiences = null;
  dataCache.projects = null;
  dataCache.certifications = null;
}

export function clearCacheFor(type: 'posts' | 'experiences' | 'projects' | 'certifications'): void {
  dataCache[type] = null;
}

async function fetchFromApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
}

export async function getAllPostsFromDb(forceRefresh = false): Promise<Post[]> {
  if (!forceRefresh && isCacheValid(dataCache.posts)) {
    return dataCache.posts!.data;
  }
  try {
    const rows = await fetchFromApi<Post[]>('/posts');
    const posts = rows.map(row => ({
      id: String(row.id),
      title: row.title,
      slug: row.slug,
      content: row.content || '',
      cover_image_url: row.cover_image_url || '',
      category: row.category || 'Jurnal & Catatan',
      status: row.status || 'draft',
      excerpt: row.excerpt || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
      reading_time: Number(row.reading_time) || 0,
    }));
    dataCache.posts = { data: posts, timestamp: Date.now() };
    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return dataCache.posts?.data || [];
  }
}

export async function getPublishedPostsFromDb(forceRefresh = false): Promise<Post[]> {
  if (!forceRefresh && isCacheValid(dataCache.posts)) {
    return dataCache.posts!.data.filter(p => p.status === 'published');
  }
  try {
    const rows = await fetchFromApi<Post[]>('/posts/published');
    const posts = rows.map(row => ({
      id: String(row.id),
      title: row.title,
      slug: row.slug,
      content: row.content || '',
      cover_image_url: row.cover_image_url || '',
      category: row.category || 'Jurnal & Catatan',
      status: row.status || 'draft',
      excerpt: row.excerpt || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
      reading_time: Number(row.reading_time) || 0,
    }));
    dataCache.posts = { data: posts, timestamp: Date.now() };
    return posts;
  } catch (error) {
    console.error('Error fetching published posts:', error);
    return [];
  }
}

export async function getPostBySlugFromDb(slug: string): Promise<Post | undefined> {
  try {
    const row = await fetchFromApi<Post>(`/posts/${slug}`);
    return {
      id: String(row.id),
      title: row.title,
      slug: row.slug,
      content: row.content || '',
      cover_image_url: row.cover_image_url || '',
      category: row.category || 'Jurnal & Catatan',
      status: row.status || 'draft',
      excerpt: row.excerpt || '',
      created_at: row.created_at,
      updated_at: row.updated_at,
      reading_time: Number(row.reading_time) || 0,
    };
  } catch (error) {
    console.error('Error fetching post by slug:', error);
    return undefined;
  }
}

interface ApiExperience {
  id: number;
  title: string;
  organization: string;
  period: string;
  description: string;
  type: string;
  image: string;
  start_date: string;
  tags: string[];
}

export async function getAllExperiencesFromDb(forceRefresh = false): Promise<Experience[]> {
  if (!forceRefresh && isCacheValid(dataCache.experiences)) {
    return dataCache.experiences!.data;
  }
  try {
    const rows = await fetchFromApi<ApiExperience[]>('/experiences');
    const experiences = rows.map(row => ({
      id: String(row.id),
      title: row.title,
      organization: row.organization || '',
      period: row.period || '',
      description: row.description || '',
      tags: Array.isArray(row.tags) ? row.tags : [],
      type: (row.type as Experience['type']) || 'work',
      image: row.image || '',
      images: Array.isArray(row.images) ? row.images : [],
      startDate: row.start_date || '',
    }));
    dataCache.experiences = { data: experiences, timestamp: Date.now() };
    return experiences;
  } catch (error) {
    console.error('Error fetching experiences:', error);
    return dataCache.experiences?.data || [];
  }
}

interface ApiProject {
  id: number;
  title: string;
  description: string;
  image: string;
  tags: string[];
  link: string;
  category: string;
}

export async function getAllProjectsFromDb(forceRefresh = false): Promise<Project[]> {
  if (!forceRefresh && isCacheValid(dataCache.projects)) {
    return dataCache.projects!.data;
  }
  try {
    const rows = await fetchFromApi<ApiProject[]>('/projects');
    const projects = rows.map(row => ({
      id: String(row.id),
      title: row.title,
      description: row.description || '',
      image: row.image || '',
      tags: Array.isArray(row.tags) ? row.tags : [],
      link: row.link || '',
      category: row.category || '',
    }));
    dataCache.projects = { data: projects, timestamp: Date.now() };
    return projects;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return dataCache.projects?.data || [];
  }
}

interface ApiCertification {
  id: number;
  name: string;
  organization: string;
  issue_date: string;
  expiry_date: string;
  credential_id: string;
  credential_url: string;
  image: string;
  skills: string[];
}

export async function getAllCertificationsFromDb(forceRefresh = false): Promise<Certification[]> {
  if (!forceRefresh && isCacheValid(dataCache.certifications)) {
    return dataCache.certifications!.data;
  }
  try {
    const rows = await fetchFromApi<ApiCertification[]>('/certifications');
    const certifications = rows.map(row => ({
      id: String(row.id),
      name: row.name,
      organization: row.organization,
      issueDate: row.issue_date || '',
      expiryDate: row.expiry_date || '',
      credentialId: row.credential_id || '',
      credentialUrl: row.credential_url || '',
      image: row.image || '',
      skills: Array.isArray(row.skills) ? row.skills : [],
    }));
    dataCache.certifications = { data: certifications, timestamp: Date.now() };
    return certifications;
  } catch (error) {
    console.error('Error fetching certifications:', error);
    return dataCache.certifications?.data || [];
  }
}

// ==================== CRUD FUNCTIONS ====================

// Posts CRUD
export async function createPostInDb(data: Partial<Post>): Promise<Post | null> {
  try {
    const result = await fetchFromApi<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result;
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
}

export async function updatePostInDb(id: string, data: Partial<Post>): Promise<Post | null> {
  try {
    const result = await fetchFromApi<Post>(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result;
  } catch (error) {
    console.error('Error updating post:', error);
    return null;
  }
}

export async function deletePostInDb(id: string): Promise<boolean> {
  try {
    await fetchFromApi(`/posts/${id}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    return false;
  }
}

// Experiences CRUD
export async function createExperienceInDb(data: Partial<Experience>): Promise<Experience | null> {
  try {
    const result = await fetchFromApi<Experience>('/experiences', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result;
  } catch (error) {
    console.error('Error creating experience:', error);
    return null;
  }
}

export async function updateExperienceInDb(id: string, data: Partial<Experience>): Promise<Experience | null> {
  try {
    const result = await fetchFromApi<Experience>(`/experiences/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result;
  } catch (error) {
    console.error('Error updating experience:', error);
    return null;
  }
}

export async function deleteExperienceInDb(id: string): Promise<boolean> {
  try {
    await fetchFromApi(`/experiences/${id}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error('Error deleting experience:', error);
    return false;
  }
}

// Projects CRUD
export async function createProjectInDb(data: Partial<Project>): Promise<Project | null> {
  try {
    const result = await fetchFromApi<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result;
  } catch (error) {
    console.error('Error creating project:', error);
    return null;
  }
}

export async function updateProjectInDb(id: string, data: Partial<Project>): Promise<Project | null> {
  try {
    const result = await fetchFromApi<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result;
  } catch (error) {
    console.error('Error updating project:', error);
    return null;
  }
}

export async function deleteProjectInDb(id: string): Promise<boolean> {
  try {
    await fetchFromApi(`/projects/${id}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
}

// Certifications CRUD
export async function createCertificationInDb(data: Partial<Certification>): Promise<Certification | null> {
  try {
    const result = await fetchFromApi<Certification>('/certifications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return result;
  } catch (error) {
    console.error('Error creating certification:', error);
    return null;
  }
}

export async function updateCertificationInDb(id: string, data: Partial<Certification>): Promise<Certification | null> {
  try {
    const result = await fetchFromApi<Certification>(`/certifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result;
  } catch (error) {
    console.error('Error updating certification:', error);
    return null;
  }
}

export async function deleteCertificationInDb(id: string): Promise<boolean> {
  try {
    await fetchFromApi(`/certifications/${id}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error('Error deleting certification:', error);
    return false;
  }
}

// ==================== SETTINGS ====================

export interface SiteSettings {
  site_name: string;
  site_description: string;
  profile_image: string;
  github_url: string;
  linkedin_url: string;
  instagram_url: string;
  whatsapp_number: string;
  whatsapp_message: string;
  email: string;
  cover_title: string;
  cover_subtitle: string;
  cover_description: string;
  nav_home: string;
  nav_blog: string;
  nav_daily_logs: string;
  footer_copyright: string;
}

const defaultSettings: SiteSettings = {
  site_name: 'Ravnx.',
  site_description: 'Mahasiswa Sistem Informasi, AI Enthusiast dan Data Enthusiast.',
  profile_image: '',
  github_url: 'https://github.com/robet31',
  linkedin_url: 'https://www.linkedin.com/in/arraffi-abqori-nur-azizi/',
  instagram_url: 'https://www.instagram.com/ravnxx_/',
  whatsapp_number: '6281515450611',
  whatsapp_message: 'Hai min, aku interested sama project kamu nih. Bisa jelasin lebih lanjut?',
  email: 'api@portfolio.dev',
  cover_title: 'Hi, I am Ravnx',
  cover_subtitle: 'Mahasiswa Sistem Informasi | AI & Data Enthusiast',
  cover_description: 'Saya adalah mahasiswa Sistem Informasi yang passionate dalam dunia AI, Data Science, dan Web Development.',
  nav_home: 'Home',
  nav_blog: 'Blog',
  nav_daily_logs: 'Daily Logs',
  footer_copyright: '© 2026 Ravnx. Built with ❤️ & code.',
};

let settingsCache: { data: SiteSettings; timestamp: number } | null = null;
const SETTINGS_CACHE_DURATION = 5 * 60 * 1000;

export async function getSettingsFromDb(forceRefresh = false): Promise<SiteSettings> {
  if (!forceRefresh && settingsCache && Date.now() - settingsCache.timestamp < SETTINGS_CACHE_DURATION) {
    return settingsCache.data;
  }

  try {
    const settings = await fetchFromApi<SiteSettings>('/settings');
    const merged = { ...defaultSettings, ...settings };
    settingsCache = { data: merged, timestamp: Date.now() };
    return merged;
  } catch (error) {
    console.error('Error fetching settings:', error);
    return defaultSettings;
  }
}

export async function updateSettingInDb(key: string, value: string): Promise<boolean> {
  try {
    await fetchFromApi('/settings', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });
    settingsCache = null;
    return true;
  } catch (error) {
    console.error('Error updating setting:', error);
    return false;
  }
}

export async function updateSettingsBulkInDb(settings: Partial<SiteSettings>): Promise<boolean> {
  try {
    await fetchFromApi('/settings/bulk', {
      method: 'POST',
      body: JSON.stringify({ settings }),
    });
    settingsCache = null;
    return true;
  } catch (error) {
    console.error('Error updating settings:', error);
    return false;
  }
}

export function getCachedSettings(): SiteSettings | null {
  return settingsCache?.data || null;
}
