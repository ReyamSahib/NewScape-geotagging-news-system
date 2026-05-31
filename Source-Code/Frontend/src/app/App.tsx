import { useState, useMemo } from 'react';
import { NewsMap } from './components/NewsMap';
import { NewsDetailsModal } from './components/NewsDetailsModal';
import { FilterPanel } from './components/FilterPanel';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { NewsList } from './components/NewsList';
import { NewsItem, FilterState } from './types';
import { mockNewsData } from './data/mockNews';

export default function App() {
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    category: 'All',
    location: 'All',
    dateRange: 'This Week',
    geotagType: 'All',
  });

  const filteredNews = useMemo(() => {
    return mockNewsData.filter((news) => {
      if (filters.category !== 'All' && news.category !== filters.category) return false;
      if (filters.location !== 'All' && news.location !== filters.location) return false;
      if (filters.geotagType !== 'All' && news.geotagType !== filters.geotagType) return false;
      return true;
    });
  }, [filters]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1800px] mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            News Geotagging on Maps and Analytics
          </h1>
          <p className="text-gray-600">
            UAE News Distribution System with Interactive Maps and Real-time Analytics
          </p>
        </header>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <FilterPanel filters={filters} onFilterChange={setFilters} />
          </div>

          <div className="col-span-6">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden" style={{ height: '600px' }}>
              <NewsMap newsItems={filteredNews} onNewsSelect={setSelectedNews} />
            </div>

            <div className="mt-6">
              <NewsList newsItems={filteredNews} onNewsSelect={setSelectedNews} />
            </div>
          </div>

          <div className="col-span-3">
            <AnalyticsDashboard newsItems={filteredNews} />
          </div>
        </div>
      </div>

      <NewsDetailsModal news={selectedNews} onClose={() => setSelectedNews(null)} />
    </div>
  );
}
