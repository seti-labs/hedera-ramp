import { useState } from 'react';
import { CreditCard, Building2, ArrowRight, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWallet } from '@/context/WalletContext';
import { useAPI } from '@/hooks/useAPI';
import { toast } from '@/hooks/use-toast';

export default function OnRamp() {
  const { wallet, kycStatus } = useWallet();
  const { post } = useAPI();
  const [fiatAmount, setFiatAmount] = useState('');
  const [depositMethod, setDepositMethod] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const exchangeRate = 2.0; // Mock rate: 1 USD = 2 HBAR
  const hbarAmount = fiatAmount ? (parseFloat(fiatAmount) * exchangeRate).toFixed(2) : '0';

  const handleDeposit = async (e: React.FormEvent) => {
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

    setIsLoading(true);
    try {
      // In production: await post('/api/onramp', { fiatAmount, depositMethod, accountId: wallet.accountId })
      
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      const mockHash = `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}.${Math.floor(Math.random() * 1000000)}`;
      setTransactionHash(mockHash);

      toast({
        title: 'Deposit Successful!',
        description: `${hbarAmount} HBAR will be credited to your wallet soon`,
      });

      // Reset form
      setFiatAmount('');
      setDepositMethod('');
    } catch (error) {
      toast({
        title: 'Deposit Failed',
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
        <h1 className="text-3xl font-bold tracking-tight">On-Ramp</h1>
        <p className="text-muted-foreground">
          Deposit fiat currency and receive HBAR tokens
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deposit Funds</CardTitle>
          <CardDescription>
            Enter the amount you'd like to deposit and choose your payment method
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDeposit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fiatAmount">Amount (USD)</Label>
              <Input
                id="fiatAmount"
                type="number"
                placeholder="100.00"
                value={fiatAmount}
                onChange={(e) => setFiatAmount(e.target.value)}
                step="0.01"
                min="10"
                max="10000"
                required
                disabled={!wallet.isConnected}
              />
              <p className="text-sm text-muted-foreground">
                Minimum: $10.00 • Maximum: $10,000.00
              </p>
            </div>

            <div className="p-4 rounded-lg border bg-accent/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">You will receive</span>
                <span className="text-sm text-muted-foreground">Rate: 1 USD = {exchangeRate} HBAR</span>
              </div>
              <p className="text-2xl font-bold text-primary">{hbarAmount} HBAR</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="depositMethod">Payment Method</Label>
              <Select
                value={depositMethod}
                onValueChange={setDepositMethod}
                disabled={!wallet.isConnected}
              >
                <SelectTrigger id="depositMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Credit/Debit Card</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="bank">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>Bank Transfer</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
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
              disabled={!wallet.isConnected || !kycStatus.isVerified || isLoading || !fiatAmount || !depositMethod}
            >
              {isLoading ? 'Processing...' : 'Deposit Now'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {transactionHash && (
            <div className="mt-6 p-4 rounded-lg border bg-success/5 border-success/20">
              <h4 className="font-semibold text-success mb-2">Transaction Submitted!</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Transaction Hash:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background p-2 rounded overflow-x-auto">
                  {transactionHash}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`https://hashscan.io/testnet/transaction/${transactionHash}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              1
            </div>
            <div>
              <h4 className="font-medium">Enter Amount</h4>
              <p className="text-sm text-muted-foreground">
                Specify how much fiat currency you want to deposit
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              2
            </div>
            <div>
              <h4 className="font-medium">Choose Payment Method</h4>
              <p className="text-sm text-muted-foreground">
                Select card payment or bank transfer
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              3
            </div>
            <div>
              <h4 className="font-medium">Receive HBAR</h4>
              <p className="text-sm text-muted-foreground">
                Tokens are sent directly to your connected wallet
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
