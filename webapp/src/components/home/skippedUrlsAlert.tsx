import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, X, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SkippedUrl {
  url: string;
  failureCount: number;
  lastFailed: string;
  jobTitle?: string;
  companyName?: string;
}

interface SkippedUrlsAlertProps {
  skippedUrls: SkippedUrl[];
  onRetryUrl?: (url: string) => void;
  onDismiss?: () => void;
  onOpenUrl?: (url: string) => void;
}

export function SkippedUrlsAlert({ 
  skippedUrls, 
  onRetryUrl, 
  onDismiss, 
  onOpenUrl 
}: SkippedUrlsAlertProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (skippedUrls.length > 0) {
      setIsOpen(true);
    }
  }, [skippedUrls]);

  if (skippedUrls.length === 0) {
    return null;
  }

  const handleRetryUrl = (url: string) => {
    onRetryUrl?.(url);
  };

  const handleOpenUrl = (url: string) => {
    onOpenUrl?.(url);
  };

  const handleDismiss = () => {
    setIsOpen(false);
    onDismiss?.();
  };

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <AlertTitle className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-orange-600" />
          <span>URLs Skipped Due to Repeated Failures</span>
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            {skippedUrls.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      
      <AlertDescription className="mt-2">
        <p className="text-sm text-orange-700 mb-3">
          The following URLs have failed multiple times and have been temporarily skipped. 
          This may indicate robot detection or other issues that require manual review.
        </p>
        
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="mb-3">
              {isOpen ? 'Hide' : 'Show'} Details ({skippedUrls.length} URLs)
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-2">
            {skippedUrls.map((skippedUrl, index) => (
              <Card key={index} className="border-orange-200 bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium text-gray-900 truncate">
                        {skippedUrl.jobTitle || 'Unknown Job'}
                        {skippedUrl.companyName && (
                          <span className="text-gray-500 font-normal"> at {skippedUrl.companyName}</span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs text-gray-500 mt-1">
                        Failed {skippedUrl.failureCount} times • Last failed: {new Date(skippedUrl.lastFailed).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenUrl(skippedUrl.url)}
                        className="h-7 px-2"
                        title="Open URL in browser"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetryUrl(skippedUrl.url)}
                        className="h-7 px-2"
                        title="Retry URL"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xs text-gray-600 break-all">
                    {skippedUrl.url}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </AlertDescription>
    </Alert>
  );
}










