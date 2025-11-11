import React, { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Link, BookOpen, Loader2 } from 'lucide-react';

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
        // 1. Get resource IDs linked to the question
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

        // 2. Get the actual resources
        const { data: resourceData, error: resourceError } = await supabase
          .from('resources')
          .select('*')
          .in('id', resourceIds);

        if (resourceError) throw resourceError;

        setResources(resourceData);
      } catch (err) {
        console.error('Error fetching question resources:', err.message);
        setError('Failed to load resources for this question.');
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [questionId]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
        <p className="mt-2 text-gray-600">Loading resources...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-center py-8 text-red-600">{error}</p>;
  }

  if (resources.length === 0) {
    return <p className="text-center py-8 text-gray-500">No specific resources are linked to this question.</p>;
  }

  const resourceLinks = resources.filter(r => r.type === 'resource_link');
  const definitions = resources.filter(r => r.type === 'definition');

  return (
    <div className="space-y-6">
      {resourceLinks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
            <Link className="w-5 h-5 mr-2 text-purple-500" /> Resource Links
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {resourceLinks.map(resource => (
              <a 
                key={resource.id} 
                href={resource.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block p-3 border border-gray-200 rounded-lg hover:bg-purple-50 transition-colors group"
              >
                <h4 className="font-medium text-purple-700 group-hover:underline">{resource.title}</h4>
                {resource.description && <p className="text-gray-600 text-sm mt-1">{resource.description}</p>}
              </a>
            ))}
          </div>
        </div>
      )}
      {definitions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-green-500" /> Definitions
          </h3>
          <div className="space-y-3">
            {definitions.map(def => (
              <div key={def.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-800">{def.title}</h4>
                {def.description && <p className="text-gray-700 text-sm mt-1">{def.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionResources;