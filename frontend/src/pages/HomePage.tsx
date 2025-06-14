import React, { useEffect, useRef, useState } from "react";
import PostCard from "../components/PostCard";
import CreatePost from "../components/CreatePost";
import { Post } from "../types";
import api from "../services/api";
import { useAuth } from "../contexts/authContext";
import { useNavigate } from "react-router-dom";

const HomePage: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreatePost, setShowCreatePost] = useState(false);
    const { user, loading: authLoading } = useAuth();
    const blogPostsRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await api.get('/api/posts');
            setPosts(response.data.filter((post: Post) => post.published));
        } catch (error) {
            console.error('Failed to fetch posts: ', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePostCreated = () => {
        fetchPosts();
        setShowCreatePost(false);
    };

    const scrollToBlogPosts = () => {
        blogPostsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    useEffect(() => {
        (window as any).scrollToBlogPosts = scrollToBlogPosts;
        return () => {
            delete (window as any).scrollToBlogPosts;
        };
    }, []);

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-dark-bg flex justify-center items-center">
                <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                    <span className="text-white text-lg">
                        {authLoading ? 'Loading...' : 'Loading posts...'}
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg">
            {/* Hero Section */}
            <div className="self-stretch px-4 sm:px-6 lg:px-9 pt-20 sm:pt-32 lg:pt-56 pb-16 sm:pb-24 lg:pb-40 bg-gradient-to-br from-red-900 to-stone-900 shadow-[0_3px_25px_rgba(0,0,0,0.3)] flex flex-col justify-center items-center gap-6 sm:gap-8 lg:gap-11 overflow-hidden">
                <h1 className="text-white text-3xl sm:text-4xl lg:text-6xl font-medium font-ubuntu leading-normal text-center px-4">
                    Welcome to my blog!
                </h1>

                <p className="text-white text-lg sm:text-2xl lg:text-3xl font-light font-ubuntu leading-normal text-center max-w-4xl px-4">
                    Explore insights on technology, cyber security, and secure development!
                </p>

                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 lg:gap-12 w-full max-w-md sm:max-w-none">
                    <button
                        onClick={() => navigate('/about-me')}
                        className="w-full sm:w-40 p-3 bg-red-700 rounded-lg shadow-md outline outline-2 outline-offset-[-1px] outline-stone-900 text-white text-sm sm:text-base font-semibold font-inter leading-snug hover:bg-red-800 transition"
                    >
                        About me
                    </button>

                    <button
                        onClick={scrollToBlogPosts}
                        className="w-full sm:w-44 p-3 bg-stone-900 rounded-lg shadow-md outline outline-2 outline-offset-[-1px] outline-red-800 text-white text-sm sm:text-base font-semibold font-inter leading-snug hover:bg-stone-800 transition"
                    >
                        Read my posts
                    </button>
                </div>

                {/* Learning project note */}
                <div className="mt-6 sm:mt-8 max-w-2xl text-center px-4">
                    <p className="text-white/70 text-xs sm:text-sm font-inter leading-relaxed">
                        <span className="inline-flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
                            </svg>
                            Built with passion for learning
                        </span>
                        <br />
                        This blog is a personal project built with React TypeScript and Rust,
                        focused on practicing clean code, security best practices, and modern development workflows.
                    </p>
                </div>
            </div>

            {/* Blog Posts Section */}
            <div className="max-w-[100rem] mx-auto py-10 sm:py-16 lg:py-20 px-4 sm:px-6">
                {/* Create post button */}
                {!authLoading && user?.is_admin && (
                    <div className="mb-6 sm:mb-8 flex justify-end">
                        <button
                            onClick={() => setShowCreatePost(true)}
                            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800 transition-colors text-sm sm:text-base"
                        >
                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="hidden sm:inline">Create New Post</span>
                            <span className="sm:hidden">New Post</span>
                        </button>
                    </div>
                )}

                <div className="bg-dark-card rounded-xl shadow-xl p-4 sm:p-6 lg:p-8">
                    <div className="mb-6 sm:mb-8">
                        <div ref={blogPostsRef} className="mb-6 sm:mb-8">
                            <h2 className="text-2xl sm:text-3xl font-bold font-ubuntu text-white mb-4">
                                Latest Posts
                            </h2>
                            <div className="w-full h-1 bg-red-700"></div>
                        </div>

                        {posts.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {posts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 sm:py-12">
                                <svg className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <h3 className="text-lg sm:text-xl font-medium text-white mb-2">No posts available yet</h3>
                                <p className="text-gray-400 text-base sm:text-lg">Check back later for new content!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Post Modal */}
            <CreatePost
                isOpen={showCreatePost}
                onClose={() => setShowCreatePost(false)}
                onPostCreated={handlePostCreated}
            />
        </div>
    );
};

export default HomePage;