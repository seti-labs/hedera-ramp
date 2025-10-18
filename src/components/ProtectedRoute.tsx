import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/context/WalletContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { wallet, isLoading } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !wallet.isConnected) {
      // Redirect to welcome page if not connected
      navigate('/welcome', { replace: true });
    }
  }, [wallet.isConnected, isLoading, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show connect wallet prompt if not connected
  if (!wallet.isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-6">
            <Wallet className="h-16 w-16 text-muted-foreground mx-auto" />
            <div>
              <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground">
                Please connect your Hedera wallet to access this page
              </p>
            </div>
            <Button 
              onClick={() => navigate('/welcome')} 
              className="w-full bg-foreground text-background hover:bg-foreground/90"
              size="lg"
            >
              Connect Wallet to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render protected content if authenticated
  return <>{children}</>;
};

