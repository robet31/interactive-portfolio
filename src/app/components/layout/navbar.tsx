import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X, Github, Linkedin, Mail } from 'lucide-react';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../../../assets/Logo_Ravnx.png';
import { getSettingsFromDb, type SiteSettings } from '../../lib/db';

export function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSettingsFromDb().then(setSettings);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const phoneNumber = settings?.whatsapp_number || '6281515450611';
  const whatsappMessage = settings?.whatsapp_message || 'Hai min, aku interested sama project kamu nih. Bisa jelasin lebih lanjut?';
  const email = settings?.email || 'api@portfolio.dev';

  const socialLinks = [
    {
      href: settings?.github_url || 'https://github.com/robet31',
      icon: Github,
      label: 'GitHub',
    },
    {
      href: settings?.linkedin_url || 'https://www.linkedin.com/in/arraffi-abqori-nur-azizi/',
      icon: Linkedin,
      label: 'LinkedIn',
    },
    {
      href: settings?.instagram_url || 'https://www.instagram.com/ravnxx_/',
      icon: FaInstagram,
      label: 'Instagram',
    },
    {
      href: `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`,
      icon: FaWhatsapp,
      label: 'WhatsApp',
    },
    {
      href: `mailto:${email}`,
      icon: Mail,
      label: 'Email',
    },
  ];

  const navLinks = [
    { href: '/', label: settings?.nav_home || 'Home' },
    { href: '/blog', label: settings?.nav_blog || 'Blog' },
    { href: '/daily-logs', label: settings?.nav_daily_logs || 'Daily Logs' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      ref={menuRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || isOpen
          ? 'bg-background/80 backdrop-blur-xl border-b border-border shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo + Nama */}
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src={settings?.profile_image || logo} 
              alt={settings?.site_name || 'Ravnx'} 
              className="h-8 w-8 object-contain rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = logo;
              }}
            />
            <span className="text-foreground tracking-tight transition-transform group-hover:scale-105" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              {settings?.site_name || 'Ravnx.'}<span className="text-primary">.</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  isActive(link.href)
                    ? 'text-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Social Icons */}
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-border">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target={social.href.startsWith('mailto') || social.href.startsWith('https://wa') ? undefined : '_blank'}
                    rel={social.href.startsWith('mailto') || social.href.startsWith('https://wa') ? undefined : 'noopener noreferrer'}
                    aria-label={social.label}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-lg w-9 h-9"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.15 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: -90 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Menu className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="md:hidden overflow-hidden bg-background/95 backdrop-blur-xl border-b border-border"
          >
            <div className="px-6 py-4 space-y-1.5">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                >
                  <Link
                    to={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-xl transition-colors ${
                      isActive(link.href)
                        ? 'text-primary bg-primary/5'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                <span className="text-sm">{link.label}</span>
                  </Link>
                </motion.div>
              ))}
              
              {/* Social Icons - Mobile */}
              <div className="flex items-center gap-2 pt-3 mt-2 border-t border-border">
                {socialLinks.map((social, i) => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      target={social.href.startsWith('mailto') || social.href.startsWith('https://wa') ? undefined : '_blank'}
                      rel={social.href.startsWith('mailto') || social.href.startsWith('https://wa') ? undefined : 'noopener noreferrer'}
                      aria-label={social.label}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: 0.3 + i * 0.05 }}
                      className="flex items-center justify-center p-2.5 rounded-xl bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                    </motion.a>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
