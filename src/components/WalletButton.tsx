import { useState } from 'react';
import { Wallet, ChevronDown, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useWallet } from '@/context/WalletContext';
import { toast } from '@/hooks/use-toast';

export const WalletButton = () => {
  const { wallet, connectWallet, disconnectWallet, isLoading } = useWallet();
  const [showConnectDialog, setShowConnectDialog] = useState(false);

  const handleConnect = async (type: 'hashpack' | 'blade') => {
    try {
      await connectWallet(type);
      setShowConnectDialog(false);
      toast({
        title: 'Wallet Connected',
        description: `Successfully connected to ${type === 'hashpack' ? 'HashPack' : 'Blade Wallet'}`,
      });
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect wallet. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected',
    });
  };

  if (wallet.isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">
              {wallet.accountId?.slice(0, 10)}...
            </span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-popover">
          <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5">
            <p className="text-xs text-muted-foreground">Account ID</p>
            <p className="text-sm font-medium">{wallet.accountId}</p>
          </div>
          <div className="px-2 py-1.5">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="text-sm font-medium">{wallet.balance} HBAR</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDisconnect} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowConnectDialog(true)}
        disabled={isLoading}
        className="gap-2 bg-gradient-primary hover:opacity-90"
      >
        <Wallet className="h-4 w-4" />
        <span>Connect Wallet</span>
      </Button>

      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Wallet</DialogTitle>
            <DialogDescription>
              Choose your preferred wallet to connect to Hedera Testnet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Button
              onClick={() => handleConnect('hashpack')}
              disabled={isLoading}
              className="w-full justify-start gap-3 h-14"
              variant="outline"
            >
              <div className="h-8 w-8 rounded-lg bg-primary" />
              <div className="text-left">
                <p className="font-semibold">HashPack</p>
                <p className="text-xs text-muted-foreground">
                  Recommended wallet for Hedera
                </p>
              </div>
            </Button>

            <Button
              onClick={() => handleConnect('blade')}
              disabled={isLoading}
              className="w-full justify-start gap-3 h-14"
              variant="outline"
            >
              <div className="h-8 w-8 rounded-lg bg-accent" />
              <div className="text-left">
                <p className="font-semibold">Blade Wallet</p>
                <p className="text-xs text-muted-foreground">
                  Mobile-friendly option
                </p>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
