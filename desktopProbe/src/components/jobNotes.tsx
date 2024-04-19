import { useEffect, useState } from "react";
import { useError } from "@/hooks/error";
import { useToast } from "@/components/ui/use-toast";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import TextareaAutosize from "react-textarea-autosize";

import {
  addFileToNote,
  createNote,
  deleteNote,
  listNotes,
  updateNote,
} from "@/lib/electronMainSdk";

import { Note } from "../../../supabase/functions/_shared/types";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

import { Pencil2Icon, TrashIcon, UploadIcon } from "@radix-ui/react-icons";

export function JobNotes({ jobId }: { jobId: number }) {
  const { handleError } = useError();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [newNote, setNewNote] = useState<Note | undefined>();

  // Fetch notes for the job
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const notes = await listNotes(jobId);
        setNotes(notes);
        setIsLoading(false);
      } catch (error) {
        handleError({ error });
      }
    };

    fetchNotes();
  }, [jobId]);

  // Create a new note
  const handleCreateNote = async (
    job_id: number,
    text: string,
    files: string[]
  ) => {
    try {
      const newNote = await createNote({ job_id, text, files });
      setNotes((prevNotes) => [newNote, ...prevNotes]);
      toast({
        title: "Success",
        description: "A new note has been successfully added.",
        variant: "success",
      });
    } catch (error) {
      handleError({ error });
    }
  };

  // Update an existing note
  const handleUpdateNote = async (noteId: number, text: string) => {
    if (text.trim() === "") {
      toast({
        title: "Error",
        description: "Note text cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    try {
      const updatedNote = await updateNote({
        noteId,
        text,
      });
      setNotes(
        notes.map((note) =>
          note.id === noteId ? { ...note, ...updatedNote } : note
        )
      );
      toast({
        title: "Success",
        description: "Note has been successfully updated.",
        variant: "success",
      });
    } catch (error) {
      handleError({ error });
    }
  };

  // Delete an existing note
  const handleDeleteNote = async (noteId: number) => {
    try {
      await deleteNote(noteId);
      setNotes(notes.filter((note) => note.id !== noteId));
      toast({
        title: "Success",
        description: "Note has been successfully deleted.",
        variant: "success",
      });
    } catch (error) {
      handleError({ error });
    }
  };

  // Add a file to a note
  const handleAddFileToNote = async (noteId: number, file: string) => {
    try {
      const updatedNote = await addFileToNote({
        noteId,
        file,
      });
      setNotes(
        notes.map((note) =>
          note.id === noteId ? { ...note, ...updatedNote } : note
        )
      );
      toast({
        title: "Success",
        description: "File has been successfully added to the note.",
        variant: "success",
      });
    } catch (error) {
      handleError({ error });
    }
  };

  // Add new note button
  const handleNewNote = async () => {
    try {
      setNewNote({
        id: 0,
        created_at: new Date(),
        user_id: "",
        job_id: jobId,
        text: "",
        files: [],
      });
    } catch (error) {
      console;
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="py-5 ml-[25px]">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl">Your notes</h3>

        <Button
          size="sm"
          onClick={handleNewNote}
          disabled={newNote !== undefined}
        >
          Add note
        </Button>
      </div>

      <div className="mt-4 lg:mt-5 space-y-3">
        {newNote && (
          <EditJobNote
            note={newNote}
            onCreate={handleCreateNote}
            onUpdate={handleUpdateNote}
            onAddFile={handleAddFileToNote}
            onEndEditing={() => setNewNote(undefined)}
          />
        )}

        {notes.length === 0 ? (
          <p className="py-10 text-center">No notes available</p>
        ) : (
          notes.map((note) =>
            editingNoteId === note.id ? (
              <EditJobNote
                key={note.id}
                note={note}
                onCreate={handleCreateNote}
                onUpdate={handleUpdateNote}
                onAddFile={handleAddFileToNote}
                onEndEditing={() => setEditingNoteId(null)}
              />
            ) : (
              <JobNote
                key={note.id}
                note={note}
                onDelete={handleDeleteNote}
                onAddFile={handleAddFileToNote}
                onStartEditing={() => setEditingNoteId(note.id)}
              />
            )
          )
        )}
      </div>
    </div>
  );
}

function JobNote({
  note,
  onDelete,
  onAddFile,
  onStartEditing,
}: {
  note: Note;
  onDelete: (noteId: number) => Promise<void>;
  onAddFile: (noteId: number, file: string) => Promise<void>;
  onStartEditing: (noteId: number) => void;
}) {
  return (
    <Card>
      <CardHeader className="w-full flex flex-row justify-between items-center">
        <CardDescription className="text-xs">
          {new Date(note.created_at).toLocaleDateString()}
        </CardDescription>
        <div className="flex gap-2">
          <TooltipProvider delayDuration={500}>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 p-0"
                  onClick={() => onStartEditing(note.id)}
                >
                  <Pencil2Icon className="w-auto h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-sm">
                Edit
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={500}>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 p-0"
                  onClick={() => onDelete(note.id)}
                >
                  <TrashIcon className="w-4 h-auto" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-sm">
                Delete
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* <TooltipProvider delayDuration={500}>
            <Tooltip>
              <TooltipTrigger className="relative cursor-pointer">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 p-0 cursor-pointer"
                >
                  <UploadIcon className="w-auto h-4 cursor-pointer" />
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  className="absolute top-0 right-0 w-7 h-7 opacity-0 cursor-pointer"
                />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-sm">
                Attach file
              </TooltipContent>
            </Tooltip>
          </TooltipProvider> */}
        </div>
      </CardHeader>
      <CardContent>
        <Markdown
          remarkPlugins={[remarkGfm]}
          className="job-description-md px-6 py-2"
        >
          {note.text}
        </Markdown>
      </CardContent>
      <CardFooter>
        {/* {note.files.length > 0 && (
          <div className="mt-4 flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Uploads:</span>
            {note.files.map((file) => (
              <Badge key={note.id} className="cursor-pointer">
                {file}
              </Badge>
            ))}
          </div>
        )} */}
      </CardFooter>
    </Card>
  );
}

function EditJobNote({
  note,
  onCreate,
  onUpdate,
  onAddFile,
  onEndEditing,
}: {
  note: Note;
  onCreate: (job_id: number, text: string, files: string[]) => Promise<void>;
  onUpdate: (noteId: number, text: string) => Promise<void>;
  onAddFile: (noteId: number, file: string) => Promise<void>;
  onEndEditing: () => void;
}) {
  const { toast } = useToast();

  const [text, setText] = useState(note.text);

  // Handle text change in textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  // Handle the save/create action for new note
  const handleCreate = async () => {
    if (text.trim() === "") {
      toast({
        title: "Error",
        description: "Note text cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    try {
      await onCreate(note.job_id, text, []);
      onEndEditing();
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  // Handle the save/update action for existing note
  const handleUpdate = async () => {
    try {
      await onUpdate(note.id, text);
      onEndEditing();
    } catch (error) {
      console.error("Failed to update note:", error);
    }
  };

  // Handle the cancel action
  const handleCancel = () => {
    setText(note.text);
    onEndEditing();
  };

  return (
    <Card>
      <CardHeader className="w-full flex flex-row justify-between items-center">
        <CardDescription className="text-xs">
          {new Date(note.created_at).toLocaleDateString()}
        </CardDescription>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={
              note.id === 0 ? () => handleCreate() : () => handleUpdate()
            }
          >
            Save
          </Button>

          {note.id === 0 ? (
            <Button variant="outline" size="sm" onClick={onEndEditing}>
              Discard
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleCancel();
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <TextareaAutosize
          value={text}
          autoFocus={note.id === 0}
          onChange={handleTextChange}
          className={`mb-2.5 w-full px-6 py-2 resize-none rounded-md text-base focus:outline-none focus:ring-2 ring-ring ${
            note.id === 0 && "ring-2"
          }`}
        />
      </CardContent>
      <CardFooter>
        {/* {note.files.length > 0 && (
          <div className="mt-4 flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Uploads:</span>
            {note.files.map((file) => (
              <Badge key={note.id} className="cursor-pointer">
                {file}
              </Badge>
            ))}
          </div>
        )} */}
      </CardFooter>
    </Card>
  );
}
