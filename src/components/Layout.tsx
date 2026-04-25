import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { 
  BriefcaseMedical, 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  TestTube,
  LogOut,
  IndianRupee,
  PlusCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout({ role }: { role: 'admin' | 'phlebotomist' }) {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const adminNav = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Staff Management', path: '/admin/staff', icon: Users },
    { name: 'All Orders', path: '/admin/orders', icon: ClipboardList },
    { name: 'Test Prices', path: '/admin/tests', icon: TestTube },
  ];

  const phlebNav = [
    { name: 'My Orders', path: '/phleb/dashboard', icon: ClipboardList },
    { name: 'New Patient & Bill', path: '/phleb/orders/new', icon: PlusCircle },
    { name: 'Income Tracker', path: '/phleb/income', icon: IndianRupee },
  ];

  const navItems = role === 'admin' ? adminNav : phlebNav;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white font-bold mr-2"><BriefcaseMedical className="w-5 h-5"/></div>
          <span className="text-xl font-bold text-teal-900 tracking-tight">Innova Labs</span>
        </div>
        
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                  isActive 
                    ? "bg-teal-50 text-teal-700" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-teal-700" : "text-slate-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-500 font-bold">
              {userData?.name?.charAt(0).toUpperCase() || <User className="w-5 h-5"/>}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{userData?.name}</p>
              <p className="text-xs text-slate-400 capitalize mt-0.5 bg-slate-50 px-2 py-0.5 rounded inline-block">{userData?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center px-4 py-3 text-sm font-medium text-slate-500 rounded-xl hover:bg-slate-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full h-full">
        <div className="max-w-7xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
