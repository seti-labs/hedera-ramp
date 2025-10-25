import React from 'react';
import { useHashConnect } from '@/hooks/useHashConnect';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wallet, CheckCircle, XCircle } from 'lucide-react';

/**
 * Example component showing how to use the useHashConnect hook
 * This demonstrates the proper usage pattern for HashConnect v1.24.0
 */
export const HashConnectExample: React.FC = () => {
  const { 
    hashconnect, 
    connectWallet, 
    isPaired, 
    accountIds, 
    isConnecting, 
    error 
  } = useHashConnect();

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          HashConnect Example
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={isPaired ? "default" : "secondary"}>
            {isPaired ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Not Connected
              </>
            )}
          </Badge>
        </div>

        {/* Account IDs */}
        {accountIds.length > 0 && (
          <div>
            <span className="text-sm font-medium">Account IDs:</span>
            <div className="mt-1 space-y-1">
              {accountIds.map((accountId, index) => (
                <div key={index} className="text-xs font-mono bg-muted p-2 rounded">
                  {accountId}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}

        {/* Connect Button */}
        <Button
          onClick={connectWallet}
          disabled={isConnecting || isPaired}
          className="w-full"
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : isPaired ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Connected
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Connect HashPack
            </>
          )}
        </Button>

        {/* Debug Info */}
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">Debug Info</summary>
          <div className="mt-2 space-y-1">
            <div>HashConnect: {hashconnect ? '✅' : '❌'}</div>
            <div>Is Paired: {isPaired ? '✅' : '❌'}</div>
            <div>Is Connecting: {isConnecting ? '✅' : '❌'}</div>
            <div>Account Count: {accountIds.length}</div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};
