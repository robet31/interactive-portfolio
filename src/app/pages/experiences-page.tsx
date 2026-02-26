import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Pencil,
  Trash2,
  Briefcase,
  GraduationCap,
  Award,
  Search,
  Filter,
  Building2,
  Heart,
  Users,
  ArrowUpDown,
  Star,
  Image,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { ExperienceFormDialog } from '../components/dashboard/experience-form-dialog';
import { ImageLightbox, ImageGalleryGrid } from '../components/ui/image-lightbox';
import {
  getAllExperiencesFromDb,
  createExperienceInDb,
  updateExperienceInDb,
  deleteExperienceInDb,
  clearCacheFor,
} from '../lib/db';
import type { Experience } from '../lib/types';
import { toast } from 'sonner';
import { playSuccessSound, playErrorSound } from '../lib/sounds';

// Menambahkan ekstensi tipe lokal untuk mengatasi error TS 
// (sebelum kamu sempat menambahkan sortOrder di file types.ts)
interface ExtendedExperience extends Experience {
  sortOrder?: number;
}

const typeIcon: Record<string, typeof Briefcase> = {
  work: Briefcase,
  internship: Building2,
  education: GraduationCap,
  program: Award,
  organization: Users,
  volunteer: Heart,
};

const typeLabel: Record<string, string> = {
  work: 'Work',
  internship: 'Magang',
  education: 'Education',
  program: 'Program',
  organization: 'Organization',
  volunteer: 'Volunteer',
};

const typeColor: Record<string, string> = {
  work: 'bg-blue-500/10 text-blue-600',
  internship: 'bg-indigo-500/10 text-indigo-600',
  education: 'bg-emerald-500/10 text-emerald-600',
  program: 'bg-amber-500/10 text-amber-600',
  organization: 'bg-violet-500/10 text-violet-600',
  volunteer: 'bg-rose-500/10 text-rose-600',
};

function extractYear(exp: Experience): string {
  if (exp.startDate) {
    return exp.startDate.split('-')[0];
  }
  if (!exp.period) return 'Unknown';
  const match = exp.period.match(/\d{4}/);
  return match ? match[0] : 'Unknown';
}

