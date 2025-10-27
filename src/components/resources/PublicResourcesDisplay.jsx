import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Link, BookOpen, Info } from 'lucide-react';

const PublicResourcesDisplay = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .order('title', { ascending: true });
        
        if (error) throw error;
        setResources(data);
      } catch (err) {
        console.error('Error fetching public resources:', err.message);
        setError('Failed to load resources. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading resources...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  const resourceLinks = resources.filter(r => r.type === 'resource_link');
  const definitions = resources.filter(r => r.type === 'definition');

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center mb-6 border-b pb-4">
        <Info className="w-8 h-8 text-cyan-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-800">Additional Information & Resources</h2>
      </div>

      {resources.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No public resources or definitions available yet.</p>
      ) : (
        <div className="space-y-8">
          {resourceLinks.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                <Link className="w-5 h-5 mr-2 text-blue-500" /> Resource Links
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resourceLinks.map(resource => (
                  <a 
                    key={resource.id} 
                    href={resource.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors group"
                  >
                    <h4 className="font-medium text-lg text-blue-700 group-hover:underline">{resource.title}</h4>
                    {resource.description && <p className="text-gray-600 text-sm mt-1">{resource.description}</p>}
                    <p className="text-xs text-blue-500 mt-2 group-hover:text-blue-600">{resource.url}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {definitions.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-green-500" /> Definitions & Descriptions
              </h3>
              <div className="space-y-4">
                {definitions.map(def => (
                  <div key={def.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h4 className="font-medium text-lg text-gray-800">{def.title}</h4>
                    {def.description && <p className="text-gray-700 text-sm mt-1">{def.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicResourcesDisplay;