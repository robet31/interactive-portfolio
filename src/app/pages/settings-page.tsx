import { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Settings, Save, Loader2, Globe, Link2, Mail, MessageCircle, FileText, Home, Instagram } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ImageUploadField } from '../components/dashboard/image-upload-field';
import { toast } from 'sonner';
import { getSettingsFromDb, updateSettingsBulkInDb, type SiteSettings } from '../lib/db';
import { playSuccessSound, playErrorSound, playUploadSound } from '../lib/sounds';

const defaultSettings: SiteSettings = {
  site_name: 'Ravnx.',
  site_description: 'Mahasiswa Sistem Informasi, AI Enthusiast dan Data Enthusiast.',
  profile_image: '',
  github_url: 'https://github.com/robet31',
  linkedin_url: 'https://www.linkedin.com/in/arraffi-abqori-nur-azizi/',
  instagram_url: 'https://www.instagram.com/ravnxx_/',
  whatsapp_number: '6281515450611',
  whatsapp_message: 'Hai min, aku interested sama project kamu nih. Bisa jelasin lebih lanjut?',
  email: 'api@portfolio.dev',
  cover_title: 'Hi, I am Ravnx',
  cover_subtitle: 'Mahasiswa Sistem Informasi | AI & Data Enthusiast',
  cover_description: 'Saya adalah mahasiswa Sistem Informasi yang passionate dalam dunia AI, Data Science, dan Web Development.',
  nav_home: 'Home',
  nav_blog: 'Blog',
  nav_daily_logs: 'Daily Logs',
  footer_copyright: '© 2026 Ravnx. Built with ❤️ & code.',
};

export function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getSettingsFromDb();
      setSettings(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleChange = useCallback((key: keyof SiteSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const success = await updateSettingsBulkInDb(settings);
      if (success) {
        toast.success('Settings saved successfully!');
        playSuccessSound();
      } else {
        toast.error('Failed to save settings');
        playErrorSound();
      }
    } catch (error) {
      toast.error('Error saving settings');
      playErrorSound();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="!text-xl md:!text-2xl text-foreground flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Site Settings
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Kelola pengaturan website termasuk navbar, footer, dan cover page
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Cover Page Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="w-4 h-4" />
              Cover Page (Homepage)
            </CardTitle>
            <CardDescription>
              Pengaturan yang muncul di halaman utama website
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo Site</Label>
              <ImageUploadField
                label=""
                id="site-logo"
                value={settings.profile_image || ''}
                onChange={(value) => handleChange('profile_image', value)}
              />
              <p className="text-xs text-muted-foreground">Upload logo untuk site kamu (PNG/JPG, max 5MB)</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cover_title">Judul Utama</Label>
                <Input
                  id="cover_title"
                  value={settings.cover_title}
                  onChange={e => handleChange('cover_title', e.target.value)}
                  placeholder="Hi, I am Ravnx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cover_subtitle">Sub Judul</Label>
                <Input
                  id="cover_subtitle"
                  value={settings.cover_subtitle}
                  onChange={e => handleChange('cover_subtitle', e.target.value)}
                  placeholder="Mahasiswa Sistem Informasi | AI & Data Enthusiast"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover_description">Deskripsi</Label>
              <Textarea
                id="cover_description"
                value={settings.cover_description}
                onChange={e => handleChange('cover_description', e.target.value)}
                placeholder="Describe yourself..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_name">Nama Site</Label>
              <Input
                id="site_name"
                value={settings.site_name}
                onChange={e => handleChange('site_name', e.target.value)}
                placeholder="Ravnx."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_description">Deskripsi Site</Label>
              <Textarea
                id="site_description"
                value={settings.site_description}
                onChange={e => handleChange('site_description', e.target.value)}
                placeholder="Brief description of your site..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Navigation Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Navigation
            </CardTitle>
            <CardDescription>
              Pengaturan menu navigasi di navbar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nav_home">Menu Home</Label>
                <Input
                  id="nav_home"
                  value={settings.nav_home}
                  onChange={e => handleChange('nav_home', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nav_blog">Menu Blog</Label>
                <Input
                  id="nav_blog"
                  value={settings.nav_blog}
                  onChange={e => handleChange('nav_blog', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nav_daily_logs">Menu Daily Logs</Label>
                <Input
                  id="nav_daily_logs"
                  value={settings.nav_daily_logs}
                  onChange={e => handleChange('nav_daily_logs', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Social Media Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              Social Media Links
            </CardTitle>
            <CardDescription>
              Link untuk icon social media di navbar dan footer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="github_url">GitHub URL</Label>
                <Input
                  id="github_url"
                  value={settings.github_url}
                  onChange={e => handleChange('github_url', e.target.value)}
                  placeholder="https://github.com/username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  value={settings.linkedin_url}
                  onChange={e => handleChange('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram_url">Instagram URL</Label>
                <Input
                  id="instagram_url"
                  value={settings.instagram_url}
                  onChange={e => handleChange('instagram_url', e.target.value)}
                  placeholder="https://instagram.com/username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </CardTitle>
            <CardDescription>
              Pengaturan WhatsApp chat di navbar dan footer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsapp_number">Nomor WhatsApp</Label>
              <Input
                id="whatsapp_number"
                value={settings.whatsapp_number}
                onChange={e => handleChange('whatsapp_number', e.target.value)}
                placeholder="6281515450611"
              />
              <p className="text-xs text-muted-foreground">Tanpa tanda + atau spasi</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp_message">Pesan Default</Label>
              <Textarea
                id="whatsapp_message"
                value={settings.whatsapp_message}
                onChange={e => handleChange('whatsapp_message', e.target.value)}
                placeholder="Hai min, aku interested sama project kamu nih..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Footer Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Footer
            </CardTitle>
            <CardDescription>
              Pengaturan bagian footer website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="footer_copyright">Copyright Text</Label>
              <Input
                id="footer_copyright"
                value={settings.footer_copyright}
                onChange={e => handleChange('footer_copyright', e.target.value)}
                placeholder="© 2026 Ravnx. Built with ❤️ & code."
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
