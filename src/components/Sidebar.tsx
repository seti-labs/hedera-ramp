import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: ArrowDownToLine, label: 'On-Ramp', path: '/onramp' },
  { icon: ArrowUpFromLine, label: 'Off-Ramp', path: '/offramp' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 border-r border-border bg-card transition-transform duration-300 md:sticky md:top-16 md:z-0 md:h-[calc(100vh-4rem)] md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 md:hidden">
          <span className="text-lg font-semibold">Menu</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose()}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-primary'
                    : 'text-muted-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="rounded-lg bg-gradient-primary p-4 text-primary-foreground">
            <h3 className="mb-1 font-semibold">Need Help?</h3>
            <p className="mb-3 text-xs opacity-90">
              Check our documentation for guides
            </p>
            <Button size="sm" variant="secondary" className="w-full">
              View Docs
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};
