import { memo, useMemo } from 'react';
import { Job, JobStatus } from '../../../../supabase/functions/_shared/types';
import { DateGroup, groupJobsByDate, filterDateGroupsBySearch } from '@/lib/dateGrouping';
import { DateGroupedJobsList } from './DateGroupedJobsList';

interface DateGroupManagerProps {
  jobs: Job[];
  status: JobStatus;
  search: string;
  selectedJobId?: number;
  parentContainerId: string;
  onSelect: (job: Job) => void;
  onArchive: (job: Job) => void;
  onDelete: (job: Job) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

export const DateGroupManager = memo(function DateGroupManager({
  jobs,
  status,
  search,
  selectedJobId,
  parentContainerId,
  onSelect,
  onArchive,
  onDelete,
  onLoadMore,
  hasMore = false
}: DateGroupManagerProps) {
  // Group jobs by date and apply search filtering
  const dateGroups = useMemo(() => {
    const grouped = groupJobsByDate(jobs, status);
    return filterDateGroupsBySearch(grouped, search);
  }, [jobs, status, search]);

  // If no jobs, show empty state
  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
        <p>No jobs found for the selected criteria.</p>
      </div>
    );
  }

  // If search is active and no results, show no results message
  if (search.trim() && dateGroups.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
        <p>No jobs match your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {dateGroups.length} date {dateGroups.length === 1 ? 'group' : 'groups'}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {jobs.length} total {jobs.length === 1 ? 'job' : 'jobs'}
          </span>
        </div>
        
        {search.trim() && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Filtered by: "{search}"
          </span>
        )}
      </div>

      {/* Date Grouped Jobs List */}
      <DateGroupedJobsList
        dateGroups={dateGroups}
        selectedJobId={selectedJobId}
        parentContainerId={parentContainerId}
        onSelect={onSelect}
        onArchive={onArchive}
        onDelete={onDelete}
        onLoadMore={onLoadMore}
        hasMore={hasMore}
      />
    </div>
  );
});
