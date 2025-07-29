import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'

interface DateRangePickerProps {
  startDate: string
  endDate: string
  activeFilter: string | null
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  onQuickSelect: (range: 'today' | 'week' | 'month' | 'year') => void
}

export function DateRangePicker({
  startDate,
  endDate,
  activeFilter,
  onStartDateChange,
  onEndDateChange,
  onQuickSelect,
}: DateRangePickerProps) {
  const quickRanges = [
    { label: 'Today', value: 'today' as const },
    { label: 'This Week', value: 'week' as const },
    { label: 'This Month', value: 'month' as const },
    { label: 'This Year', value: 'year' as const },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Date Range</span>
      </div>
      
      {/* Quick Select Buttons */}
      <div className="flex flex-wrap gap-2">
        {quickRanges.map((range) => {
          const isActive = activeFilter === range.value
          return (
            <Button
              key={range.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => onQuickSelect(range.value)}
              className={`text-xs ${isActive ? 'bg-blue-600 text-white' : ''}`}
            >
              {range.label}
            </Button>
          )
        })}
      </div>

      {/* Custom Date Range */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-600">Custom Range</span>
          {activeFilter === 'custom' && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Active</span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              From
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              To
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  )
} 