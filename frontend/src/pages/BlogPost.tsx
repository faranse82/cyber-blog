import React, { JSX, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from 'date-fns';
import { Post } from "../types";
import api from "../services/api";
import Comments from "../components/Comments";

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

const BlogPost: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [post, setPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (slug) {
            fetchPost(slug);
        }
    }, [slug]);

    const fetchPost = async (postSlug: string) => {
        try {
            const response = await api.get(`/posts/${postSlug}`);
            setPost(response.data);
        } catch (err: any) {
            setError(err.response?.status === 404 ? 'Post not found' : 'Failed to load post');
        } finally {
            setLoading(false);
        }
    };

    const renderBlock = (block: EditorBlock) => {
        // Safety check for block data
        if (!block || !block.data) {
            return null;
        }

        try {
            switch (block.type) {
                case 'header':
                    const level = block.data.level ?? 2;
                    const HeaderTag = `h${level}` as keyof JSX.IntrinsicElements;
                    const headerClasses = {
                        1: 'text-4xl font-bold text-white mb-6 mt-8',
                        2: 'text-3xl font-bold text-white mb-5 mt-7',
                        3: 'text-2xl font-bold text-white mb-4 mt-6',
                        4: 'text-xl font-bold text-white mb-3 mt-5',
                        5: 'text-lg font-bold text-white mb-3 mt-4',
                        6: 'text-base font-bold text-white mb-2 mt-3'
                    };
                    return (
                        <HeaderTag
                            key={block.id}
                            className={headerClasses[level as keyof typeof headerClasses] || headerClasses[2]}
                            dangerouslySetInnerHTML={{ __html: String(block.data.text ?? '') }}
                        />
                    );

                case 'paragraph':
                    return (
                        <p
                            key={block.id}
                            className="text-gray-300 mb-4 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: String(block.data.text ?? '') }}
                        />
                    );

                case 'image':
                    const imageUrl = block.data.file?.url ?? block.data.url;
                    if (!imageUrl) {
                        return null;
                    }

                    // Construct full URL if it's a relative path
                    const fullImageUrl = imageUrl.startsWith('http')
                        ? imageUrl
                        : `http://0.0.0.0:8443${imageUrl}`;

                    return (
                        <figure key={block.id} className="my-6">
                            <img
                                src={fullImageUrl}
                                alt={block.data.caption ?? ''}
                                className={`w-full rounded-lg ${block.data.stretched ? 'max-w-full' : 'max-w-2xl mx-auto'
                                    } ${block.data.withBorder ? 'border-2 border-gray-600' : ''
                                    } ${block.data.withBackground ? 'p-4 bg-gray-800' : ''
                                    }`}
                                onError={(e) => {
                                    console.error('Image failed to load:', fullImageUrl);
                                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23374151" width="400" height="300"/%3E%3Ctext fill="%239CA3AF" font-family="Arial" font-size="16" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
                                }}
                            />
                            {block.data.caption && (
                                <figcaption
                                    className="text-center text-gray-400 text-sm mt-2"
                                    dangerouslySetInnerHTML={{ __html: block.data.caption }}
                                />
                            )}
                        </figure>
                    );

                case 'list':
                    if (!block.data.items || !Array.isArray(block.data.items)) {
                        return null;
                    }

                    // Handle checklist vs regular list
                    if (block.data.style === 'checklist') {
                        return (
                            <div key={block.id} className="mb-6 space-y-2">
                                {block.data.items.map((item: any, index: number) => {
                                    const isChecked = item.meta?.checked ?? false;
                                    const content = item.content ?? String(item);

                                    return (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isChecked
                                                ? 'bg-red-500 border-red-500'
                                                : 'border-gray-400'
                                                }`}>
                                                {isChecked && (
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span
                                                className={`text-gray-300 leading-relaxed ${isChecked ? 'line-through opacity-60' : ''}`}
                                                dangerouslySetInnerHTML={{ __html: content }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    } else {
                        // Regular ordered/unordered list
                        const ListTag = block.data.style === 'ordered' ? 'ol' : 'ul';
                        const listClass = block.data.style === 'ordered'
                            ? 'list-decimal list-inside text-gray-300 mb-6 space-y-2'
                            : 'list-disc list-inside text-gray-300 mb-6 space-y-2';

                        return (
                            <ListTag key={block.id} className={listClass}>
                                {block.data.items.map((item: any, index: number) => {
                                    // Handle both string items and object items
                                    const content = typeof item === 'string' ? item : (item.content ?? String(item));
                                    return (
                                        <li
                                            key={index}
                                            className="leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: content }}
                                        />
                                    );
                                })}
                            </ListTag>
                        );
                    }

                case 'quote':
                    return (
                        <blockquote key={block.id} className="border-l-4 border-red-500 pl-6 py-4 my-6 bg-gray-800/50 rounded-r-lg">
                            <p
                                className="text-lg italic text-gray-200 mb-2"
                                dangerouslySetInnerHTML={{ __html: `"${String(block.data.text ?? '')}"` }}
                            />
                            {block.data.caption && (
                                <cite
                                    className="text-sm text-gray-400"
                                    dangerouslySetInnerHTML={{ __html: `— ${String(block.data.caption)}` }}
                                />
                            )}
                        </blockquote>
                    );

                case 'delimiter':
                    return (
                        <div key={block.id} className="flex justify-center my-8">
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            </div>
                        </div>
                    );

                default:
                    return (
                        <div key={block.id} className="text-gray-400 italic mb-4 text-sm sm:text-base">
                            [Unsupported content type: {block.type}]
                        </div>
                    );
            }
        } catch (error) {
            return (
                <div key={block.id} className="text-red-400 italic mb-4 text-sm sm:text-base">
                    [Error rendering block: {block.type}]
                </div>
            );
        }
    };

    const renderContent = (contentString: string) => {
        try {
            const content: EditorContent = JSON.parse(contentString);

            if (!content.blocks || !Array.isArray(content.blocks)) {
                console.warn('No blocks found in content');
                return <p className="text-gray-300">No content available.</p>;
            }

            return content.blocks.map((block, index) => {
                return renderBlock(block);
            }).filter(Boolean); // Remove any null/undefined blocks
        } catch (err) {
            console.error('Error parsing content:', err);
            // Fallback for plain text content
            return (
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {contentString}
                </p>
            );
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="text-white text-lg">Loading...</div>
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        {error === 'Post not found' ? '404' : 'Error'}
                    </h1>
                    <p className="text-gray-300 mb-6">{error}</p>
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

    const formattedDate = format(new Date(post.created_at), 'MMMM dd, yyyy');

    return (
        <div className="min-h-screen bg-dark-bg">
            <div className="max-w-4xl mx-auto py-12 px-6">
                {/* Back button */}
                <Link
                    to="/"
                    className="inline-flex items-center text-red-400 hover:text-red-300 mb-8 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Blog
                </Link>

                {/* Article */}
                <article className="bg-dark-card rounded-xl shadow-xl p-8">
                    {/* Article Header */}
                    <header className="mb-8 pb-6 border-b border-gray-600">
                        <h1 className="text-4xl font-bold font-ubuntu text-white mb-4 leading-tight">
                            {post.title}
                        </h1>

                        <div className="flex items-center text-gray-400 text-sm">
                            <time dateTime={post.created_at}>
                                {formattedDate}
                            </time>
                            <span className="mx-2">•</span>
                            <span>By Faran Sepehrisadr</span>
                        </div>

                        {post.excerpt && (
                            <p className="text-gray-300 text-lg mt-4 leading-relaxed">
                                {post.excerpt}
                            </p>
                        )}
                    </header>

                    {/* Article Content */}
                    <div className="prose prose-lg max-w-none">
                        {renderContent(post.content)}
                    </div>

                    {/* Article Footer */}
                    <footer className="mt-12 pt-6 border-t border-gray-600">
                        <div className="flex justify-between items-center">
                            <Link
                                to="/"
                                className="text-red-400 hover:text-red-300 transition-colors"
                            >
                                ← Back to all posts
                            </Link>

                            <div className="text-gray-400 text-sm">
                                Last updated: {format(new Date(post.updated_at), 'MMM dd, yyyy')}
                            </div>
                        </div>
                    </footer>
                </article>

                {/* Comments Section */}
                <Comments postId={post.id} />
            </div>
        </div>
    );
};

export default BlogPost;