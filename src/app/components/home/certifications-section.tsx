import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Award, ExternalLink, Calendar, ShieldCheck, BadgeCheck, Hash, Layers } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { getAllCertificationsFromDb } from '../../lib/db';
import type { Certification } from '../../lib/types';

/* ── Helpers ── */
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  if (!month) return year;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

function isExpired(expiryDate: string): boolean {
  if (!expiryDate) return false;
  const now = new Date();
  const [year, month] = expiryDate.split('-');
  if (!month) return false;
  const expiry = new Date(parseInt(year), parseInt(month) - 1);
  return expiry < now;
}

/* ═══════════════════════════════════════════
   MOBILE: Compact list card
   ═══════════════════════════════════════════ */
function MobileCertCard({ cert }: { cert: Certification }) {
  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-card border border-border/60 hover:border-primary/20 transition-all group">
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-orange-500/10 flex items-center justify-center">
        <Award className="w-4 h-4 text-orange-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {cert.name}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-1">{cert.organization}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] text-muted-foreground/70">{formatDate(cert.issueDate) || 'N/A'}</span>
          {!cert.expiryDate || !isExpired(cert.expiryDate) ? (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-500">
              <BadgeCheck className="w-2.5 h-2.5" />
              Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-red-500">
              Expired
            </span>
          )}
        </div>
      </div>
      {cert.credentialUrl && (
        <a
          href={cert.credentialUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex-shrink-0 w-7 h-7 rounded-md bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors mt-0.5"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   DESKTOP: Flip Card
   ═══════════════════════════════════════════ */
function CertFlipCard({ cert, index }: { cert: Certification; index: number }) {
  const [imgError, setImgError] = useState(false);
  const hasImage = cert.image && !imgError;
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] as const }}
      className="relative w-full aspect-[4/3] cursor-pointer select-none"
      style={{ perspective: '900px' }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onTouchStart={() => setIsFlipped(f => !f)}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 26 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="relative w-full h-full"
      >
        {/* ════════ FRONT ════════ */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden border border-border/60 bg-card"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="absolute inset-0">
            {hasImage ? (
              <img
                src={cert.image}
                alt={cert.name}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/[0.05] via-muted/50 to-accent/30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />
          </div>

          <div className="absolute top-2.5 right-2.5 z-10">
            {(!cert.expiryDate || !isExpired(cert.expiryDate)) ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 backdrop-blur-md border border-emerald-500/25">
                <BadgeCheck className="w-2.5 h-2.5" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] bg-red-500/20 text-red-300 backdrop-blur-md border border-red-500/25">
                Expired
              </span>
            )}
          </div>

          {!hasImage && (
            <div className="absolute inset-0 flex items-center justify-center z-[1] -mt-6">
              <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center backdrop-blur-sm">
                <Award className="w-7 h-7 text-primary/50" />
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-3.5 z-10">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ShieldCheck className="w-3 h-3 text-white/40 shrink-0" />
              <span className="text-[10px] text-white/50 truncate">{cert.organization}</span>
            </div>
            <h3 className="text-white !text-sm !leading-[1.3] line-clamp-2 mb-2">
              {cert.name}
            </h3>
            <div className="flex items-center gap-1 text-[9px] text-white/25">
              <Layers className="w-2.5 h-2.5" />
              <span>Hover untuk detail</span>
            </div>
          </div>
        </div>

        {/* ════════ BACK ════════ */}
        <div
          className="absolute inset-0 rounded-xl overflow-hidden border border-primary/15 bg-card"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-primary/[0.02]" />

          <div className="relative h-full flex flex-col p-4">
            <div className="mb-auto min-h-0">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3 h-3 text-primary/70" />
                </div>
                <span className="text-[10px] text-muted-foreground truncate">{cert.organization}</span>
              </div>

              <h3 className="text-foreground !text-[13px] !leading-[1.35] line-clamp-2 mb-2.5">
                {cert.name}
              </h3>

              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 mb-1">
                <Calendar className="w-2.5 h-2.5 shrink-0" />
                <span>Issued {formatDate(cert.issueDate) || 'N/A'}</span>
                {cert.expiryDate && (
                  <span className={isExpired(cert.expiryDate) ? 'text-red-500' : ''}>
                    {' '} · Exp. {formatDate(cert.expiryDate)}
                  </span>
                )}
              </div>

              {cert.credentialId && (
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/45 mb-2.5">
                  <Hash className="w-2.5 h-2.5 shrink-0" />
                  <span className="truncate font-mono">{cert.credentialId}</span>
                </div>
              )}
            </div>

            {cert.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2.5">
                {cert.skills.slice(0, 4).map(skill => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="rounded-md text-[9px] px-1.5 py-0"
                  >
                    {skill}
                  </Badge>
                ))}
                {cert.skills.length > 4 && (
                  <span className="text-[9px] text-muted-foreground/40 self-center">
                    +{cert.skills.length - 4}
                  </span>
                )}
              </div>
            )}

            {cert.credentialUrl && (
              <a
                href={cert.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors group/link w-fit mt-auto"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                Show Credential
                <span className="inline-block transition-transform group-hover/link:translate-x-0.5">→</span>
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Section ── */
export function CertificationsSection() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCertifications() {
      const data = await getAllCertificationsFromDb();
      setCertifications(data);
      setLoading(false);
    }
    loadCertifications();
  }, []);

  if (loading) {
    return (
      <section className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 md:mb-12"
          >
            <span className="text-primary text-sm tracking-widest uppercase">Sertifikasi</span>
            <h2 className="!text-2xl sm:!text-3xl md:!text-4xl text-foreground mt-3">
              Licenses & Certifications
            </h2>
          </motion.div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-card border border-border/60 space-y-3">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (certifications.length === 0) return null;

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-12"
        >
          <span className="text-primary text-sm tracking-widest uppercase">Sertifikasi</span>
          <h2 className="!text-2xl sm:!text-3xl md:!text-4xl text-foreground mt-3">
            Licenses & Certifications
          </h2>
          <p className="text-muted-foreground mt-3 md:mt-4 max-w-2xl mx-auto text-base md:text-lg">
            Sertifikasi profesional dan pencapaian yang memvalidasi keahlian saya.
          </p>
        </motion.div>

        {/* Mobile: compact list */}
        <div className="md:hidden space-y-2">
          {certifications.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
            >
              <MobileCertCard cert={cert} />
            </motion.div>
          ))}
        </div>

        {/* Desktop: flip card grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {certifications.map((cert, i) => (
            <CertFlipCard key={cert.id} cert={cert} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}