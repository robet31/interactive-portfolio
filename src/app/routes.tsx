import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { PublicLayout } from './components/layout/public-layout';
import { DashboardLayout } from './components/dashboard/dashboard-layout';
import { LoginPage } from './pages/login-page';
import { NotFoundPage, RouteErrorPage } from './pages/not-found-page';

const HomePage = lazy(() => import('./pages/home-page').then(m => ({ default: m.HomePage })));
const BlogPage = lazy(() => import('./pages/blog-page').then(m => ({ default: m.BlogPage })));
const ArticlePage = lazy(() => import('./pages/article-page').then(m => ({ default: m.ArticlePage })));
const DashboardPage = lazy(() => import('./pages/dashboard-page').then(m => ({ default: m.DashboardPage })));
const PostsPage = lazy(() => import('./pages/posts-page').then(m => ({ default: m.PostsPage })));
const EditorPage = lazy(() => import('./pages/editor-page').then(m => ({ default: m.EditorPage })));
const LogGeneratorPage = lazy(() => import('./pages/log-generator-page').then(m => ({ default: m.LogGeneratorPage })));
const ExperiencesPage = lazy(() => import('./pages/experiences-page').then(m => ({ default: m.ExperiencesPage })));
const ProjectsManagementPage = lazy(() => import('./pages/projects-management-page').then(m => ({ default: m.ProjectsManagementPage })));
const CertificationsPage = lazy(() => import('./pages/certifications-page').then(m => ({ default: m.CertificationsPage })));
const DailyLogsPage = lazy(() => import('./pages/daily-logs-page').then(m => ({ default: m.DailyLogsPage })));
const SettingsPage = lazy(() => import('./pages/settings-page').then(m => ({ default: m.SettingsPage })));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'blog', element: <BlogPage /> },
      { path: 'blog/:slug', element: <ArticlePage /> },
      { path: 'daily-logs', element: <DailyLogsPage /> },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/rapi',
    element: <DashboardLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'posts', element: <PostsPage /> },
      { path: 'editor', element: <EditorPage /> },
      { path: 'editor/:id', element: <EditorPage /> },
      { path: 'log-generator', element: <LogGeneratorPage /> },
      { path: 'experiences', element: <ExperiencesPage /> },
      { path: 'certifications', element: <CertificationsPage /> },
      { path: 'projects', element: <ProjectsManagementPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);