import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

interface YearFilterProps {
  availableYears: string[];
  selectedYear: string;
  onYearSelect: (year: string) => void;
}

export function YearFilter({ availableYears, selectedYear, onYearSelect }: YearFilterProps) {
  const { theme } = useTheme();
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-8 text-muted-foreground flex items-center gap-1">
          <span className="text-sm">{selectedYear}</span>
          <CalendarIcon className="h-4 w-4" />
          <span className="sr-only">Filter the year</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex flex-col p-2 space-y-1">
          <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground border-b">
            Filter the year
          </div>
          <div className="flex flex-col space-y-1">
            {availableYears.map((year) => (
              <Button
                key={year}
                variant="ghost"
                className="justify-start h-8 px-2 py-1 w-full hover:bg-accent"
                onClick={() => onYearSelect(year)}
              >
                <div className="w-full flex items-center">
                  <div 
                    className={cn(
                      "h-2 w-2 rounded-full mr-2",
                      selectedYear === year 
                        ? "bg-primary" 
                        : "bg-transparent"
                    )}
                  />
                  <span className="text-sm">{year}</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 