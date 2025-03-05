'use client'

import { useState, useEffect } from 'react'

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

export default function FileDataTable({ data, onRowSubmit }: FileDataTableProps) {
  const [tableData, setTableData] = useState<FileDataRow[]>([])
  
  useEffect(() => {
    setTableData(data)
  }, [data])
  
  if (!tableData.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-md shadow p-4 mt-4">
        <p className="text-gray-500 dark:text-gray-400 text-center">No data to display</p>
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Pending</span>
          </div>
        )
      case 'processing':
        return (
          <div className="flex items-center text-blue-500 dark:text-blue-400">
            <div className="animate-spin mr-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <span>Success</span>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center text-red-500 dark:text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <div className="bg-white dark:bg-gray-800 rounded-md shadow overflow-hidden mt-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              {headers.map((header) => (
                <th 
                  key={header} 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {tableData.map((row) => (
              <tr key={row.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                row.status === 'error' 
                  ? 'bg-red-50 dark:bg-red-900/20' 
                  : row.status === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20' 
                    : ''
              }`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div 
                    className={`flex items-center relative group ${
                      row.status === 'error' ? 'cursor-help' : ''
                    }`}
                  >
                    {getStatusIcon(row.status)}
                    
                    {/* Show error icon with tooltip for errors */}
                    {row.status === 'error' && row.error && (
                      <div className="relative">
                        <span className="ml-2 text-red-500 dark:text-red-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                          </svg>
                        </span>
                        
                        {/* Tooltip that appears on hover */}
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                          <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 max-w-xs">
                            <p>{row.error}</p>
                            <div className="absolute top-full left-3 w-3 h-3 bg-gray-900 transform rotate-45"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Add retry button for error rows */}
                    {row.status === 'error' && onRowSubmit && (
                      <button
                        type="button"
                        onClick={() => onRowSubmit(row)}
                        className="ml-3 inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                        className="ml-3 inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Process
                      </button>
                    )}
                  </div>
                </td>
                {headers.map((header) => (
                  <td key={`${row.id}-${header}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
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