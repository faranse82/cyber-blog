import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/authContext';
import api from '../services/api';
import AuthModal from './AuthModal';

interface Comment {
    id: string;
    content: string;
    post_id: string;
    user_id: string;
    username: string;
    profile_pic_url?: string;
    created_at: string;
}

interface CommentsProps {
    postId: string;
}

// Simple client-side sanitization for display
const sanitizeForDisplay = (text: string): string => {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

const Comments: React.FC<CommentsProps> = ({ postId }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [error, setError] = useState('');
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [postId]);

    const fetchComments = async () => {
        try {
            const response = await api.get(`/comments/post/${postId}`);
            setComments(response.data);
        } catch (error) {
            console.error('Failed to fetch comments:', error);
            setError('Failed to load comments');
        } finally {
            setLoading(false);
        }
    };

    const validateComment = (content: string): string | null => {
        const trimmed = content.trim();

        if (!trimmed) {
            return 'Comment cannot be empty';
        }

        if (trimmed.length < 1) {
            return 'Comment is too short';
        }

        if (trimmed.length > 1000) {
            return 'Comment is too long (max 1000 characters)';
        }

        // Check for potentially malicious content
        const suspiciousPatterns = [
            /<script/i,
            /javascript:/i,
            /on\w+\s*=/i,
            /<iframe/i,
            /<object/i,
            /<embed/i
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(trimmed)) {
                return 'Comment contains invalid content';
            }
        }

        return null;
    };

    const handleSubmitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        const validationError = validateComment(newComment);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError('');
        setSubmitting(true);

        try {
            const response = await api.post('/comments', {
                content: newComment.trim(),
                post_id: postId
            });

            setComments([response.data, ...comments]);
            setNewComment('');
        } catch (err: any) {
            console.error('Failed to create comment:', err);
            setError(err.response?.data?.error ?? 'Failed to post comment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditComment = async (commentId: string) => {
        const validationError = validateComment(editContent);
        if (validationError) {
            setError(validationError);
            return;
        }

        setError('');

        try {
            const response = await api.put(`/comments/${commentId}`, {
                content: editContent.trim(),
                post_id: postId
            });

            setComments(comments.map(comment =>
                comment.id === commentId
                    ? { ...comment, content: response.data.content }
                    : comment
            ));

            setEditingId(null);
            setEditContent('');
        } catch (err: any) {
            console.error('Failed to update comment:', err);
            setError(err.response?.data?.error ?? 'Failed to update comment');
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;

        setError('');

        try {
            await api.delete(`/comments/${commentId}`);
            setComments(comments.filter(comment => comment.id !== commentId));
        } catch (err: any) {
            console.error('Failed to delete comment:', err);
            setError(err.response?.data?.error ?? 'Failed to delete comment');
        }
    };

    const startEditing = (comment: Comment) => {
        setEditingId(comment.id);
        setEditContent(comment.content);
        setError('');
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditContent('');
        setError('');
    };

    const clearError = () => {
        setError('');
    };

    if (loading) {
        return (
            <div className="mt-12">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                    <span className="ml-3 text-gray-400">Loading comments...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-12 border-t border-gray-600 pt-8">
            <h3 className="text-2xl font-bold font-ubuntu text-white mb-6">
                Comments ({comments.length})
            </h3>

            {error && (
                <div className="mb-6 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm flex justify-between items-center">
                    <span>{error}</span>
                    <button
                        onClick={clearError}
                        className="ml-2 text-red-200 hover:text-white"
                        title="Dismiss error"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Add Comment Form */}
            {user ? (
                <form onSubmit={handleSubmitComment} className="mb-8 bg-[#2a2a2a] rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                                {user.profile_pic_url ? (
                                    <img
                                        src={user.profile_pic_url}
                                        alt={user.username}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-white font-medium">
                                        {user.username.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex-1">
                            <textarea
                                value={newComment}
                                onChange={(e) => {
                                    setNewComment(e.target.value);
                                    if (error) setError('');
                                }}
                                placeholder="Share your thoughts..."
                                className="w-full px-4 py-3 bg-[#262626] text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                rows={3}
                                required
                                minLength={1}
                                maxLength={1000}
                            />

                            <div className="flex justify-between items-center mt-3">
                                <span className={`text-xs ${newComment.length > 900 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                    {newComment.length}/1000 characters
                                </span>

                                <button
                                    type="submit"
                                    disabled={submitting || !newComment.trim() || newComment.length > 1000}
                                    className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Posting...' : 'Post Comment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="mb-8 p-6 bg-[#2a2a2a] rounded-xl text-center">
                    <p className="text-gray-400 mb-4">Sign in to join the conversation</p>
                    <button
                        onClick={() => setShowAuthModal(true)}
                        className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors"
                    >
                        Sign In
                    </button>
                </div>
            )}

            {/* Comments List */}
            {comments.length > 0 ? (
                <div className="space-y-6">
                    {comments.map((comment) => (
                        <div key={comment.id} className="bg-[#2a2a2a] rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                                        {comment.profile_pic_url ? (
                                            <img
                                                src={comment.profile_pic_url}
                                                alt={comment.username}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="text-white font-medium">
                                                {comment.username.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium text-white">{comment.username}</span>
                                            <span className="text-xs text-gray-400">
                                                {format(new Date(comment.created_at), 'MMM dd, yyyy • h:mm a')}
                                            </span>
                                        </div>

                                        {user && (user.id === comment.user_id || user.is_admin) && (
                                            <div className="flex items-center gap-2">
                                                {editingId !== comment.id && (
                                                    <>
                                                        <button
                                                            onClick={() => startEditing(comment)}
                                                            className="p-1 text-gray-400 hover:text-white transition-colors"
                                                            title="Edit comment"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                                            title="Delete comment"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {editingId === comment.id ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => {
                                                    setEditContent(e.target.value);
                                                    if (error) setError('');
                                                }}
                                                className="w-full px-3 py-2 bg-[#262626] text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                                rows={3}
                                                maxLength={1000}
                                            />
                                            <div className="flex justify-between items-center">
                                                <span className={`text-xs ${editContent.length > 900 ? 'text-yellow-400' : 'text-gray-400'}`}>
                                                    {editContent.length}/1000 characters
                                                </span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditComment(comment.id)}
                                                        disabled={!editContent.trim() || editContent.length > 1000}
                                                        className="px-3 py-1 bg-red-700 text-white rounded text-sm hover:bg-red-800 transition-colors disabled:opacity-50"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={cancelEditing}
                                                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                                            {sanitizeForDisplay(comment.content)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h4 className="text-lg font-medium text-white mb-2">No comments yet</h4>
                    <p className="text-gray-400">
                        {user ? 'Be the first to share your thoughts!' : 'Sign in to start the conversation'}
                    </p>
                </div>
            )}

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />
        </div>
    );
};

export default Comments;