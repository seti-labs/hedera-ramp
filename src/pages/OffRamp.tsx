import { useState } from 'react';
import { Smartphone, Building2, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWallet } from '@/context/WalletContext';
import { useAPI } from '@/hooks/useAPI';
import { toast } from '@/hooks/use-toast';

export default function OffRamp() {
  const { wallet, kycStatus } = useWallet();
  const { post } = useAPI();
  const [hbarAmount, setHbarAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'mpesa' | 'bank'>('mpesa');
  const [mpesaPhone, setMpesaPhone] = useState('');
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
      // In production: await post('/api/offramp', { 
      //   hbarAmount, 
      //   accountId: wallet.accountId,
      //   method: withdrawMethod,
      //   mpesaPhone: withdrawMethod === 'mpesa' ? mpesaPhone : undefined
      // })
      
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      const mockTxId = `TX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      setTransactionId(mockTxId);

      const destination = withdrawMethod === 'mpesa' 
        ? `M-Pesa (${mpesaPhone})`
        : 'bank account';

      toast({
        title: 'Withdrawal Initiated',
        description: `$${fiatAmount} will be sent to your ${destination}`,
      });

      // Reset form
      setHbarAmount('');
      setMpesaPhone('');
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
    <div className="space-y-6 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Cash Out</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Convert your HBAR to cash instantly
        </p>
      </div>

      <Card className="border-border/50">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-semibold">Withdraw Funds</CardTitle>
          <CardDescription className="text-sm">
            Convert your HBAR to cash
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleWithdraw} className="space-y-5">
            {wallet.isConnected && (
              <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Available</span>
                  <span className="text-lg sm:text-xl font-semibold">{wallet.balance} HBAR</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="hbarAmount" className="text-sm font-medium">Amount (HBAR)</Label>
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
                  className="h-12 text-base pr-16"
                />
                {wallet.isConnected && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 text-xs font-medium"
                    onClick={() => setHbarAmount(wallet.balance || '')}
                  >
                    Max
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Minimum: 1 HBAR</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdrawMethod" className="text-sm font-medium">Payout Method</Label>
              <Select value={withdrawMethod} onValueChange={(value: 'mpesa' | 'bank') => setWithdrawMethod(value)}>
                <SelectTrigger id="withdrawMethod" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mpesa">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      <span>M-Pesa</span>
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

            {withdrawMethod === 'mpesa' && (
              <div className="space-y-2">
                <Label htmlFor="mpesaPhone" className="text-sm font-medium">M-Pesa Phone Number</Label>
                <Input
                  id="mpesaPhone"
                  type="tel"
                  placeholder="+254 7XX XXX XXX"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  required
                  disabled={!wallet.isConnected}
                  className="h-12 text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your M-Pesa registered phone number
                </p>
              </div>
            )}

            <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">You receive</span>
                <span className="text-xs text-muted-foreground">1 HBAR = ${exchangeRate}</span>
              </div>
              <p className="text-2xl sm:text-3xl font-semibold">${fiatAmount}</p>
            </div>

            {withdrawMethod === 'bank' && (
              <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium mb-1">Bank Account</h4>
                    <p className="text-xs text-muted-foreground">
                      ****1234 • 1-3 business days
                    </p>
                  </div>
                </div>
              </div>
            )}

            {withdrawMethod === 'mpesa' && mpesaPhone && (
              <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/50">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium mb-1">M-Pesa Account</h4>
                    <p className="text-xs text-muted-foreground">
                      {mpesaPhone} • Instant transfer
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!wallet.isConnected && (
              <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/50 text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Connect your wallet to continue
                </p>
              </div>
            )}

            {wallet.isConnected && !kycStatus.isVerified && (
              <div className="p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/50 text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Complete KYC verification in your profile
                </p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 gap-2 text-base font-medium"
              disabled={
                !wallet.isConnected || 
                !kycStatus.isVerified || 
                isLoading || 
                !hbarAmount ||
                (withdrawMethod === 'mpesa' && !mpesaPhone)
              }
            >
              {isLoading ? 'Processing...' : 'Cash Out'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {transactionId && (
            <div className="mt-5 p-3 sm:p-4 rounded-xl bg-success/10 border border-success/20">
              <h4 className="text-sm font-semibold text-success mb-2">Withdrawal Initiated</h4>
              <p className="text-xs text-muted-foreground mb-2">Transaction ID</p>
              <code className="block text-xs bg-background/50 p-2 rounded overflow-x-auto border border-border/50">
                {transactionId}
              </code>
              <p className="text-xs text-muted-foreground mt-3">
                {withdrawMethod === 'mpesa' 
                  ? 'Your M-Pesa will receive funds within minutes'
                  : 'Your bank will receive funds in 1-3 business days'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-semibold">Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">M-Pesa Transfer</h4>
            <p className="text-xs text-muted-foreground">
              Instant transfer • No fees for amounts under $1,000
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Bank Transfer</h4>
            <p className="text-xs text-muted-foreground">
              1-3 business days • 2.5% processing fee
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Daily Limits</h4>
            <p className="text-xs text-muted-foreground">
              Up to $10,000 per day for verified accounts
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
