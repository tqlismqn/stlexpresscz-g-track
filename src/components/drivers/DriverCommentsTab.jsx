import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function DriverCommentsTab({ driver, isTerminated }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driver?.id) return;
    loadComments();
  }, [driver?.id]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await base44.entities.DriverComment.filter({ driver_id: driver.id });
      setComments(data.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await base44.entities.DriverComment.create({
        driver_id: driver.id,
        text: newComment,
        author: 'Admin'
      });

      // Create history record
      const truncated = newComment.length > 100 ? newComment.substring(0, 100) + '...' : newComment;
      await base44.entities.DriverHistory.create({
        driver_id: driver.id,
        action: 'comment_added',
        description: 'Комментарий добавлен',
        new_value: truncated,
        changed_by: 'Admin'
      });

      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('✗ Ошибка добавления комментария');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Удалить комментарий?')) return;

    try {
      // Get comment text before deletion
      const commentToDelete = comments.find(c => c.id === commentId);
      const deletedText = commentToDelete?.text || '';
      const truncated = deletedText.length > 100 ? deletedText.substring(0, 100) + '...' : deletedText;

      await base44.entities.DriverComment.delete(commentId);

      // Create history record for deletion
      await base44.entities.DriverHistory.create({
        driver_id: driver.id,
        action: 'comment_deleted',
        description: 'Комментарий удалён',
        old_value: truncated,
        changed_by: 'Admin'
      });

      await loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('✗ Ошибка удаления комментария');
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Add comment form */}
      {!isTerminated && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Новый комментарий..."
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            style={{ maxHeight: '120px' }}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Добавить
            </button>
          </div>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Нет комментариев</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span>👤 {comment.author}</span>
                  <span>·</span>
                  <span>{format(new Date(comment.created_date), 'dd.MM.yyyy HH:mm')}</span>
                </div>
                {!isTerminated && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{comment.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}