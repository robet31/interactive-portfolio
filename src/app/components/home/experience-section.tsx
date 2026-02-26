import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, GraduationCap, Award, Calendar, Building2, Heart, Users } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { ImageLightbox, ImageGalleryGrid } from '../ui/image-lightbox';
import { getAllExperiencesFromDb } from '../../lib/db';
import type { Experience } from '../../lib/types';

const typeIcon: Record<string, typeof Briefcase> = {
  work: Briefcase,
  internship: Building2,
  education: GraduationCap,
  program: Award,
  organization: Users,
  volunteer: Heart,
};

const typeColor: Record<string, string> = {
  work: 'bg-blue-500',
  internship: 'bg-indigo-500',
  education: 'bg-emerald-500',
  program: 'bg-amber-500',
  organization: 'bg-violet-500',
  volunteer: 'bg-rose-500',
};

const typeBadgeBg: Record<string, string> = {
  work: 'bg-blue-500/80',
  internship: 'bg-indigo-500/80',
  education: 'bg-emerald-500/80',
  program: 'bg-amber-500/80',
  organization: 'bg-violet-500/80',
  volunteer: 'bg-rose-500/80',
};

const typeLabel: Record<string, string> = {
  work: 'Work',
  internship: 'Magang',
  education: 'Education',
  program: 'Program',
  organization: 'Organization',
  volunteer: 'Volunteer',
};

const typeDotColor: Record<string, string> = {
  work: 'bg-blue-500/15 text-blue-500',
  internship: 'bg-indigo-500/15 text-indigo-500',
  education: 'bg-emerald-500/15 text-emerald-500',
  program: 'bg-amber-500/15 text-amber-500',
  organization: 'bg-violet-500/15 text-violet-500',
  volunteer: 'bg-rose-500/15 text-rose-500',
};

function extractYear(exp: Experience): string {
  if (exp.startDate) {
    return exp.startDate.split('-')[0];
  }
  if (!exp.period) return 'Unknown';
  const match = exp.period.match(/\d{4}/);
  return match ? match[0] : 'Unknown';
}

interface YearGroup {
  year: string;
  items: Experience[];
}

/* ═══════════════════════════════════════════
   MOBILE: Compact card — no image, no tags (TETAP DIPERTAHANKAN)
   ═══════════════════════════════════════════ */
