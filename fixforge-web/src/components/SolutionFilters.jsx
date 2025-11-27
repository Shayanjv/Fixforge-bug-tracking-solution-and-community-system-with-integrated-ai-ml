import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Search, SlidersHorizontal, X, Grid3x3, List } from "lucide-react";

export function SolutionFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  severityFilter,
  onSeverityChange,
  selectedTags,
  onTagToggle,
  sortBy,
  onSortChange,
  onClearFilters,
  layout,
  onLayoutChange,
  availableTags = []
}) {
  const statuses = ["all", "Open", "In Progress", "Solved", "Needs Review"];
  const severities = ["all", "Low", "Medium", "High", "Critical"];
  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "most-voted", label: "Most Voted" },
    { value: "most-commented", label: "Most Commented" }
  ];

  const hasActive = statusFilter !== "all" || severityFilter !== "all" || selectedTags.length > 0 || searchQuery;

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Filters & Sort</h3>
        </div>

        {/* Layout Toggle */}
        <div className="flex gap-2">
          <Button
            variant={layout === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => onLayoutChange("grid")}
            className="gap-1"
          >
            <Grid3x3 className="w-4 h-4" />
            Grid
          </Button>
          <Button
            variant={layout === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => onLayoutChange("list")}
            className="gap-1"
          >
            <List className="w-4 h-4" />
            List
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search solutions..."
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-200"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Statuses" : s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Severity</label>
          <select
            value={severityFilter}
            onChange={(e) => onSeverityChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-200"
          >
            {severities.map((s) => (
              <option key={s} value={s}>
                {s === "all" ? "All Severities" : s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-200"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={onClearFilters}
            disabled={!hasActive}
            className="w-full gap-2"
          >
            <X className="w-4 h-4" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Tags */}
      {availableTags.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-2">Tags</label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => onTagToggle(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters */}
      {hasActive && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-purple-600">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="font-medium">
              Active filters: {[statusFilter !== "all", severityFilter !== "all", ...selectedTags, searchQuery].filter(Boolean).length}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
