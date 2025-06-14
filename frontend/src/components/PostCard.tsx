import React from "react";
import { Link } from 'react-router-dom';
import { Post } from "../types";
import { format } from 'date-fns';

interface PostCardProps {
    post: Post;
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

const PostCard: React.FC<PostCardProps> = ({ post }) => {
    const formattedDate = format(new Date(post.created_at), 'dd/MM/yyyy');

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
            console.error('Error parsing content for image:', error);
            return null;
        }
    };

    const firstImageUrl = getFirstImage(post.content);

    return (
        <div className="bg-[#262626] rounded-lg shadow-lg overflow-hidden flex flex-col h-full hover:transform hover:scale-105 transition-transform duration-200">
            {/* Image or placeholder */}
            <div className="w-full h-48 bg-gradient-to-br from-red-400 to-red-900 flex items-center justify-center relative overflow-hidden">
                {firstImageUrl ? (
                    <img
                        src={firstImageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                                const fallback = document.createElement('div');
                                fallback.className = 'text-white text-4xl font-bold opacity-50';
                                fallback.textContent = post.title.charAt(0).toUpperCase();
                                parent.appendChild(fallback);
                            }
                        }}
                    />
                ) : (
                    <div className="text-white text-4xl font-bold opacity-50">
                        {post.title.charAt(0).toUpperCase()}
                    </div>
                )}
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