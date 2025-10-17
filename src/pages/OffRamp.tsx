import { useState } from 'react';
import { Building2, ArrowRight, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/context/WalletContext';
import { useAPI } from '@/hooks/useAPI';
import { toast } from '@/hooks/use-toast';

export default function OffRamp() {
  const { wallet, kycStatus } = useWallet();
  const { post } = useAPI();
  const [hbarAmount, setHbarAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const exchangeRate = 0.5; // Mock rate: 1 HBAR = 0.5 USD
  const fiatAmount = hbarAmount ? (parseFloat(hbarAmount) * exchangeRate).toFixed(2) : '0';

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    if (!kycStatus.isVerified) {
      toast({
        title: 'KYC Required',
        description: 'Please complete KYC verification in your profile',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(hbarAmount);
    const balance = parseFloat(wallet.balance || '0');

    if (amount > balance) {
      toast({
        title: 'Insufficient Balance',
        description: `You only have ${wallet.balance} HBAR available`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // In production: await post('/api/offramp', { hbarAmount, accountId: wallet.accountId })
      
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      const mockTxId = `TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      setTransactionId(mockTxId);

      toast({
        title: 'Withdrawal Successful!',
        description: `$${fiatAmount} will be transferred to your bank account`,
      });

      // Reset form
      setHbarAmount('');
    } catch (error) {
      toast({
        title: 'Withdrawal Failed',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Off-Ramp</h1>
        <p className="text-muted-foreground">
          Convert your HBAR tokens back to fiat currency
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Withdraw Funds</CardTitle>
          <CardDescription>
            Enter the amount of HBAR you'd like to convert to fiat
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleWithdraw} className="space-y-6">
            {wallet.isConnected && (
              <div className="p-4 rounded-lg border bg-accent/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Available Balance</span>
                  <span className="text-xl font-bold text-primary">{wallet.balance} HBAR</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="hbarAmount">Amount (HBAR)</Label>
              <div className="relative">
                <Input
                  id="hbarAmount"
                  type="number"
                  placeholder="100.00"
                  value={hbarAmount}
                  onChange={(e) => setHbarAmount(e.target.value)}
                  step="0.01"
                  min="1"
                  max={wallet.balance || undefined}
                  required
                  disabled={!wallet.isConnected}
                />
                {wallet.isConnected && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7"
                    onClick={() => setHbarAmount(wallet.balance || '')}
                  >
                    Max
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Minimum: 1 HBAR
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-accent/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">You will receive</span>
                <span className="text-sm text-muted-foreground">Rate: 1 HBAR = ${exchangeRate}</span>
              </div>
              <p className="text-2xl font-bold text-primary">${fiatAmount}</p>
            </div>

            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-start gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Bank Account</h4>
                  <p className="text-sm text-muted-foreground">
                    Funds will be transferred to your linked bank account ending in ****1234
                  </p>
                </div>
              </div>
            </div>

            {!wallet.isConnected && (
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <p className="text-sm text-center">
                  Please connect your wallet to continue
                </p>
              </div>
            )}

            {wallet.isConnected && !kycStatus.isVerified && (
              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <p className="text-sm text-center">
                  KYC verification required. Please complete your profile.
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full gap-2 bg-gradient-primary"
              disabled={!wallet.isConnected || !kycStatus.isVerified || isLoading || !hbarAmount}
            >
              {isLoading ? 'Processing...' : 'Withdraw Now'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {transactionId && (
            <div className="mt-6 p-4 rounded-lg border bg-success/5 border-success/20">
              <h4 className="font-semibold text-success mb-2">Withdrawal Initiated!</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Transaction ID:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background p-2 rounded overflow-x-auto">
                  {transactionId}
                </code>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Your funds will arrive in 1-3 business days
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Processing Time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">Bank Transfer</h4>
            <p className="text-sm text-muted-foreground">
              Typically arrives within 1-3 business days
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Transaction Fees</h4>
            <p className="text-sm text-muted-foreground">
              2.5% processing fee + network fees
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-1">Daily Limits</h4>
            <p className="text-sm text-muted-foreground">
              Up to $10,000 per day for verified accounts
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