// Komponen Card di-sederhanakan agar lebih pas untuk admin dashboard
function ExperienceCard({
  exp,
  onEdit,
  onDelete
}: {
  exp: ExtendedExperience; // Menggunakan tipe yang sudah di-extend agar TS tidak error
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const Icon = typeIcon[exp.type] || Briefcase;
  const currentSortOrder = exp.sortOrder ?? 0;

  // Get images array
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
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border border-border/50 bg-card hover:border-primary/30 transition-all group"
      >
        {/* Kiri: Icon / Gambar */}
        {images.length > 0 ? (
          <div 
            className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-border cursor-pointer"
            onClick={() => handleImageClick(0)}
          >
            <ImageWithFallback
              src={images[0]}
              alt={exp.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className={`w-16 h-16 rounded-lg flex items-center justify-center shrink-0 border border-border/50 ${typeColor[exp.type]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}

        {/* Tengah: Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
            <div>
              <h3 className="text-foreground font-semibold truncate group-hover:text-primary transition-colors">
                {exp.title}
              </h3>
              <p className="text-muted-foreground text-sm truncate">{exp.organization}</p>
            </div>

            <div className="flex items-center gap-2 mt-2 sm:mt-0 shrink-0">
              {/* Indikator Prioritas (Sort Order) */}
              {currentSortOrder === 2 && (
                <Badge className="text-[10px] bg-amber-500/20 text-amber-700 border-amber-500/40 shrink-0">
                  <Star className="w-3 h-3 mr-1 fill-amber-500" />
                  Sangat Utama
                </Badge>
              )}
              {currentSortOrder === 1 && (
                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30 shrink-0">
                  <Star className="w-3 h-3 mr-1" />
                  Utama
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs shrink-0 hidden sm:inline-flex">
                {exp.period || <span className="text-muted-foreground italic">No period</span>}
              </Badge>
              {/* Image count indicator */}
              {images.length > 1 && (
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 shrink-0">
                  <Image className="w-3 h-3 mr-1" />
                  {images.length}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Kanan: Aksi Edit & Delete */}
        <div className="flex items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-border/50 shrink-0">
          <Button variant="secondary" size="sm" className="flex-1 sm:flex-none h-8 px-3" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button variant="destructive" size="icon" className="h-8 w-8 shrink-0" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </motion.div>

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

export function ExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const refresh = useCallback(async () => {
    clearCacheFor('experiences');
    const data = await getAllExperiencesFromDb(true);
    setExperiences(data);
  }, []);

  useEffect(() => {
    async function load() {
      const data = await getAllExperiencesFromDb();
      setExperiences(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = useCallback(
    async (data: Partial<Experience>): Promise<boolean> => {
      let success = false;
      if (editingExp) {
        const result = await updateExperienceInDb(editingExp.id, data);
        if (result) {
          toast.success('Experience updated!');
          playSuccessSound();
          success = true;
        } else {
          toast.error('Failed to update experience');
          playErrorSound();
        }
      } else {
        const result = await createExperienceInDb(data);
        if (result) {
          toast.success('Experience added!');
          playSuccessSound();
          success = true;
        } else {
          toast.error('Failed to add experience');
          playErrorSound();
        }
      }
      setEditingExp(null);
      refresh();
      return success;
    },
    [editingExp, refresh],
  );

  const handleEdit = (exp: Experience) => {
    setEditingExp(exp);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingExp(null);
    setFormOpen(true);
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletingId) {
      const result = await deleteExperienceInDb(deletingId);
      if (result) {
        toast.success('Experience deleted.');
        playSuccessSound();
      } else {
        toast.error('Failed to delete experience');
        playErrorSound();
      }
      setDeleteDialogOpen(false);
      setDeletingId(null);
      refresh();
    }
  };

  const filtered = useMemo(() => {
    let result = experiences;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        e =>
          e.title.toLowerCase().includes(q) ||
          e.organization.toLowerCase().includes(q) ||
          e.tags.some(t => t.toLowerCase().includes(q)),
      );
    }
    if (filterType !== 'all') {
      result = result.filter(e => e.type === filterType);
    }
    return result;
  }, [experiences, searchQuery, filterType]);

  const grouped = useMemo(() => {
    const groups: Record<string, ExtendedExperience[]> = {};

    // LOGIKA PENGURUTAN BARU (Sorting by Date + Priority Order)
    const sorted = [...filtered].sort((a, b) => {
      const aDate = a.startDate || '0000-00';
      const bDate = b.startDate || '0000-00';

      // 1. Urutkan berdasarkan tanggal mulai (Descending)
      if (bDate !== aDate) {
        return bDate.localeCompare(aDate);
      }

      // 2. Jika tanggalnya sama, urutkan berdasarkan sortOrder (Prioritas)
      const aOrder = (a as ExtendedExperience).sortOrder || 0;
      const bOrder = (b as ExtendedExperience).sortOrder || 0;
      return bOrder - aOrder;
    });

    for (const exp of sorted) {
      const year = extractYear(exp);
      if (!groups[year]) groups[year] = [];
      groups[year].push(exp);
    }

    const sortedYears = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedYears.map(year => ({
      year,
      items: groups[year]
    }));
  }, [filtered]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto pb-12"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Experiences</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Kelola perjalanan karir dan pendidikanmu. Total: {experiences.length} pengalaman.
          </p>
        </div>
        <Button className="gap-2 rounded-xl w-full sm:w-auto shadow-sm" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          Add Experience
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8 p-4 bg-muted/30 rounded-xl border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search role, company, or skills..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-44 bg-background">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="work">Work</SelectItem>
            <SelectItem value="internship">Magang</SelectItem>
            <SelectItem value="education">Education</SelectItem>
            <SelectItem value="program">Program</SelectItem>
            <SelectItem value="organization">Organization</SelectItem>
            <SelectItem value="volunteer">Volunteer</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Years List */}
      {grouped.length === 0 ? (
        <div className="text-center py-16 rounded-xl border-2 border-dashed border-border/60 bg-muted/10">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-1">Tidak ada data</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            {searchQuery || filterType !== 'all'
              ? 'Tidak ada pengalaman yang cocok dengan pencarian atau filtermu.'
              : 'Belum ada pengalaman yang ditambahkan. Klik tombol "Add" untuk memulai.'}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <AnimatePresence mode="popLayout">
            {grouped.map(({ year, items }) => (
              <motion.div
                key={year}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Year Header */}
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-2xl font-bold text-foreground">{year}</span>
                  <div className="flex-1 h-px bg-border/80" />
                  <Badge variant="outline" className="text-xs font-normal text-muted-foreground bg-muted/30">
                    {items.length} items
                  </Badge>
                </div>

                {/* Grid Items - List Rapi, Stabil, Tidak Loncak-loncak */}
                <div className="grid grid-cols-1 gap-3">
                  {items.map((exp) => (
                    <ExperienceCard
                      key={exp.id}
                      exp={exp}
                      onEdit={() => handleEdit(exp)}
                      onDelete={() => confirmDelete(exp.id)}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Form Dialog */}
      <ExperienceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        experience={editingExp}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Experience</DialogTitle>
            <DialogDescription>
              Apakah kamu yakin ingin menghapus data ini? Aksi ini tidak bisa dibatalkan dan akan hilang dari halaman utamamu.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}