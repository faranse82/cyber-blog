import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Delimiter from '@editorjs/delimiter';
import ImageTool from "@editorjs/image";
import api from "../services/api";
import { useAuth } from "../contexts/authContext";

interface EditPostData {
    title: string;
    content: string;
    excerpt: string;
    published: boolean;
}

interface Post {
    id: string;
    slug: string;
    title: string;
    content: string;
    excerpt?: string;
    published: boolean;
}

const EditPost: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [formData, setFormData] = useState<EditPostData>({
        title: '',
        content: '',
        excerpt: '',
        published: false
    });
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState('');
    const [postId, setPostId] = useState<string>('');
    const editorRef = useRef<EditorJS | null>(null);
    const holderRef = useRef<HTMLDivElement>(null);

    // Load existing post data
    useEffect(() => {
        if (!authLoading && !user?.is_admin) {
            navigate('/');
            return;
        }
        if (user?.is_admin && slug) {
            fetchPost();
        }
    }, [slug, user, authLoading, navigate]);

    const fetchPost = async () => {
        try {
            const response = await api.get(`/posts/${slug}`);
            const post: Post = response.data;

            // Store the post ID in state
            setPostId(post.id);

            setFormData({
                title: post.title,
                content: post.content,
                excerpt: post.excerpt ?? '',
                published: post.published
            });

            // Initialize editor with existing content after data is loaded
            setTimeout(() => {
                initializeEditor(post.content);
            }, 100);

        } catch (error) {
            console.error('Failed to fetch post:', error);
            setError('Failed to load post');
        } finally {
            setPageLoading(false);
        }
    };

    const initializeEditor = (existingContent: string) => {
        if (holderRef.current && !editorRef.current) {
            let initialData = { blocks: [] };

            // Parse existing content if it exists
            if (existingContent) {
                try {
                    initialData = JSON.parse(existingContent);
                } catch (e) {
                    console.error('Failed to parse existing content:', e);
                }
            }

            editorRef.current = new EditorJS({
                holder: holderRef.current,
                autofocus: true,
                placeholder: "Start writing your blog post...",
                tools: {
                    header: {
                        // @ts-ignore
                        class: Header,
                        config: {
                            placeholder: 'Enter a header',
                            levels: [1, 2, 3, 4, 5, 6],
                            defaultLevel: 2
                        },
                        inlineToolbar: true
                    },
                    list: {
                        // @ts-ignore
                        class: List,
                        inlineToolbar: true,
                        config: {
                            defaultStyle: 'unordered'
                        }
                    },
                    quote: {
                        // @ts-ignore
                        class: Quote,
                        inlineToolbar: true,
                        config: {
                            quotePlaceholder: 'Enter a quote',
                            captionPlaceholder: 'Quote\'s author',
                        }
                    },
                    delimiter: {
                        // @ts-ignore
                        class: Delimiter
                    },
                    image: {
                        class: ImageTool,
                        config: {
                            endpoints: {
                                byFile: 'http://0.0.0.0:8443/api/files/upload',
                                byUrl: 'http://0.0.0.0:8443/api/files/fetchUrl',
                            },
                            field: 'image',
                            types: 'image/*',
                            additionalRequestHeaders: {
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                            }
                        }
                    }
                },
                data: initialData,
            });
        }
    };

    // Cleanup editor
    useEffect(() => {
        return () => {
            if (editorRef.current) {
                editorRef.current.destroy();
                editorRef.current = null;
            }
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!editorRef.current) {
                throw new Error('Editor not initialized');
            }

            if (!postId) {
                throw new Error('Post ID not found');
            }

            const savedData = await editorRef.current.save();
            const contentString = JSON.stringify(savedData);

            const postData = {
                title: formData.title,
                content: contentString,
                excerpt: formData.excerpt,
                published: formData.published
            };

            await api.post(`/posts/${postId}`, postData);

            // Navigate back to admin dashboard
            navigate('/admin-dashboard');

        } catch (err: any) {
            console.error('Error updating post:', err);
            setError(err.response?.data?.error ?? 'Failed to update post');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin-dashboard');
    };

    if (!user?.is_admin) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
                    <p className="text-gray-400 mb-6">You don't have permission to access this page.</p>
                    <Link
                        to="/"
                        className="px-6 py-3 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    if (pageLoading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                    <span className="text-white text-lg">Loading post...</span>
                </div>
            </div>
        );
    }

    if (error && !formData.title) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Error</h1>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/admin-dashboard')}
                        className="px-6 py-3 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg">
            <div className="max-w-4xl mx-auto py-8 px-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold font-ubuntu text-white">Edit Post</h1>
                        <p className="text-gray-400 mt-1">Update your blog post</p>
                    </div>
                    <button
                        onClick={handleCancel}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <div className="bg-dark-card rounded-xl overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Title */}
                        <div>
                            <label className="block text-white text-sm font-medium mb-2">
                                Title *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-[#262626] text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="Enter post title..."
                                required
                            />
                        </div>

                        {/* Excerpt */}
                        <div>
                            <label className="block text-white text-sm font-medium mb-2">
                                Excerpt (Optional)
                            </label>
                            <textarea
                                name="excerpt"
                                value={formData.excerpt}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-4 py-3 bg-[#262626] text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                placeholder="Brief description of the post..."
                            />
                        </div>

                        {/* Content Editor */}
                        <div>
                            <label className="block text-white text-sm font-medium mb-2">
                                Content *
                            </label>
                            <div className="bg-[#262626] rounded-lg border border-gray-600 min-h-[400px] p-4">
                                <div
                                    ref={holderRef}
                                    className="prose prose max-w-none min-h-[350px]"
                                />
                            </div>
                            <p className="text-gray-400 text-xs mt-2">
                                Use the + button to add headers, lists, quotes, images and more.
                            </p>
                        </div>

                        {/* Published Checkbox */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                name="published"
                                id="published"
                                checked={formData.published}
                                onChange={handleInputChange}
                                className="w-4 h-4 accent-red-700"
                            />
                            <label htmlFor="published" className="text-white text-sm">
                                Published
                            </label>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading || !formData.title.trim()}
                                className="flex-1 py-3 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Updating...' : 'Update Post'}
                            </button>
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditPost;