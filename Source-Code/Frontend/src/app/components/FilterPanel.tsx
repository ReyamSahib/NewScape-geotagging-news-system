import { FilterState, Category, UAELocation, GeotagType } from '../types';

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const categories: (Category | 'All')[] = ['All', 'Traffic', 'Sports', 'Weather', 'Business'];
const locations: (UAELocation | 'All')[] = ['All', 'Dubai', 'Sharjah', 'Abu Dhabi', 'Al Ain', 'Fujairah', 'Ajman', 'Umm Al-Quwain', 'Ras Al Khaimah', 'Northern Emirates'];
const geotagTypes: (GeotagType | 'All')[] = ['All', 'Explicit', 'Inferred', 'Not Geotaggable'];

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm h-fit">
      <h2 className="text-xl font-semibold mb-4">Filters</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value as Category | 'All' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Location</label>
          <select
            value={filters.location}
            onChange={(e) => onFilterChange({ ...filters, location: e.target.value as UAELocation | 'All' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Geotag Type</label>
          <select
            value={filters.geotagType}
            onChange={(e) => onFilterChange({ ...filters, geotagType: e.target.value as GeotagType | 'All' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {geotagTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) => onFilterChange({ ...filters, dateRange: e.target.value as FilterState['dateRange'] })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="Today">Today</option>
            <option value="This Week">This Week</option>
            <option value="Custom">Custom Date Range</option>
          </select>
        </div>
      </div>
    </div>
  );
}
