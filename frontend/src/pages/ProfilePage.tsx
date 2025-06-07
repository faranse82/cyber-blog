import React, {useEffect, useState} from "react";
import { User } from "../types";
import api from "../services/api";

const ProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<User>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUser();
    })

    const fetchUser = async () => {
        try {
            const response = await api.get('api/users/me');
            setProfile(response.data);
        } catch (error) {
            console.error('Failed to fetch profile: ', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-96">Loading...</div>
    }

    return (
        <div className=""
    )
}

export default ProfilePage;