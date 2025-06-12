import React, { useState, useRef, useEffect } from "react";
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Delimiter from '@editorjs/delimiter';
import ImageTool from "@editorjs/image";
import api from "../services/api";

interface CreatePostProps {
    isOpen: boolean;
    onClose: () => void;
    onPostCreated: () => void;
}

interface CreatePostData {
    title: string;
    content: string;
    excerpt: string;
    published: boolean;
}

const CreatePost: React.FC<CreatePostProps> = ({ isOpen, onClose, onPostCreated }) => {
    const [formData, setFormData] = useState<CreatePostData>({
        title: '',
        content: '',
        excerpt: '',
        published: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const editorRef = useRef<EditorJS | null>(null);
    const holderRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && holderRef.current && !editorRef.current) {
            editorRef.current = new EditorJS({
                holder: holderRef.current,
                autofocus: true,
                placeholder: "Start writing your blog post...",
                tools: {
                    header: {
                        // @ts-ignore - EditorJS types are sometimes inconsistent
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
                                byFile: 'http://localhost:8443/api/files/upload',
                                byUrl: 'http://localhost:8443/api/files/fetchUrl',
                            },
                            field: 'image',
                            types: 'image/*',
                            additionalRequestHeaders: {
                                'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
                            }
                        }
                    }
                },
                data: {
                    blocks: []
                },
                onChange: () => {
                }
            });
        }

        // Cleanup editor when modal closes
        if (!isOpen && editorRef.current) {
            editorRef.current.destroy();
            editorRef.current = null;
        }
    }, [isOpen]);

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

            const savedData = await editorRef.current.save();

            // Convert Editor.js data to string for backend
            const contentString = JSON.stringify(savedData);

            const postData = {
                ...formData,
                content: contentString
            };

            await api.post('/api/posts', postData);

            setFormData({
                title: '',
                content: '',
                excerpt: '',
                published: false
            });

            if (editorRef.current) {
                editorRef.current.clear();
            }

            onPostCreated();
            onClose();
        } catch (err: any) {
            console.error('Error creating post:', err);
            setError(err.response?.data?.error ?? 'Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            title: '',
            content: '',
            excerpt: '',
            published: false
        });
        setError('');

        if (editorRef.current) {
            editorRef.current.clear();
        }

        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
                onClick={handleClose}
            />
            <div className="relative z-10 w-full max-w-4xl max-h-[90vh] bg-zinc-800 rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-600">
                    <h2 className="text-2xl font-bold text-white">Create New Post</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
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
                                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                placeholder="Brief description of the post..."
                            />
                        </div>

                        {/* Content Editor */}
                        <div>
                            <label className="block text-white text-sm font-medium mb-2">
                                Content *
                            </label>
                            <div className="bg-gray-700 rounded-lg border border-gray-600 min-h-[400px] p-4">
                                <div
                                    ref={holderRef}
                                    className="prose prose max-w-none min-h-[350px]"
                                />
                            </div>
                            <p className="text-gray-400 text-xs mt-2">
                                Click the editor to start writing. Use + button to add headers, lists, quotes, images and more.
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
                                Publish immediately
                            </label>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading || !formData.title.trim()}
                                className="flex-1 py-3 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating...' : 'Create Post'}
                            </button>
                            <button
                                type="button"
                                onClick={handleClose}
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

export default CreatePost;