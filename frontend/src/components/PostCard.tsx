import React from "react";
import { Link } from 'react-router-dom';
import { Post } from "../types";
import { format } from 'date-fns';

interface PostCardProps {
    post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const formattedDate = format(new Date(post.created_at), 'dd/MM/yyyy');

    return (
        <div className="bg-[#262626] rounded-lg shadow-lg overflow-hidden flex flex-col h-full hover:transform hover:scale-105 transition-transform duration-200">
            {/* Image placeholder */}
            <div className="w-full h-48 bg-gradient-to-br from-red-400 to-red-900 flex items-center justify-center">
                <div className="text-white text-4xl font-bold opacity-50">
                    {post.title.charAt(0).toUpperCase()}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-grow">
                <Link to={`/post/${post.slug}`} className="flex-grow">
                    <h3 className="text-lg font-bold font-ubuntu hover:text-gray-300 text-white mb-3 line-clamp-2">
                        {post.title}
                    </h3>
                </Link>

                <div className="flex items-center gap-2 text-sm text-text-muted mb-3">
                    <span className="text-red-400">{formattedDate}</span>
                </div>

                <p className="text-gray-300 text-sm line-clamp-3 flex-grow">
                    {post.excerpt ?? post.content.substring(0, 150) + '...'}
                </p>

                <div className="mt-4">
                    <Link
                        to={`/post/${post.slug}`}
                        className="inline-block text-red-400 hover:text-red-300 text-sm font-medium border-b border-red-400 hover:border-red-300 transition-colors"
                    >
                        Read More
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PostCard;