function MobileCompactCard({ exp }: { exp: Experience }) {
  const Icon = typeIcon[exp.type] || Briefcase;
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border/60 hover:border-primary/20 transition-all group">
      <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${typeDotColor[exp.type]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {exp.title}
        </p>
        <p className="text-xs text-primary/70 line-clamp-1">{exp.organization}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{exp.period}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DESKTOP: Interactive List Card (BARU - Sesuai Permintaan)
   ═══════════════════════════════════════════ */
function InteractiveListCard({ exp }: { exp: Experience }) {
  const [isHovered, setIsHovered] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const Icon = typeIcon[exp.type] || Briefcase;

  // Get images array - prioritize new images field, fallback to old image field
  const images = exp.images && exp.images.length > 0 
    ? exp.images 
    : exp.image 
      ? [exp.image] 
      : [];

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative overflow-hidden rounded-xl border border-border/50 bg-card/40 hover:bg-card hover:border-primary/30 transition-all duration-300 cursor-pointer group"
      >
        {/* ── Tampilan List (Ringkas) ── */}
        <div className="flex items-center justify-between p-4 md:p-5">
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-lg flex-shrink-0 ${typeDotColor[exp.type]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {exp.title}
              </h4>
              <p className="text-sm text-primary/80">{exp.organization}</p>
            </div>
          </div>
          <div className="text-sm font-medium text-muted-foreground whitespace-nowrap hidden sm:block">
            {exp.period}
          </div>
        </div>

        {/* ── Tampilan Dropdown (Muncul Pas Di-hover) ── */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="px-4 md:px-5 pb-5 pt-2 border-t border-border/50 flex flex-col md:flex-row gap-5">
                {/* Gambar/Gallery kalau ada */}
                {images.length > 0 && (
                  <div className="w-full md:w-48 flex-shrink-0">
                    {images.length === 1 ? (
                      <div 
                        className="w-full h-32 rounded-lg overflow-hidden relative cursor-pointer"
                        onClick={() => handleImageClick(0)}
                      >
                        <ImageWithFallback
                          src={images[0]}
                          alt={exp.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] text-white/90 backdrop-blur-md ${typeBadgeBg[exp.type]}`}>
                            <Icon className="w-3 h-3" />
                            {typeLabel[exp.type]}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <ImageGalleryGrid 
                        images={images} 
                        onImageClick={handleImageClick}
                        className="w-full"
                      />
                    )}
                  </div>
                )}

                {/* Deskripsi & Tag */}
                <div className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {exp.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {exp.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="rounded-md text-xs px-2 py-0.5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={images}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </>
  );
}

export function ExperienceSection() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadExperiences() {
      const data = await getAllExperiencesFromDb();
      setExperiences(data);
      setLoading(false);
    }
    loadExperiences();
  }, []);

  const yearGroups = useMemo<YearGroup[]>(() => {
    const sorted = [...experiences].sort((a, b) => {
      const aDate = a.startDate || '0000-00';
      const bDate = b.startDate || '0000-00';
      return bDate.localeCompare(aDate);
    });

    const groups: Record<string, Experience[]> = {};
    for (const exp of sorted) {
      const year = extractYear(exp);
      if (!groups[year]) groups[year] = [];
      groups[year].push(exp);
    }

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(year => ({ year, items: groups[year] }));
  }, [experiences]);

  if (loading) {
    return (
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10 md:mb-16">
            <span className="text-primary text-sm tracking-widest uppercase">Pengalaman</span>
            <h2 className="!text-2xl sm:!text-3xl md:!text-4xl text-foreground mt-3">
              Experience & Journey
            </h2>
          </div>
          
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  {i < 3 && <div className="w-0.5 flex-1 bg-border mt-2" />}
                </div>
                <div className="flex-1 space-y-3 pb-8">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-16"
        >
          <span className="text-primary text-sm tracking-widest uppercase">Pengalaman</span>
          <h2 className="!text-2xl sm:!text-3xl md:!text-4xl text-foreground mt-3">
            Experience & Journey
          </h2>
          <p className="text-muted-foreground mt-3 md:mt-4 max-w-2xl mx-auto text-base md:text-lg">
            Perjalanan profesional dan akademis yang membentuk keahlian saya.
          </p>
        </motion.div>

        {/* ═══════════════════════════════
            MOBILE VIEW — Simple compact list (TETAP DIPERTAHANKAN)
            ═══════════════════════════════ */}
        <div className="md:hidden space-y-6">
          {yearGroups.map((group, gi) => (
            <motion.div
              key={group.year}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: gi * 0.05 }}
            >
              {/* Year header — simple */}
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs shadow-sm">
                  <Calendar className="w-3 h-3" />
                  {group.year}
                </span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] text-muted-foreground">{group.items.length}</span>
              </div>

              {/* Compact cards */}
              <div className="space-y-2">
                {group.items.map(exp => (
                  <MobileCompactCard key={exp.id} exp={exp} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ═══════════════════════════════
            DESKTOP VIEW — Row-based Timeline (BARU)
            ═══════════════════════════════ */}
        <div className="hidden md:block max-w-4xl mx-auto space-y-12 relative">
          {yearGroups.map((group, gi) => (
            <motion.div
              key={group.year}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: gi * 0.1 }}
              className="flex items-start gap-8 relative group/year"
            >
              {/* Kiri: Teks Tahun */}
              <div className="w-32 flex-shrink-0 pt-4 text-right sticky top-24">
                <span className="text-3xl font-bold text-foreground group-hover/year:text-primary transition-colors">
                  {group.year}
                </span>
                <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                  {group.items.length} Activities
                </div>
              </div>

              {/* Tengah: Garis Timeline & Titik */}
              <div className="relative flex flex-col items-center pt-6">
                <div className="w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-background z-10 shadow-sm" />
                {/* Garis Vertikal (Jangan dirender di item terakhir agar rapi) */}
                {gi !== yearGroups.length - 1 && (
                  <div className="absolute top-10 bottom-[-48px] w-px bg-border" />
                )}
              </div>

              {/* Kanan: List Experience Interaktif */}
              <div className="flex-1 space-y-4 pt-1">
                {group.items.map(exp => (
                  <InteractiveListCard key={exp.id} exp={exp} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}