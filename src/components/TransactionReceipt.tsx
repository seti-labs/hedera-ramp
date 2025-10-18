import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Transaction } from '@/services/api';

interface TransactionReceiptProps {
  transaction: Transaction;
  onDownload?: () => void;
}

export const TransactionReceipt = ({ transaction, onDownload }: TransactionReceiptProps) => {
  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Clock className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default: Print to PDF
      window.print();
    }
  };

  return (
    <Card className="max-w-2xl mx-auto print:shadow-none">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <img src="/logo-light.svg" alt="Hedera Ramp Hub" className="h-12 w-12" />
          <div className="text-right">
            <h3 className="text-sm font-medium text-muted-foreground">Transaction Receipt</h3>
            <p className="text-xs text-muted-foreground">Receipt #{transaction.id}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <h2 className="text-2xl font-bold capitalize">{transaction.transaction_type}</h2>
              <Badge className={getStatusColor()}>{transaction.status}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Transaction Details */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Transaction Details</h3>
          <Separator />
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Transaction ID</p>
              <p className="font-medium">{transaction.id}</p>
            </div>
            
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{transaction.transaction_type}</p>
            </div>
            
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">{new Date(transaction.created_at).toLocaleString()}</p>
            </div>
            
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{transaction.status}</p>
            </div>
          </div>
        </div>

        {/* Amount Details */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Amount Details</h3>
          <Separator />
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Crypto Amount</span>
              <span className="font-medium">{transaction.amount} HBAR</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fiat Amount</span>
              <span className="font-medium">{transaction.fiat_amount} {transaction.currency}</span>
            </div>
            
            {transaction.payment_method && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium capitalize">{transaction.payment_method.replace('_', ' ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Hedera Transaction Details */}
        {transaction.hedera_transaction_id && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Blockchain Details</h3>
            <Separator />
            
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-muted-foreground">Hedera Transaction ID</p>
                <p className="font-mono text-xs break-all">{transaction.hedera_transaction_id}</p>
              </div>
              
              {transaction.hedera_transaction_hash && (
                <div>
                  <p className="text-muted-foreground">Transaction Hash</p>
                  <p className="font-mono text-xs break-all">{transaction.hedera_transaction_hash}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Completion Details */}
        {transaction.completed_at && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Completion Details</h3>
            <Separator />
            
            <div className="text-sm">
              <p className="text-muted-foreground">Completed At</p>
              <p className="font-medium">{new Date(transaction.completed_at).toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Notes */}
        {transaction.notes && (
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Notes</h3>
            <Separator />
            <p className="text-sm text-muted-foreground">{transaction.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t print:hidden">
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={handlePrint}>
              Print Receipt
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Print Footer */}
        <div className="hidden print:block pt-6 border-t text-center text-xs text-muted-foreground">
          <p>Hedera Ramp Hub - Transaction Receipt</p>
          <p>Generated on {new Date().toLocaleString()}</p>
          <p className="mt-2">This is a digital receipt. Please keep for your records.</p>
        </div>
      </CardContent>
    </Card>
  );
};

