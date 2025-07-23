// app/programs/page.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Award, BookOpen, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { programApi } from '@/lib/api';
import { Program } from '@/types/program';

export default function ProgramsPage() {
  const [filter, setFilter] = useState<'all' | 'major' | 'minor'>('all');

  const { data: programs, isLoading } = useQuery({
    queryKey: ['programs', filter],
    queryFn: () => programApi.getByType(filter === 'all' ? '' : filter),
  });

  const filteredPrograms = programs || [];
  const majors = filteredPrograms.filter((p: { program_type: string; }) => p.program_type === 'major');
  const minors = filteredPrograms.filter((p: { program_type: string; }) => p.program_type === 'minor');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Academic Programs
        </h1>
        <p className="text-gray-600">
          Explore majors and minors offered at UNC Chapel Hill
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md transition-colors ${filter === 'all'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          All Programs
        </button>
        <button
          onClick={() => setFilter('major')}
          className={`px-4 py-2 rounded-md transition-colors ${filter === 'major'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Majors ({majors.length})
        </button>
        <button
          onClick={() => setFilter('minor')}
          className={`px-4 py-2 rounded-md transition-colors ${filter === 'minor'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
            }`}
        >
          Minors ({minors.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrograms.map((program: Program) => (
            <ProgramCard key={program.program_id} program={program} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProgramCard({ program }: { program: Program }) {
  const Icon = program.program_type === 'major' ? GraduationCap : Award;

  return (
    <Link
      href={`/programs/${program.program_id}`}
      className="block bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <Icon className="w-8 h-8 text-blue-600" />
        <span className={`text-sm px-2 py-1 rounded-full ${program.program_type === 'major'
          ? 'bg-blue-100 text-blue-700'
          : 'bg-purple-100 text-purple-700'
          }`}>
          {program.program_type}
        </span>
      </div>

      <h3 className="font-semibold text-gray-900 mb-2">
        {program.name}
      </h3>

      <div className="flex items-center justify-between text-sm text-gray-600">
        {program.degree_type && (
          <span>{program.degree_type}</span>
        )}
        {program.total_hours && (
          <span className="flex items-center">
            <BookOpen className="w-4 h-4 mr-1" />
            {program.total_hours} hours
          </span>
        )}
      </div>
    </Link>
  );
}