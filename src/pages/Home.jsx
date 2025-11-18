import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, FileEdit, Settings } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import AdminPasswordPrompt from '../components/admin/AdminPasswordPrompt';

const Home = () => {
  const [showEditor, setShowEditor] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);

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
        
        setShowEditor(data ? data.value : true);
      } catch (err) {
        console.error('Error fetching home page settings:', err);
        setShowEditor(true);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  const gridClass = showEditor ? 'md:grid-cols-3' : 'md:grid-cols-2';

  const Card = ({ as: Component = 'div', to, icon, title, description, colorClass, ...props }) => {
    const Icon = icon;
    const content = (
      <>
        <Icon size={48} className="mb-4 transition-transform duration-300 group-hover:scale-110" />
        <span className="text-xl font-semibold text-white">{title}</span>
        <p className="text-sm text-gray-300 mt-2">{description}</p>
      </>
    );
    
    const className = `group glass-card flex flex-col items-center justify-center p-8 text-center transition-all duration-300 ease-in-out hover:border-white/40 hover:-translate-y-1 ${colorClass}`;

    if (Component === 'link') {
      return <Link to={to} className={className} {...props}>{content}</Link>;
    }
    return <button className={className} {...props}>{content}</button>;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
      {showPasswordPrompt && <AdminPasswordPrompt onClose={() => setShowPasswordPrompt(false)} />}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to the OQI Evaluation Tool
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl">
          This tool is designed to help evaluate the Open Quantum Initiative (OQI). Please select an option below to begin.
        </p>
      </div>

      <div className={`grid grid-cols-1 ${gridClass} gap-8 w-full max-w-5xl`}>
        <Card
          as="link"
          to="/questionnaire"
          icon={FileText}
          title="Start OQI Evaluation"
          description="Fill out the questionnaire to generate a comprehensive evaluation report."
          colorClass="text-purple-300"
        />

        {!loadingSettings && showEditor && (
          <Card
            as="link"
            to="/editor"
            icon={FileEdit}
            title="Evaluation Editor"
            description="Review, edit, or suggest changes to the evaluation questions."
            colorClass="text-blue-300"
          />
        )}

        <Card
          as="button"
          onClick={() => setShowPasswordPrompt(true)}
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