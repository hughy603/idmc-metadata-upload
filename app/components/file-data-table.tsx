'use client';

import { useEffect, useState } from 'react';

/**
 * Represents a row of data in the file data table
 */
export interface FileDataRow {
  /** Unique identifier for the row */
  id: string;
  /** Row data as key-value pairs */
  data: Record<string, string | number>;
  /** Current processing status of the row */
  status: 'pending' | 'processing' | 'success' | 'error';
  /** Error message if status is 'error' */
  error?: string | undefined;
  /** Job ID if the row has been submitted */
  jobId?: string | null;
}

/**
 * Props for the FileDataTable component
 */
interface FileDataTableProps {
  /** Array of data rows to display in the table */
  data: FileDataRow[];
  /** Function to call when a single row is submitted */
  onRowSubmit?: (row: FileDataRow) => Promise<void>;
  /** Function to call when multiple rows are submitted as a batch */
  onBatchSubmit?: (rows: FileDataRow[]) => Promise<void>;
  /** Initial page size for pagination, defaults to 25 */
  initialPageSize?: number;
}

const StatusBadge = ({ status, error, onRetry }: { status: string; error?: string | undefined; onRetry?: (() => void | Promise<void>) | undefined }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor()}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
        {(status === 'error' || status === 'pending') && onRetry && (
          <button
            onClick={onRetry}
            className={`rounded px-2 py-1 text-xs text-white ${
              status === 'error'
                ? 'bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-600'
                : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600'
            }`}
          >
            {status === 'error' ? 'Retry' : 'Process'}
          </button>
        )}
      </div>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      )}
    </div>
  );
};

/**
 * Table component that displays file data and provides batch processing capabilities
 */
