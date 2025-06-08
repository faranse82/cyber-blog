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
    const { user } = useAuth();
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


    if (loading) {
        return <div className="flex justify-center items-center h-96">Loading...</div>
    }

    return (
        <div className="min-h-screen bg-dark-bg">
            <div
                className="self-stretch px-9 pt-56 pb-40 bg-gradient-to-br from-red-900 to-stone-900 shadow-[0_3px_25px_rgba(0,0,0,0.3)] flex flex-col justify-center items-center gap-11 overflow-hidden"
            >
                <h1 className="text-white text-6xl font-medium font-ubuntu leading-normal">
                    Welcome to my blog!
                </h1>

                <p className="text-white text-3xl font-light font-ubuntu leading-normal text-center max-w-4xl">
                    Explore insights on technology, cyber security, and secure development!
                </p>

                <div className="flex justify-center items-center gap-12">
                    <button
                        onClick={() => navigate('/about-me')}
                        className="w-40 p-3 bg-red-700 rounded-lg shadow-md outline outline-2 outline-offset-[-1px] outline-stone-900 text-white text-base font-semibold font-inter leading-snug hover:bg-red-800 transition">
                        About me
                    </button>

                    <button
                        onClick={() => scrollToBlogPosts()}
                        className="w-44 h-12 p-3 bg-stone-900 rounded-lg shadow-md outline outline-2 outline-offset-[-1px] outline-red-800 text-white text-base font-semibold font-inter leading-snug hover:bg-stone-800 transition">
                        Read my posts
                    </button>
                </div>
            </div>

            <div className="max-w-[100rem] mx-auto py-20 px-6">
                {user && (
                    <div className="mb-8 flex justify-end">
                        <button
                            onClick={() => setShowCreatePost(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create New Post
                        </button>
                    </div>
                )}
                <div className="bg-dark-card rounded-xl shadow-xl p-8">

                    <div className="mb-8">
                        <div ref={blogPostsRef} className="mb-8">
                            <h2 className="text-3xl font-bold font-ubuntu text-white mb-4">
                                Latest Posts
                            </h2>
                            <div className="w-fill h-1 bg-red-700"></div>
                        </div>


                        {posts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {posts.map((post) => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-400 text-lg">No posts available yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <CreatePost
                isOpen={showCreatePost}
                onClose={() => setShowCreatePost(false)}
                onPostCreated={handlePostCreated}
            />
        </div>
    )
};

export default HomePage;