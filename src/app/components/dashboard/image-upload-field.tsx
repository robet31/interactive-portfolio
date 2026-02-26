import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Link as LinkIcon, X, ImageIcon, FileWarning } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { playUploadSound } from '../../lib/sounds';

interface ImageUploadFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  /** Max file size in bytes. Default 5MB */
  maxSize?: number;
  id?: string;
}

type Mode = 'url' | 'file';

export function ImageUploadField({
  label = 'Cover Image',
  value,
  onChange,
  maxSize = 5 * 1024 * 1024,
  id = 'img-upload',
}: ImageUploadFieldProps) {
  const [mode, setMode] = useState<Mode>(
    value && value.startsWith('data:') ? 'file' : 'url'
  );
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (value && value.startsWith('data:')) {
      setMode('file');
    }
  }, [value]);

  const acceptTypes = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,application/pdf';

  const handleFileRead = useCallback(
    (file: File) => {
      setError('');

      if (file.size > maxSize) {
        setError(`File terlalu besar. Maksimum ${(maxSize / 1024 / 1024).toFixed(0)}MB.`);
        return;
      }

      const validTypes = [
        'image/png',
        'image/jpeg',
        'image/webp',
        'image/gif',
        'image/svg+xml',
        'application/pdf',
      ];
      if (!validTypes.includes(file.type)) {
        setError('Format tidak didukung. Gunakan PNG, JPG, WebP, GIF, SVG, atau PDF.');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onChange(reader.result);
          playUploadSound();
        }
      };
      reader.onerror = () => {
        setError('Gagal membaca file.');
      };
      reader.readAsDataURL(file);
    },
    [maxSize, onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFileRead(file);
    },
    [handleFileRead],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
    // reset so same file can be selected again
    e.target.value = '';
  };

  const clearImage = () => {
    onChange('');
    setError('');
  };

  const isDataUrl = value.startsWith('data:');
  const isPdf = value.startsWith('data:application/pdf');
  const hasPreview = value && !isPdf;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>
          <span className="flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" />
            {label}
          </span>
        </Label>
        <div className="flex items-center bg-muted rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${
              mode === 'url'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LinkIcon className="w-3 h-3" />
            URL
          </button>
          <button
            type="button"
            onClick={() => setMode('file')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${
              mode === 'file'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Upload className="w-3 h-3" />
            Upload
          </button>
        </div>
      </div>

      {/* URL mode */}
      {mode === 'url' && (
        <Input
          id={id}
          placeholder="https://images.unsplash.com/..."
          value={isDataUrl ? '' : value}
          onChange={e => {
            setError('');
            onChange(e.target.value);
          }}
        />
      )}

      {/* File upload mode */}
      {mode === 'file' && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptTypes}
            className="hidden"
            onChange={handleFileChange}
          />
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleBrowse}
            className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/40 hover:bg-muted/30'
            }`}
          >
            <Upload className={`w-6 h-6 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
            <div className="text-center">
              <p className="text-sm text-foreground">
                {dragActive ? 'Lepaskan file di sini' : 'Drag & drop atau klik untuk browse'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WebP, GIF, SVG, PDF &middot; Max {(maxSize / 1024 / 1024).toFixed(0)}MB
              </p>
            </div>
          </div>
        </>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <FileWarning className="w-3.5 h-3.5" />
          {error}
        </div>
      )}

      {/* Preview */}
      {hasPreview && (
        <div className="relative h-28 rounded-lg overflow-hidden border border-border">
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearImage}
            className="absolute top-1.5 right-1.5 w-7 h-7 p-0 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* PDF indicator */}
      {isPdf && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border p-3 bg-muted/30">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <div className="w-8 h-8 rounded-md bg-red-500/10 text-red-500 flex items-center justify-center text-xs">
              PDF
            </div>
            File PDF berhasil diupload
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearImage}
            className="w-7 h-7 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
