import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, User, X, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ArrowUpFromLine, label: 'On-Ramp', path: '/mpesa?tab=onramp' },
  { icon: ArrowDownToLine, label: 'Off-Ramp', path: '/mpesa?tab=offramp' },
  { icon: Receipt, label: 'Receipts', path: '/receipts' },
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
          'fixed left-0 top-0 z-50 h-full w-64 border-r border-border bg-gradient-surface transition-transform duration-300 md:sticky md:top-16 md:z-0 md:h-[calc(100vh-4rem)] md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 md:hidden border-b border-border">
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
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
                  'hover:bg-white hover:shadow-apple',
                  isActive
                    ? 'bg-foreground text-background shadow-apple'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="rounded-2xl bg-foreground p-5 text-background shadow-apple-lg">
            <div className="flex items-center gap-2 mb-3">
              <img src="/hedera-logo.svg" alt="Hedera" className="h-6 w-6" />
              <div>
                <p className="font-bold text-xs">Hedera Ramp Hub</p>
                <p className="text-xs opacity-75">By SetiLabs</p>
              </div>
            </div>
            <p className="text-xs opacity-90">
              M-Pesa to HBAR conversion platform for Kenya
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
