import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { NewsItem } from "../types";

interface AnalyticsDashboardProps {
  newsItems: NewsItem[];
}

const COLORS = {
  Explicit: "#10b981",
  Inferred: "#f59e0b",
  "Not Geotaggable": "#6b7280",
  Traffic: "#ef4444",
  Sports: "#8b5cf6",
  Weather: "#06b6d4",
  Business: "#f97316",
};

export function AnalyticsDashboard({
  newsItems,
}: AnalyticsDashboardProps) {
  const geotagBreakdown = [
    {
      name: "Explicit",
      value: newsItems.filter(
        (n) => n.geotagType === "Explicit",
      ).length,
    },
    {
      name: "Inferred",
      value: newsItems.filter(
        (n) => n.geotagType === "Inferred",
      ).length,
    },
    {
      name: "Not Geotaggable",
      value: newsItems.filter(
        (n) => n.geotagType === "Not Geotaggable",
      ).length,
    },
  ];

  const categoryBreakdown = [
    {
      name: "Traffic",
      value: newsItems.filter((n) => n.category === "Traffic")
        .length,
    },
    {
      name: "Sports",
      value: newsItems.filter((n) => n.category === "Sports")
        .length,
    },
    {
      name: "Weather",
      value: newsItems.filter((n) => n.category === "Weather")
        .length,
    },
    {
      name: "Business",
      value: newsItems.filter((n) => n.category === "Business")
        .length,
    },
  ];

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">
        Analytics Dashboard
      </h2>

      <div className="mb-6">
        <div className="text-3xl font-semibold text-teal-600">
          {newsItems.length}
        </div>
        <div className="text-gray-600">Total News Items</div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-3">
            Geotag Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={geotagBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {geotagBreakdown.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      COLORS[entry.name as keyof typeof COLORS]
                    }
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-3">
            Category Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#14b8a6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}