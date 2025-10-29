import { PricingOptions } from '@/components/pricingOptions';
import { FiltersSkeleton } from '@/components/skeletons/filtersSkeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { useError } from '@/hooks/error';
import { useSession } from '@/hooks/session';
import { getAdvancedMatchingConfig, getApiConfig, openExternalUrl, updateAdvancedMatchingConfig, updateApiConfig } from '@/lib/electronMainSdk';
import { Cross2Icon, InfoCircledIcon, MinusCircledIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { StripeBillingPlan, SubscriptionTier } from '../../../supabase/functions/_shared/types';
import { DefaultLayout } from './defaultLayout';

export function FiltersPage() {
  const { handleError } = useError();
  const { toast } = useToast();
  const { profile, stripeConfig, refreshProfile } = useSession();

  const [userAiInput, setUserAiInput] = useState<string>('');
  const [blacklistedCompanies, setBlacklistedCompanies] = useState<string[]>([]);
  const [addBlacklistedCompany, setAddBlacklistedCompany] = useState<string>('');
  const [isSubscriptionDialogOpen, setSubscriptionDialogOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAllBlacklistedCompanies, setShowAllBlacklistedCompanies] = useState(false);
  
  // API Model Selection State
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'gemini' | 'llama'>('gemini');
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    gemini: '',
    llama: ''
  });
  const [showApiKeyInputs, setShowApiKeyInputs] = useState(false);

  /**
   * Load the advanced matching filters and API config from the user's profile.
   */
  useEffect(() => {
    const asyncLoad = async () => {
      try {
        // Load advanced matching config
        const config = await getAdvancedMatchingConfig();
        if (config) {
          setUserAiInput(config.chatgpt_prompt);
          setBlacklistedCompanies(config.blacklisted_companies);
        }
        
        // Load API configuration
        const apiConfig = await getApiConfig();
        setSelectedProvider(apiConfig.provider);
        setApiKeys({
          openai: apiConfig.keys.openai || '',
          gemini: apiConfig.keys.gemini || '',
          llama: apiConfig.keys.llama || ''
        });
      } catch (error) {
        handleError({ error, title: 'Failed to load advanced matching filters' });
      } finally {
        setIsLoading(false);
      }
    };
    asyncLoad();
  }, []);

  /**
   * Save the config to the database and local storage.
   */
  const onSave = async () => {
    try {
      // Save advanced matching config
      const updatedConfig = await updateAdvancedMatchingConfig({
        chatgpt_prompt: userAiInput,
        blacklisted_companies: blacklistedCompanies,
      });
      setUserAiInput(updatedConfig.chatgpt_prompt);
      setBlacklistedCompanies(updatedConfig.blacklisted_companies);

      // Save API configuration
      await updateApiConfig({
        provider: selectedProvider,
        keys: {
          openai: apiKeys.openai || undefined,
          gemini: apiKeys.gemini || undefined,
          llama: apiKeys.llama || undefined,
        }
      });

      // For local development, bypass PRO plan check
      // if (profile.subscription_tier !== 'pro') {
      //   setSubscriptionDialogOpen(true);
      //   return;
      // } else {
      //   toast({ title: 'Advanced matching filters and API configuration saved' });
      // }
      
      // Always allow saving for local development
      toast({ title: 'Advanced matching filters and API configuration saved' });
    } catch (error) {
      handleError({ error, title: 'Failed to save advanced matching filters' });
    }
  };

  /**
   * Handle plan selection from a trial customer.
   */
  const onSelectPlan = async ({ tier, billingCycle }: { tier: SubscriptionTier; billingCycle: string }) => {
    try {
      if (!profile.is_trial) {
        await openExternalUrl(stripeConfig.customerPortalLink);
      } else {
        const stripePlan = stripeConfig.plans.find((p) => p.tier === tier);

        if (!stripePlan) {
          console.error(`Stripe plan not found for ${tier}`);
          return;
        }
        const checkoutLink = stripePlan[`${billingCycle}CheckoutLink` as keyof StripeBillingPlan];

        if (!checkoutLink) {
          console.error(`Checkout link not found for ${billingCycle}`);
          return;
        }

        await openExternalUrl(checkoutLink);
      }
    } catch (error) {
      handleError({ error, title: 'Failed to upgrade to PRO plan' });
    }
  };

  const onCloseSubscriptionDialog = async () => {
    try {
      await refreshProfile();
      setSubscriptionDialogOpen(false);
    } catch (error) {
      handleError({ error, title: 'Failed to close subscription dialog' });
    }
  };

  if (isLoading) {
    return (
      <DefaultLayout className="flex flex-col p-6 md:p-10">
        <FiltersSkeleton />
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout className="flex flex-col space-y-16 p-6 md:p-10">
      <h1 className="w-fit text-2xl font-medium tracking-wide">Advanced Matching</h1>

      <section>
        <p className="mb-4 text-lg">
          Set your preferences and let <span className="font-medium">AI</span> find the{' '}
          <span className="font-medium">right jobs</span> for you. Just tell us what you’re looking for:
        </p>

        <div className="relative">
          <TextareaAutosize
            value={userAiInput}
            placeholder='E.g. "Avoid Java or senior roles", "Seeking $60K+ salary, remote opportunities", "Suitable for under 2 years of experience"'
            autoFocus={true}
            onChange={(evt) => setUserAiInput(evt.target.value)}
            minRows={3}
            maxLength={5000}
            className="w-full resize-none rounded-md border border-border bg-card px-6 py-4 text-base ring-ring placeholder:text-muted-foreground focus:outline-none focus:ring-2"
          />
          <span className="absolute bottom-4 right-4 text-sm text-muted-foreground">{userAiInput.length}/5000</span>
        </div>

        <Alert className="flex items-center gap-2 border-0 p-0">
          <AlertTitle className="mb-0">
            <InfoCircledIcon className="h-4 w-4 text-muted-foreground" />
          </AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            Pro Tips: Exclude skills you don’t want, specify salary expectations, define experience levels, select job
            specifics like remote work or PTO preferences and more.
          </AlertDescription>
        </Alert>
      </section>

      {/* API MODEL SELECTION */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-lg">
            Choose your <span className="font-medium">AI Provider</span> for job filtering:
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowApiKeyInputs(!showApiKeyInputs)}
          >
            {showApiKeyInputs ? 'Hide' : 'Configure'} API Keys
          </Button>
        </div>

        <div className="space-y-4">
          {/* Provider Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedProvider === 'gemini'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedProvider('gemini')}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Google Gemini</h3>
                <Badge variant="secondary" className="text-xs">Recommended</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Fast, cost-effective, and reliable
              </p>
              <div className="text-xs text-muted-foreground">
                <div>Model: Gemini 2.5 Flash-Lite</div>
                <div>Cost: ~$0.075/1M tokens</div>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedProvider === 'openai'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedProvider('openai')}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">OpenAI GPT</h3>
                <Badge variant="outline" className="text-xs">Premium</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                High accuracy, more expensive
              </p>
              <div className="text-xs text-muted-foreground">
                <div>Model: GPT-4o</div>
                <div>Cost: ~$2.5/1M tokens</div>
              </div>
            </div>

            <div
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all opacity-50 ${
                selectedProvider === 'llama'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-200'
              }`}
              onClick={() => setSelectedProvider('llama')}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Llama API</h3>
                <Badge variant="outline" className="text-xs">Coming Soon</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Open source, flexible pricing
              </p>
              <div className="text-xs text-muted-foreground">
                <div>Model: Llama 3.2</div>
                <div>Cost: Variable</div>
              </div>
            </div>
          </div>

          {/* API Key Configuration */}
          {showApiKeyInputs && (
            <div className="mt-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
              <h4 className="font-medium mb-4">API Key Configuration</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Google Gemini API Key
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter your Gemini API key"
                    value={apiKeys.gemini}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, gemini: e.target.value }))}
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    OpenAI API Key
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter your OpenAI API key (sk-...)"
                    value={apiKeys.openai}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, openai: e.target.value }))}
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Llama API Key
                    <Badge variant="outline" className="ml-2 text-xs">Coming Soon</Badge>
                  </label>
                  <Input
                    type="password"
                    placeholder="Llama API integration coming soon"
                    value={apiKeys.llama}
                    onChange={(e) => setApiKeys(prev => ({ ...prev, llama: e.target.value }))}
                    className="font-mono text-sm"
                    disabled
                  />
                </div>
              </div>
              
              <Alert className="mt-4">
                <InfoCircledIcon className="h-4 w-4" />
                <AlertTitle>Security Note</AlertTitle>
                <AlertDescription>
                  Your API keys are stored securely on your device and never shared with our servers.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </section>

      {/* HERE STARTS THE BLACKLISTING */}

      <section>
        <p className="mb-4 text-lg">
          <span className="font-medium">Blacklist companies</span> you don’t want to work for. We’ll make sure you{' '}
          <span className="font-medium">don’t see jobs</span> from them anymore:
        </p>

        <div className="flex w-full gap-2">
          <div className="relative flex-1">
            <Input
              value={addBlacklistedCompany}
              placeholder="E.g. Luxoft"
              onChange={(evt) => setAddBlacklistedCompany(evt.target.value)}
              maxLength={100}
              className="bg-card px-6 pr-20 text-base ring-ring placeholder:text-base focus-visible:ring-2"
            />
            <span className="absolute bottom-2 right-4 text-sm text-muted-foreground">
              {addBlacklistedCompany.length}/100
            </span>
          </div>

          <Button
            variant="secondary"
            className="w-36 border border-border"
            onClick={() => {
              if (addBlacklistedCompany) {
                setBlacklistedCompanies([...blacklistedCompanies, addBlacklistedCompany]);
                setAddBlacklistedCompany('');
              }
            }}
          >
            Add company
          </Button>
        </div>

        <Alert className="mt-1.5 flex items-center gap-2 border-0 p-0">
          <AlertTitle className="mb-0">
            <MinusCircledIcon className="h-4 w-4 text-destructive/90" />
          </AlertTitle>
          <AlertDescription className="text-sm text-destructive/90">
            Attention: Ensure you input the company name accurately without any typos.
          </AlertDescription>
        </Alert>

        <div className="mt-4">
          {blacklistedCompanies.length === 0 ? (
            <p>You haven't blacklisted any companies yet</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(showAllBlacklistedCompanies ? blacklistedCompanies : blacklistedCompanies.slice(0, 10)).map(
                (company) => (
                  <Badge
                    key={company}
                    className="flex items-center gap-2 border border-border bg-card py-1 pl-4 pr-2 text-base hover:bg-card"
                  >
                    {company}
                    <TooltipProvider delayDuration={500}>
                      <Tooltip>
                        <TooltipTrigger>
                          <Cross2Icon
                            className="h-4 w-4 text-foreground"
                            onClick={() => setBlacklistedCompanies(blacklistedCompanies.filter((c) => c !== company))}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="mt-2 text-sm">
                          Remove
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Badge>
                ),
              )}
              {blacklistedCompanies.length > 10 && !showAllBlacklistedCompanies && (
                <Button variant="secondary" className="py-2" onClick={() => setShowAllBlacklistedCompanies(true)}>
                  See All
                </Button>
              )}
              {showAllBlacklistedCompanies && (
                <Button variant="secondary" className="py-2" onClick={() => setShowAllBlacklistedCompanies(false)}>
                  Show Less
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      <Button className="ml-auto w-36" onClick={onSave}>
        Save filters
      </Button>

      <SubscriptionDialog
        isOpen={isSubscriptionDialogOpen}
        onCancel={() => onCloseSubscriptionDialog()}
        onSelectPlan={onSelectPlan}
      />
    </DefaultLayout>
  );
}

function SubscriptionDialog({
  isOpen,
  onCancel,
  onSelectPlan,
}: {
  isOpen: boolean;
  onCancel: () => void;
  onSelectPlan: (_: { tier: SubscriptionTier; billingCycle: string }) => Promise<void>;
}) {
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onCancel();
        }
      }}
    >
      <AlertDialogContent className="max-h-screen max-w-[80%] overflow-y-scroll">
        <AlertDialogHeader>
          <AlertDialogTitle className="mb-5 text-center text-2xl">
            Advanced matching is only available with a <b>PRO</b> plan
            <Cross2Icon className="absolute right-4 top-4 h-6 w-6 cursor-pointer" onClick={onCancel} />
          </AlertDialogTitle>
          <AlertDialogDescription className="">
            <PricingOptions onSelectPlan={onSelectPlan} disableBasic={true}></PricingOptions>
          </AlertDialogDescription>
          <AlertDialogDescription className="flex items-center"></AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
