import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

// Layouts
import PublicLayout from './layouts/PublicLayout.jsx';
import UserLayout from './layouts/UserLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

// Guards
import { ProtectedRoute, AdminRoute } from './components/shared/ProtectedRoute.jsx';

// Public pages
import HomePage from './pages/public/HomePage.jsx';
import MarketplacePage from './pages/public/MarketplacePage.jsx';
import ProductDetailPage from './pages/public/ProductDetailPage.jsx';
import LoginPage from './pages/public/LoginPage.jsx';
import RegisterPage from './pages/public/RegisterPage.jsx';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/public/ResetPasswordPage.jsx';
import FaqPage from './pages/public/FaqPage.jsx';
import ContactPage from './pages/public/ContactPage.jsx';
import TermsPage from './pages/public/TermsPage.jsx';
import PrivacyPage from './pages/public/PrivacyPage.jsx';

// Dashboard pages
import DashboardHome from './pages/dashboard/DashboardHome.jsx';
import WalletPage from './pages/dashboard/WalletPage.jsx';
import TasksPage from './pages/dashboard/TasksPage.jsx';
import OrdersPage from './pages/dashboard/OrdersPage.jsx';
import DownloadsPage from './pages/dashboard/DownloadsPage.jsx';
import ReferralsPage from './pages/dashboard/ReferralsPage.jsx';
import SettingsPage from './pages/dashboard/SettingsPage.jsx';
import NotificationsPage from './pages/dashboard/NotificationsPage.jsx';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import AdminProductForm from './pages/admin/AdminProductForm.jsx';
import AdminTasks from './pages/admin/AdminTasks.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminDeposits from './pages/admin/AdminDeposits.jsx';
import AdminCoupons from './pages/admin/AdminCoupons.jsx';
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx';

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/marketplace', element: <MarketplacePage /> },
      { path: '/marketplace/:slug', element: <ProductDetailPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password/:token', element: <ResetPasswordPage /> },
      { path: '/faq', element: <FaqPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '/terms', element: <TermsPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
    ],
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute><UserLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardHome /> },
      { path: 'wallet', element: <WalletPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'orders', element: <OrdersPage /> },
      { path: 'downloads', element: <DownloadsPage /> },
      { path: 'referrals', element: <ReferralsPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminRoute><AdminLayout /></AdminRoute>,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'users', element: <AdminUsers /> },
      { path: 'products', element: <AdminProducts /> },
      { path: 'products/new', element: <AdminProductForm /> },
      { path: 'products/:id/edit', element: <AdminProductForm /> },
      { path: 'tasks', element: <AdminTasks /> },
      { path: 'orders', element: <AdminOrders /> },
      { path: 'deposits', element: <AdminDeposits /> },
      { path: 'coupons', element: <AdminCoupons /> },
      { path: 'analytics', element: <AdminAnalytics /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
