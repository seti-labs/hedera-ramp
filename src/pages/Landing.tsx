import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/context/WalletContext';
import api from '@/services/api';
import { mockPublicAPI } from '@/services/mockAPI';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ErrorBoundary from '@/components/ErrorBoundary';
import { 
  ArrowRight, 
  Wallet, 
  TrendingUp, 
  Users, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Smartphone,
  Shield,
  Zap,
  BarChart3,
  GraduationCap,
  Lock,
  Unlock,
  BookOpen,
  Building,
  DollarSign,
  Calendar
} from 'lucide-react';

interface PublicStats {
  total_users: number;
  total_transactions: number;
  completed_transactions: number;
  total_volume_kes: number;
  unique_wallets: number;
  onramp_count: number;
  offramp_count: number;
  recent_transactions: any[];
  daily_activity: any[];
  last_updated: string;
}

export default function Landing() {
  return (
    <ErrorBoundary>
      <LandingContent />
    </ErrorBoundary>
  );
}

function LandingContent() {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Don't auto-redirect from landing - let them see stats first

  useEffect(() => {
    loadStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      if (process.env.NODE_ENV === 'development') {
        // Use mock data in development
        const response = await mockPublicAPI.getStats();
        setStats(response);
      } else {
        const response = await api.get('/public/stats');
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      // Set fallback data to prevent breaking
      setStats({
        total_users: 0,
        total_transactions: 0,
        completed_transactions: 0,
        total_volume_kes: 0,
        unique_wallets: 0,
        onramp_count: 0,
        offramp_count: 0,
        recent_transactions: [],
        daily_activity: [],
        last_updated: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-background to-muted opacity-50"></div>
        
        <div className="container mx-auto px-4 py-12 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-3">
              <img src="/hedera-logo.svg" alt="Hedera" className="h-12 w-12" />
              <div>
                <h2 className="text-2xl font-bold">Campus Investment Hub</h2>
                <p className="text-sm text-muted-foreground">Student Investment Platform • Powered by Hedera</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate(wallet.isConnected ? '/dashboard' : '/welcome')} 
              className="bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-full px-6"
            >
              {wallet.isConnected ? 'Go to Dashboard' : 'Launch App'}
            </Button>
          </div>

          {/* Hero Content */}
          <div className="max-w-4xl mx-auto text-center mb-20">
            <Badge className="mb-6 bg-foreground text-background">
              🎓 Campus Student Investment Platform
            </Badge>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6">
              Invest & Lock
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Build financial discipline by investing with funds locked until graduation. 
              Learn investing while your money grows safely.
            </p>

            <Button
              size="lg"
              onClick={() => navigate(wallet.isConnected ? '/dashboard' : '/welcome')}
              className="bg-foreground text-background hover:bg-foreground/90 text-lg px-12 py-7 rounded-full shadow-apple-lg font-bold"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            <Card className="shadow-apple border-0 text-center">
              <CardContent className="pt-8 pb-6">
                <div className="p-4 bg-foreground rounded-2xl inline-block mb-4">
                  <Users className="h-8 w-8 text-background" />
                </div>
                <div className="text-4xl font-bold mb-2">
                  {loading ? '...' : stats?.total_users || 0}
                </div>
                <div className="text-sm text-muted-foreground font-semibold">Student Investors</div>
              </CardContent>
            </Card>

            <Card className="shadow-apple border-0 text-center">
              <CardContent className="pt-8 pb-6">
                <div className="p-4 bg-foreground rounded-2xl inline-block mb-4">
                  <Activity className="h-8 w-8 text-background" />
                </div>
                <div className="text-4xl font-bold mb-2">
                  {loading ? '...' : stats?.total_transactions || 0}
                </div>
                <div className="text-sm text-muted-foreground font-semibold">Active Investments</div>
              </CardContent>
            </Card>

            <Card className="shadow-apple border-0 text-center">
              <CardContent className="pt-8 pb-6">
                <div className="p-4 bg-foreground rounded-2xl inline-block mb-4">
                  <Wallet className="h-8 w-8 text-background" />
                </div>
                <div className="text-4xl font-bold mb-2">
                  {loading ? '...' : stats?.unique_wallets || 0}
                </div>
                <div className="text-sm text-muted-foreground font-semibold">Universities</div>
              </CardContent>
            </Card>

            <Card className="shadow-apple border-0 text-center">
              <CardContent className="pt-8 pb-6">
                <div className="p-4 bg-foreground rounded-2xl inline-block mb-4">
                  <TrendingUp className="h-8 w-8 text-background" />
                </div>
                <div className="text-4xl font-bold mb-2">
                  {loading ? '...' : stats ? `${(stats.total_volume_kes / 1000).toFixed(0)}K` : '0'}
                </div>
                <div className="text-sm text-muted-foreground font-semibold">Total Locked (KES)</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">How Student Investment Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="shadow-apple border-0">
              <CardContent className="pt-8 text-center">
                <div className="p-5 bg-foreground rounded-3xl inline-block mb-6">
                  <GraduationCap className="h-12 w-12 text-background" />
                </div>
                <h3 className="text-2xl font-bold mb-3">1. Register as Student</h3>
                <p className="text-muted-foreground">
                  Register with your university details and graduation year. 
                  Your student status is verified for secure investing.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-apple border-0">
              <CardContent className="pt-8 text-center">
                <div className="p-5 bg-foreground rounded-3xl inline-block mb-6">
                  <Lock className="h-12 w-12 text-background" />
                </div>
                <h3 className="text-2xl font-bold mb-3">2. Invest & Lock</h3>
                <p className="text-muted-foreground">
                  Choose your investment type and lock period. Your money is locked 
                  until graduation or the specified time period.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-apple border-0">
              <CardContent className="pt-8 text-center">
                <div className="p-5 bg-foreground rounded-3xl inline-block mb-6">
                  <Unlock className="h-12 w-12 text-background" />
                </div>
                <h3 className="text-2xl font-bold mb-3">3. Graduate & Withdraw</h3>
                <p className="text-muted-foreground">
                  When you graduate or the lock period ends, withdraw your 
                  investment plus returns. Build financial discipline!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Investment Types */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Savings Investment */}
            <Card className="shadow-apple-lg border-0 overflow-hidden group hover:shadow-glow transition-all">
              <CardContent className="pt-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 bg-foreground rounded-2xl">
                    <DollarSign className="h-10 w-10 text-background" />
                  </div>
                  <Badge className="bg-muted font-semibold px-3 py-1">
                    Safe & Secure
                  </Badge>
                </div>
                <h3 className="text-3xl font-bold mb-4">Savings Investment</h3>
                <p className="text-muted-foreground mb-6">
                  Traditional savings account with guaranteed returns. 
                  Your money is locked until graduation with 5% annual returns.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm">5% annual return rate</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm">Locked until graduation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm">Guaranteed returns</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => navigate(wallet.isConnected ? '/investments' : '/welcome')} 
                  className="w-full bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-xl py-6"
                >
                  Start Savings Investment
                </Button>
              </CardContent>
            </Card>

            {/* Crypto Investment */}
            <Card className="shadow-apple-lg border-0 overflow-hidden group hover:shadow-glow transition-all">
              <CardContent className="pt-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="p-4 bg-foreground rounded-2xl">
                    <TrendingUp className="h-10 w-10 text-background" />
                  </div>
                  <Badge className="bg-muted font-semibold px-3 py-1">
                    Higher Returns
                  </Badge>
                </div>
                <h3 className="text-3xl font-bold mb-4">Crypto Investment</h3>
                <p className="text-muted-foreground mb-6">
                  Invest in cryptocurrency with higher potential returns. 
                  Your investment is locked until graduation with market-based returns.
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm">Market-based returns</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm">Locked until graduation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm">Higher growth potential</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => navigate(wallet.isConnected ? '/investments' : '/welcome')} 
                  className="w-full bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-xl py-6"
                >
                  Start Crypto Investment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Activity Chart */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="shadow-apple-lg border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <BarChart3 className="h-6 w-6" />
                      Transaction Activity
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Last 7 days</p>
                  </div>
                  <Badge className="bg-foreground text-background">Live</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {stats && stats.daily_activity && stats.daily_activity.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.daily_activity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#737373"
                        fontSize={12}
                      />
                      <YAxis stroke="#737373" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e5e5',
                          borderRadius: '12px',
                          padding: '12px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#171717" 
                        strokeWidth={3}
                        dot={{ fill: '#171717', r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No activity data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Transactions */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-4">Recent Transactions</h2>
            <p className="text-center text-muted-foreground mb-12">
              {stats && stats.recent_transactions.length > 0 
                ? 'Live anonymous transactions on the platform' 
                : 'No transactions yet - Be the first!'}
            </p>
            
            {stats && stats.recent_transactions.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_transactions.slice(0, 8).map((tx, index) => (
                  <Card key={tx.id || index} className="shadow-apple border-0 hover:shadow-apple-lg transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${
                            tx.type === 'onramp' ? 'bg-foreground' : 'bg-muted'
                          }`}>
                            {tx.type === 'onramp' ? (
                              <ArrowUpRight className="h-5 w-5 text-background" />
                            ) : (
                              <ArrowDownRight className="h-5 w-5 text-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold capitalize">{tx.type}</p>
                            <p className="text-sm text-muted-foreground font-mono">{tx.wallet}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{tx.amount} HBAR</p>
                          <p className="text-sm text-muted-foreground">{tx.fiat_amount} {tx.currency}</p>
                          {tx.completed_at && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.completed_at).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="shadow-apple border-0">
                <CardContent className="py-16 text-center">
                  <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Transactions Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Be the first to use Hedera Ramp Hub!
                  </p>
                  <Button 
                    onClick={() => navigate('/welcome')}
                    className="bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-full px-8"
                  >
                    Get Started - Connect Wallet
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">Why Choose Us?</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="shadow-apple border-0 text-center">
              <CardContent className="pt-8">
                <Zap className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">Lightning Fast</h3>
                <p className="text-muted-foreground">
                  Transactions complete in seconds on Hedera's high-performance network
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-apple border-0 text-center">
              <CardContent className="pt-8">
                <Shield className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">Secure & Safe</h3>
                <p className="text-muted-foreground">
                  Non-custodial solution - you always control your funds and keys
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-apple border-0 text-center">
              <CardContent className="pt-8">
                <Smartphone className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-3">M-Pesa Native</h3>
                <p className="text-muted-foreground">
                  Built specifically for Kenya with full M-Pesa integration
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-foreground text-background py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Start?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Connect your Hedera wallet and start converting between M-Pesa and HBAR in seconds
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate(wallet.isConnected ? '/dashboard' : '/welcome')}
              className="bg-background text-foreground hover:bg-background/90 text-lg px-12 py-7 rounded-full font-bold"
            >
              Launch App Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Live Update Indicator */}
          {stats && (
            <p className="text-sm opacity-75 mt-12">
              Live stats updated: {new Date(stats.last_updated).toLocaleTimeString()}
            </p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src="/hedera-logo.svg" alt="Hedera" className="h-10 w-10" />
              <div>
                <p className="font-bold">Hedera Ramp Hub</p>
                <p className="text-sm text-muted-foreground">Built on Hedera Hashgraph</p>
              </div>
            </div>
            
            <div className="flex gap-6 text-sm">
              <button 
                onClick={() => navigate(wallet.isConnected ? '/dashboard' : '/welcome')} 
                className="hover:underline font-semibold"
              >
                Dashboard
              </button>
              <button 
                onClick={() => navigate(wallet.isConnected ? '/mpesa' : '/welcome')} 
                className="hover:underline font-semibold"
              >
                Transactions
              </button>
              <button 
                onClick={() => navigate(wallet.isConnected ? '/receipts' : '/welcome')} 
                className="hover:underline font-semibold"
              >
                Receipts
              </button>
            </div>
            
            <div className="text-sm text-muted-foreground text-center md:text-right">
              <p className="font-semibold">Built & Powered by SetiLabs</p>
              <p>© 2025 SetiLabs. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
