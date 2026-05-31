import { X } from 'lucide-react';
import { NewsItem } from '../types';

interface NewsDetailsModalProps {
  news: NewsItem | null;
  onClose: () => void;
}

export function NewsDetailsModal({ news, onClose }: NewsDetailsModalProps) {
  if (!news) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-semibold mb-4">{news.title}</h2>

        <div className="space-y-3">
          <div>
            <span className="font-semibold">Location: </span>
            <span>{news.location}</span>
          </div>

          <div>
            <span className="font-semibold">Category: </span>
            <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm">
              {news.category}
            </span>
          </div>

          <div>
            <span className="font-semibold">Geotag Type: </span>
            <span className={`px-3 py-1 rounded-full text-sm ${
              news.geotagType === 'Explicit' ? 'bg-green-100 text-green-800' :
              news.geotagType === 'Inferred' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {news.geotagType}
            </span>
          </div>

          <div>
            <span className="font-semibold">Date: </span>
            <span>{news.date}</span>
          </div>

          <div className="pt-2">
            <p className="font-semibold mb-2">Description:</p>
            <p className="text-gray-700 leading-relaxed">{news.description}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
