import { MapPin } from 'lucide-react';
import { NewsItem } from '../types';

interface NewsListProps {
  newsItems: NewsItem[];
  onNewsSelect: (news: NewsItem) => void;
}

export function NewsList({ newsItems, onNewsSelect }: NewsListProps) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">News Headlines</h2>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {newsItems.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No news items match your filters</p>
        ) : (
          newsItems.map((news) => (
            <div
              key={news.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onNewsSelect(news)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-medium mb-2">{news.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{news.location}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      news.geotagType === 'Explicit' ? 'bg-green-100 text-green-800' :
                      news.geotagType === 'Inferred' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {news.geotagType}
                    </span>
                    <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded-full text-xs">
                      {news.category}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-gray-500 whitespace-nowrap">{news.date}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
