import { useEffect, useState } from 'react';
'use client'


export interface FileDataRow {
  id: string
  data: Record<string, string | number>
  status: 'pending' | 'processing' | 'success' | 'error'
  error?: string
}

interface FileDataTableProps {
  data: FileDataRow[]
  onRowSubmit?: (row: FileDataRow) => Promise<void>
}

export default function FileDataTable({
  data,
  onRowSubmit,
}: FileDataTableProps): JSX.Element {
  const [tableData, setTableData] = useState<FileDataRow[]>([])

  useEffect(() => {
    setTableData(data)
  }, [data])

  if (!tableData.length) {
    return (
      <div className="mt-4 rounded-md bg-white p-4 shadow dark:bg-gray-800">
        <p className="text-center text-gray-500 dark:text-gray-400">
          No data to display
        </p>
      </div>
    )
  }

  // Extract column headers from the first row
  const headers = Object.keys(tableData[0].data)

  const getStatusIcon = (status: FileDataRow['status']) => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1 h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Pending</span>
          </div>
        )
      case 'processing':
        return (
          <div className="flex items-center text-blue-500 dark:text-blue-400">
            <div className="mr-1 animate-spin">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="2" x2="12" y2="6"></line>
                <line x1="12" y1="18" x2="12" y2="22"></line>
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                <line x1="2" y1="12" x2="6" y2="12"></line>
                <line x1="18" y1="12" x2="22" y2="12"></line>
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              </svg>
            </div>
            <span>Processing</span>
          </div>
        )
      case 'success':
        return (
          <div className="flex items-center text-green-500 dark:text-green-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1 h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Success</span>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center text-red-500 dark:text-red-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1 h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>Error</span>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="mt-6 overflow-hidden rounded-md bg-white shadow dark:bg-gray-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                Status
              </th>
              {headers.map(header => (
                <th
                  key={header}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {tableData.map(row => (
              <tr
                key={row.id}
                className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  row.status === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : row.status === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : ''
                }`}
              >
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <div
                    className={`group relative flex items-center ${
                      row.status === 'error' ? 'cursor-help' : ''
                    }`}
                  >
                    {getStatusIcon(row.status)}

                    {/* Show error icon with tooltip for errors */}
                    {row.status === 'error' && row.error && (
                      <div className="relative">
                        <span className="ml-2 text-red-500 dark:text-red-400">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                        </span>

                        {/* Tooltip that appears on hover */}
                        <div className="absolute bottom-full left-0 z-10 mb-2 hidden group-hover:block">
                          <div className="max-w-xs rounded bg-gray-900 px-2 py-1 text-xs text-white">
                            <p>{row.error}</p>
                            <div className="absolute left-3 top-full h-3 w-3 rotate-45 transform bg-gray-900"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Add retry button for error rows */}
                    {row.status === 'error' && onRowSubmit && (
                      <button
                        type="button"
                        onClick={() => onRowSubmit(row)}
                        className="ml-3 inline-flex items-center rounded border border-transparent bg-red-100 px-2 py-1 text-xs font-medium leading-4 text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-900/60"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="mr-1 h-3.5 w-3.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="1 4 1 10 7 10"></polyline>
                          <polyline points="23 20 23 14 17 14"></polyline>
                          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                        </svg>
                        Retry
                      </button>
                    )}

                    {/* Add process button for pending rows */}
                    {row.status === 'pending' && onRowSubmit && (
                      <button
                        type="button"
                        onClick={() => onRowSubmit(row)}
                        className="ml-3 inline-flex items-center rounded border border-transparent bg-gray-100 px-2 py-1 text-xs font-medium leading-4 text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                      >
                        Process
                      </button>
                    )}
                  </div>
                </td>
                {headers.map(header => (
                  <td
                    key={`${row.id}-${header}`}
                    className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100"
                  >
                    {String(row.data[header] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
