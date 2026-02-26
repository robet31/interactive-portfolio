import { useState, useEffect } from 'react';
import { Briefcase, GraduationCap, Award, X, Plus, Building2, Heart, Users, ArrowUpDown, Info, Star, ImagePlus, Trash2, Loader2, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import type { Experience, ExperienceType } from '../../lib/types';
import { ImageUploadField } from './image-upload-field';
import { generateExperienceFromImage, type GeneratedExperience } from '../../lib/ai-service';

interface ExperienceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experience?: Experience | null;
  onSave: (data: Partial<Experience>) => Promise<boolean>;
}

const typeOptions = [
  { value: 'work', label: 'Work', icon: Briefcase },
  { value: 'internship', label: 'Magang', icon: Building2 },
  { value: 'education', label: 'Education', icon: GraduationCap },
  { value: 'program', label: 'Program', icon: Award },
  { value: 'organization', label: 'Organization', icon: Users },
  { value: 'volunteer', label: 'Volunteer', icon: Heart },
] as const;

export function ExperienceFormDialog({
  open,
  onOpenChange,
  experience,
  onSave,
}: ExperienceFormDialogProps) {
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [period, setPeriod] = useState('');
  const [startDate, setStartDate] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ExperienceType>('work');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [image, setImage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const isEditing = !!experience;

  const handleAIGenerate = async () => {
    const imageUrl = images.length > 0 ? images[0] : image;
    if (!imageUrl) {
      alert('Silakan upload gambar dulu sebelum menggunakan AI Generate');
      return;
    }

    setIsGenerating(true);
    try {
      const result: GeneratedExperience = await generateExperienceFromImage(imageUrl);
      
      if (result.title) setTitle(result.title);
      if (result.organization) setOrganization(result.organization);
      if (result.period) setPeriod(result.period);
      if (result.description) setDescription(result.description);
      if (result.type) setType(result.type as ExperienceType);
      if (result.tags && result.tags.length > 0) setTags(result.tags);
    } catch (error) {
      console.error('AI Generation error:', error);
      alert('Gagal generate dari gambar. Silakan isi form secara manual.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (experience) {
      setTitle(experience.title || '');
      setOrganization(experience.organization || '');
      setPeriod(experience.period || '');
      setStartDate(experience.startDate || '');
      setDescription(experience.description || '');
      setType(experience.type || 'work');
      setTags(experience.tags || []);
      setImage(experience.image || '');
      setImages(experience.images || []);
      
      // Mengambil data sortOrder, pakai any sementara biar tidak error TS
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSortOrder((experience as any).sortOrder?.toString() || '0');
    } else {
      setTitle('');
      setOrganization('');
      setPeriod('');
      setStartDate('');
      setDescription('');
      setType('work');
      setTags([]);
      setTagInput('');
      setImage('');
      setImages([]);
      setSortOrder('0');
    }
  }, [experience, open]);

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
      setTagInput('');
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddImage = (url: string) => {
    if (url.trim() && !images.includes(url.trim())) {
      setImages([...images, url.trim()]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    const success = await onSave({
      title: title.trim(),
      organization: organization.trim(),
      period: period.trim(),
      startDate: startDate.trim(),
      description: description.trim(),
      type,
      tags,
      image: images.length > 0 ? images[0] : image.trim(),
      images: images,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sortOrder: parseInt(sortOrder) || 0,
    } as any);

    setIsSubmitting(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isEditing ? 'Edit Experience' : 'Add New Experience'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update detail perjalanan karir atau studimu.'
                : 'Tambahkan pengalaman baru ke dalam linimasamu.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-6">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="space-y-2">
              <Label htmlFor="exp-title">Title <span className="text-destructive">*</span></Label>
              <Input
                id="exp-title"
                placeholder="e.g. Software Engineering Intern"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exp-org">Organization</Label>
                <Input
                  id="exp-org"
                  placeholder="e.g. Google, Kampus Merdeka"
                  value={organization}
                  onChange={e => setOrganization(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v: ExperienceType) => setType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="w-3.5 h-3.5" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 2: Time & Sorting */}
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Pengaturan Waktu & Urutan</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Display Period */}
              <div className="space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="exp-period" className="flex items-center gap-1.5 cursor-help">
                        Display Period 
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs">
                        <strong>Teks yang ditampilkan</strong> di kartu pengalaman. 
                        Contoh: "Jun 2025 - Present" atau "2022 - 2024"
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Input
                  id="exp-period"
                  placeholder="e.g. Jun 2025 - Present"
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Teks bebas untuk ditampilkan ke pengguna
                </p>
              </div>

              {/* Start Date for Sorting */}
              <div className="space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="exp-start" className="flex items-center gap-1.5 cursor-help">
                        Start Date (Untuk Urutan)
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs">
                        <strong>Tanggal asli</strong> untuk mengurutkan pengalaman. 
                        Pilih bulan & tahun dimulainya pengalaman ini.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Input
                  id="exp-start"
                  type="month"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">
                  Tanggal asli untuk sorting otomatis
                </p>
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-3 pt-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label className="flex items-center gap-1.5 cursor-help">
                      <Star className="w-4 h-4 text-amber-500" />
                      Prioritas Utama
                      <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">
                      Tentukan pengalaman mana yang ingin ditampilkan lebih awal dalam tahun yang sama.
                      Pilih <strong>Utama</strong> untuk pengalaman terbaik/paling penting.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <div className="flex gap-2">
                {[
                  { value: '0', label: 'Normal', color: 'bg-muted text-muted-foreground border-border hover:bg-muted/80' },
                  { value: '1', label: 'Utama', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20' },
                  { value: '2', label: 'Sangat Utama', color: 'bg-amber-500/20 text-amber-700 border-amber-500/50 hover:bg-amber-500/30' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSortOrder(option.value)}
                    className={`flex-1 py-2.5 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      sortOrder === option.value
                        ? option.color + ' ring-2 ring-primary/30'
                        : 'bg-background border-border text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exp-desc">Description</Label>
              
              {/* === FIX UTAMA ADA DI SINI === */}
              <textarea
                id="exp-desc"
                rows={5}
                placeholder="Ceritakan tanggung jawab, pencapaian, atau teknologinya..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                // FIX: Ubah 'flex' jadi 'block', tambah min-h lebih besar, dan 'relative z-10' agar tidak ketutupan elemen bawahnya
                className="block min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 resize-y relative z-10"
              />
              {/* ============================= */}
              
            </div>

            <div className="space-y-2">
              <Label>Images (Gallery)</Label>
              <p className="text-xs text-muted-foreground">Add multiple images. Click on an image to preview in lightbox.</p>
              
              {/* Existing Images Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                  {images.map((img, index) => (
                    <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border border-border">
                      <img 
                        src={img} 
                        alt={`Image ${index + 1}`} 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add More Images */}
              <div className="flex gap-2">
                <ImageUploadField
                  label=""
                  id="exp-image-add"
                  value=""
                  onChange={(val) => {
                    if (val) handleAddImage(val);
                  }}
                  className="flex-1"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                First image will be used as cover. Click to add more images.
              </p>
            </div>

            {/* AI Generate Section - Always visible */}
            <div className="space-y-3 p-4 rounded-lg border border-violet-500/30 bg-violet-500/5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-violet-400">🤖 AI Auto Fill</Label>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAIGenerate}
                  disabled={isGenerating || (!image && !isGenerating)}
                  className="flex-1 gap-2 bg-violet-500/10 border-violet-500/30 hover:bg-violet-500/20"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-violet-400" />
                  )}
                  <span className="text-sm">Generate Sekarang</span>
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                AI akan mengisi form berdasarkan gambar yang diupload
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tags / Skills</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. React, Node.js (tekan Enter)"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={handleAddTag} className="shrink-0 px-4">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 p-3 bg-muted/20 rounded-lg border border-border/50 min-h-[44px]">
                  {tags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="rounded-md text-xs px-2.5 py-1 gap-1.5 cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag}
                      <X className="w-3 h-3" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isSubmitting} className="min-w-[120px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                'Save Changes'
              ) : (
                'Add Experience'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}