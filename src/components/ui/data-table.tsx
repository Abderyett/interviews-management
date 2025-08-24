import * as React from "react"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Button } from "./button"
import { Input } from "./input"

export interface DataTableColumn<TData> {
  id: string
  header: string
  accessorKey?: keyof TData
  cell?: (props: { getValue: () => any; row: { original: TData } }) => React.ReactNode
  enableSorting?: boolean
}

interface DataTableProps<TData> {
  columns: DataTableColumn<TData>[]
  data: TData[]
  searchKey?: keyof TData
  searchPlaceholder?: string
  pageSize?: number
}

export function DataTable<TData>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  pageSize = 10,
}: DataTableProps<TData>) {
  const [currentPage, setCurrentPage] = React.useState(0)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [sortColumn, setSortColumn] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")

  // Filter data based on search term
  const filteredData = React.useMemo(() => {
    if (!searchTerm || !searchKey) return data
    
    return data.filter(item => {
      const value = item[searchKey]
      if (value == null) return false
      return String(value).toLowerCase().includes(searchTerm.toLowerCase())
    })
  }, [data, searchTerm, searchKey])

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortColumn) return filteredData
    
    return [...filteredData].sort((a, b) => {
      const column = columns.find(col => col.id === sortColumn)
      if (!column?.accessorKey) return 0
      
      const aValue = a[column.accessorKey]
      const bValue = b[column.accessorKey]
      
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1
      
      const result = String(aValue).localeCompare(String(bValue))
      return sortDirection === "asc" ? result : -result
    })
  }, [filteredData, sortColumn, sortDirection, columns])

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = sortedData.slice(currentPage * pageSize, (currentPage + 1) * pageSize)

  const handleSort = (columnId: string) => {
    if (sortColumn === columnId) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnId)
      setSortDirection("asc")
    }
  }

  React.useEffect(() => {
    setCurrentPage(0)
  }, [searchTerm])

  return (
    <div className="w-full space-y-4">
      {/* Search */}
      {searchKey && (
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-gray-500">
            {sortedData.length} of {data.length} students
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto overflow-y-visible scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table className="w-full border-collapse" style={{minWidth: '1400px'}}>
            <thead className="bg-gray-50">
              <tr className="border-b">
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={`text-left p-3 cursor-pointer hover:bg-gray-100 ${
                      column.id === 'actions' ? 'min-w-[120px]' :
                      column.id === 'name' ? 'min-w-[150px]' :
                      column.id === 'mobile' ? 'min-w-[120px]' :
                      column.id === 'bac' ? 'min-w-[100px]' :
                      column.id === 'specialite' ? 'min-w-[100px]' :
                      column.id === 'scores' ? 'min-w-[120px]' :
                      column.id === 'test' ? 'min-w-[80px]' :
                      column.id === 'testResults' ? 'min-w-[120px]' :
                      column.id === 'status' ? 'min-w-[100px]' :
                      column.id === 'studentStatus' ? 'min-w-[120px]' :
                      column.id === 'comment' ? 'min-w-[150px]' :
                      column.id === 'interviewDate' ? 'min-w-[120px]' :
                      column.id === 'created' ? 'min-w-[100px]' :
                      column.id === 'salesPerson' ? 'min-w-[120px]' :
                      'min-w-[100px]'
                    }`}
                    onClick={() => column.enableSorting !== false && handleSort(column.id)}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="text-sm font-medium text-gray-900">{column.header}</span>
                      {column.enableSorting !== false && sortColumn === column.id && (
                        <span className="text-xs">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    {columns.map((column) => (
                      <td key={column.id} className={`p-3 text-sm ${
                        column.id === 'actions' ? 'min-w-[120px] whitespace-nowrap' :
                        column.id === 'name' ? 'min-w-[150px] whitespace-nowrap' :
                        column.id === 'mobile' ? 'min-w-[120px] whitespace-nowrap' :
                        column.id === 'bac' ? 'min-w-[100px] whitespace-nowrap' :
                        column.id === 'specialite' ? 'min-w-[100px] whitespace-nowrap' :
                        column.id === 'scores' ? 'min-w-[120px]' :
                        column.id === 'test' ? 'min-w-[80px] whitespace-nowrap' :
                        column.id === 'testResults' ? 'min-w-[120px]' :
                        column.id === 'status' ? 'min-w-[100px] whitespace-nowrap' :
                        column.id === 'studentStatus' ? 'min-w-[120px] whitespace-nowrap' :
                        column.id === 'comment' ? 'min-w-[150px] whitespace-nowrap' :
                        column.id === 'interviewDate' ? 'min-w-[120px] whitespace-nowrap' :
                        column.id === 'created' ? 'min-w-[100px] whitespace-nowrap' :
                        column.id === 'salesPerson' ? 'min-w-[120px] whitespace-nowrap' :
                        'min-w-[100px] whitespace-nowrap'
                      }`}>
                        {column.cell 
                          ? column.cell({
                              getValue: () => column.accessorKey ? item[column.accessorKey] : "",
                              row: { original: item }
                            })
                          : column.accessorKey 
                            ? String(item[column.accessorKey] ?? "")
                            : ""
                        }
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td 
                    colSpan={columns.length} 
                    className="p-3 py-8 text-center text-gray-500"
                  >
                    No results found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, sortedData.length)} of {sortedData.length} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm font-medium">
            Page {currentPage + 1} of {Math.max(1, totalPages)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage >= totalPages - 1}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

