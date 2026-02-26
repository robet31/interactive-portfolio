import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Pencil,
  Trash2,
  FolderKanban,
  Search,
  Filter,
  ExternalLink,
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
import { ProjectFormDialog } from '../components/dashboard/project-form-dialog';
import {
  getAllProjectsFromDb,
  createProjectInDb,
  updateProjectInDb,
  deleteProjectInDb,
  clearCacheFor,
} from '../lib/db';
import type { Project } from '../lib/types';
import { toast } from 'sonner';
import { playSuccessSound, playErrorSound } from '../lib/sounds';

const categoryColors: Record<string, string> = {
  'Web Development': 'bg-blue-500/10 text-blue-600',
  'AI & IoT': 'bg-violet-500/10 text-violet-600',
  'Data Science': 'bg-emerald-500/10 text-emerald-600',
  'Data Analytics': 'bg-amber-500/10 text-amber-600',
  'Mobile Development': 'bg-pink-500/10 text-pink-600',
  'DevOps': 'bg-cyan-500/10 text-cyan-600',
  'Other': 'bg-gray-500/10 text-gray-600',
};

export function ProjectsManagementPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProj, setEditingProj] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const refresh = useCallback(async () => {
    clearCacheFor('projects');
    const data = await getAllProjectsFromDb(true);
    setProjects(data);
  }, []);

  useEffect(() => {
    async function load() {
      const data = await getAllProjectsFromDb();
      setProjects(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = useCallback(
    async (data: Partial<Project>) => {
      if (editingProj) {
        const result = await updateProjectInDb(editingProj.id, data);
        if (result) {
          toast.success('Project updated!');
          playSuccessSound();
        } else {
          toast.error('Failed to update project');
          playErrorSound();
        }
      } else {
        const result = await createProjectInDb(data);
        if (result) {
          toast.success('Project added!');
          playSuccessSound();
        } else {
          toast.error('Failed to add project');
          playErrorSound();
        }
      }
      setEditingProj(null);
      refresh();
    },
    [editingProj, refresh],
  );

  const handleEdit = (proj: Project) => {
    setEditingProj(proj);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingProj(null);
    setFormOpen(true);
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deletingId) {
      const result = await deleteProjectInDb(deletingId);
      if (result) {
        toast.success('Project deleted.');
        playSuccessSound();
      } else {
        toast.error('Failed to delete project');
        playErrorSound();
      }
      setDeleteDialogOpen(false);
      setDeletingId(null);
      refresh();
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(projects.map(p => p.category));
    return Array.from(cats).sort();
  }, [projects]);

  const filtered = useMemo(() => {
    let result = projects;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.tags.some(t => t.toLowerCase().includes(q)),
      );
    }
    if (filterCategory !== 'all') {
      result = result.filter(p => p.category === filterCategory);
    }
    return result;
  }, [projects, searchQuery, filterCategory]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, Project[]> = {};
    for (const proj of filtered) {
      if (!groups[proj.category]) groups[proj.category] = [];
      groups[proj.category].push(proj);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="!text-2xl text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your portfolio — {projects.length} projects across{' '}
            {categories.length} categories.
          </p>
        </div>
        <Button className="gap-2 rounded-xl w-full sm:w-auto" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          Add Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search title, description, or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5" />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Projects list */}
      {grouped.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-border">
          <FolderKanban className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {searchQuery || filterCategory !== 'all'
              ? 'No projects match your filters.'
              : 'No projects yet. Start building your portfolio!'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          <AnimatePresence mode="popLayout">
            {grouped.map(([category, items]) => (
              <motion.div
                key={category}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Category header */}
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm ${categoryColors[category] || 'bg-gray-500/10 text-gray-600'}`}
                  >
                    {category}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">
                    {items.length} {items.length === 1 ? 'project' : 'projects'}
                  </span>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map(proj => (
                    <motion.div
                      key={proj.id}
                      layout
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="group rounded-xl border border-border bg-card hover:border-primary/20 transition-all duration-300 overflow-hidden"
                    >
                      {/* Image strip */}
                      {proj.image && (
                        <div className="relative h-36 overflow-hidden">
                          <ImageWithFallback
                            src={proj.image}
                            alt={proj.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                        </div>
                      )}

                      <div className="p-4">
                        {/* Title & link */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-foreground truncate">{proj.title}</h3>
                          {proj.link && (
                            <a
                              href={proj.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0 mt-0.5"
                              onClick={e => e.stopPropagation()}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-3">
                          {proj.description}
                        </p>

                        {/* Tags */}
                        {proj.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {proj.tags.slice(0, 5).map(tag => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="rounded-md text-xs px-2 py-0.5"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {proj.tags.length > 5 && (
                              <span className="text-xs text-muted-foreground self-center">
                                +{proj.tags.length - 5}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t border-border">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 gap-1.5 text-muted-foreground hover:text-foreground"
                            onClick={() => handleEdit(proj)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 gap-1.5 text-muted-foreground hover:text-destructive"
                            onClick={() => confirmDelete(proj.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Form Dialog */}
      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editingProj}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
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