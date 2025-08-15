import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { login, register, logout, resetPassword, updateUser } from '/services/authService';

const useAuth = () => {
  const { user, loading } = useContext(AuthContext);

  return {
    user,
    isAuthenticated: !!user,
    isLoading: loading,
    login: async (email, password) => {
      try {
        const response = await login(email, password);
        return response;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    register: async (userData) => {
      try {
        const response = await register(userData);
        return response;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    logout: async () => {
      try {
        await logout();
      } catch (error) {
        throw new Error(error.message);
      }
    },
    resetPassword: async (email) => {
      try {
        await resetPassword(email);
      } catch (error) {
        throw new Error(error.message);
      }
    },
    updateUser: async (userId, updates) => {
      try {
        const response = await updateUser(userId, updates);
        return response;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  };
};

export default useAuth;