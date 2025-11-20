import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Link, BookOpen, Loader2 } from 'lucide-react';

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

const QuestionResources = ({ questionId }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!questionId) return;

    const fetchResources = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: links, error: linkError } = await supabase
          .from('question_resources')
          .select('resource_id')
          .eq('question_id', questionId);

        if (linkError) throw linkError;

        const resourceIds = links.map(link => link.resource_id);

        if (resourceIds.length === 0) {
          setResources([]);
          return;
        }

        const { data: resourceData, error: resourceError } = await supabase
          .from('resources')
          .select('*')
          .in('id', resourceIds);

        if (resourceError) throw resourceError;

        setResources(resourceData);
      } catch (err) {
        console.error('Error fetching question resources:', err.message);
        setResources([]);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [questionId]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand-purple-light" />
        <p className="mt-2 text-gray-300">Loading resources...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-center py-8 text-red-400">{error}</p>;
  }

  const resourceLinks = resources.filter(r => r.type === 'resource_link' && isValidUrl(r.url));
  const definitions = resources.filter(r => r.type === 'definition');

  if (resourceLinks.length === 0 && definitions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-300 space-y-3">
        <p>There are no resources linked to this question yet.</p>
        <p>We encourage you to do your own research, and if you find something useful, please share it by adding a comment to this question!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center">
          <Link className="w-5 h-5 mr-2 text-brand-purple-light" /> Resource Links
        </h3>
        {resourceLinks.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {resourceLinks.map(resource => (
              <a 
                key={resource.id} 
                href={ensureHttps(resource.url)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block p-3 border border-white/20 rounded-lg hover:bg-white/10 transition-colors group"
              >
                <h4 className="font-medium text-brand-purple-light group-hover:underline">{resource.title}</h4>
                {resource.description && <p className="text-gray-300 text-sm mt-1">{resource.description}</p>}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm p-3 bg-white/5 rounded-lg border border-white/20">There are no resource links for this question.</p>
        )}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-200 mb-3 flex items-center">
          <BookOpen className="w-5 h-5 mr-2 text-green-400" /> Definitions
        </h3>
        {definitions.length > 0 ? (
          <div className="space-y-3">
            {definitions.map(def => (
              <div key={def.id} className="p-3 border border-white/20 rounded-lg bg-white/5">
                <h4 className="font-medium text-white">{def.title}</h4>
                {def.description && <p className="text-gray-300 text-sm mt-1">{def.description}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm p-3 bg-white/5 rounded-lg border border-white/20">There are no definitions for this question.</p>
        )}
      </div>
    </div>
  );
};

export default QuestionResources;