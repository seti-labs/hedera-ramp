import { useState } from 'react';
import { Wallet, Badge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WalletConnect } from './WalletConnect';
import { useWallet } from '@/context/WalletContext';

export const WalletButton = () => {
  const { wallet, disconnectWallet } = useWallet();
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);

  if (!wallet.isConnected) {
    return (
      <>
        <Button 
          onClick={() => setConnectDialogOpen(true)}
          className="bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-full"
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
        
        <WalletConnect 
          open={connectDialogOpen} 
          onOpenChange={setConnectDialogOpen}
          onSuccess={() => setConnectDialogOpen(false)}
        />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-full font-semibold border-2">
          <Wallet className="h-4 w-4" />
          <span className="hidden md:inline">
            {wallet.accountId?.slice(0, 10)}...
          </span>
          <Badge className="ml-1 h-2 w-2 rounded-full bg-success" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Hedera Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-2 text-sm">
          <p className="font-medium">Account ID</p>
          <p className="text-muted-foreground font-mono text-xs">{wallet.accountId}</p>
        </div>
        <div className="px-2 py-2 text-sm">
          <p className="font-medium">Balance</p>
          <p className="text-lg font-semibold">{wallet.balance} HBAR</p>
        </div>
        <div className="px-2 py-2 text-sm">
          <p className="font-medium">Wallet Type</p>
          <p className="capitalize">{wallet.walletType}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnectWallet} className="text-destructive">
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
