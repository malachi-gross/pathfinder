// app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { CourseSearch } from './components/CourseSearch';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/courses?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to UNC Course Planner
        </h1>
        <p className="text-xl text-gray-600">
          Search courses, check prerequisites, and plan your academic journey
        </p>
      </div>

      <div className="max-w-2xl mx-auto mb-12">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for courses (e.g., COMP 110, Data Structures)"
            className="w-full px-4 py-3 pr-12 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-blue-600"
          >
            <Search className="w-5 h-5" />
          </button>
        </form>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-2">Search Courses</h3>
          <p className="text-gray-600 mb-4">
            Find courses by name, code, or description
          </p>
          <a
            href="/courses"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Browse Courses →
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-2">Check Prerequisites</h3>
          <p className="text-gray-600 mb-4">
            See what courses you need before enrolling
          </p>
          <a
            href="/courses"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View Prerequisites →
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-2">Plan Your Schedule</h3>
          <p className="text-gray-600 mb-4">
            Build your semester schedule with AI assistance
          </p>
          <a
            href="/planner"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Start Planning →
          </a>
        </div>
      </div>

      <div className="bg-blue-50 p-8 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Quick Course Search</h2>
        <CourseSearch />
      </div>
    </div>
  );
}