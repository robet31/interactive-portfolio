import { Github, Linkedin, Mail, Heart } from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';
import { FaWhatsapp } from 'react-icons/fa';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import logo from '../../../assets/Logo_Ravnx.png';
import { getSettingsFromDb, type SiteSettings } from '../../lib/db';
import { useEffect, useState } from 'react';

export function Footer() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    getSettingsFromDb().then(setSettings);
  }, []);

  const phoneNumber = settings?.whatsapp_number || '6281515450611';
  const whatsappMessage = settings?.whatsapp_message || 'Hai min, aku interested sama project kamu nih. Bisa jelasin lebih lanjut?';
  const email = settings?.email || 'api@portfolio.dev';
  const siteName = settings?.site_name || 'Ravnx';
  const siteDescription = settings?.site_description || 'Mahasiswa Sistem Informasi, AI Enthusiast dan Data Enthusiast.';
  const copyright = settings?.footer_copyright || '© 2026 Ravnx. Built with ❤️ & code.';

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
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12 md:py-16">
        {/* ═══ Mobile: Centered stacked layout ═══ */}
        <div className="md:hidden flex flex-col items-center text-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="inline-flex items-center gap-2 mb-5">
              <img src={settings?.profile_image || logo} alt={siteName} className="h-8 w-auto object-contain rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = logo; }} />
              <span className="text-foreground tracking-tight" style={{ fontSize: '1.35rem', fontWeight: 700 }}>
                {siteName}<span className="text-primary">.</span>
              </span>
            </Link>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-muted-foreground text-sm leading-relaxed max-w-[300px] mb-7"
          >
            {siteDescription}
          </motion.p>

          {/* Nav links — horizontal pill row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap items-center justify-center gap-2.5 mb-7"
          >
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className="px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200 active:scale-95"
              >
                {link.label}
              </Link>
            ))}
          </motion.div>

          {/* Social icons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex items-center gap-3 mb-10"
          >
            {socialLinks.map((social, i) => {
              const Icon = social.icon;
              return (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target={social.href.startsWith('mailto') ? undefined : '_blank'}
                  rel={social.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                  aria-label={social.label}
                  className="w-11 h-11 rounded-xl bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              );
            })}
          </motion.div>

          {/* Copyright */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="pt-6 border-t border-border/60 w-full"
          >
            <p className="text-muted-foreground text-xs flex items-center justify-center gap-1">
              {copyright} <Heart className="w-3 h-3 text-destructive/60 inline" />
            </p>
          </motion.div>
        </div>

        {/* ═══ Desktop: Three-column grid ═══ */}
        <div className="hidden md:block">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-3 gap-12 lg:gap-16"
          >
            {/* Brand column */}
            <div>
              <Link to="/" className="inline-flex items-center gap-2 mb-5">
                <img src={settings?.profile_image || logo} alt={siteName} className="h-10 w-auto object-contain rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = logo; }} />
                <span className="text-foreground tracking-tight" style={{ fontSize: '1.35rem', fontWeight: 700 }}>
                  {siteName}<span className="text-primary">.</span>
                </span>
              </Link>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                {siteDescription}
              </p>
            </div>

            {/* Navigation column */}
            <div>
              <h4 className="text-foreground text-sm mb-5" style={{ fontWeight: 600 }}>Navigasi</h4>
              <div className="flex flex-col gap-3">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-muted-foreground text-sm hover:text-foreground hover:translate-x-1 transition-all duration-200 w-fit"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Connect column */}
            <div>
              <h4 className="text-foreground text-sm mb-5" style={{ fontWeight: 600 }}>Connect</h4>
              <div className="flex gap-3">
                {socialLinks.map(social => {
                  const Icon = social.icon;
                  return (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      target={social.href.startsWith('mailto') ? undefined : '_blank'}
                      rel={social.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                      aria-label={social.label}
                      className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-200"
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <Icon className="w-4 h-4" />
                    </motion.a>
                  );
                })}
              </div>
              <p className="text-muted-foreground/60 text-xs mt-5">{email}</p>
            </div>
          </motion.div>

          {/* Bottom bar */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-12 pt-6 border-t border-border flex items-center justify-between"
          >
            <p className="text-muted-foreground text-sm flex items-center gap-1.5">
              {copyright} <Heart className="w-3 h-3 text-destructive/60" />
            </p>
            <p className="text-muted-foreground/50 text-xs">
              All rights reserved.
            </p>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
