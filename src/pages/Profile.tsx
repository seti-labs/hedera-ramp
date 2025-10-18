import { useState, useEffect } from 'react';
import { User, Shield, CheckCircle, Wallet as WalletIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/context/WalletContext';
import { toast } from '@/hooks/use-toast';

export default function Profile() {
  const { wallet, disconnectWallet } = useWallet();
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (wallet.isConnected && wallet.accountId) {
      fetchAccountInfo();
    }
  }, [wallet.accountId]);

  const fetchAccountInfo = async () => {
    if (!wallet.accountId) return;
    
    setLoading(true);
    try {
      // Fetch account info from Hedera Mirror Node
      const response = await fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${wallet.accountId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setAccountInfo(data);
      }
    } catch (error) {
      console.error('Failed to fetch account info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast({
      title: 'Wallet Disconnected',
      description: 'You have been logged out successfully',
    });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your Hedera wallet account
        </p>
      </div>

      {/* Wallet Info */}
      <Card className="shadow-apple-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <WalletIcon className="h-6 w-6" />
            Connected Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-6 bg-foreground rounded-2xl shadow-apple text-background">
            <div className="flex items-center gap-4">
              <CheckCircle className="h-8 w-8" />
              <div>
                <p className="font-bold text-lg">Wallet Connected</p>
                <p className="text-sm opacity-90">Your wallet is your identity</p>
              </div>
            </div>
            <Badge className="bg-background text-foreground px-3 py-1 font-bold">Verified</Badge>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-muted-foreground">Account ID</Label>
              <p className="text-lg font-mono mt-1 break-all">{wallet.accountId}</p>
            </div>
            
              <div>
                <Label className="text-muted-foreground">Balance</Label>
              <p className="text-2xl font-semibold mt-1">{wallet.balance} HBAR</p>
              </div>
            
              <div>
                <Label className="text-muted-foreground">Wallet Type</Label>
                <p className="text-lg capitalize mt-1">{wallet.walletType}</p>
              </div>

            {accountInfo && (
              <div>
                <Label className="text-muted-foreground">Account Created</Label>
                <p className="text-lg mt-1">
                  {new Date(accountInfo.created_timestamp).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Status */}
      <Card className="shadow-apple border-0 overflow-hidden">
        <div className="bg-foreground p-6 text-background">
          <CardTitle className="flex items-center gap-3 text-xl mb-2">
            <Shield className="h-6 w-6" />
            Verification Status
          </CardTitle>
          <p className="text-sm opacity-90">Your Hedera wallet serves as your identity verification</p>
        </div>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
              <span className="font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-foreground" />
                Wallet Connected
              </span>
              <Badge className="bg-foreground text-background font-semibold">Active</Badge>
                </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
              <span className="font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-foreground" />
                Blockchain Verified
              </span>
              <Badge className="bg-foreground text-background font-semibold">Active</Badge>
              </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
              <span className="font-semibold flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-foreground" />
                Ready to Transact
              </span>
              <Badge className="bg-foreground text-background font-semibold">Active</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card className="shadow-apple border-0">
          <CardHeader>
          <CardTitle className="text-xl">Account Actions</CardTitle>
          </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start rounded-xl py-6 font-semibold border-2 hover:bg-primary hover:text-white hover:border-primary"
            onClick={fetchAccountInfo}
            disabled={loading}
          >
            <User className="h-5 w-5 mr-2" />
            {loading ? 'Refreshing...' : 'Refresh Account Info'}
          </Button>

              <Button
            variant="destructive" 
            className="w-full justify-start rounded-xl py-6 font-semibold shadow-apple"
            onClick={handleDisconnect}
          >
            <WalletIcon className="h-5 w-5 mr-2" />
            Disconnect Wallet
              </Button>
          </CardContent>
        </Card>

      {/* Info Card */}
      <Card className="shadow-apple border-0 bg-gradient-surface">
        <CardHeader>
          <CardTitle className="text-xl">About Wallet Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            Your Hedera wallet serves as your identity on the network. By connecting your wallet:
          </p>
          <ul className="space-y-2 ml-2">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
              <span>Your identity is verified via blockchain</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
              <span>You maintain full control of your funds (non-custodial)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
              <span>All transactions are cryptographically signed</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
              <span>Instant access to on-ramp and off-ramp features</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
