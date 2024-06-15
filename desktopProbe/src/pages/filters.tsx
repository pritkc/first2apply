import { useToast } from '@/components/ui/use-toast';
import { useError } from '@/hooks/error';
import { getAdvancedMatchingConfig, updateAdvancedMatchingConfig } from '@/lib/electronMainSdk';
import { useEffect, useState } from 'react';

import { DefaultLayout } from './defaultLayout';

export function FiltersPage() {
  const { handleError } = useError();
  const { toast } = useToast();

  const [userAiInput, setUserAiInput] = useState<string>('');
  const [blacklistedCompanies, setBlacklistedCompanies] = useState<string[]>([]);

  /**
   * Load the advanced matching filters from the user's profile.
   */
  useEffect(() => {
    const asyncLoad = async () => {
      try {
        const config = await getAdvancedMatchingConfig();
        if (config) {
          setUserAiInput(config.chatgpt_prompt);
          setBlacklistedCompanies(config.blacklisted_companies);
        }
      } catch (error) {
        handleError({ error, title: 'Failed to load advanced matching filters' });
      }
    };
    asyncLoad();
  }, []);

  /**
   * Save the config to the database.
   */
  const onSave = async () => {
    try {
      const updatedConfig = await updateAdvancedMatchingConfig({
        chatgpt_prompt: userAiInput,
        blacklisted_companies: blacklistedCompanies,
      });
      setUserAiInput(updatedConfig.chatgpt_prompt);
      setBlacklistedCompanies(updatedConfig.blacklisted_companies);
      toast({ title: 'Advanced matching filters saved' });
    } catch (error) {
      handleError({ error, title: 'Failed to save advanced matching filters' });
    }
  };

  return (
    <DefaultLayout className="flex flex-col space-y-6 p-6 md:p-10">
      <h1 className="w-fit text-2xl font-medium tracking-wide">Advanced Matching</h1>

      <p>
        Use AI to filter jobs based on your preferences. We run each new job through our AI system to match it with your
        input.
      </p>
      <p>
        You have the full flexibility ro refine your search with filters like:
        <ul>
          <li>
            <strong>Skills:</strong> You can tell it to ignore jobs that require a certain skill or tech stack.
          </li>
          <li>
            <strong>Keywords:</strong> You can tell it to ignore jobs that contain certain keywords like "senior" or
            "lead."
          </li>
          <li>
            <strong>Location:</strong> You can tell it to ignore jobs that are advertised as remote, but actually
            require you to be in a specific location.
          </li>
          <li>
            <strong>Salary:</strong> You can tell it to ignore jobs which pay less than a certain amount.
          </li>
          <li>
            <strong>Others:</strong> PTO, benefits, visa sponsorship, etc. You can tell it to ignore jobs that don't
            meet your requirements.
          </li>
        </ul>
      </p>

      <textarea
        name=""
        id=""
        cols={30}
        rows={10}
        value={userAiInput}
        onChange={(evt) => setUserAiInput(evt.target.value)}
      ></textarea>

      <button className="btn-primary" onClick={onSave}>
        Save
      </button>
    </DefaultLayout>
  );
}
