import api from './api';

export const getVideos = async () => {
  try {
    // Simuler un appel API (à remplacer par un appel réel)
    const mockVideos = [
      { id: 1, title: 'Anatomie - Cœur', url: '/videos/1', thumbnail: '/images/thumbnails/cardio.jpg' },
      { id: 2, title: 'Physiologie - Respiration', url: '/videos/2', thumbnail: '/images/thumbnails/respiration.jpg' },
    ];
    return mockVideos;
    // const response = await api.get('/videos');
    // return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const uploadVideo = async (title, file) => {
  try {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('file', file);
    // Simuler un appel API
    return { message: 'Vidéo chargée avec succès.', title };
    // const response = await api.post('/videos', formData, {
    //   headers: { 'Content-Type': 'multipart/form-data' },
    // });
    // return response.data;
  } catch (error) {
    throw new Error(error.message);
  }
};