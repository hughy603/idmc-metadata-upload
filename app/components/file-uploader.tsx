'use client'

import { useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const fileUploaderSchema = z.object({
  file: z
    .any()
    .refine((files) => files instanceof FileList && files.length > 0, {
      message: 'Please select a file',
    }),
  description: z.string().optional(),
})

export type FileUploaderValues = z.infer<typeof fileUploaderSchema>

interface FileUploaderProps {
  isValidating: boolean
  isUploading: boolean
  fileName: string | null
  validationError: string | null
  isFileValid: boolean
  onFileChange: (file: File) => Promise<void>
  onSubmit: (values: FileUploaderValues) => Promise<void>
}

export default function FileUploader({
  isValidating,
  isUploading,
  fileName,
  validationError,
  isFileValid,
  onFileChange,
  onSubmit,
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FileUploaderValues>({
    resolver: zodResolver(fileUploaderSchema),
    defaultValues: {
      description: '',
    },
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      await onFileChange(files[0])
    }
  }

  const { ref, ...fileRegisterRest } = register('file')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="mb-4">
        <h3 className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Upload Mapping File
        </h3>

        <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pb-6 pt-5">
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
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
                    ref(element)
                    if (element) {
                      fileInputRef.current = element
                    }
                  }}
                  onChange={handleFileChange}
                  accept=".xlsx,.csv"
                />
              </label>
              <p className="pl-1 dark:text-gray-400">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Excel (.xlsx) or CSV (.csv) only
            </p>
            {fileName && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Selected: {fileName}
              </p>
            )}
          </div>
        </div>

        {errors.file && (
          <p className="mt-1 text-sm text-red-600">
            {errors.file.message?.toString()}
          </p>
        )}

        {validationError && (
          <div className="mt-3 rounded-lg bg-red-100 p-3 text-sm text-red-700 dark:bg-red-200 dark:text-red-800">
            {validationError}
          </div>
        )}

        {isFileValid && (
          <div className="mt-3 rounded-lg bg-green-100 p-3 text-sm text-green-700 dark:bg-green-200 dark:text-green-800">
            File validated successfully
          </div>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Description (optional)
        </label>
        <textarea
          id="description"
          {...register('description')}
          disabled={isValidating || isUploading || !isFileValid}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          rows={3}
        />
      </div>

      <button
        type="submit"
        disabled={isValidating || isUploading || !isFileValid}
        className="w-full rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isUploading ? 'Uploading...' : 'Upload to Informatica'}
      </button>
    </form>
  )
}
