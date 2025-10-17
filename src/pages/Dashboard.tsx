import { useState, useEffect } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, TrendingUp, Wallet as WalletIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/context/WalletContext';
import { useAPI } from '@/hooks/useAPI';
import { Transaction } from '@/types/wallet';

export default function Dashboard() {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const { get } = useAPI();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (wallet.isConnected) {
      fetchTransactions();
    }
  }, [wallet.isConnected]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    // Mock transactions for demo
    // In production: const { data } = await get('/api/dashboard');
    setTimeout(() => {
      setTransactions([
        {
          id: '1',
          type: 'onramp',
          amount: '100',
          fiatAmount: '50.00',
          status: 'completed',
          timestamp: new Date().toISOString(),
          transactionHash: '0.0.123456@1234567890.123456789',
        },
        {
          id: '2',
          type: 'offramp',
          amount: '50',
          fiatAmount: '25.00',
          status: 'pending',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your Hedera tokens and transactions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <WalletIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {wallet.isConnected ? `${wallet.balance} HBAR` : 'Not Connected'}
            </div>
            <p className="text-xs text-muted-foreground">
              {wallet.isConnected ? wallet.accountId : 'Connect your wallet to view balance'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total On-Ramped</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$50.00</div>
            <p className="text-xs text-muted-foreground">
              +20% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Off-Ramped</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$25.00</div>
            <p className="text-xs text-muted-foreground">
              Recent activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Manage your tokens with one click
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            onClick={() => navigate('/onramp')}
            className="gap-2 bg-gradient-primary"
            disabled={!wallet.isConnected}
          >
            <ArrowDownToLine className="h-4 w-4" />
            On-Ramp Tokens
          </Button>
          <Button
            onClick={() => navigate('/offramp')}
            variant="outline"
            className="gap-2"
            disabled={!wallet.isConnected}
          >
            <ArrowUpFromLine className="h-4 w-4" />
            Off-Ramp Tokens
          </Button>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Your latest on-ramp and off-ramp activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!wallet.isConnected ? (
            <p className="text-center text-muted-foreground py-8">
              Connect your wallet to view transactions
            </p>
          ) : isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        tx.type === 'onramp' ? 'bg-success/10' : 'bg-primary/10'
                      }`}
                    >
                      {tx.type === 'onramp' ? (
                        <ArrowDownToLine className="h-5 w-5 text-success" />
                      ) : (
                        <ArrowUpFromLine className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{tx.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${tx.fiatAmount}</p>
                    <p className="text-sm text-muted-foreground">
                      {tx.amount} HBAR
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                        tx.status === 'completed'
                          ? 'bg-success/10 text-success'
                          : tx.status === 'pending'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {tx.status}
                    </span>
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
