import React from 'react';
import { FileText, FileEdit, Settings } from 'lucide-react';

const Home = ({ onSelectView }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 bg-gray-50">
      <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">Welcome to the GESDA OQI Evaluation Tool</h2>
      <p className="text-lg text-gray-600 mb-12 text-center max-w-2xl">
        Select an option below to get started with managing your OQI evaluation.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl">
        <button
          onClick={() => onSelectView('questionnaire')}
          className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out text-purple-700 hover:text-purple-800 border border-gray-200 hover:border-purple-300"
        >
          <FileText size={48} className="mb-4" />
          <span className="text-xl font-semibold">Start Evaluation</span>
          <p className="text-sm text-gray-500 mt-2 text-center">Fill out the evaluation to generate a report.</p>
        </button>

        <button
          onClick={() => onSelectView('editor')}
          className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out text-blue-700 hover:text-blue-800 border border-gray-200 hover:border-blue-300"
        >
          <FileEdit size={48} className="mb-4" />
          <span className="text-xl font-semibold">Evaluation Editor</span>
          <p className="text-sm text-gray-500 mt-2 text-center">Manage or suggest changes to evaluation questions.</p>
        </button>

        <button
          onClick={() => onSelectView('admin')}
          className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 ease-in-out text-purple-700 hover:text-purple-800 border border-gray-200 hover:border-purple-300"
        >
          <Settings size={48} className="mb-4" />
          <span className="text-xl font-semibold">Admin Dashboard</span>
          <p className="text-sm text-gray-500 mt-2 text-center">Oversee users, suggestions, and analytics.</p>
        </button>
      </div>
    </div>
  );
};

export default Home;