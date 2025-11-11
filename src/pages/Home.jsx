import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, FileEdit, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../integrations/supabase/client';

const Home = () => {
  const { user } = useAuth();
  const [showEditor, setShowEditor] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoadingSettings(true);
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'show_editor_to_users')
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          throw error;
        }
        
        // Default to true if setting doesn't exist yet
        setShowEditor(data ? data.value : true);
      } catch (err) {
        console.error('Error fetching home page settings:', err);
        // Fail safe: default to showing the button if fetch fails
        setShowEditor(true);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  const isAdmin = user?.role === 'admin';
  const canSeeEditorButton = isAdmin || showEditor;

  // Adjust grid layout based on number of visible items
  const gridClass = canSeeEditorButton ? 'md:grid-cols-3' : 'md:grid-cols-2';

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Welcome, {user?.first_name || 'User'}!
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          This tool is designed to help evaluate the Open Quantum Initiative (OQI). Please select an option below to begin.
        </p>
      </div>

      <div className={`grid grid-cols-1 ${gridClass} gap-8 w-full max-w-5xl`}>
        <Link
          to="/questionnaire"
          className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out text-purple-700 hover:bg-purple-50 border border-gray-200"
        >
          <FileText size={48} className="mb-4" />
          <span className="text-xl font-semibold text-center">Start OQI Evaluation</span>
          <p className="text-sm text-gray-500 mt-2 text-center">Fill out the questionnaire to generate a comprehensive evaluation report.</p>
        </Link>

        {!loadingSettings && canSeeEditorButton && (
          <Link
            to="/editor"
            className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out text-blue-700 hover:bg-blue-50 border border-gray-200"
          >
            <FileEdit size={48} className="mb-4" />
            <span className="text-xl font-semibold text-center">Evaluation Editor</span>
            <p className="text-sm text-gray-500 mt-2 text-center">Review, edit, or suggest changes to the evaluation questions.</p>
          </Link>
        )}

        <Link
          to="/admin"
          className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 ease-in-out text-green-700 hover:bg-green-50 border border-gray-200"
        >
          <Settings size={48} className="mb-4" />
          <span className="text-xl font-semibold text-center">Admin Dashboard</span>
          <p className="text-sm text-gray-500 mt-2 text-center">Oversee suggestions, view analytics, and manage the platform.</p>
        </Link>
      </div>
    </div>
  );
};

export default Home;