import { Search, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SearchFilterProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterValue?: string;
  setFilterValue?: (value: string) => void;
  filterOptions?: { label: string; value: string }[];
  onFilterButtonClick?: () => void;
  placeholder?: string;
  className?: string;
  sortValue?: string;
  setSortValue?: (value: string) => void;
  sortOptions?: { label: string; value: string }[];
}

export const SearchFilter = ({
  searchTerm,
  setSearchTerm,
  filterValue,
  setFilterValue,
  filterOptions,
  onFilterButtonClick,
  placeholder = "Search...",
  className = "",
  sortValue,
  setSortValue,
  sortOptions,
}: SearchFilterProps) => {
  return (
    <div className={`flex items-center gap-3 w-full ${className}`}>
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-12 py-2.5 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
        />
        {onFilterButtonClick ? (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 border-l border-border pl-2 pr-1">
            <button
              onClick={onFilterButtonClick}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors outline-none"
              title="Advanced filters"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        ) : setFilterValue && filterOptions ? (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 border-l border-border pl-2 pr-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors outline-none"
                  title="Filter options"
                >
                  <Filter className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl bg-background/80 backdrop-blur-md border-border shadow-elevated">
                {filterOptions.map((opt) => (
                  <DropdownMenuItem
                    key={opt.value}
                    onClick={() => setFilterValue(opt.value)}
                    className={`cursor-pointer rounded-lg mx-1 my-0.5 text-xs font-medium ${
                      filterValue === opt.value
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
                {sortOptions && setSortValue && (
                  <>
                    <div className="my-1 border-t border-border/50 mx-2" />
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 pt-1 pb-0.5">Sort By</p>
                    {sortOptions.map((s) => (
                      <DropdownMenuItem
                        key={s.value}
                        onClick={() => setSortValue(s.value)}
                        className={`cursor-pointer rounded-lg mx-1 my-0.5 text-xs font-medium ${
                          sortValue === s.value
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {s.label}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null}
      </div>
    </div>
  );
};
