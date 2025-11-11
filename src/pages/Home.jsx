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

  const gridClass = canSeeEditorButton ? 'md:grid-cols-3' : 'md:grid-cols-2';

  const CardLink = ({ to, icon, title, description, colorClass }) => {
    const Icon = icon;
    return (
      <Link
        to={to}
        className={`group glass-card flex flex-col items-center justify-center p-8 text-center transition-all duration-300 ease-in-out hover:border-white/40 hover:-translate-y-1 ${colorClass}`}
      >
        <Icon size={48} className="mb-4 transition-transform duration-300 group-hover:scale-110" />
        <span className="text-xl font-semibold text-white">{title}</span>
        <p className="text-sm text-gray-300 mt-2">{description}</p>
      </Link>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome, {user?.first_name || 'User'}!
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl">
          This tool is designed to help evaluate the Open Quantum Initiative (OQI). Please select an option below to begin.
        </p>
      </div>

      <div className={`grid grid-cols-1 ${gridClass} gap-8 w-full max-w-5xl`}>
        <CardLink
          to="/questionnaire"
          icon={FileText}
          title="Start OQI Evaluation"
          description="Fill out the questionnaire to generate a comprehensive evaluation report."
          colorClass="text-purple-300"
        />

        {!loadingSettings && canSeeEditorButton && (
          <CardLink
            to="/editor"
            icon={FileEdit}
            title="Evaluation Editor"
            description="Review, edit, or suggest changes to the evaluation questions."
            colorClass="text-blue-300"
          />
        )}

        <CardLink
          to="/admin"
          icon={Settings}
          title="Admin Dashboard"
          description="Oversee suggestions, view analytics, and manage the platform."
          colorClass="text-green-300"
        />
      </div>
    </div>
  );
};

export default Home;