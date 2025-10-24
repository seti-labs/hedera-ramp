import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useWallet } from '@/context/WalletContext';
import { authAPI, setAuthToken, setRefreshToken } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface WalletConnectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const WalletConnect = ({ open, onOpenChange, onSuccess }: WalletConnectProps) => {
  const { connectWallet, wallet } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [hashPackDetected, setHashPackDetected] = useState(false);

  // Check for HashPack on mount
  useEffect(() => {
    const checkHashPack = () => {
      // HashPack detection - check for the extension
      const isHashPackInstalled = !!(
        // Check for HashPack extension
        window.hashconnect ||
        (window as any).hashconnect ||
        // Check for HashPack global objects
        (window as any).HashConnect ||
        // Check for HashPack in extensions
        (window as any).hashpack ||
        // Check if we can access HashPack APIs
        (typeof window !== 'undefined' && 'hashconnect' in window)
      );
      
      console.log('HashPack detection check:', {
        windowHashconnect: !!window.hashconnect,
        windowHashConnect: !!(window as any).HashConnect,
        windowHashpack: !!(window as any).hashpack,
        hasHashconnect: 'hashconnect' in window
      });
      
      if (isHashPackInstalled) {
        setHashPackDetected(true);
        console.log('✅ HashPack detected!');
      } else {
        setHashPackDetected(false);
        console.log('❌ HashPack not detected');
      }
    };

    checkHashPack();
    
    // Check multiple times with increasing delays
    const timeouts = [
      setTimeout(checkHashPack, 100),
      setTimeout(checkHashPack, 500),
      setTimeout(checkHashPack, 1000),
      setTimeout(checkHashPack, 2000)
    ];
    
    return () => timeouts.forEach(clearTimeout);
  }, []);

  // Manual override for HashPack detection
  const forceHashPackDetection = () => {
    setHashPackDetected(true);
    console.log('🔧 Manual HashPack detection override activated');
  };

  const handleWalletConnect = async () => {
    setIsConnecting(true);
    try {
      console.log('Starting wallet connection...');
      
      // Connect to HashPack wallet
      await connectWallet('hashpack');
      
      console.log('Wallet connected, wallet state:', wallet);
      
      // After wallet connects, automatically sign up/sign in
      // Wait a bit for wallet state to update
      setTimeout(async () => {
        const currentWallet = JSON.parse(localStorage.getItem('walletState') || '{}');
        if (currentWallet.accountId) {
          console.log('Authenticating with accountId:', currentWallet.accountId);
          await handleWalletAuth(currentWallet.accountId, 'hashpack');
        }
      }, 500);
      
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Connection Failed';
      let errorDetails = '';
      
      if (error.message?.includes('timeout')) {
        errorMessage = 'Connection Timeout';
        errorDetails = error.message || 'Connection timed out. Please:\n1. Make sure HashPack is unlocked\n2. Switch HashPack to Testnet network\n3. Check for popup blockers\n4. Click the HashPack extension icon to approve';
      } else if (error.message?.includes('not found') || error.message?.includes('install')) {
        errorMessage = 'HashPack Not Found';
        errorDetails = 'Please install HashPack wallet extension from hashpack.app';
      } else if (error.message?.includes('initialize') || error.message?.includes('init')) {
        errorMessage = 'Initialization Failed';
        errorDetails = error.message || 'Failed to initialize HashConnect. Please refresh the page and try again.';
      } else {
        errorDetails = error.message || 'An unexpected error occurred. Please try again.';
      }
      
      toast({
        title: errorMessage,
        description: errorDetails,
        variant: 'destructive',
        duration: 12000, // Show for 12 seconds
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWalletAuth = async (walletAddress: string, walletType: 'hashpack' | 'blade') => {
    setRegistering(true);
    
    try {
      // Try to sign in with wallet first
      try {
        const response = await authAPI.signinWallet({ wallet_address: walletAddress });
        
        // Store tokens
        setAuthToken(response.access_token);
        setRefreshToken(response.refresh_token);
        
        toast({
          title: 'Welcome Back!',
          description: 'Successfully logged in with your wallet',
        });
        
        onOpenChange(false);
        if (onSuccess) onSuccess();
        
      } catch (signInError: any) {
        // If sign in fails (wallet not registered), sign up
        if (signInError.response?.status === 404) {
          const response = await authAPI.signup({
            wallet_address: walletAddress,
            wallet_type: walletType,
            email: '',  // No email needed
            password: '',  // No password needed
            country: 'KE'  // Default to Kenya
          });
          
          // Store tokens
          setAuthToken(response.access_token);
          setRefreshToken(response.refresh_token);
          
          toast({
            title: 'Welcome!',
            description: 'Your Hedera wallet has been registered',
          });
          
          onOpenChange(false);
          if (onSuccess) onSuccess();
        } else {
          throw signInError;
        }
      }
    } catch (error: any) {
      console.error('Authentication failed:', error);
      toast({
        title: 'Authentication Failed',
        description: error.response?.data?.message || 'Failed to authenticate',
        variant: 'destructive',
      });
    } finally {
      setRegistering(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">Connect Hedera Wallet</DialogTitle>
          <DialogDescription>
            Connect your Hedera wallet to get started. Your wallet is your identity on the platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* HashPack Only */}
          <Card className="cursor-pointer hover:shadow-apple transition-all border-2 hover:border-foreground">
            <CardContent className="p-6">
              <Button
                onClick={handleWalletConnect}
                disabled={isConnecting || registering}
                className="w-full bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-xl py-6"
                size="lg"
              >
                {(isConnecting || registering) ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {registering ? 'Registering...' : 'Connecting...'}
                  </>
                ) : (
                  <>
                    <img src="/hedera-icon.svg" alt="HashPack" className="mr-3 h-6 w-6" />
                    Connect HashPack
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                {hashPackDetected 
                  ? '✅ HashPack detected - Click to connect'
                  : '⚠️ HashPack not detected - Install from hashpack.app'
                }
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 text-center mt-2">
                💡 If popup doesn't appear, click the HashPack extension icon in your browser
              </p>
            </CardContent>
          </Card>

          {/* Connection Instructions */}
          <div className="bg-muted/50 rounded-xl p-4 text-sm">
            <p className="font-semibold mb-2 text-center">Connection Steps</p>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>1. <strong>Install HashPack</strong> - Get it from <a href="https://www.hashpack.app/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">hashpack.app</a></p>
              <p>2. <strong>Unlock HashPack</strong> and switch to <strong>Testnet</strong></p>
              <p>3. <strong>Click "Connect HashPack"</strong> button above</p>
              <p>4. <strong>Approve the connection</strong> in the popup</p>
              <p className="text-amber-600 dark:text-amber-500 mt-2">⚠️ <strong>Note:</strong> Check for popup blockers if you don't see the HashPack approval window</p>
            </div>
          </div>

          {/* Info */}
          <div className="bg-muted/50 rounded-xl p-4 text-sm text-center">
            <p className="font-semibold mb-2">New to Hedera?</p>
            <p className="text-muted-foreground text-xs">
              {hashPackDetected 
                ? 'Your HashPack wallet is ready! Connect it to get started.'
                : 'Install HashPack wallet extension, create a new wallet, and connect it here.'
              }
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

