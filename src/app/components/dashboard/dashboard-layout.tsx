import { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { LayoutDashboard, FileText, PenSquare, LogOut, Terminal, ArrowLeft, Sparkles, Briefcase, FolderKanban, Award, Menu, X, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { getAuthState, logout } from '../../lib/store';
import { motion, AnimatePresence } from 'motion/react';
import logo from '../../../assets/Logo_Ravnx.png';
import { ScrollToTop } from '../layout/scroll-to-top';

export function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthed, setIsAuthed] = useState(() => getAuthState().isAuthenticated);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const auth = getAuthState();
    setIsAuthed(auth.isAuthenticated);
    if (!auth.isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileMenuOpen]);

  if (!isAuthed) return null;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { href: '/rapi', label: 'Overview', icon: LayoutDashboard },
    { href: '/rapi/posts', label: 'Articles', icon: FileText },
    { href: '/rapi/editor', label: 'New Post', icon: PenSquare },
    { href: '/rapi/experiences', label: 'Experiences', icon: Briefcase },
    { href: '/rapi/certifications', label: 'Certifications', icon: Award },
    { href: '/rapi/projects', label: 'Projects', icon: FolderKanban },
    { href: '/rapi/log-generator', label: 'AI Log', icon: Sparkles },
    { href: '/rapi/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-14 px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <Link to="/rapi" className="flex items-center gap-2">
              <img src={logo} alt="Ravnx" className="h-6 w-6 sm:h-8 sm:w-8 object-contain" />
              <span className="text-foreground text-xs sm:text-sm" style={{ fontWeight: 700 }}>
                <span className="text-muted-foreground ml-1">/ dashboard</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 text-muted-foreground">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1 sm:gap-2 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Desktop Tab navigation */}
        <div className="hidden md:flex gap-0.5 sm:gap-1 px-2 sm:px-6 -mb-px overflow-x-auto scrollbar-none">
          {navItems.map(item => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-1.5 sm:gap-2 px-2 py-2.5 text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap ${
                isActive(item.href)
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">{item.label.split(' ')[0]}</span>
            </Link>
          ))}
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden bg-card/95 backdrop-blur-xl border-b border-border"
            >
              <div className="px-3 py-3 space-y-1">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                  >
                    <Link
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        isActive(item.href)
                          ? 'text-primary bg-primary/5'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>
      <ScrollToTop />
    </div>
  );
}