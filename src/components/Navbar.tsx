import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletButton } from './WalletButton';
import { useWallet } from '@/context/WalletContext';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar = ({ onMenuClick }: NavbarProps) => {
  const { wallet } = useWallet();
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border glass">
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
          
          <div className="flex items-center gap-3">
            <img src="/hedera-logo.svg" alt="Hedera" className="h-10 w-10" />
            <span className="text-xl font-bold text-foreground">
              Hedera Ramp Hub
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {wallet.isConnected && wallet.balance && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-foreground rounded-full text-background shadow-apple">
              <span className="text-sm font-semibold">{wallet.balance} HBAR</span>
            </div>
          )}
          
          <WalletButton />
        </div>
      </div>
    </header>
  );
};
