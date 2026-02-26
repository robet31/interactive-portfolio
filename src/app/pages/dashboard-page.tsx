import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { FileText, Eye, PenSquare, Clock, Sparkles, CalendarDays, Briefcase, FolderKanban, Award, ArrowRight, Database, HardDrive, Image, FileText as FilePdf, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Progress } from '../components/ui/progress';
import { getAllPostsFromDb, getAllExperiencesFromDb, getAllProjectsFromDb, getAllCertificationsFromDb, getCachedPosts, getCachedExperiences, getCachedProjects, getCachedCertifications, clearCache } from '../lib/db';
import type { Post, Experience, Project, Certification } from '../lib/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface DbStorageInfo {
  plan: string;
  limitGB: number;
  used: { bytes: number; pretty: string };
  remaining: { bytes: number; pretty: string };
  usagePercentage: string;
  tables: { name: string; size: string; bytes: number }[];
  recommendations: {
    estimatedImagesRemaining: number;
    estimatedPdfsRemaining: number;
    message: string;
  };
}

export function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState<DbStorageInfo | null>(null);
  const [storageLoading, setStorageLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const cachedPosts = getCachedPosts();
      const cachedExp = getCachedExperiences();
      const cachedProj = getCachedProjects();
      const cachedCert = getCachedCertifications();

      if (cachedPosts) setPosts(cachedPosts);
      if (cachedExp) setExperiences(cachedExp);
      if (cachedProj) setProjects(cachedProj);
      if (cachedCert) setCertifications(cachedCert);

      if (cachedPosts && cachedExp && cachedProj && cachedCert) {
        setLoading(false);
        return;
      }

      const [postsData, experiencesData, projectsData, certificationsData] = await Promise.all([
        getAllPostsFromDb(true),
        getAllExperiencesFromDb(true),
        getAllProjectsFromDb(true),
        getAllCertificationsFromDb(true)
      ]);
      setPosts(postsData);
      setExperiences(experiencesData);
      setProjects(projectsData);
      setCertifications(certificationsData);
      setLoading(false);
    }

    loadData();

    const handleFocus = () => {
      clearCache();
      loadData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Fetch database storage info
  useEffect(() => {
    async function fetchStorageInfo() {
      try {
        const response = await fetch(`${API_BASE_URL}/db-storage`);
        if (response.ok) {
          const data = await response.json();
          setStorageInfo(data);
        }
      } catch (error) {
        console.error('Failed to fetch storage info:', error);
      } finally {
        setStorageLoading(false);
      }
    }
    fetchStorageInfo();
  }, []);

  const stats = useMemo(() => {
    const published = posts.filter(p => p.status === 'published').length;
    const drafts = posts.filter(p => p.status === 'draft').length;
    const logs = posts.filter(p => p.category === 'Daily Log').length;
    const totalReadTime = posts.reduce((acc, p) => acc + p.reading_time, 0);
    return { total: posts.length, published, drafts, logs, totalReadTime, experiences: experiences.length, projects: projects.length, certifications: certifications.length };
  }, [posts, experiences, projects, certifications]);

  const allStats = [
    { label: 'Total Articles', value: stats.total, icon: FileText, color: 'text-primary' },
    { label: 'Published', value: stats.published, icon: Eye, color: 'text-emerald-500' },
    { label: 'Drafts', value: stats.drafts, icon: PenSquare, color: 'text-amber-500' },
    { label: 'Daily Logs', value: stats.logs, icon: CalendarDays, color: 'text-violet-500' },
    { label: 'Experiences', value: stats.experiences, icon: Briefcase, color: 'text-cyan-500' },
    { label: 'Certifications', value: stats.certifications, icon: Award, color: 'text-orange-500' },
    { label: 'Projects', value: stats.projects, icon: FolderKanban, color: 'text-pink-500' },
    { label: 'Read Time', value: `${stats.totalReadTime}m`, icon: Clock, color: 'text-blue-500' },
  ];

  // Mobile: show top 4 key stats only
  const mobileStats = allStats.slice(0, 4);

  const recentPosts = posts.slice(0, 5);

  if (loading) {
    return (
      <div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>

          {/* Mobile Skeleton */}
          <div className="md:hidden grid grid-cols-2 gap-2.5 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-card border border-border">
                <Skeleton className="w-4 h-4" />
                <div className="min-w-0">
                  <Skeleton className="h-6 w-8" />
                  <Skeleton className="h-3 w-16 mt-1" />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Skeleton */}
          <div className="hidden md:grid md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="p-5 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="w-5 h-5" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-8 w-12" />
              </div>
            ))}
          </div>

          {/* CTA Skeleton */}
          <Skeleton className="h-20 rounded-xl mb-6 md:mb-8" />

          {/* Recent Posts Skeleton */}
          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <Skeleton className="h-5 w-32 mb-4" />
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="!text-xl md:!text-2xl text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">Welcome back, Api!</p>
          </div>
          <Link to="/rapi/editor">
            <Button className="gap-2 rounded-xl w-full sm:w-auto">
              <PenSquare className="w-4 h-4" />
              New Post
            </Button>
          </Link>
        </div>

        {/* Mobile stats — compact 2×2 grid, top 4 only */}
        <div className="md:hidden grid grid-cols-2 gap-2.5 mb-6">
          {mobileStats.map(stat => (
            <div key={stat.label} className="flex items-center gap-2.5 p-3 rounded-xl bg-card border border-border">
              <stat.icon className={`w-4 h-4 ${stat.color} flex-shrink-0`} />
              <div className="min-w-0">
                <p className="!text-xl text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground truncate">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop stats — full 4-col grid */}
        <div className="hidden md:grid md:grid-cols-4 gap-4 mb-8">
          {allStats.map(stat => (
            <div
              key={stat.label}
              className="p-5 rounded-xl bg-card border border-border"
            >
              <div className="flex items-center gap-3 mb-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <span className="text-sm text-muted-foreground truncate">{stat.label}</span>
              </div>
              <p className="!text-3xl text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Database Storage Info */}
        {storageLoading ? (
          <div className="rounded-xl border border-border bg-card p-5 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="w-5 h-5" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : storageInfo ? (
          <div className="rounded-xl border border-border bg-card p-5 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Database Storage</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {storageInfo.plan}
                </span>
              </div>
              {parseFloat(storageInfo.usagePercentage) > 80 ? (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              )}
            </div>
            
            {/* Progress bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  {storageInfo.used.pretty} / {storageInfo.limitGB} GB
                </span>
                <span className={`font-medium ${
                  parseFloat(storageInfo.usagePercentage) > 80 ? 'text-red-500' :
                  parseFloat(storageInfo.usagePercentage) > 50 ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {storageInfo.usagePercentage}%
                </span>
              </div>
              <Progress 
                value={parseFloat(storageInfo.usagePercentage)} 
                className={`h-2 ${
                  parseFloat(storageInfo.usagePercentage) > 80 ? '[&>div]:bg-red-500' :
                  parseFloat(storageInfo.usagePercentage) > 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'
                }`}
              />
            </div>

            {/* Storage details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Used</p>
                  <p className="text-sm font-medium text-foreground">{storageInfo.used.pretty}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className="text-sm font-medium text-foreground">{storageInfo.remaining.pretty}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Images (≈500KB)</p>
                  <p className="text-sm font-medium text-foreground">~{storageInfo.recommendations.estimatedImagesRemaining}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FilePdf className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">PDFs (≈2MB)</p>
                  <p className="text-sm font-medium text-foreground">~{storageInfo.recommendations.estimatedPdfsRemaining}</p>
                </div>
              </div>
            </div>

            {/* Table sizes */}
            {storageInfo.tables.length > 0 && (
              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground mb-2">Table Sizes:</p>
                <div className="flex flex-wrap gap-2">
                  {storageInfo.tables.map(table => (
                    <span key={table.name} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                      {table.name}: {table.size}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Warning message */}
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              parseFloat(storageInfo.usagePercentage) > 80 ? 'bg-red-500/10 text-red-500' :
              parseFloat(storageInfo.usagePercentage) > 50 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              {storageInfo.recommendations.message}
            </div>
          </div>
        ) : null}

        {/* AI Log Generator CTA */}
        <div className="rounded-xl border border-border bg-gradient-to-r from-violet-500/5 via-blue-500/5 to-cyan-500/5 p-4 md:p-5 mb-6 md:mb-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <h3 className="text-foreground text-sm">AI Log Generator</h3>
                <p className="text-muted-foreground text-xs hidden sm:block">Ceritakan kegiatanmu, AI akan menyusun log harian yang rapi</p>
              </div>
            </div>
            <Link to="/rapi/log-generator">
              <Button size="sm" className="gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600">
                <Sparkles className="w-3.5 h-3.5" />
                Buat Log
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent posts */}
        <div className="rounded-xl border border-border bg-card">
          <div className="p-4 md:p-5 border-b border-border flex items-center justify-between">
            <h3 className="text-foreground text-sm md:text-base">Recent Articles</h3>
            <Link to="/rapi/posts">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs md:text-sm">
                View all
              </Button>
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentPosts.map(post => (
              <Link
                key={post.id}
                to={`/rapi/editor/${post.id}`}
                className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-foreground text-sm md:text-base truncate">{post.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {post.category} &middot; {post.reading_time} min
                  </p>
                </div>
                <span
                  className={`text-[10px] md:text-xs px-2 py-0.5 md:px-2.5 md:py-1 rounded-md ml-3 flex-shrink-0 ${
                    post.status === 'published'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-amber-500/10 text-amber-600'
                  }`}
                >
                  {post.status}
                </span>
              </Link>
            ))}
            {recentPosts.length === 0 && (
              <div className="px-5 py-12 text-center text-muted-foreground">
                No articles yet. Start writing!
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