export default function FileDataTable({
  data,
  onRowSubmit,
  onBatchSubmit,
  initialPageSize = 25
}: FileDataTableProps): JSX.Element {
  const [tableData, setTableData] = useState<FileDataRow[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(1);

  // Update table data when input data changes
  useEffect(() => {
    setTableData(data);
    setTotalPages(Math.max(1, Math.ceil(data.length / pageSize)));
    // Reset to first page when data changes
    setCurrentPage(1);

    // Automatically submit all rows when data is loaded
    if (data.length > 0 && onBatchSubmit) {
      const pendingRows = data.filter(row => row.status === 'pending');
      if (pendingRows.length > 0) {
        handleBatchProcess(pendingRows);
      }
    }
  }, [data, pageSize]);

  // Update local table data when a row's status changes
  const updateRowStatus = (rowId: string, updates: Partial<FileDataRow>): void => {
    setTableData(currentData =>
      currentData.map(row =>
        row.id === rowId ? { ...row, ...updates } : row
      )
    );
  };

  /**
   * Handle submission of a single row
   */
  const handleRowSubmit = async (row: FileDataRow): Promise<void> => {
    if (!onRowSubmit || row.status !== 'pending') return;

    updateRowStatus(row.id, { status: 'processing' });
    try {
      await onRowSubmit(row);
      updateRowStatus(row.id, { status: 'success' });
    } catch (error) {
      console.error('Row processing failed:', error);
      updateRowStatus(row.id, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Processing failed'
      });
    }
  };

  /**
   * Handle batch processing of selected rows
   */
  const handleBatchProcess = async (rowsToProcess?: FileDataRow[]): Promise<void> => {
    if (!onBatchSubmit) return;

    const rows = rowsToProcess || tableData.filter(
      row => selectedRows.has(row.id) && row.status === 'pending'
    );

    if (rows.length === 0) {
      console.warn('No pending rows selected for processing');
      return;
    }

    setIsBatchProcessing(true);
    try {
      // Mark all rows as processing
      rows.forEach(row => {
        updateRowStatus(row.id, { status: 'processing' });
      });

      await onBatchSubmit(rows);

      // Mark all rows as success
      rows.forEach(row => {
        updateRowStatus(row.id, { status: 'success' });
      });
    } catch (error) {
      console.error('Batch processing failed:', error);
      // Mark all rows as error
      rows.forEach(row => {
        updateRowStatus(row.id, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Batch processing failed'
        });
      });
    } finally {
      setIsBatchProcessing(false);
      setSelectedRows(new Set());
      setSelectAll(false);
    }
  };

  // Show a message when there's no data to display
  if (!tableData.length) {
    return (
      <div className="mt-4 rounded-md bg-white p-4 shadow dark:bg-gray-800">
        <p className="text-center text-gray-500 dark:text-gray-400">
          No data to display
        </p>
      </div>
    );
  }

  // Extract column headers from the first row
  const headers = Object.keys(tableData[0].data);

  /**
   * Toggle select all rows
   */
  const toggleSelectAll = (): void => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      const pendingRowIds = tableData
        .filter(row => row.status === 'pending')
        .map(row => row.id);
      setSelectedRows(new Set(pendingRowIds));
    }
    setSelectAll(!selectAll);
  };

  // Get current page data only
  const paginatedData = tableData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handle page change
  const handlePageChange = (page: number): void => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Create pagination controls
  const renderPaginationControls = (): JSX.Element => {
    return (
      <div className="mt-4 flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * pageSize, tableData.length)}
              </span>{' '}
              of <span className="font-medium">{tableData.length}</span> results
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div>
              <label htmlFor="pageSize" className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                Rows per page:
              </label>
              <select
                id="pageSize"
                value={pageSize}
                onChange={handlePageSizeChange}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <span className="sr-only">First</span>
                <span>«</span>
              </button>
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <span className="sr-only">Previous</span>
                <span>‹</span>
              </button>
              {/* Page number buttons - show limited range of pages */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageIndex = Math.min(
                  Math.max(currentPage - 2, 1) + i,
                  totalPages
                );
                // Only show if within valid page range
                if (pageIndex <= totalPages && pageIndex > 0) {
                  return (
                    <button
                      key={pageIndex}
                      onClick={() => handlePageChange(pageIndex)}
                      className={`relative inline-flex items-center border px-4 py-2 text-sm font-medium ${
                        currentPage === pageIndex
                          ? 'z-10 border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-900 dark:text-blue-200'
                          : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageIndex}
                    </button>
                  );
                }
                return null;
              })}
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <span className="sr-only">Next</span>
                <span>›</span>
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <span className="sr-only">Last</span>
                <span>»</span>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Toggle selection of a row
   */
  const toggleRowSelection = (rowId: string): void => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(rowId)) {
      newSelectedRows.delete(rowId);
      setSelectAll(false);
    } else {
      newSelectedRows.add(rowId);
      // Check if all pending rows are now selected
      const pendingRowIds = tableData
        .filter(row => row.status === 'pending')
        .map(row => row.id);
      setSelectAll(
        pendingRowIds.length > 0 &&
          pendingRowIds.every(id => newSelectedRows.has(id))
      );
    }
    setSelectedRows(newSelectedRows);
  };

  return (
    <div className="mt-4 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800">
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={toggleSelectAll}
            disabled={isBatchProcessing}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            {selectedRows.size} selected
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <span className="font-medium">{tableData.filter(row => row.status === 'success').length}</span> processed,{' '}
            <span className="font-medium">{tableData.filter(row => row.status === 'error').length}</span> failed,{' '}
            <span className="font-medium">{tableData.filter(row => row.status === 'pending').length}</span> pending
          </div>
          <button
            onClick={() => handleBatchProcess()}
            disabled={
              selectedRows.size === 0 ||
              isBatchProcessing ||
              !Array.from(selectedRows).some(
                id => tableData.find(row => row.id === id)?.status === 'pending'
              )
            }
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            {isBatchProcessing ? 'Processing...' : 'Process Selected'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th
                scope="col"
                className="w-12 px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
              >
                <span className="sr-only">Select</span>
              </th>
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
            {paginatedData.map(row => (
              <tr
                key={row.id}
                className={row.status === 'processing' ? 'animate-pulse bg-blue-50 dark:bg-blue-900/20' : ''}
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(row.id)}
                    onChange={() => toggleRowSelection(row.id)}
                    disabled={isBatchProcessing || row.status !== 'pending'}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700"
                  />
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <StatusBadge
                    status={row.status}
                    error={row.error}
                    onRetry={
                      (row.status === 'error' || row.status === 'pending')
                        ? () => handleRowSubmit(row)
                        : undefined
                    }
                  />
                </td>
                {headers.map(header => (
                  <td
                    key={header}
                    className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-300"
                  >
                    {row.data[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {renderPaginationControls()}
    </div>
  );
}
