import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { db, storage } from '../firebase/config';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as XLSX from 'xlsx';

const AdminQCM = () => {
  const { language } = useLanguage();
  const [videos, setVideos] = useState([]);
  const [qcms, setQcms] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState('');
  const [newQCM, setNewQCM] = useState({
    id: null, // Pour l'édition
    title: { fr: '', ar: '' },
    description: { fr: '', ar: '' },
    videoId: '',
    questions: [],
    timeLimit: 30,
    passingScore: 60,
    attempts: 3,
    source: 'manual',
    status: 'active'
  });
  const [excelFile, setExcelFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQCMId, setEditingQCMId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: { fr: '', ar: '' },
    options: [
      { fr: '', ar: '', isCorrect: false },
      { fr: '', ar: '', isCorrect: false },
      { fr: '', ar: '', isCorrect: false },
      { fr: '', ar: '', isCorrect: false }
    ],
    explanation: { fr: '', ar: '' },
    difficulty: 'medium'
  });

  useEffect(() => {
    fetchVideos();
    fetchQCMs();
  }, []);

  const fetchVideos = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'videos'));
      const videosList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVideos(videosList);
    } catch (err) {
      console.error('Erreur lors du chargement des vidéos:', err);
    }
  };

  const fetchQCMs = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'qcms'));
      const qcmsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setQcms(qcmsList);
    } catch (err) {
      setError(language === 'fr' ? 'Erreur lors du chargement des QCMs.' : 'خطأ أثناء تحميل الاختبارات.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getLocalizedText = (textObj) => {
    if (typeof textObj === 'string') return textObj;
    return textObj?.[language] || textObj?.fr || textObj?.ar || '';
  };

  const parseExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const questions = jsonData.map((row, index) => {
            const correctIndex = parseInt(row.correct_answer) - 1;
            const options = [];
            for (let i = 1; i <= 4; i++) {
              options.push({
                fr: row[`option${i}_fr`] || '',
                ar: row[`option${i}_ar`] || '',
                isCorrect: i - 1 === correctIndex
              });
            }
            return {
              question: { fr: row.question_fr || '', ar: row.question_ar || '' },
              options,
              explanation: { fr: row.explanation_fr || '', ar: row.explanation_ar || '' },
              difficulty: row.difficulty || 'medium'
            };
          });
          resolve(questions);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const questions = await parseExcelFile(file);
      setNewQCM({ ...newQCM, questions, source: 'excel' });
      setError('');
    } catch (err) {
      setError(language === 'fr' ? 'Erreur lors de la lecture du fichier Excel. Vérifiez le format.' : 'خطأ في قراءة ملف Excel. تحقق من التنسيق.');
    } finally {
      setUploading(false);
    }
  };

  const addQuestion = () => {
    if (!currentQuestion.question.fr || !currentQuestion.question.ar) {
      setError(language === 'fr' ? 'La question est requise dans les deux langues.' : 'السؤال مطلوب بكلا اللغتين.');
      return;
    }
    const hasCorrectAnswer = currentQuestion.options.some(option => option.isCorrect);
    if (!hasCorrectAnswer) {
      setError(language === 'fr' ? 'Veuillez sélectionner la bonne réponse.' : 'يرجى تحديد الإجابة الصحيحة.');
      return;
    }
    const filledOptions = currentQuestion.options.filter(option => option.fr.trim() && option.ar.trim());
    if (filledOptions.length < 2) {
      setError(language === 'fr' ? 'Au moins 2 options sont requises.' : 'مطلوب على الأقل خيارين.');
      return;
    }

    setNewQCM({ ...newQCM, questions: [...newQCM.questions, { ...currentQuestion }] });
    setCurrentQuestion({
      question: { fr: '', ar: '' },
      options: [
        { fr: '', ar: '', isCorrect: false },
        { fr: '', ar: '', isCorrect: false },
        { fr: '', ar: '', isCorrect: false },
        { fr: '', ar: '', isCorrect: false }
      ],
      explanation: { fr: '', ar: '' },
      difficulty: 'medium'
    });
    setError('');
  };

  const removeQuestion = (index) => {
    const updatedQuestions = newQCM.questions.filter((_, i) => i !== index);
    setNewQCM({ ...newQCM, questions: updatedQuestions });
  };

  const handleCreateOrUpdateQCM = async (e) => {
    e.preventDefault();
    if (!newQCM.title.fr || !newQCM.title.ar || !newQCM.videoId || newQCM.questions.length === 0) {
      setError(language === 'fr' ? 'Tous les champs obligatoires doivent être remplis et au moins une question ajoutée.' : 'جميع الحقول المطلوبة يجب أن تكون مملوءة وإضافة سؤال واحد على الأقل.');
      return;
    }

    try {
      setUploading(true);
      const qcmData = {
        title: newQCM.title,
        description: newQCM.description,
        videoId: newQCM.videoId,
        questions: newQCM.questions,
        timeLimit: newQCM.timeLimit,
        passingScore: newQCM.passingScore,
        attempts: newQCM.attempts,
        createdAt: newQCM.createdAt || new Date().toISOString(),
        status: newQCM.status
      };

      if (newQCM.id) {
        // Mise à jour
        await updateDoc(doc(db, 'qcms', newQCM.id), qcmData);
        setQcms(qcms.map(qcm => (qcm.id === newQCM.id ? { ...qcm, ...qcmData } : qcm)));
      } else {
        // Création
        const docRef = await addDoc(collection(db, 'qcms'), qcmData);
        setQcms([...qcms, { id: docRef.id, ...qcmData }]);
      }

      // Reset form
      setNewQCM({
        id: null,
        title: { fr: '', ar: '' },
        description: { fr: '', ar: '' },
        videoId: '',
        questions: [],
        timeLimit: 30,
        passingScore: 60,
        attempts: 3,
        source: 'manual',
        status: 'active'
      });
      setShowAddForm(false);
      setEditingQCMId(null);
      setError('');
    } catch (err) {
      setError(language === 'fr' ? 'Erreur lors de la création/mise à jour du QCM.' : 'خطأ أثناء إنشاء/تحديث الاختبار.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleEditQCM = (qcm) => {
    setNewQCM({
      id: qcm.id,
      title: qcm.title,
      description: qcm.description,
      videoId: qcm.videoId,
      questions: qcm.questions,
      timeLimit: qcm.timeLimit,
      passingScore: qcm.passingScore,
      attempts: qcm.attempts,
      source: qcm.source || 'manual',
      status: qcm.status
    });
    setShowAddForm(true);
    setEditingQCMId(qcm.id);
  };

  const handleDeleteQCM = async (qcmId) => {
    if (window.confirm(language === 'fr' ? 'Confirmer la suppression ?' : 'تأكيد الحذف؟')) {
      try {
        await deleteDoc(doc(db, 'qcms', qcmId));
        setQcms(qcms.filter(qcm => qcm.id !== qcmId));
      } catch (err) {
        setError(language === 'fr' ? 'Erreur lors de la suppression.' : 'خطأ أثناء الحذف.');
        console.error(err);
      }
    }
  };

  // Partie HTML (simplifiée pour l'ajout/modification)
  return (
    <div className="page-container max-w-6xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {language === 'fr' ? 'Gestion des QCM' : 'إدارة الاختبارات'}
        </h1>
        <button
          onClick={() => {
            setNewQCM({
              id: null,
              title: { fr: '', ar: '' },
              description: { fr: '', ar: '' },
              videoId: '',
              questions: [],
              timeLimit: 30,
              passingScore: 60,
              attempts: 3,
              source: 'manual',
              status: 'active'
            });
            setShowAddForm(true);
            setEditingQCMId(null);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {language === 'fr' ? 'Nouveau QCM' : 'اختبار جديد'}
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {showAddForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {language === 'fr' ? (editingQCMId ? 'Modifier le QCM' : 'Créer un nouveau QCM') : (editingQCMId ? 'تعديل الاختبار' : 'إنشاء اختبار جديد')}
          </h2>

          <form onSubmit={handleCreateOrUpdateQCM} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'fr' ? 'Titre (Français)' : 'العنوان (فرنسي)'}
                </label>
                <input
                  type="text"
                  value={newQCM.title.fr}
                  onChange={(e) => setNewQCM({ ...newQCM, title: { ...newQCM.title, fr: e.target.value } })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'fr' ? 'Titre (Arabe)' : 'العنوان (عربي)'}
                </label>
                <input
                  type="text"
                  value={newQCM.title.ar}
                  onChange={(e) => setNewQCM({ ...newQCM, title: { ...newQCM.title, ar: e.target.value } })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                {language === 'fr' ? 'Vidéo associée' : 'الفيديو المرتبط'}
              </label>
              <select
                value={newQCM.videoId}
                onChange={(e) => setNewQCM({ ...newQCM, videoId: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">
                  {language === 'fr' ? 'Sélectionner une vidéo' : 'اختر فيديو'}
                </option>
                {videos.map(video => (
                  <option key={video.id} value={video.id}>
                    {getLocalizedText(video.title)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'fr' ? 'Temps limite (minutes)' : 'الوقت المحدد (دقائق)'}
                </label>
                <input
                  type="number"
                  value={newQCM.timeLimit}
                  onChange={(e) => setNewQCM({ ...newQCM, timeLimit: parseInt(e.target.value) })}
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'fr' ? 'Score de réussite (%)' : 'نقاط النجاح (%)'}
                </label>
                <input
                  type="number"
                  value={newQCM.passingScore}
                  onChange={(e) => setNewQCM({ ...newQCM, passingScore: parseInt(e.target.value) })}
                  min="1"
                  max="100"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {language === 'fr' ? 'Nombre de tentatives' : 'عدد المحاولات'}
                </label>
                <input
                  type="number"
                  value={newQCM.attempts}
                  onChange={(e) => setNewQCM({ ...newQCM, attempts: parseInt(e.target.value) })}
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">
                {language === 'fr' ? 'Questions' : 'الأسئلة'}
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  {language === 'fr' ? 'Importer depuis Excel' : 'استيراد من Excel'}
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelUpload}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'fr' 
                    ? 'Format Excel: question_fr, question_ar, option1_fr, option1_ar, ..., correct_answer (1-4), explanation_fr, explanation_ar, difficulty'
                    : 'تنسيق Excel: question_fr, question_ar, option1_fr, option1_ar, ..., correct_answer (1-4), explanation_fr, explanation_ar, difficulty'
                  }
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <h4 className="font-medium mb-3">
                  {language === 'fr' ? 'Ajouter une question manuellement' : 'إضافة سؤال يدوياً'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {language === 'fr' ? 'Question (Français)' : 'السؤال (فرنسي)'}
                    </label>
                    <textarea
                      value={currentQuestion.question.fr}
                      onChange={(e) => setCurrentQuestion({
                        ...currentQuestion,
                        question: { ...currentQuestion.question, fr: e.target.value }
                      })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {language === 'fr' ? 'Question (Arabe)' : 'السؤال (عربي)'}
                    </label>
                    <textarea
                      value={currentQuestion.question.ar}
                      onChange={(e) => setCurrentQuestion({
                        ...currentQuestion,
                        question: { ...currentQuestion.question, ar: e.target.value }
                      })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows="2"
                    />
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {currentQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={option.isCorrect}
                        onChange={() => {
                          const updatedOptions = currentQuestion.options.map((opt, i) => ({
                            ...opt,
                            isCorrect: i === index
                          }));
                          setCurrentQuestion({ ...currentQuestion, options: updatedOptions });
                        }}
                      />
                      <input
                        type="text"
                        placeholder={`Option ${index + 1} (FR)`}
                        value={option.fr}
                        onChange={(e) => {
                          const updatedOptions = [...currentQuestion.options];
                          updatedOptions[index].fr = e.target.value;
                          setCurrentQuestion({ ...currentQuestion, options: updatedOptions });
                        }}
                        className="flex-1 p-2 border border-gray-300 rounded-md"
                      />
                      <input
                        type="text"
                        placeholder={`Option ${index + 1} (AR)`}
                        value={option.ar}
                        onChange={(e) => {
                          const updatedOptions = [...currentQuestion.options];
                          updatedOptions[index].ar = e.target.value;
                          setCurrentQuestion({ ...currentQuestion, options: updatedOptions });
                        }}
                        className="flex-1 p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      {language === 'fr' ? 'Explication (Français)' : 'التوضيح (فرنسي)'}
                    </label>
                    <textarea
                      value={currentQuestion.explanation.fr}
                      onChange={(e) => setCurrentQuestion({
                        ...currentQuestion,
                        explanation: { ...currentQuestion.explanation, fr: e.target.value }
                      })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      rows="2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {language === 'fr' ? 'Difficulté' : 'الصعوبة'}
                    </label>
                    <select
                      value={currentQuestion.difficulty}
                      onChange={(e) => setCurrentQuestion({
                        ...currentQuestion,
                        difficulty: e.target.value
                      })}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="easy">{language === 'fr' ? 'Facile' : 'سهل'}</option>
                      <option value="medium">{language === 'fr' ? 'Moyen' : 'متوسط'}</option>
                      <option value="hard">{language === 'fr' ? 'Difficile' : 'صعب'}</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addQuestion}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  {language === 'fr' ? 'Ajouter la question' : 'إضافة السؤال'}
                </button>
              </div>

              {newQCM.questions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">
                    {language === 'fr' ? `Questions ajoutées (${newQCM.questions.length})` : `الأسئلة المضافة (${newQCM.questions.length})`}
                  </h4>
                  {newQCM.questions.map((question, index) => (
                    <div key={index} className="bg-white p-3 rounded-md border flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{index + 1}. {getLocalizedText(question.question)}</p>
                        <div className="text-sm text-gray-600 mt-1">
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className={`ml-4 ${option.isCorrect ? 'text-green-600 font-medium' : ''}`}>
                              {String.fromCharCode(65 + optIndex)}. {getLocalizedText(option)} 
                              {option.isCorrect && ' ✓'}
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                      >
                        {language === 'fr' ? 'Supprimer' : 'حذف'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingQCMId(null);
                  setNewQCM({
                    id: null,
                    title: { fr: '', ar: '' },
                    description: { fr: '', ar: '' },
                    videoId: '',
                    questions: [],
                    timeLimit: 30,
                    passingScore: 60,
                    attempts: 3,
                    source: 'manual',
                    status: 'active'
                  });
                }}
                className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
              >
                {language === 'fr' ? 'Annuler' : 'إلغاء'}
              </button>
              <button
                type="submit"
                disabled={uploading || newQCM.questions.length === 0}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
              >
                {uploading 
                  ? (language === 'fr' ? 'En cours...' : 'جاري التنفيذ...')
                  : (editingQCMId ? (language === 'fr' ? 'Mettre à jour' : 'تحديث') : (language === 'fr' ? 'Créer' : 'إنشاء'))
                }
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {language === 'fr' ? 'QCMs existants' : 'الاختبارات الموجودة'}
        </h2>
        {loading ? (
          <p>{language === 'fr' ? 'Chargement...' : 'جاري التحميل...'}</p>
        ) : qcms.length === 0 ? (
          <p className="text-gray-500">
            {language === 'fr' ? 'Aucun QCM créé.' : 'لا توجد اختبارات.'}
          </p>
        ) : (
          qcms.map(qcm => {
            const associatedVideo = videos.find(v => v.id === qcm.videoId);
            return (
              <div key={qcm.id} className="bg-white p-4 rounded-lg shadow border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">
                      {getLocalizedText(qcm.title)}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {getLocalizedText(qcm.description)}
                    </p>
                    <div className="text-sm text-gray-500 space-y-1">
                      {associatedVideo && (
                        <p>
                          <span className="font-medium">
                            {language === 'fr' ? 'Vidéo:' : 'الفيديو:'}
                          </span> {getLocalizedText(associatedVideo.title)}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">
                          {language === 'fr' ? 'Questions:' : 'الأسئلة:'}
                        </span> {qcm.questions.length}
                      </p>
                      <p>
                        <span className="font-medium">
                          {language === 'fr' ? 'Temps limite:' : 'الوقت المحدد:'}
                        </span> {qcm.timeLimit} {language === 'fr' ? 'minutes' : 'دقائق'}
                      </p>
                      <p>
                        <span className="font-medium">
                          {language === 'fr' ? 'Score de réussite:' : 'نقاط النجاح:'}
                        </span> {qcm.passingScore}%
                      </p>
                    </div>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleEditQCM(qcm)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      {language === 'fr' ? 'Modifier' : 'تعديل'}
                    </button>
                    <button
                      onClick={() => handleDeleteQCM(qcm.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      {language === 'fr' ? 'Supprimer' : 'حذف'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminQCM;