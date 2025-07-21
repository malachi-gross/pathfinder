// app/planner/page.tsx
'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus, Save, Download, Calendar } from 'lucide-react';
import { ScheduleProvider, useSchedule } from '@/contexts/ScheduleContext';
import { SemesterCard } from '@/app/components/planner/SemesterCard';
import { CourseCard } from '@/app/components/planner/CourseCard';
import { CourseSelector } from '@/app/components/planner/CourseSearch';
import { PlannedCourse } from '@/types/planner';

function PlannerContent() {
  const { schedule, addSemester, moveCourse, addCourse } = useSchedule();
  const [showCourseSelector, setShowCourseSelector] = useState(false);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [activeCourse, setActiveCourse] = useState<PlannedCourse | null>(null);

  const handleDragStart = (event: any) => {
    const { active } = event;
    if (active.data.current?.type === 'course') {
      setActiveCourse(active.data.current.course);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCourse(null);

    if (!over || !active.data.current || !over.data.current) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Only handle course dragging
    if (activeData.type !== 'course') return;

    const fromSemesterId = activeData.semesterId;
    const course = activeData.course;

    // Check if dropping on a semester
    if (overData.type === 'semester' && overData.semester) {
      const toSemesterId = overData.semester.id;
      
      if (fromSemesterId !== toSemesterId) {
        moveCourse(fromSemesterId, toSemesterId, course.course_id);
      }
    }
  };

  const handleAddCourse = (course: PlannedCourse) => {
    if (selectedSemesterId) {
      addCourse(selectedSemesterId, course);
      setShowCourseSelector(false);
      setSelectedSemesterId(null);
    }
  };

  const openCourseSelector = (semesterId: string) => {
    setSelectedSemesterId(semesterId);
    setShowCourseSelector(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Schedule Planner
        </h1>
        <p className="text-gray-600">
          Plan your academic journey by dragging courses between semesters
        </p>
      </div>

      {/* Schedule Overview */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">{schedule.name}</h2>
            <p className="text-sm text-gray-600">
              {schedule.semesters.length} semesters • 
              {schedule.semesters.reduce((total, sem) => total + sem.courses.length, 0)} courses
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Schedule
            </button>
            <button className="px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Semesters Grid */}
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
          {schedule.semesters.map((semester) => (
            <div key={semester.id}>
              <SemesterCard semester={semester} />
              <button
                onClick={() => openCourseSelector(semester.id)}
                className="w-full mt-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Course
              </button>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeCourse ? (
            <div className="shadow-lg">
              <CourseCard course={activeCourse} semesterId="" />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add Semester Button */}
      <button
        onClick={addSemester}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
      >
        <Calendar className="w-4 h-4" />
        Add Semester
      </button>

      {/* Course Selector Modal */}
      {showCourseSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Course</h2>
              <button
                onClick={() => setShowCourseSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <CourseSelector onAddCourse={handleAddCourse} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function PlannerPage() {
  return (
    <ScheduleProvider>
      <PlannerContent />
    </ScheduleProvider>
  );
}