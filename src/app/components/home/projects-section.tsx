import { useState, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, ImageOff, FolderKanban } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { getAllProjectsFromDb } from '../../lib/db';
import type { Project } from '../../lib/types';

/* ═══════════════════════════════════════════
   MOBILE: Compact project card — no large image
   ═══════════════════════════════════════════ */
function MobileProjectCard({ project }: { project: Project }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border/60 hover:border-primary/20 transition-all group">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <FolderKanban className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {project.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{project.description}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          <Badge variant="secondary" className="rounded-md text-[10px] px-1.5 py-0">
            {project.category}
          </Badge>
          {project.tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="secondary" className="rounded-md text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          {project.tags.length > 2 && (
            <span className="text-[10px] text-muted-foreground/60">+{project.tags.length - 2}</span>
          )}
        </div>
      </div>
      {project.link && (
        <a
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 w-7 h-7 rounded-md bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors mt-0.5"
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

export function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      const data = await getAllProjectsFromDb();
      setProjects(data);
      setLoading(false);
    }
    loadProjects();
  }, []);

  if (loading) {
    return (
      <section id="projects" className="py-16 md:py-24 bg-card/30">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 md:mb-16"
          >
            <span className="text-primary text-sm tracking-widest uppercase">Portofolio</span>
            <h2 className="!text-2xl sm:!text-3xl md:!text-4xl text-foreground mt-3">
              Featured Projects
            </h2>
          </motion.div>
          <div className="grid gap-4">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border/60">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border/60">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
            <div className="hidden md:grid md:grid-cols-2 gap-6">
              <div className="space-y-3 p-4 rounded-xl bg-card border border-border/60">
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
              <div className="space-y-3 p-4 rounded-xl bg-card border border-border/60">
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="projects" className="py-16 md:py-24 bg-card/30">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-16"
        >
          <span className="text-primary text-sm tracking-widest uppercase">Portofolio</span>
          <h2 className="!text-2xl sm:!text-3xl md:!text-4xl text-foreground mt-3">
            Featured Projects
          </h2>
          <p className="text-muted-foreground mt-3 md:mt-4 max-w-2xl mx-auto text-base md:text-lg">
            Koleksi proyek yang telah saya bangun, dari IoT hingga data visualization.
          </p>
        </motion.div>

        {projects.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No projects yet.
          </div>
        ) : (
          <>
            {/* Mobile: compact list */}
            <div className="md:hidden space-y-2">
              {projects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                >
                  <MobileProjectCard project={project} />
                </motion.div>
              ))}
            </div>

            {/* Desktop: full cards with images */}
            <div className="hidden md:grid md:grid-cols-2 gap-6">
              {projects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500"
                >
                  <div className="relative h-52 overflow-hidden bg-muted">
                    <ProjectImage src={project.image} alt={project.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                    <div className="absolute top-4 right-4">
                      <Badge className="rounded-lg bg-background/80 text-foreground backdrop-blur-sm border-0">
                        {project.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-foreground group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      {project.link && (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 mt-1"
                        >
                          <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      )}
                      {!project.link && (
                        <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    <p className="text-foreground/70 text-sm leading-relaxed mb-4 line-clamp-3">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map(tag => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="rounded-md text-xs px-2 py-0.5"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* Image component with fallback */
function ProjectImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  const handleError = useCallback(() => setError(true), []);

  if (!src || error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted/60 text-muted-foreground">
        <ImageOff className="w-8 h-8 mb-2 opacity-40" />
        <span className="text-xs opacity-60">Image not available</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      onError={handleError}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
}