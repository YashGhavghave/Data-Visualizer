"use client";

import { useState, useCallback, type DragEvent } from 'react';
import { UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFileUpload: (content: string, file: { name: string; type: string }) => void;
  disabled?: boolean;
}

const ACCEPTED_MIME_TYPES = ['text/csv', 'application/json'];
const ACCEPTED_EXTENSIONS = ['.csv', '.json'];

export default function FileUploader({ onFileUpload, disabled }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFile = useCallback((file: File | null) => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'File Error',
        description: 'No file selected.',
      });
      return;
    }

    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    const isValid = ACCEPTED_MIME_TYPES.includes(fileType) || ACCEPTED_EXTENSIONS.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      toast({
        variant: 'destructive',
        title: 'Invalid File Type',
        description: 'Please upload a CSV or JSON file.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileUpload(content, { name: file.name, type: file.type || (fileName.endsWith('.csv') ? 'text/csv' : 'application/json') });
    };
    reader.onerror = () => {
        toast({
            variant: 'destructive',
            title: 'File Read Error',
            description: 'Could not read the selected file.',
        });
    }
    reader.readAsText(file);
  }, [onFileUpload, toast]);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if(disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div className="w-full">
      <label
        htmlFor="file-upload"
        className={cn(
          'relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
          'border-border hover:border-primary/50',
          'bg-background hover:bg-accent/50',
          disabled && 'cursor-not-allowed opacity-50',
          isDragging && 'border-primary bg-primary/10'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
            <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold text-primary">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-muted-foreground/80">CSV or JSON files</p>
        </div>
        <input id="file-upload" type="file" className="sr-only" accept=".csv,application/json" onChange={(e) => handleFile(e.target.files ? e.target.files[0] : null)} disabled={disabled} />
      </label>
    </div>
  );
}
