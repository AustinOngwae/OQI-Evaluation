import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../integrations/supabase/client';
import toast from 'react-hot-toast';
import { Send, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';

const QuestionComments = ({ questionId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('question_comments')
      .select('*')
      .eq('question_id', questionId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching comments:', error);
      toast.error('Could not load comments.');
    } else {
      setComments(data);
    }
    setLoading(false);
  }, [questionId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmitting(true);

    const { error } = await supabase.from('question_comments').insert({
      question_id: questionId,
      user_id: null,
      user_name_context: 'Anonymous',
      comment: newComment,
    });

    if (error) {
      toast.error('Failed to add comment.');
    } else {
      toast.success('Comment added.');
      setNewComment('');
      fetchComments();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="mt-4 p-4 bg-black/10 rounded-lg border border-white/20">
      <h4 className="font-semibold text-gray-200 mb-4 flex items-center font-sans"><MessageSquare size={18} className="mr-2" /> Discussion & Comments</h4>
      <form onSubmit={handleAddComment} className="mb-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full p-2 bg-black/20 border border-white/20 rounded-lg text-sm text-white placeholder-gray-400"
          rows="2"
          placeholder="Add a comment or suggestion..."
        />
        <Button type="submit" disabled={isSubmitting || !newComment.trim()} className="mt-2" size="sm">
          <Send size={14} className="mr-2" /> Post Comment
        </Button>
      </form>
      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
        {loading && <p className="text-sm text-gray-400">Loading comments...</p>}
        {!loading && comments.length === 0 && <p className="text-sm text-gray-400">No comments yet.</p>}
        {comments.map(comment => (
          <div key={comment.id} className="p-3 rounded-md text-sm bg-white/5">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-white font-sans">{comment.user_name_context}</p>
                <p className="text-gray-300 font-body">{comment.comment}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionComments;