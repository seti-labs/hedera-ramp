import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WalletConnect } from '@/components/WalletConnect';
import { useWallet } from '@/context/WalletContext';
import { Shield, Wallet, CheckCircle, ArrowRight } from 'lucide-react';

export default function Welcome() {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);

  // If wallet is connected, redirect to dashboard
  if (wallet.isConnected) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleGetStarted = () => {
    setConnectDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full shadow-apple-lg border-0">
        <CardContent className="pt-12 pb-8 px-8">
          <div className="text-center mb-8">
            <img src="/hedera-logo.svg" alt="Hedera" className="h-20 w-20 mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4">Welcome to Hedera Ramp Hub</h1>
            <p className="text-xl text-muted-foreground mb-2">
              M-Pesa to HBAR On/Off-Ramp Platform
            </p>
            <p className="text-sm text-muted-foreground">
              Built by SetLabs • Powered by Hedera Hashgraph
            </p>
          </div>

          {/* KYC Steps */}
          <div className="space-y-6 mb-8">
            <h2 className="text-2xl font-bold text-center mb-6">Quick Setup (1 Step)</h2>
            
            <Card className="bg-muted/50 border-0">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-foreground rounded-xl">
                    <Wallet className="h-8 w-8 text-background" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">Connect Your Hedera Wallet</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Connect HashPack or Blade wallet. Your wallet serves as your identity - no forms, no waiting.
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>Instant verification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>Non-custodial (you control your keys)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>Blockchain-verified identity</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Features Preview */}
          <div className="bg-gradient-surface rounded-2xl p-6 mb-8">
            <h3 className="font-bold mb-4 text-center">What You'll Get Access To:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>M-Pesa On-Ramp</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>M-Pesa Off-Ramp</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Transaction Receipts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Live HBAR Balance</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={handleGetStarted}
            className="w-full bg-foreground text-background hover:bg-foreground/90 font-bold text-lg py-7 rounded-2xl shadow-apple-lg"
            size="lg"
          >
            <Shield className="mr-2 h-5 w-5" />
            Connect Wallet to Continue
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-6">
            By connecting your wallet, you agree to our terms of service. Your wallet is your identity on the platform.
          </p>
        </CardContent>
      </Card>

      {/* Wallet Connect Dialog */}
      <WalletConnect 
        open={connectDialogOpen} 
        onOpenChange={setConnectDialogOpen}
        onSuccess={() => {
          setConnectDialogOpen(false);
          navigate('/dashboard');
        }}
      />
    </div>
  );
}

