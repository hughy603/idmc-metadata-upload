'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { cn } from '@/lib/utils';

export const fileUploaderSchema = z.object({
  file: z.instanceof(File).optional(),
});

export type FileUploaderValues = z.infer<typeof fileUploaderSchema>;

interface FileUploaderProps {
  isValidating: boolean;
  isUploading: boolean;
  fileName: string | null;
  validationError: string | null;
  isFileValid: boolean;
  onFileChange: (file: File) => Promise<void>;
  onSubmit: (values: FileUploaderValues) => Promise<void>;
}

export default function FileUploader({
  isValidating,
  isUploading,
  fileName,
  validationError,
  isFileValid,
  onFileChange,
  onSubmit,
}: FileUploaderProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FileUploaderValues>({
    resolver: zodResolver(fileUploaderSchema),
  });

  const { ref: fileRegisterRef, ...fileRegisterRest } = register('file');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onFileChange(file);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-900/25 p-6 dark:border-gray-700">
        <div className="text-center">
          <div className="mt-4 flex text-sm leading-6 text-gray-600 dark:text-gray-400">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500 dark:bg-gray-800"
            >
              <span>Upload a file</span>
              <input
                id="file-upload"
                type="file"
                className="sr-only"
                disabled={isValidating || isUploading}
                {...fileRegisterRest}
                ref={element => {
                  fileRegisterRef(element);
                  if (element) {
                    fileInputRef.current = element;
                  }
                }}
                onChange={handleFileChange}
                accept=".xlsx,.csv"
              />
            </label>
            <p className="pl-1 dark:text-gray-400">or drag and drop</p>
          </div>
          <p className="text-xs leading-5 text-gray-600 dark:text-gray-400">
            XLSX or CSV up to 10MB
          </p>
        </div>
      </div>

      {fileName && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Selected file: {fileName}
          </p>
        </div>
      )}

      {validationError && (
        <div className="mt-4">
          <p className="text-sm text-red-500">{validationError}</p>
        </div>
      )}

      {errors.file && (
        <div className="mt-4">
          <p className="text-sm text-red-500">
            {errors.file.message?.toString()}
          </p>
        </div>
      )}

      <div className="mt-4">
        <button
          type="submit"
          disabled={!isFileValid || isValidating || isUploading}
          className={cn(
            'inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
            (!isFileValid || isValidating || isUploading) &&
              'cursor-not-allowed opacity-50'
          )}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </form>
  );
}
