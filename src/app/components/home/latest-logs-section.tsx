import { useMemo, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { ArrowRight, Clock, Terminal, CalendarDays } from 'lucide-react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { getPublishedPostsFromDb } from '../../lib/db';
import { format } from 'date-fns';
import type { Post } from '../../lib/types';

export function LatestLogsSection() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      const data = await getPublishedPostsFromDb();
      setPosts(data);
      setLoading(false);
    }
    loadPosts();
  }, []);

  const logs = useMemo(() => {
    return posts
      .filter((p) => p.category === 'Daily Log')
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 5);
  }, [posts]);

  if (loading) {
    return (
      <section className="py-16 md:py-20 border-t border-border/40">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-10"
          >
            <div>
              <h2 className="!text-2xl sm:!text-3xl md:!text-4xl text-foreground mb-2">
                Log Harian
              </h2>
            </div>
          </motion.div>
          
          <div className="grid gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border/60">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <div className="flex gap-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="w-6 h-6 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (logs.length === 0) return null;

  return (
    <section className="py-16 md:py-20 border-t border-border/40">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 md:mb-10"
        >
          <div>
            <h2 className="!text-2xl sm:!text-3xl md:!text-4xl text-foreground mb-2">
              Log Harian
            </h2>
            <p className="text-muted-foreground max-w-lg text-sm md:text-base">
              Catatan kegiatan harian — coding session, debugging, riset, dan
              progress project.
            </p>
          </div>
          <Link to="/daily-logs" className="hidden sm:block">
            <Button
              variant="ghost"
              className="gap-2 text-muted-foreground hover:text-primary"
            >
              Lihat Semua
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

        {/* ═══ MOBILE: Simple list ═══ */}
        <div className="md:hidden space-y-2">
          {logs.map((log, i) => {
            const date = new Date(log.created_at);
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
              >
                <Link
                  to={`/blog/${log.slug}`}
                  className="group flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border/60 hover:border-violet-500/20 transition-all"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <CalendarDays className="w-4 h-4 text-violet-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground group-hover:text-violet-400 transition-colors line-clamp-1">
                      {log.title.replace(/^Log Harian\s*[-–—]\s*/i, '')}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {log.excerpt}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-violet-400/70">{format(date, 'dd MMM yyyy')}</span>
                      <span className="text-[11px] text-muted-foreground/60 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {log.reading_time}m
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-violet-400 transition-colors flex-shrink-0 mt-1" />
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* ═══ DESKTOP: Full timeline ═══ */}
        <div className="hidden md:block relative">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-violet-500/40 via-blue-500/20 to-transparent" />

          <div className="space-y-4">
            {logs.map((log, i) => {
              const date = new Date(log.created_at);

              const sections: string[] = [];
              const h3Regex = /<h3[^>]*>(.*?)<\/h3>/g;
              let match;
              while (
                (match = h3Regex.exec(log.content)) !== null &&
                sections.length < 3
              ) {
                sections.push(match[1].replace(/<[^>]*>/g, ''));
              }

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <Link
                    to={`/blog/${log.slug}`}
                    className="group flex gap-6"
                  >
                    {/* Timeline dot */}
                    <div className="flex flex-col items-center pt-1">
                      <div className="w-[10px] h-[10px] rounded-full bg-violet-500 ring-4 ring-background z-10 group-hover:ring-violet-500/20 transition-all" />
                    </div>

                    {/* Card */}
                    <div className="flex-1 rounded-xl border border-border bg-card p-5 hover:border-violet-500/30 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300">
                      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md">
                            {format(date, 'dd MMM yyyy')}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {log.reading_time} min
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-violet-400 transition-all" />
                      </div>

                      <h3 className="text-foreground mb-2 group-hover:text-violet-400 transition-colors line-clamp-1">
                        {log.title.replace(/^Log Harian\s*[-–—]\s*/i, '')}
                      </h3>

                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                        {log.excerpt}
                      </p>

                      {sections.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {sections.map((sec, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-muted/50 text-muted-foreground flex items-center gap-1"
                            >
                              <Terminal className="w-2.5 h-2.5" />
                              {sec.length > 30
                                ? sec.substring(0, 30) + '...'
                                : sec}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="mt-6 text-center md:hidden">
          <Link to="/daily-logs">
            <Button
              variant="outline"
              className="gap-2 rounded-xl"
            >
              Lihat Semua Log
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}