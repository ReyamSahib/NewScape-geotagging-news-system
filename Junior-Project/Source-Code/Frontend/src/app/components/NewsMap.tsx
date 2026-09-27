import { MapPin } from 'lucide-react';
import { NewsItem } from '../types';
import { useState } from 'react';
import uaeMap from '../../imports/Screenshot_2026-04-27_220721.png';

interface NewsMapProps {
  newsItems: NewsItem[];
  onNewsSelect: (news: NewsItem) => void;
}

// UAE region positions matched to the uploaded map image
// Positions are percentage-based (x, y) relative to the map image
const regionPositions: Record<string, { x: number; y: number }> = {
  // Dubai - center-right, middle area
  'Dubai': { x: 50, y: 56 },
  'Dubai Marina': { x: 52, y: 50 },
  'Downtown Dubai': { x: 49, y: 53 },
  'Dubai Silicon Oasis': { x: 54, y: 54 },
  'Dubai World Trade Centre': { x: 52, y: 53 },

  // Abu Dhabi - lower-left, coastal area
  'Abu Dhabi': { x: 22, y: 77 },
  'Abu Dhabi Corniche': { x: 22, y: 80 },

  // Sharjah - just north of Dubai
  'Sharjah': { x: 55, y: 41 },
  'Sharjah Cricket Stadium': { x: 59, y: 43 },

  // Al Ain - inland, east-central
  'Al Ain': { x: 62, y: 85 },

  // Fujairah - far right, eastern coast
  'Fujairah': { x: 80, y: 55 },

  // Ajman - north of Sharjah
  'Ajman': { x: 60, y: 40 },

  // Umm Al-Quwain - northern area
  'Umm Al-Quwain': { x: 62, y: 35 },

  // Ras Al Khaimah - northern tip
  'Ras Al Khaimah': { x: 72, y: 22 },

  // Northern Emirates - top area
  'Northern Emirates': { x: 75, y: 18 },

  // UAE - center of map
  'UAE': { x: 60, y: 70 },
};

export function NewsMap({ newsItems, onNewsSelect }: NewsMapProps) {
  const [hoveredNews, setHoveredNews] = useState<string | null>(null);

  const getPosition = (location: string) => {
    return regionPositions[location] || regionPositions['UAE'];
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Traffic: 'bg-red-500',
      Sports: 'bg-purple-500',
      Weather: 'bg-cyan-500',
      Business: 'bg-orange-500',
    };
    return colors[category] || 'bg-teal-500';
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg overflow-hidden">
      {/* Map background with grid */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#14b8a6" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* UAE Map background - Custom uploaded map */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <img
          src={uaeMap}
          alt="UAE Map"
          className="w-full h-full object-contain opacity-40"
        />
      </div>

      {/* Region labels */}
      <div className="absolute top-8 left-8 bg-white bg-opacity-90 rounded-lg p-4 shadow-sm text-sm">
        <div className="font-semibold mb-2">UAE Regions</div>
        <div className="space-y-1 text-gray-600">
          <div>• Abu Dhabi (West)</div>
          <div>• Dubai (Center-East)</div>
          <div>• Northern Emirates (North)</div>
          <div>• Eastern Coast (East)</div>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-8 right-8 bg-white bg-opacity-90 rounded-lg p-4 shadow-sm text-sm">
        <div className="font-semibold mb-2">Categories</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Traffic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span>Sports</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
            <span>Weather</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Business</span>
          </div>
        </div>
      </div>

      {/* News markers */}
      {newsItems.map((news) => {
        const pos = getPosition(news.location);
        const isHovered = hoveredNews === news.id;

        return (
          <div
            key={news.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              zIndex: isHovered ? 20 : 10,
            }}
            onMouseEnter={() => setHoveredNews(news.id)}
            onMouseLeave={() => setHoveredNews(null)}
            onClick={() => onNewsSelect(news)}
          >
            <div className={`relative ${isHovered ? 'scale-125' : 'scale-100'} transition-transform`}>
              <MapPin
                className={`${getCategoryColor(news.category)} text-white p-1 rounded-full shadow-lg`}
                size={isHovered ? 32 : 24}
                fill="currentColor"
              />

              {isHovered && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white rounded-lg shadow-xl p-3 min-w-[250px] max-w-[300px] z-30">
                  <div className="text-sm font-semibold mb-1">{news.title}</div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div><strong>Location:</strong> {news.location}</div>
                    <div><strong>Category:</strong> {news.category}</div>
                    <div><strong>Geotag:</strong> {news.geotagType}</div>
                    <div className="pt-1 text-gray-500">{news.description.substring(0, 100)}...</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewsSelect(news);
                    }}
                    className="mt-2 px-2 py-1 bg-teal-600 text-white rounded text-xs hover:bg-teal-700 w-full"
                  >
                    View Details
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Info footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-90 rounded-lg px-4 py-2 shadow-sm text-sm text-gray-600">
        Showing {newsItems.length} news items across UAE regions
      </div>
    </div>
  );
}
