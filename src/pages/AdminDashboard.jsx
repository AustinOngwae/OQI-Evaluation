import React from 'react';
import SuggestionManagement from '../components/admin/SuggestionManagement';
import AnalyticsDashboard from '../components/admin/AnalyticsDashboard';

const AdminDashboard = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      <div className="space-y-12">
        <section aria-labelledby="suggestion-management-heading">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 id="suggestion-management-heading" className="text-2xl font-semibold text-gray-800">
                Manage Suggestions
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Approve or dismiss suggestions submitted by users.
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <SuggestionManagement />
            </div>
          </div>
        </section>
        
        <section aria-labelledby="analytics-heading">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 id="analytics-heading" className="text-2xl font-semibold text-gray-800">
                Questionnaire Analytics
              </h2>
               <p className="mt-1 max-w-2xl text-sm text-gray-500">
                View insights from questionnaire responses.
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <AnalyticsDashboard />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;