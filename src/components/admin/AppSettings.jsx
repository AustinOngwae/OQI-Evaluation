import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import toast from 'react-hot-toast';
import { SlidersHorizontal } from 'lucide-react';

const AppSettings = () => {
  const [settings, setSettings] = useState({ show_editor_to_users: true });
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');
      
      if (error) throw error;

      const settingsMap = data.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});
      
      setSettings(prev => ({ ...prev, ...settingsMap }));
    } catch (err) {
      console.error('Error fetching app settings:', err);
      toast.error('Could not load application settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSettingChange = async (key, value) => {
    const toastId = toast.loading('Updating setting...');
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value: value }, { onConflict: 'key' });
      
      if (error) throw error;
      
      setSettings(prev => ({ ...prev, [key]: value }));
      toast.success('Setting updated successfully!', { id: toastId });
    } catch (err) {
      toast.error(`Failed to update setting: ${err.message}`, { id: toastId });
    }
  };

  const handleToggle = (e) => {
    const { name, checked } = e.target;
    handleSettingChange(name, checked);
  };

  if (loading) {
    return <p>Loading settings...</p>;
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <SlidersHorizontal className="mr-2" /> Application Settings
      </h3>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="show_editor_to_users" className="font-medium text-gray-700">
              Show Evaluation Editor to All Users
            </label>
            <p className="text-sm text-gray-500">
              If disabled, only admins will see the "Evaluation Editor" button on the home page.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id="show_editor_to_users"
              name="show_editor_to_users"
              checked={settings.show_editor_to_users}
              onChange={handleToggle}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-purple-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default AppSettings;