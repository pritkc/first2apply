import { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { DateGroup } from '@/lib/dateGrouping';
import { Job } from '@/lib/types';
import { DateGroupHeader } from './DateGroupHeader';
import { ArchiveIcon, TrashIcon, StarFilledIcon } from '@radix-ui/react-icons';
import { getJobPostingDate, getRelativeTimeString } from '@/lib/dateUtils';

interface DateGroupedJobsListProps {
  dateGroups: DateGroup[];
  selectedJobId?: number;
  parentContainerId: string;
  onSelect: (job: Job) => void;
  onArchive: (job: Job) => void;
  onDelete: (job: Job) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  favoriteCompanies?: string[];
}

export const DateGroupedJobsList = memo(function DateGroupedJobsList({
  dateGroups,
  selectedJobId,
  parentContainerId,
  onSelect,
  onArchive,
  onDelete,
  onLoadMore,
  hasMore = false,
  favoriteCompanies = []
}: DateGroupedJobsListProps) {
  // Track which date groups are expanded - use ref to avoid unnecessary re-renders
  const expandedDatesRef = useRef<Set<string>>(new Set());
  const [expandedDatesState, setExpandedDatesState] = useState<Set<string>>(new Set());
  
  // Track selected job IDs for bulk actions
  const [selectedJobIds, setSelectedJobIds] = useState<Set<number>>(new Set());

  // Initialize expanded dates - expand all groups by default; add diagnostics
  useEffect(() => {
    if (dateGroups.length > 0) {
      const newExpandedDates = new Set<string>(dateGroups.map(g => g.date));
      console.debug('[DateGroupedJobsList] init date groups', {
        count: dateGroups.length,
        dates: dateGroups.map(g => g.date),
      });
      expandedDatesRef.current = newExpandedDates;
      setExpandedDatesState(newExpandedDates);
    }
  }, [dateGroups.length]); // Only depend on length, not the entire array

  // Toggle expansion of a date group
  const toggleDateGroup = useCallback((date: string) => {
    const newExpandedDates = new Set(expandedDatesRef.current);
    if (newExpandedDates.has(date)) {
      newExpandedDates.delete(date);
    } else {
      newExpandedDates.add(date);
    }
    expandedDatesRef.current = newExpandedDates;
    setExpandedDatesState(newExpandedDates);
  }, []);

  // Select all jobs from a specific date
  const selectAllFromDate = useCallback((dateGroup: DateGroup) => {
    setSelectedJobIds(prev => {
      const newSet = new Set(prev);
      const jobIds = dateGroup.jobs.map(job => job.id);
      
      // If all jobs from this date are already selected, deselect them
      const allSelected = jobIds.every(id => newSet.has(id));
      if (allSelected) {
        jobIds.forEach(id => newSet.delete(id));
      } else {
        // Otherwise, select all jobs from this date
        jobIds.forEach(id => newSet.add(id));
      }
      
      return newSet;
    });
  }, []);

  // Toggle individual job selection
  const toggleJobSelection = useCallback((jobId: number) => {
    setSelectedJobIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  }, []);

  // Handle bulk actions for selected jobs
  const handleBulkAction = useCallback((action: 'archive' | 'apply' | 'delete') => {
    const selectedJobs = Array.from(selectedJobIds);
    
    // Perform the action on all selected jobs
    selectedJobs.forEach(jobId => {
      const job = dateGroups
        .flatMap(group => group.jobs)
        .find(j => j.id === jobId);
      
      if (job) {
        switch (action) {
          case 'archive':
            onArchive(job);
            break;
          case 'apply':
            // Update job status to applied (this would need to be implemented)
            // For now, we'll just archive it
            onArchive(job);
            break;
          case 'delete':
            onDelete(job);
            break;
        }
      }
    });
    
    // Clear selection after bulk action
    setSelectedJobIds(new Set());
  }, [selectedJobIds, dateGroups, onArchive, onDelete]);

  if (dateGroups.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
        <p>No jobs found for the selected criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {dateGroups.map((dateGroup) => {
        const isExpanded = expandedDatesState.has(dateGroup.date);
        const selectedJobsInGroup = dateGroup.jobs.filter(job => 
          selectedJobIds.has(job.id)
        );
        
        return (
          <div key={dateGroup.date} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {/* Date Group Header */}
            <DateGroupHeader
              dateGroup={dateGroup}
              isExpanded={isExpanded}
              onToggle={() => toggleDateGroup(dateGroup.date)}
              onSelectAll={() => selectAllFromDate(dateGroup)}
              onBulkAction={handleBulkAction}
              selectedJobIds={new Set(selectedJobsInGroup.map(job => job.id))}
            />
            
            {/* Jobs List - Only render when expanded */}
            {isExpanded && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dateGroup.jobs.map((job) => {
                    const isSelected = selectedJobIds.has(job.id);
                    const isJobSelected = selectedJobId === job.id;
                    const isFavoriteCompany = favoriteCompanies.some(fav => 
                      job.companyName?.toLowerCase().trim() === fav.toLowerCase().trim()
                    );
                    
                    return (
                      <div
                        key={job.id}
                        className={`flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                          isJobSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        } ${isFavoriteCompany ? 'border-l-4 border-yellow-400 bg-yellow-50/30 dark:bg-yellow-900/10' : ''}`}
                      >
                        {/* Selection Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleJobSelection(job.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                        />
                        
                        {/* Job Content - Fixed width to prevent overflow */}
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => onSelect(job)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 pr-2">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                {job.title}
                              </h3>
                              <div className="flex items-center gap-1">
                                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                  {job.companyName}
                                </p>
                                {isFavoriteCompany && (
                                  <StarFilledIcon className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                )}
                              </div>
                              {/* Date Information */}
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                  Posted: {getJobPostingDate(job) || 'Unknown'}
                                </span>
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                  Found: {getRelativeTimeString(job.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons - Fixed width to prevent hiding */}
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <button
                            onClick={() => onArchive(job)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            title="Archive job"
                          >
                            <ArchiveIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDelete(job)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete job"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
