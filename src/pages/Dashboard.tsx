import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/context/WalletContext';
import { transactionAPI, intersendAPI, Transaction } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  TrendingUp, 
  Clock,
  Smartphone,
  RefreshCw
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { wallet, updateBalance, isLoading: walletLoading } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [rates, setRates] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load recent transactions
      const txResponse = await transactionAPI.getAll({ limit: 5 });
      setTransactions(txResponse.transactions);
      
      // Load transaction stats
      const statsResponse = await transactionAPI.getStats();
      setStats(statsResponse);
      
      // Load Intersend rates
      try {
        const ratesResponse = await intersendAPI.getRates();
        setRates(ratesResponse);
      } catch (error) {
        console.log('Intersend rates not available');
      }
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshBalance = async () => {
    try {
      await updateBalance();
      toast({
        title: 'Balance Updated',
        description: 'Your wallet balance has been refreshed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update balance',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // No need to check wallet connection here - ProtectedRoute handles it

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
        <p className="text-muted-foreground">
          {wallet.accountId}
        </p>
      </div>

      {/* Wallet Balance Card */}
      <Card className="bg-foreground text-background shadow-apple-lg border-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-background/10 rounded-full -mr-20 -mt-20"></div>
        <CardHeader>
          <CardTitle className="flex items-center justify-between relative z-10">
            <span className="text-xl">Wallet Balance</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefreshBalance}
              disabled={walletLoading}
              className="text-background hover:bg-background/20 rounded-full"
            >
              <RefreshCw className={`h-5 w-5 ${walletLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
          <CardDescription className="text-background/90 relative z-10">
            Your current HBAR balance
          </CardDescription>
          </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-5xl font-bold mb-2">
            {wallet.balance ? `${wallet.balance}` : 'Loading...'}
          </div>
          <div className="text-lg opacity-90 mb-4">HBAR</div>
          {rates && wallet.balance && (
            <div className="px-4 py-2 bg-background/20 rounded-full inline-block">
              <p className="text-sm font-semibold">
                ≈ {(parseFloat(wallet.balance) * rates.HBAR_TO_KES).toFixed(2)} KES
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-apple hover:shadow-apple-lg transition-all cursor-pointer border-0 overflow-hidden group" onClick={() => navigate('/mpesa?tab=onramp')}>
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="p-4 bg-foreground rounded-2xl shadow-apple">
                  <ArrowUpRight className="h-7 w-7 text-background" />
                </div>
                <Badge className="bg-muted text-foreground px-3 py-1 font-semibold">On-Ramp</Badge>
              </div>
              <h3 className="text-2xl font-bold mb-2">Buy HBAR</h3>
              <p className="text-muted-foreground mb-6">
                Pay with M-Pesa to purchase HBAR instantly
              </p>
              <Button className="w-full bg-foreground text-background font-semibold rounded-xl py-6 shadow-apple hover:shadow-apple-lg hover:bg-foreground/90">
                Start On-Ramp
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-apple hover:shadow-apple-lg transition-all cursor-pointer border-0 overflow-hidden group" onClick={() => navigate('/mpesa?tab=offramp')}>
          <CardContent className="pt-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-6">
                <div className="p-4 bg-foreground rounded-2xl shadow-apple">
                  <ArrowDownRight className="h-7 w-7 text-background" />
                </div>
                <Badge className="bg-muted text-foreground px-3 py-1 font-semibold">Off-Ramp</Badge>
              </div>
              <h3 className="text-2xl font-bold mb-2">Sell HBAR</h3>
              <p className="text-muted-foreground mb-6">
                Convert HBAR to KES via M-Pesa
              </p>
              <Button className="w-full bg-foreground text-background font-semibold rounded-xl py-6 shadow-apple hover:shadow-apple-lg hover:bg-foreground/90">
                Start Off-Ramp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="shadow-apple border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-foreground rounded-2xl shadow-apple">
                  <TrendingUp className="h-6 w-6 text-background" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Total</p>
                  <p className="text-3xl font-bold">{stats.total_transactions}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-apple border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-foreground rounded-2xl shadow-apple">
                  <ArrowUpRight className="h-6 w-6 text-background" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">On-Ramps</p>
                  <p className="text-3xl font-bold">{stats.by_type.onramp}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-apple border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-foreground rounded-2xl shadow-apple">
                  <ArrowDownRight className="h-6 w-6 text-background" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Off-Ramps</p>
                  <p className="text-3xl font-bold">{stats.by_type.offramp}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-apple border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-muted rounded-2xl">
                  <Clock className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Pending</p>
                  <p className="text-3xl font-bold">{stats.by_status.pending + stats.by_status.processing}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Exchange Rates */}
      {rates && (
        <Card className="shadow-apple border-0">
          <CardHeader>
            <CardTitle>Current Exchange Rates</CardTitle>
            <CardDescription>Live M-Pesa to HBAR conversion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-5 bg-gradient-surface rounded-2xl shadow-card">
                <span className="font-semibold text-foreground">1 HBAR</span>
                <span className="text-xl font-bold text-foreground">{rates.HBAR_TO_KES} KES</span>
              </div>
              <div className="flex items-center justify-between p-5 bg-gradient-surface rounded-2xl shadow-card">
                <span className="font-semibold text-foreground">1 KES</span>
                <span className="text-xl font-bold text-foreground">{rates.KES_TO_HBAR} HBAR</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Last updated: {new Date(rates.last_updated).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card className="shadow-apple border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Recent Transactions</CardTitle>
              <CardDescription>Your latest transactions</CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate('/receipts')} className="rounded-full font-semibold">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-6 bg-gradient-surface rounded-3xl inline-block mb-4">
                <Smartphone className="h-16 w-16 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">No transactions yet</h3>
              <p className="text-muted-foreground mb-6">Start your first transaction with M-Pesa</p>
              <Button onClick={() => navigate('/mpesa')} className="bg-foreground text-background font-semibold rounded-full px-8 shadow-apple hover:bg-foreground/90">
                Start Transaction
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-5 bg-gradient-surface rounded-2xl hover:shadow-apple cursor-pointer transition-all group"
                  onClick={() => navigate('/receipts')}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl shadow-card bg-foreground">
                      {tx.transaction_type === 'onramp' ? (
                        <ArrowUpRight className="h-6 w-6 text-background" />
                      ) : (
                        <ArrowDownRight className="h-6 w-6 text-background" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-base capitalize">{tx.transaction_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{tx.amount} HBAR</p>
                    <Badge className={`${getStatusColor(tx.status)} font-semibold`}>
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
