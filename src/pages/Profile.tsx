import { useState } from 'react';
import { User, Shield, CheckCircle, Clock, XCircle } from 'lucide-react';
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

export default function Profile() {
  const { wallet, kycStatus, setKycStatus } = useWallet();
  const { post } = useAPI();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    idType: '',
    idNumber: '',
    country: '',
  });

  const handleSubmitKYC = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // In production: await post('/api/kyc', { ...formData, accountId: wallet.accountId })
      
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Simulate approval
      const newKycStatus = {
        isVerified: true,
        status: 'approved' as const,
        submittedAt: new Date().toISOString(),
      };
      
      setKycStatus(newKycStatus);

      toast({
        title: 'KYC Submitted Successfully!',
        description: 'Your account has been verified',
      });

      // Reset form
      setFormData({
        fullName: '',
        idType: '',
        idNumber: '',
        country: '',
      });
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (kycStatus.status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-primary" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Shield className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (kycStatus.status) {
      case 'approved':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted/50 text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account and verification status
        </p>
      </div>

      {/* Wallet Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Wallet Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {wallet.isConnected ? (
            <>
              <div>
                <Label className="text-muted-foreground">Account ID</Label>
                <p className="text-lg font-mono mt-1">{wallet.accountId}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Balance</Label>
                <p className="text-lg font-semibold mt-1">{wallet.balance} HBAR</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Wallet Type</Label>
                <p className="text-lg capitalize mt-1">{wallet.walletType}</p>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Connect your wallet to view details
            </p>
          )}
        </CardContent>
      </Card>

      {/* KYC Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            KYC Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div>
                  <p className="font-semibold capitalize">{kycStatus.status.replace('_', ' ')}</p>
                  {kycStatus.submittedAt && (
                    <p className="text-sm opacity-75">
                      Submitted {new Date(kycStatus.submittedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KYC Form */}
      {kycStatus.status === 'not_started' && (
        <Card>
          <CardHeader>
            <CardTitle>Complete KYC Verification</CardTitle>
            <CardDescription>
              Verify your identity to enable on-ramp and off-ramp features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitKYC} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                  disabled={!wallet.isConnected}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idType">ID Type</Label>
                <Select
                  value={formData.idType}
                  onValueChange={(value) => setFormData({ ...formData, idType: value })}
                  disabled={!wallet.isConnected}
                >
                  <SelectTrigger id="idType">
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="drivers_license">Driver's License</SelectItem>
                    <SelectItem value="national_id">National ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="idNumber">ID Number</Label>
                <Input
                  id="idNumber"
                  placeholder="AB123456"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  required
                  disabled={!wallet.isConnected}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                  disabled={!wallet.isConnected}
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="us">United States</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="ca">Canada</SelectItem>
                    <SelectItem value="au">Australia</SelectItem>
                    <SelectItem value="de">Germany</SelectItem>
                    <SelectItem value="fr">France</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!wallet.isConnected && (
                <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                  <p className="text-sm text-center">
                    Please connect your wallet to submit KYC
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-primary"
                disabled={!wallet.isConnected || isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit KYC'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Why KYC?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            KYC (Know Your Customer) verification is required to comply with financial regulations
            and ensure the security of your transactions.
          </p>
          <p>
            Benefits of completing KYC:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Access to on-ramp and off-ramp features</li>
            <li>Higher transaction limits</li>
            <li>Enhanced account security</li>
            <li>Faster transaction processing</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
