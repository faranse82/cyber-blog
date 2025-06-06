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
        <div className="w-full bg-[#262626] rounded-lg shadow-lg overflow-hidden flex">
            <div className="w-56 h-56 bg-white" />

            <div className="flex-1 p-4 flex flex-col gap-2">
                <Link to={`/post/${post.slug}`}>
                    <h3 className="text-xl font-bold font-ubuntu hover:text-gray-300">
                        {post.title}
                    </h3>
                </Link>

                <div className="flex items-center gap-4 text-sm text-text-muted">
                    <span>{formattedDate}</span>
                    <span className="w-px h-4 bg-gray-600" />
                </div>

                <p className="text-gray-300 line-clamp-3">
                    {post.excerpt ?? post.content.substring(0, 200) + '...'}
                </p>
            </div>
        </div>
    );
};

export default PostCard;