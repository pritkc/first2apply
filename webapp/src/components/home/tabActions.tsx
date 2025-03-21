import { JobStatus } from '@/lib/supabase/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@radix-ui/react-alert-dialog';
import { DotsVerticalIcon, UpdateIcon } from '@radix-ui/react-icons';
import { ArchiveIcon, DownloadIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';

import { AlertDialogFooter, AlertDialogHeader } from '../ui/alert-dialog';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export function TabActions({
  tab,
  onTabChange,
  onCsvExport,
  onArchiveAll,
  onDeleteAll,
}: {
  tab: JobStatus;
  onTabChange: (tab: JobStatus) => void;
  onCsvExport: (tab: JobStatus) => Promise<void>;
  onArchiveAll: (tab: JobStatus) => Promise<void>;
  onDeleteAll: (tab: JobStatus) => Promise<void>;
}) {
  const [isArchiveAllDialogOpen, setIsArchiveAllDialogOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);

  return (
    <>
      {/* Buttons */}
      <div className="hidden items-center gap-1 lg:flex">
        <Button onClick={() => onTabChange(tab)} variant="secondary" className="text-sm">
          <UpdateIcon className="mr-2 inline-block h-4 w-4" />
          Refresh
        </Button>

        <Button onClick={() => onCsvExport(tab)} variant="secondary" className="text-sm">
          <DownloadIcon className="mr-2 inline-block h-4 w-4" />
          Export CSV
        </Button>

        <Button onClick={() => setIsArchiveAllDialogOpen(true)} variant="secondary" className="text-sm">
          <ArchiveIcon className="mr-2 inline-block h-4 w-4" />
          Archive all
        </Button>

        <Button
          onClick={() => setIsDeleteAllDialogOpen(true)}
          variant="destructive"
          className="bg-destructive/10 text-sm text-foreground hover:bg-destructive/20"
        >
          <TrashIcon className="mr-2 inline-block h-5 w-5 text-destructive" />
          Delete all
        </Button>
      </div>

      {/* Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="h-6 w-6 focus-visible:outline-none focus-visible:ring-0 lg:hidden"
          onClick={(evt) => {
            evt.preventDefault();
            evt.stopPropagation();
          }}
        >
          <DotsVerticalIcon className="m-auto h-5 w-auto text-muted-foreground transition-all duration-200 ease-in-out hover:h-6" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" className="space-y-1">
          <DropdownMenuItem className="cursor-pointer focus:bg-secondary/40" onClick={() => onTabChange(tab)}>
            <UpdateIcon className="mb-0.5 mr-2 inline-block h-4 w-4" />
            Refresh
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer focus:bg-secondary/40" onClick={() => onCsvExport(tab)}>
            <DownloadIcon className="mb-0.5 mr-2 inline-block h-4 w-4" />
            CSV export
          </DropdownMenuItem>
          {tab !== 'archived' && (
            <DropdownMenuItem
              className="cursor-pointer focus:bg-secondary/40"
              onClick={() => setIsArchiveAllDialogOpen(true)}
            >
              <ArchiveIcon className="mb-0.5 mr-2 inline-block h-4 w-4" />
              Archive all
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="cursor-pointer bg-destructive/5 focus:bg-destructive/20"
            onClick={() => setIsDeleteAllDialogOpen(true)}
          >
            <TrashIcon className="-ml-0.5 mb-0.5 mr-2 inline-block h-5 w-5 text-destructive" />
            Delete all
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Archive all jobs confirm dialog */}
      <AlertDialog open={isArchiveAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to archive all {tab} jobs?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone, and all jobs will be moved to the archived tab.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsArchiveAllDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsArchiveAllDialogOpen(false);
                onArchiveAll(tab);
              }}
            >
              <ArchiveIcon className="mr-2 inline-block h-4 w-4" />
              Archive All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete all jobs confirm dialog */}
      <AlertDialog open={isDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete all {tab} jobs?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. You won't ever see these jobs again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteAllDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                setIsDeleteAllDialogOpen(false);
                onDeleteAll(tab);
              }}
            >
              <TrashIcon className="mr-2 inline-block h-5 w-5" />
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
