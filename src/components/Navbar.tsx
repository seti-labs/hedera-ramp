import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletButton } from './WalletButton';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar = ({ onMenuClick }: NavbarProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Hedera Ramp
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Bell className="h-5 w-5" />
          </Button>
          
          <WalletButton />
        </div>
      </div>
    </header>
  );
};
