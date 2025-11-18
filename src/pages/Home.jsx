import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, FileEdit, Settings, Lock } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import AdminPasswordPrompt from '../components/admin/AdminPasswordPrompt';
import EditorPasswordPrompt from '../components/auth/EditorPasswordPrompt';

const Home = () => {
  const [isEditorPasswordProtected, setIsEditorPasswordProtected] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [showAdminPasswordPrompt, setShowAdminPasswordPrompt] = useState(false);
  const [showEditorPasswordPrompt, setShowEditorPasswordPrompt] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoadingSettings(true);
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'password_protect_editor')
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          throw error;
        }
        
        setIsEditorPasswordProtected(data ? data.value : false);
      } catch (err) {
        console.error('Error fetching home page settings:', err);
        setIsEditorPasswordProtected(false); // Default to not protected on error
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  const Card = ({ as: Component = 'div', to, icon, title, description, colorClass, isLocked, ...props }) => {
    const Icon = icon;
    const content = (
      <>
        <div className="relative w-auto h-auto flex justify-center">
          <Icon size={48} className="mb-4 transition-transform duration-300 group-hover:scale-110" />
          {isLocked && <Lock size={20} className="absolute bottom-3 -right-2 bg-gray-800 text-white p-1 rounded-full border-2 border-gray-900" />}
        </div>
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
      {showAdminPasswordPrompt && <AdminPasswordPrompt onClose={() => setShowAdminPasswordPrompt(false)} />}
      {showEditorPasswordPrompt && <EditorPasswordPrompt onClose={() => setShowEditorPasswordPrompt(false)} />}
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to the OQI Evaluation Tool
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl">
          This tool is designed to help evaluate the Open Quantum Initiative (OQI). Please select an option below to begin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <Card
          as="link"
          to="/questionnaire"
          icon={FileText}
          title="Start OQI Evaluation"
          description="Fill out the questionnaire to generate a comprehensive evaluation report."
          colorClass="text-purple-300"
        />

        {!loadingSettings && (
          <Card
            as={isEditorPasswordProtected ? "button" : "link"}
            to={!isEditorPasswordProtected ? "/editor" : null}
            onClick={isEditorPasswordProtected ? () => setShowEditorPasswordPrompt(true) : null}
            icon={FileEdit}
            isLocked={isEditorPasswordProtected}
            title="Evaluation Editor"
            description="Review, edit, or suggest changes to the evaluation questions."
            colorClass="text-blue-300"
          />
        )}

        <Card
          as="button"
          onClick={() => setShowAdminPasswordPrompt(true)}
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