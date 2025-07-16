
import React, { useState } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

interface ReportDateFilterProps {
  onFilterChange: (filter: { type: string; dateRange?: DateRange }) => void;
}

const ReportDateFilter = ({ onFilterChange }: ReportDateFilterProps) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleFilterTypeChange = (type: string) => {
    setFilterType(type);
    
    const today = new Date();
    let newDateRange: DateRange = { from: undefined, to: undefined };
    
    switch (type) {
      case 'today':
        newDateRange = { from: today, to: today };
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        newDateRange = { from: yesterday, to: yesterday };
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        newDateRange = { from: weekStart, to: today };
        break;
      case 'month':
        const monthStart = new Date(today);
        monthStart.setDate(today.getDate() - 30);
        newDateRange = { from: monthStart, to: today };
        break;
      case 'custom':
        // Keep existing range or reset
        break;
      default:
        newDateRange = { from: undefined, to: undefined };
    }
    
    setDateRange(newDateRange);
    onFilterChange({ type, dateRange: newDateRange });
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    onFilterChange({ type: filterType, dateRange: range });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filter Reports by Date
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Time Period</label>
          <Select value={filterType} onValueChange={handleFilterTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filterType === 'custom' && (
          <div>
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range) {
                      handleDateRangeChange(range);
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {(dateRange.from || dateRange.to) && (
          <div className="text-sm text-muted-foreground">
            {dateRange.from && dateRange.to && (
              <p>Showing results from {format(dateRange.from, "MMM dd, yyyy")} to {format(dateRange.to, "MMM dd, yyyy")}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportDateFilter;
