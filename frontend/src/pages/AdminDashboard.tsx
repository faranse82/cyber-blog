import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import api from '../services/api';
import CreatePost from '../components/CreatePost';

interface AuthorInfo {
    id: string;
    username: string;
    profile_pic_url?: string;
}

interface Post {
    id: string;
    title: string;
    slug: string;
    content: string;
    excerpt?: string;
    published: boolean;
    author: AuthorInfo;
    created_at: string;
    updated_at: string;
}

interface EditorBlock {
    id: string;
    type: string;
    data: any;
}

interface EditorContent {
    time: number;
    blocks: EditorBlock[];
    version: string;
}

const AdminDashboard: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!authLoading && !user?.is_admin) {
            navigate('/');
            return;
        }
        if (user?.is_admin) {
            fetchPosts();
        }
    }, [user, authLoading, navigate]);

    const fetchPosts = async () => {
        try {
            const response = await api.get('/posts');
            setPosts(response.data);
        } catch (error) {
            console.error('Failed to fetch posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (postId: string, postTitle: string) => {
        if (!window.confirm(`Are you sure you want to delete "${postTitle}"?`)) return;

        try {
            await api.delete(`/posts/${postId}`);
            setPosts(posts.filter(post => post.id !== postId));
        } catch (error) {
            console.error('Failed to delete post:', error);
            alert('Failed to delete post');
        }
    };

    const handleTogglePublished = async (postId: string, currentStatus: boolean) => {
        try {
            await api.post(`/posts/${postId}`, { published: !currentStatus });
            setPosts(posts.map(post =>
                post.id === postId
                    ? { ...post, published: !currentStatus }
                    : post
            ));
        } catch (error) {
            console.error('Failed to update post status:', error);
            alert('Failed to update post status');
        }
    };

    // Extract first image from Editor.js content
    const getFirstImage = (contentString: string): string | null => {
        try {
            const content: EditorContent = JSON.parse(contentString);

            if (!content.blocks || !Array.isArray(content.blocks)) {
                return null;
            }

            const imageBlock = content.blocks.find((block: EditorBlock) =>
                block.type === 'image' && block.data
            );

            if (imageBlock && imageBlock.data) {
                const imageUrl = imageBlock.data.file?.url ?? imageBlock.data.url;

                if (imageUrl) {
                    return imageUrl.startsWith('http')
                        ? imageUrl
                        : `http://0.0.0.0:8443${imageUrl}`;
                }
            }

            return null;
        } catch (error) {
            return null;
        }
    };

    // Extract plain text from Editor.js content
    const extractTextContent = (contentString: string, maxLength: number = 100): string => {
        try {
            const content: EditorContent = JSON.parse(contentString);

            if (!content.blocks || !Array.isArray(content.blocks)) {
                return '';
            }

            let textContent = '';

            for (const block of content.blocks) {
                if (block.type === 'paragraph' || block.type === 'header') {
                    const text = block.data?.text ?? '';
                    textContent += text + ' ';

                    if (textContent.length >= maxLength) {
                        break;
                    }
                }
            }

            const trimmed = textContent.trim();
            return trimmed.length > maxLength
                ? trimmed.substring(0, maxLength) + '...'
                : trimmed;
        } catch (error) {
            return contentString.substring(0, maxLength) + '...';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Filter posts based on search
    const filteredPosts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (authLoading || (!user?.is_admin && authLoading)) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
        );
    }

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

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                    <span className="text-white text-lg">Loading posts...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg">
            <div className="max-w-7xl mx-auto py-8 px-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-ubuntu text-white">Admin Dashboard</h1>
                        <p className="text-gray-400 mt-1">Manage your blog posts</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create New Post
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-dark-card rounded-xl p-6 mb-6">
                    <div className="relative max-w-md">
                        <input
                            type="text"
                            placeholder="Search posts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-[#262626] text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Posts List */}
                <div className="bg-dark-card rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-600">
                        <h2 className="text-xl font-semibold font-ubuntu text-white">
                            Posts ({filteredPosts.length})
                        </h2>
                    </div>

                    {filteredPosts.length > 0 ? (
                        <div className="divide-y divide-gray-600">
                            {filteredPosts.map((post) => {
                                const firstImage = getFirstImage(post.content);
                                const textContent = extractTextContent(post.content, 120);

                                return (
                                    <div key={post.id} className="p-6 hover:bg-[#2a2a2a] transition-colors">
                                        <div className="flex gap-4">
                                            {/* Thumbnail */}
                                            <div className="flex-shrink-0">
                                                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-red-400 to-red-900 flex items-center justify-center">
                                                    {firstImage ? (
                                                        <img
                                                            src={firstImage}
                                                            alt={post.title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                const parent = e.currentTarget.parentElement;
                                                                if (parent) {
                                                                    parent.innerHTML = `<div class="text-white text-lg font-bold opacity-50">${post.title.charAt(0).toUpperCase()}</div>`;
                                                                }
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="text-white text-lg font-bold opacity-50">
                                                            {post.title.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-lg font-medium font-ubuntu text-white truncate mb-2">
                                                            {post.title}
                                                        </h3>
                                                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                                                            {post.excerpt ?? textContent}
                                                        </p>
                                                        <div className="flex items-center gap-4 text-xs text-gray-400">
                                                            <span>Created: {formatDate(post.created_at)}</span>
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${post.published
                                                                ? 'bg-green-900 text-green-300'
                                                                : 'bg-yellow-900 text-yellow-300'
                                                                }`}>
                                                                {post.published ? 'Published' : 'Draft'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-2 ml-4">
                                                        <Link
                                                            to={`/post/${post.slug}`}
                                                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-[#333] rounded-lg transition-colors"
                                                            title="View Post"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </Link>

                                                        <Link
                                                            to={`/admin/edit-post/${post.slug}`}
                                                            className="p-2 text-green-400 hover:text-green-300 hover:bg-[#333] rounded-lg transition-colors"
                                                            title="Edit Post"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                            </svg>
                                                        </Link>

                                                        <button
                                                            onClick={() => handleTogglePublished(post.id, post.published)}
                                                            className={`p-2 rounded-lg transition-colors ${post.published
                                                                ? 'text-yellow-400 hover:text-yellow-300 hover:bg-[#333]'
                                                                : 'text-green-400 hover:text-green-300 hover:bg-[#333]'
                                                                }`}
                                                            title={post.published ? 'Unpublish' : 'Publish'}
                                                        >
                                                            {post.published ? (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                            )}
                                                        </button>

                                                        <button
                                                            onClick={() => handleDeletePost(post.id, post.title)}
                                                            className="p-2 text-red-400 hover:text-red-300 hover:bg-[#333] rounded-lg transition-colors"
                                                            title="Delete Post"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <svg className="w-12 h-12 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="text-lg font-medium text-white mb-2">
                                {searchTerm ? 'No posts match your search' : 'No posts yet'}
                            </h3>
                            <p className="text-gray-400 mb-4">
                                {searchTerm
                                    ? 'Try adjusting your search criteria'
                                    : 'Get started by creating your first blog post'
                                }
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="inline-flex items-center px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors"
                                >
                                    Create Your First Post
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <CreatePost
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onPostCreated={() => {
                    fetchPosts();
                    setIsCreateModalOpen(false);
                }}
            />
        </div>
    );
};

export default AdminDashboard;