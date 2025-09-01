'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { ArchiveIcon, CheckIcon, TrashIcon } from '@radix-ui/react-icons';
import { memo } from 'react';
import { formatDisplayDate, DateGroup } from '@/lib/dateGrouping';
import { JobStatus } from '@/lib/supabase/types';

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
    <div className="sticky top-0 z-10 bg-background border-b border-border">
      <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
        {/* Date and Count Section */}
        <div className="flex items-center space-x-3 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-6 w-6 p-0 hover:bg-muted"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </Button>
          
          <div className="flex items-center space-x-2">
            <span className="font-medium text-sm">{displayDate}</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
              {count} {count === 1 ? 'job' : 'jobs'}
            </span>
          </div>
        </div>

        {/* Selection and Actions Section */}
        <div className="flex items-center space-x-2">
          {/* Select All Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            className={cn(
              "h-7 px-2 text-xs",
              isAllSelected ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-muted"
            )}
          >
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </Button>

          {/* Bulk Action Buttons - Only show when jobs are selected */}
          {hasSelectedJobs && (
            <div className="flex items-center space-x-1">
              {showApplyAction && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkAction('apply')}
                  className="h-7 px-2 text-xs"
                >
                  <CheckIcon className="h-3 w-3 mr-1" />
                  Apply
                </Button>
              )}
              
              {showArchiveAction && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkAction('archive')}
                  className="h-7 px-2 text-xs"
                >
                  <ArchiveIcon className="h-3 w-3 mr-1" />
                  Archive
                </Button>
              )}
              
              {showDeleteAction && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkAction('delete')}
                  className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                >
                  <TrashIcon className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
