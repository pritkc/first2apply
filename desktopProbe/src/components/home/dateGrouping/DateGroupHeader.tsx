import { memo } from 'react';
import { ChevronDownIcon, ChevronRightIcon, ArchiveIcon, CheckIcon, TrashIcon } from '@radix-ui/react-icons';
import { formatDisplayDate, DateGroup } from '@/lib/dateGrouping';
import { JobStatus } from '../../../../supabase/functions/_shared/types';

interface DateGroupHeaderProps {
  dateGroup: DateGroup;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectAll: () => void;
  onBulkAction: (action: 'archive' | 'apply' | 'delete') => void;
  selectedJobIds: Set<number>;
}

export const DateGroupHeader = memo(function DateGroupHeader({
  dateGroup,
  isExpanded,
  onToggle,
  onSelectAll,
  onBulkAction,
  selectedJobIds
}: DateGroupHeaderProps) {
  const { date, count, status } = dateGroup;
  const displayDate = formatDisplayDate(date);
  const isAllSelected = selectedJobIds.size === count;
  const hasSelectedJobs = selectedJobIds.size > 0;
  
  // Determine which bulk actions to show based on current status
  const showArchiveAction = status === 'new' || status === 'applied';
  const showApplyAction = status === 'new';
  const showDeleteAction = status !== 'deleted';

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
        {/* Date and Count Section */}
        <div className="flex items-center space-x-3 flex-1">
          <button
            onClick={onToggle}
            className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>
          
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{displayDate}</span>
            <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {count} {count === 1 ? 'job' : 'jobs'}
            </span>
          </div>
        </div>

        {/* Selection and Actions Section */}
        <div className="flex items-center space-x-2">
          {/* Select All Button */}
          <button
            onClick={onSelectAll}
            className={`h-7 px-2 text-xs rounded transition-colors ${
              isAllSelected 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </button>

          {/* Bulk Action Buttons - Only show when jobs are selected */}
          {hasSelectedJobs && (
            <div className="flex items-center space-x-1">
              {showApplyAction && (
                <button
                  onClick={() => onBulkAction('apply')}
                  className="h-7 px-2 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <CheckIcon className="h-3 w-3 mr-1 inline" />
                  Apply
                </button>
              )}
              
              {showArchiveAction && (
                <button
                  onClick={() => onBulkAction('archive')}
                  className="h-7 px-2 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ArchiveIcon className="h-3 w-3 mr-1 inline" />
                  Archive
                </button>
              )}
              
              {showDeleteAction && (
                <button
                  onClick={() => onBulkAction('delete')}
                  className="h-7 px-2 text-xs border border-red-300 dark:border-red-600 text-red-700 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <TrashIcon className="h-3 w-3 mr-1 inline" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
