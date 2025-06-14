import React, { useState } from 'react';
import Modal from './Modal';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
    const [mode, setMode] = useState<'login' | 'register'>(initialMode);

    const handleSwitchMode = () => {
        setMode(mode === 'login' ? 'register' : 'login');
    };

    const handleClose = () => {
        setMode('login'); // Reset to login when closing
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            {mode === 'login' ? (
                <LoginForm
                    onClose={handleClose}
                    onSwitchToRegister={handleSwitchMode}
                />
            ) : (
                <RegisterForm
                    onClose={handleClose}
                    onSwitchToLogin={handleSwitchMode}
                />
            )}
        </Modal>
    );
};

export default AuthModal;