import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { intersendAPI } from '@/services/intersend';
import { toast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, XCircle, Phone, DollarSign } from 'lucide-react';

interface IntersendRates {
  KES_TO_HBAR: number;
  HBAR_TO_KES: number;
  last_updated: string;
  currency: string;
  provider: string;
}

export default function MPesa() {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') || 'onramp';
  
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [onRampAmount, setOnRampAmount] = useState('');
  const [onRampPhone, setOnRampPhone] = useState('254');
  const [offRampAmount, setOffRampAmount] = useState('');
  const [offRampPhone, setOffRampPhone] = useState('254');
  const [cryptoAmount, setCryptoAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<IntersendRates | null>(null);
  const [transactionId, setTransactionId] = useState<number | null>(null);

  useEffect(() => {
    loadRates();
  }, []);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  const loadRates = async () => {
    try {
      const ratesData = await intersendAPI.getRates();
      setRates(ratesData);
    } catch (error) {
      console.error('Failed to load rates:', error);
    }
  };

  const calculateCrypto = (kesAmount: string) => {
    if (rates && kesAmount) {
      const crypto = parseFloat(kesAmount) * rates.KES_TO_HBAR;
      return crypto.toFixed(4);
    }
    return '0';
  };

  const calculateKES = (crypto: string) => {
    if (rates && crypto) {
      const kes = parseFloat(crypto) * rates.HBAR_TO_KES;
      return kes.toFixed(2);
    }
    return '0';
  };

  const handleOnRampAmountChange = (value: string) => {
    setOnRampAmount(value);
    if (value) {
      const crypto = calculateCrypto(value);
      // Update crypto amount display if needed
    }
  };

  const handleOffRampCryptoChange = (value: string) => {
    setCryptoAmount(value);
    if (value) {
      const kes = calculateKES(value);
      setOffRampAmount(kes);
    }
  };

  const handleOnRamp = async () => {
    if (!onRampAmount || !onRampPhone) {
      toast({
        title: 'Error',
        description: 'Please enter amount and phone number',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(onRampAmount);
    if (amount < 25 || amount > 150000) {
      toast({
        title: 'Invalid Amount',
        description: 'Amount must be between 25 and 150,000 KES',
        variant: 'destructive',
      });
      return;
    }

    if (!intersendAPI.validatePhoneNumber(onRampPhone)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Phone number must be in format 254XXXXXXXXX',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await intersendAPI.initiateOnRamp({
        amount,
        phone_number: onRampPhone,
        crypto_amount: calculateCrypto(onRampAmount),
      });

      setTransactionId(response.transaction_id);

      toast({
        title: 'Payment Initiated!',
        description: 'Check your phone for the mobile money payment prompt',
      });

      // Poll for transaction status
      setTimeout(() => checkTransactionStatus(response.transaction_id), 5000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOffRamp = async () => {
    if (!offRampAmount || !offRampPhone || !cryptoAmount) {
      toast({
        title: 'Error',
        description: 'Please enter all required fields',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(offRampAmount);
    const hbarAmount = parseFloat(cryptoAmount);
    
    if (amount < 25 || amount > 150000) {
      toast({
        title: 'Invalid Amount',
        description: 'Amount must be between 25 and 150,000 KES',
        variant: 'destructive',
      });
      return;
    }
    
    if (hbarAmount < 2) {
      toast({
        title: 'Invalid Amount',
        description: 'Minimum off-ramp amount is 2 HBAR',
        variant: 'destructive',
      });
      return;
    }

    if (!intersendAPI.validatePhoneNumber(offRampPhone)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Phone number must be in format 254XXXXXXXXX',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await intersendAPI.initiateOffRamp({
        amount,
        phone_number: offRampPhone,
        crypto_amount: cryptoAmount,
      });

      setTransactionId(response.transaction_id);

      toast({
        title: 'Payment Initiated!',
        description: 'You will receive M-Pesa payment shortly',
      });

      // Poll for transaction status
      setTimeout(() => checkTransactionStatus(response.transaction_id), 5000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to initiate payment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkTransactionStatus = async (txId: number) => {
    try {
      const status = await mpesaAPI.getTransactionStatus(txId);
      
      if (status.status === 'completed') {
        toast({
          title: 'Transaction Completed!',
          description: 'Your transaction was successful',
        });
      } else if (status.status === 'failed') {
        toast({
          title: 'Transaction Failed',
          description: status.notes || 'Transaction failed',
          variant: 'destructive',
        });
      } else if (status.status === 'processing') {
        // Continue polling
        setTimeout(() => checkTransactionStatus(txId), 5000);
      }
    } catch (error) {
      console.error('Failed to check transaction status:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {activeTab === 'onramp' ? 'On-Ramp' : 'Off-Ramp'}
        </h1>
        <p className="text-muted-foreground">
          {activeTab === 'onramp' 
            ? 'Pay with M-Pesa to buy HBAR' 
            : 'Sell HBAR and receive KES via M-Pesa'}
        </p>
      </div>

      {rates && (
        <Card className="mb-6 shadow-apple border-0">
          <CardHeader>
            <CardTitle>Current Exchange Rates</CardTitle>
            <CardDescription>Updated {new Date(rates.last_updated).toLocaleString()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-5 bg-muted rounded-2xl shadow-card">
                <span className="font-semibold">1 HBAR</span>
                <span className="text-xl font-bold text-foreground">{rates.HBAR_TO_KES} KES</span>
              </div>
              <div className="flex items-center justify-between p-5 bg-muted rounded-2xl shadow-card">
                <span className="font-semibold">1 KES</span>
                <span className="text-xl font-bold text-foreground">{rates.KES_TO_HBAR} HBAR</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="onramp">On-Ramp</TabsTrigger>
          <TabsTrigger value="offramp">Off-Ramp</TabsTrigger>
        </TabsList>

        <TabsContent value="onramp">
          <Card className="shadow-apple-lg border-0">
            <CardHeader>
              <CardTitle className="text-2xl">Buy HBAR with Mobile Money</CardTitle>
              <CardDescription>
                Pay with mobile money to purchase HBAR
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Phone className="h-4 w-4" />
                <AlertDescription>
                  You will receive a payment prompt on your phone. Enter your mobile money PIN to complete the transaction.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="onramp-amount">Amount (KES)</Label>
                <Input
                  id="onramp-amount"
                  type="number"
                  placeholder="Enter amount in KES"
                  value={onRampAmount}
                  onChange={(e) => handleOnRampAmountChange(e.target.value)}
                  min="25"
                  max="150000"
                />
                {onRampAmount && rates && (
                  <p className="text-sm text-muted-foreground">
                    ≈ {calculateCrypto(onRampAmount)} HBAR
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="onramp-phone">M-Pesa Phone Number</Label>
                <Input
                  id="onramp-phone"
                  type="tel"
                  placeholder="254712345678"
                  value={onRampPhone}
                  onChange={(e) => setOnRampPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Format: 254XXXXXXXXX
                </p>
              </div>

              <Button
                onClick={handleOnRamp}
                disabled={loading}
                className="w-full bg-foreground text-background font-bold rounded-2xl shadow-apple-lg hover:shadow-glow hover:bg-foreground/90"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-5 w-5" />
                    Pay with M-Pesa
                  </>
                )}
              </Button>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Minimum: 25 KES</p>
                <p>• Maximum: 150,000 KES</p>
                <p>• Instant HBAR delivery after payment</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offramp">
          <Card className="shadow-apple-lg border-0">
            <CardHeader>
              <CardTitle className="text-2xl">Sell HBAR for Mobile Money</CardTitle>
              <CardDescription>
                Convert HBAR to KES and receive via mobile money
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  You will receive M-Pesa payment directly to your phone number within minutes.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="offramp-crypto">Crypto Amount (HBAR)</Label>
                <Input
                  id="offramp-crypto"
                  type="number"
                  placeholder="Enter HBAR amount"
                  value={cryptoAmount}
                  onChange={(e) => handleOffRampCryptoChange(e.target.value)}
                  min="2"
                />
                {cryptoAmount && rates && (
                  <p className="text-sm text-muted-foreground">
                    ≈ {calculateKES(cryptoAmount)} KES
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="offramp-amount">You'll Receive (KES)</Label>
                <Input
                  id="offramp-amount"
                  type="number"
                  placeholder="Calculated amount"
                  value={offRampAmount}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="offramp-phone">M-Pesa Phone Number</Label>
                <Input
                  id="offramp-phone"
                  type="tel"
                  placeholder="254712345678"
                  value={offRampPhone}
                  onChange={(e) => setOffRampPhone(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Format: 254XXXXXXXXX
                </p>
              </div>

              <Button
                onClick={handleOffRamp}
                disabled={loading}
                className="w-full bg-foreground text-background font-bold rounded-2xl shadow-apple-lg hover:shadow-glow hover:bg-foreground/90"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Sell for M-Pesa
                  </>
                )}
              </Button>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Minimum: 25 KES or 2 HBAR</p>
                <p>• Maximum: 150,000 KES</p>
                <p>• Instant M-Pesa payment</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {transactionId && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Transaction Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Transaction ID:</span>
              <Badge>{transactionId}</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

