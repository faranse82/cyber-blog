import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/authContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface ProfileData {
    username: string;
    email: string;
    newPassword: string;
    confirmPassword: string;
    profile_pic_url: string;
}

const EditProfile: React.FC = () => {
    const { user, loading: authLoading, refreshUser, clearError } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<ProfileData>({
        username: '',
        email: '',
        newPassword: '',
        confirmPassword: '',
        profile_pic_url: ''
    });

    const [loading, setLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [imagePreview, setImagePreview] = useState<string>('');

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/');
            return;
        }

        if (user) {
            setFormData(prev => ({
                ...prev,
                username: user.username,
                email: user.email,
                profile_pic_url: user.profile_pic_url || ''
            }));
            setImagePreview(user.profile_pic_url || '');
        }
    }, [user, authLoading, navigate]);

    // Clear auth errors when component mounts
    useEffect(() => {
        clearError();
    }, [clearError]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Update image preview for URL changes
        if (name === 'profile_pic_url') {
            setImagePreview(value);
        }

        // Clear messages when user starts typing
        if (error) setError('');
        if (success) setSuccess('');
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
            return;
        }

        // Validate file size (10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('File size must be less than 10MB');
            return;
        }

        setUploadingImage(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await api.post('/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success === 1 && response.data.file) {
                const fullImageUrl = response.data.file.url.startsWith('http')
                    ? response.data.file.url
                    : `http://0.0.0.0:8443${response.data.file.url}`;

                setFormData(prev => ({
                    ...prev,
                    profile_pic_url: fullImageUrl
                }));
                setImagePreview(fullImageUrl);
                setSuccess('Image uploaded successfully!');
            } else {
                throw new Error('Upload failed');
            }
        } catch (err: any) {
            console.error('Image upload failed:', err);
            setError(err.response?.data?.error || 'Failed to upload image');
        } finally {
            setUploadingImage(false);
            // Clear file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeProfilePicture = () => {
        setFormData(prev => ({
            ...prev,
            profile_pic_url: ''
        }));
        setImagePreview('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (showPasswordFields) {
            if (formData.newPassword !== formData.confirmPassword) {
                setError('New passwords do not match');
                return;
            }

            if (formData.newPassword.length < 6) {
                setError('New password must be at least 6 characters long');
                return;
            }
        }

        setLoading(true);

        try {
            const updateData: any = {
                username: formData.username,
                email: formData.email,
                profile_pic_url: formData.profile_pic_url || null
            };

            if (showPasswordFields && formData.newPassword) {
                updateData.password = formData.newPassword;
            }

            await api.put('/users/profile', updateData);

            setSuccess('Profile updated successfully!');

            // Clear password fields
            setFormData(prev => ({
                ...prev,
                newPassword: '',
                confirmPassword: ''
            }));
            setShowPasswordFields(false);

            // Refresh user data in auth context
            await refreshUser();

        } catch (err: any) {
            console.error('Profile update failed:', err);
            setError(err.response?.data?.error || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-dark-bg flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
                    <p className="text-gray-400">Please sign in to edit your profile.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-bg">
            <div className="max-w-2xl mx-auto py-8 px-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold font-ubuntu text-white">Edit Profile</h1>
                        <p className="text-gray-400 mt-1">Update your account information</p>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                    </button>
                </div>

                {/* Form */}
                <div className="bg-dark-card rounded-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-200 text-sm">
                                {success}
                            </div>
                        )}

                        {/* Profile Picture Upload Section */}
                        <div className="space-y-4">
                            <label className="block text-white text-sm font-medium">
                                Profile Picture
                            </label>

                            <div className="flex items-start gap-6">
                                {/* Image Preview */}
                                <div className="flex-shrink-0">
                                    <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden border-2 border-gray-500">
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Profile preview"
                                                className="w-full h-full object-cover"
                                                onError={() => setImagePreview('')}
                                            />
                                        ) : (
                                            <span className="text-white text-xl font-bold">
                                                {formData.username.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Upload Controls */}
                                <div className="flex-1 space-y-3">
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={handleFileSelect}
                                            disabled={uploadingImage || loading}
                                            className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {uploadingImage ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Uploading...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    Upload Image
                                                </>
                                            )}
                                        </button>

                                        {imagePreview && (
                                            <button
                                                type="button"
                                                onClick={removeProfilePicture}
                                                disabled={uploadingImage || loading}
                                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    <p className="text-gray-400 text-xs">
                                        Upload an image (JPEG, PNG, GIF, WebP) up to 10MB
                                    </p>

                                    {/* URL Input Alternative */}
                                    <div className="pt-2 border-t border-gray-600">
                                        <label className="block text-gray-300 text-xs font-medium mb-2">
                                            Or enter image URL directly:
                                        </label>
                                        <input
                                            type="url"
                                            name="profile_pic_url"
                                            value={formData.profile_pic_url}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-[#262626] text-white rounded border border-gray-600 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-transparent text-sm"
                                            placeholder="https://example.com/avatar.jpg"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-white text-sm font-medium mb-2">
                                Username
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-[#262626] text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                required
                                minLength={3}
                                disabled={loading}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-white text-sm font-medium mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 bg-[#262626] text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Password Section */}
                        <div className="border-t border-gray-600 pt-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-white">Change Password</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                                    className="text-red-400 hover:text-red-300 text-sm font-medium"
                                    disabled={loading}
                                >
                                    {showPasswordFields ? 'Cancel' : 'Change Password'}
                                </button>
                            </div>

                            {showPasswordFields && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-white text-sm font-medium mb-2">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={formData.newPassword}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-[#262626] text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            minLength={6}
                                            required={showPasswordFields}
                                            disabled={loading}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-white text-sm font-medium mb-2">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-[#262626] text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                            minLength={6}
                                            required={showPasswordFields}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Submit Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading || uploadingImage}
                                className="flex-1 py-3 bg-red-700 text-white rounded-lg font-medium hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Updating...' : 'Update Profile'}
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                                disabled={loading || uploadingImage}
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

export default EditProfile;