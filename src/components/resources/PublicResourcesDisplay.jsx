import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Link, BookOpen, Info } from 'lucide-react';

const isValidUrl = (string) => {
  if (!string) return false;
  if (!string.includes('.') || string.includes(' ')) return false;
  try {
    new URL(string);
    return true;
  } catch (_) {
    try {
      new URL(`https://${string}`);
      return true;
    } catch (e) {
      return false;
    }
  }
};

const ensureHttps = (url) => {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    return `https://${url}`;
}

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
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

  const resourceLinks = resources.filter(r => r.type === 'resource_link' && isValidUrl(r.url));
  const definitions = resources.filter(r => r.type === 'definition');

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center mb-6 border-b pb-4">
        <Info className="w-8 h-8 text-brand-primary mr-3" />
        <h2 className="text-2xl font-bold text-brand-dark-grey font-sans">Additional Information & Resources</h2>
      </div>

      {(resourceLinks.length === 0 && definitions.length === 0) ? (
        <p className="text-gray-500 text-center py-4">No public resources or definitions available yet.</p>
      ) : (
        <div className="space-y-8">
          {resourceLinks.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-brand-dark-grey mb-4 flex items-center font-sans">
                <Link className="w-5 h-5 mr-2 text-brand-primary" /> Resource Links
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resourceLinks.map(resource => {
                  const formattedUrl = ensureHttps(resource.url);
                  return (
                    <a 
                      key={resource.id} 
                      href={formattedUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors group"
                    >
                      <h4 className="font-medium text-lg text-brand-primary group-hover:underline font-sans">{resource.title}</h4>
                      {resource.description && <p className="text-gray-600 text-sm mt-1 font-body">{resource.description}</p>}
                      <p className="text-xs text-brand-primary/80 mt-2 group-hover:text-brand-primary break-all">{formattedUrl}</p>
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {definitions.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-brand-dark-grey mb-4 flex items-center font-sans">
                <BookOpen className="w-5 h-5 mr-2 text-brand-green" /> Definitions & Descriptions
              </h3>
              <div className="space-y-4">
                {definitions.map(def => (
                  <div key={def.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h4 className="font-medium text-lg text-brand-dark-grey font-sans">{def.title}</h4>
                    {def.description && <p className="text-gray-700 text-sm mt-1 font-body">{def.description}</p>}
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