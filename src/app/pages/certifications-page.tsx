import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Pencil,
  Trash2,
  Award,
  Search,
  ExternalLink,
  Calendar,
  X,
  Loader2,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { ImageUploadField } from '../components/dashboard/image-upload-field';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import {
  getAllCertificationsFromDb,
  createCertificationInDb,
  updateCertificationInDb,
  deleteCertificationInDb,
  clearCacheFor,
} from '../lib/db';
import type { Certification } from '../lib/types';
import { toast } from 'sonner';
import { playSuccessSound, playErrorSound } from '../lib/sounds';
import { generateCertificationFromImage, generateCertificationFromText, type GeneratedCertification } from '../lib/ai-service';

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
  const expiry = new Date(parseInt(year), parseInt(month) - 1);
  return expiry < now;
}

/* ── Form Dialog ── */
function CertFormDialog({
  open,
  onOpenChange,
  certification,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certification?: Certification | null;
  onSave: (data: Partial<Certification>) => void;
}) {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [image, setImage] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMode, setGenerateMode] = useState<'image' | 'text'>('text');
  const [certText, setCertText] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  const isEditing = !!certification;

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    let errorMsg = '';
    
    try {
      let result: GeneratedCertification;
      
      if (generateMode === 'image') {
        if (!image) {
          alert('Silakan upload gambar dulu');
          return;
        }
        result = await generateCertificationFromImage(image);
      } else {
        if (!certText.trim()) {
          alert('Silakan masukkan teks dari sertifikat terlebih dahulu');
          return;
        }
        result = await generateCertificationFromText(certText);
      }
      
      if (result.name) setName(result.name);
      if (result.organization) setOrganization(result.organization);
      if (result.issueDate) setIssueDate(result.issueDate);
      if (result.expiryDate) setExpiryDate(result.expiryDate);
      if (result.credentialId) setCredentialId(result.credentialId);
      if (result.skills && result.skills.length > 0) setSkills(result.skills);
      
      toast.success('Berhasil generate data sertifikasi!');
    } catch (error) {
      errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('AI Generation error:', error);
      toast.error(`Gagal generate: ${errorMsg}. Silakan isi form secara manual.`);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (certification) {
      setName(certification.name || '');
      setOrganization(certification.organization || '');
      setIssueDate(certification.issueDate || '');
      setExpiryDate(certification.expiryDate || '');
      setCredentialId(certification.credentialId || '');
      setCredentialUrl(certification.credentialUrl || '');
      setImage(certification.image || '');
      setSkills(certification.skills || []);
    } else if (open) {
      setName('');
      setOrganization('');
      setIssueDate('');
      setExpiryDate('');
      setCredentialId('');
      setCredentialUrl('');
      setImage('');
      setSkills([]);
      setSkillInput('');
    }
  }, [certification, open]);

  const handleAddSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setSkillInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      organization: organization.trim(),
      issueDate,
      expiryDate: expiryDate || undefined,
      credentialId: credentialId.trim() || undefined,
      credentialUrl: credentialUrl.trim() || undefined,
      image: image.trim() || undefined,
      skills,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Certification' : 'Add Certification'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update certification details.' : 'Add a new license or certification.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="cert-name">Certification Name *</Label>
            <Input
              id="cert-name"
              placeholder="e.g. Google Cloud Computing Foundations"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cert-org">Issuing Organization</Label>
              <Input
                id="cert-org"
                placeholder="e.g. Google Cloud"
                value={organization}
                onChange={e => setOrganization(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cert-cred-id">Credential ID</Label>
              <Input
                id="cert-cred-id"
                placeholder="e.g. ABC-123-XYZ"
                value={credentialId}
                onChange={e => setCredentialId(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cert-issue">Issue Date</Label>
              <Input
                id="cert-issue"
                type="month"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cert-expiry">Expiry Date (optional)</Label>
              <Input
                id="cert-expiry"
                type="month"
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cert-url">Credential URL</Label>
            <Input
              id="cert-url"
              placeholder="https://www.credly.com/..."
              value={credentialUrl}
              onChange={e => setCredentialUrl(e.target.value)}
            />
          </div>

          <ImageUploadField
            label="Image (Optional)"
            id="cert-image"
            value={image}
            onChange={setImage}
          />

          {/* AI Generate Section - Always visible */}
          <div className="space-y-3 p-4 rounded-lg border border-violet-500/30 bg-violet-500/5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-violet-400">🤖 AI Auto Fill</Label>
              <button
                type="button"
                onClick={() => setShowTextInput(!showTextInput)}
                className="text-xs text-violet-500 hover:text-violet-400 flex items-center gap-1"
              >
                {showTextInput ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showTextInput ? 'Sembunyikan' : 'Gunakan teks'}
              </button>
            </div>

            {showTextInput && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Paste teks dari sertifikat di sini...&#10;Contoh:&#10;Google Cloud Professional Data Engineer&#10;Diterbitkan oleh Google Cloud&#10;Tanggal: Januari 2024&#10;ID: abc123xyz"
                  value={certText}
                  onChange={e => setCertText(e.target.value)}
                  className="min-h-[100px] text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                  Atau gunakan mode gambar di bawah
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setGenerateMode('text'); handleAIGenerate(); }}
                disabled={isGenerating || (!certText.trim() && generateMode === 'text')}
                className="flex-1 gap-2 bg-violet-500/10 border-violet-500/30 hover:bg-violet-500/20"
              >
                {isGenerating && generateMode === 'text' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4 text-violet-400" />
                )}
                <span className="text-sm">dari Teks</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { setGenerateMode('image'); handleAIGenerate(); }}
                disabled={isGenerating || !image}
                className="flex-1 gap-2 bg-violet-500/10 border-violet-500/30 hover:bg-violet-500/20"
              >
                {isGenerating && generateMode === 'image' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-violet-400" />
                )}
                <span className="text-sm">dari Gambar</span>
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              AI akan mengisi form berdasarkan teks atau gambar
            </p>
          </div>

          <div className="space-y-2">
            <Label>Skills</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill..."
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddSkill} className="shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {skills.map(skill => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className="rounded-md text-xs px-2 py-1 gap-1 cursor-pointer hover:bg-destructive/10"
                    onClick={() => setSkills(skills.filter(s => s !== skill))}
                  >
                    {skill}
                    <X className="w-3 h-3" />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {isEditing ? 'Save Changes' : 'Add Certification'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Page ── */
export function CertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const refresh = useCallback(async () => {
    clearCacheFor('certifications');
    const data = await getAllCertificationsFromDb(true);
    setCertifications(data);
  }, []);

  useEffect(() => {
    async function load() {
      const data = await getAllCertificationsFromDb();
      setCertifications(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = useCallback(
    async (data: Partial<Certification>) => {
      if (editingCert) {
        const result = await updateCertificationInDb(editingCert.id, data);
        if (result) {
          toast.success('Certification updated!');
          playSuccessSound();
        } else {
          toast.error('Failed to update certification');
          playErrorSound();
        }
      } else {
        const result = await createCertificationInDb(data);
        if (result) {
          toast.success('Certification added!');
          playSuccessSound();
        } else {
          toast.error('Failed to add certification');
          playErrorSound();
        }
      }
      setEditingCert(null);
      refresh();
    },
    [editingCert, refresh],
  );

  const handleEdit = (cert: Certification) => {
    setEditingCert(cert);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingCert(null);
    setFormOpen(true);
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletingId) {
      const result = await deleteCertificationInDb(deletingId);
      if (result) {
        toast.success('Certification deleted.');
        playSuccessSound();
      } else {
        toast.error('Failed to delete certification');
        playErrorSound();
      }
      setDeleteDialogOpen(false);
      setDeletingId(null);
      refresh();
    }
  };

  const filtered = useMemo(() => {
    if (!searchQuery) return certifications;
    const q = searchQuery.toLowerCase();
    return certifications.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.organization.toLowerCase().includes(q) ||
        c.skills.some(s => s.toLowerCase().includes(q)),
    );
  }, [certifications, searchQuery]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="!text-2xl text-foreground">Certifications</h1>
          <p className="text-muted-foreground mt-1">
            Manage your licenses & certifications — {certifications.length} total.
          </p>
        </div>
        <Button className="gap-2 rounded-xl w-full sm:w-auto" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          Add Certification
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search name, organization, or skills..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-border">
          <Award className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {searchQuery
              ? 'No certifications match your search.'
              : 'No certifications yet. Add your first one!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(cert => (
              <motion.div
                key={cert.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="group rounded-xl border border-border bg-card hover:border-primary/20 transition-all duration-300 overflow-hidden"
              >
                {/* Image */}
                {cert.image && (
                  <div className="relative h-32 overflow-hidden">
                    <img
                      src={cert.image}
                      alt={cert.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-orange-500" />
                    <span className="text-xs text-muted-foreground">{cert.organization}</span>
                  </div>

                  <h3 className="text-foreground mb-1 truncate">{cert.name}</h3>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(cert.issueDate) || 'N/A'}</span>
                    {cert.expiryDate && (
                      <span className={isExpired(cert.expiryDate) ? 'text-red-500' : ''}>
                        &middot; Exp. {formatDate(cert.expiryDate)}
                      </span>
                    )}
                    {!cert.expiryDate && (
                      <Badge variant="outline" className="text-[10px] h-5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                        Active
                      </Badge>
                    )}
                    {cert.expiryDate && !isExpired(cert.expiryDate) && (
                      <Badge variant="outline" className="text-[10px] h-5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                        Active
                      </Badge>
                    )}
                    {cert.expiryDate && isExpired(cert.expiryDate) && (
                      <Badge variant="outline" className="text-[10px] h-5 bg-red-500/10 text-red-600 border-red-500/30">
                        Expired
                      </Badge>
                    )}
                  </div>

                  {cert.credentialId && (
                    <p className="text-xs text-muted-foreground mb-2 truncate">
                      ID: {cert.credentialId}
                    </p>
                  )}

                  {cert.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {cert.skills.slice(0, 4).map(skill => (
                        <Badge key={skill} variant="secondary" className="rounded-md text-xs px-2 py-0.5">
                          {skill}
                        </Badge>
                      ))}
                      {cert.skills.length > 4 && (
                        <span className="text-xs text-muted-foreground self-center">
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
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-3"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Show Credential
                    </a>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 gap-1.5 text-muted-foreground hover:text-foreground"
                      onClick={() => handleEdit(cert)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 gap-1.5 text-muted-foreground hover:text-destructive"
                      onClick={() => confirmDelete(cert.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Form Dialog */}
      <CertFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        certification={editingCert}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Certification</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this certification? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}