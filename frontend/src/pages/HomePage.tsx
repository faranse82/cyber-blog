import React, { use, useEffect, useState } from "react";
import PostCard from "../components/PostCard";
import { Post } from "../types";
import api from "../services/api";

const HomePage: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await api.get('/posts');

            setPosts(response.data.filter((post: Post) => post.published));
        } catch (error) {
            console.error('Failed to fetch posts: ', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-96">Loading...</div>
    }

    return (
        <div className="min-h-screen bg-dark-bg">
            <div className="max-w-6xl mx-auto py-20">
                <div className="bg-dark-card rounded-xl shadow-xl p-8">
                    <div className="space-y-8">
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
};

export default HomePage;