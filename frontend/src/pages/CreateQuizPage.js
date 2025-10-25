import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { 
  Plus, 
  Trash2, 
  Share2, 
  Eye, 
  Save, 
  ArrowLeft,
  FileText,
  Users,
  Globe,
  Link2,
  Check,
  X,
  Edit3,
  Copy,
  CheckCircle
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

const CreateQuizPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    category: 'Ümumi',
    is_public: true,
    questions: []
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    explanation: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [isSaving, setIsSaving] = useState(false);
  const [createdQuiz, setCreatedQuiz] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const categories = [
    'Ümumi',
    'İnformasiya və informasiya prosesləri',
    'Say sistemləri', 
    'İnformasiyanın kodlaşdırılması',
    'Modelləşdirmə',
    'Kompüterin aparat təminatı',
    'Proqram təminatı',
    'Əməliyyat sistemi',
    'Verilənlər bazası',
    'Proqramlaşdırma',
    'Şəbəkə və İnternet',
    'İnformasiya təhlükəsizliyi'
  ];

  const handleQuestionChange = (field, value) => {
    setCurrentQuestion(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    
    // If the current correct answer becomes empty, reset to first non-empty option
    let newCorrectAnswer = currentQuestion.correct_answer;
    if (index === currentQuestion.correct_answer && !value.trim()) {
      // Find first non-empty option
      newCorrectAnswer = newOptions.findIndex(opt => opt.trim() !== '');
      if (newCorrectAnswer === -1) newCorrectAnswer = 0; // fallback to first option
    }
    
    setCurrentQuestion(prev => ({
      ...prev,
      options: newOptions,
      correct_answer: newCorrectAnswer
    }));
  };

  const addQuestion = () => {
    if (!currentQuestion.question_text.trim()) {
      toast.error('Sual mətni daxil edin');
      return;
    }
    
    const filledOptions = currentQuestion.options.filter(opt => opt.trim());
    if (filledOptions.length < 2) {
      toast.error('Ən azı 2 cavab variantı daxil edin');
      return;
    }
    
    // Check if correct answer index is valid for filled options
    if (currentQuestion.correct_answer >= filledOptions.length) {
      toast.error('Düzgün cavabı seçin - boş variantlar silinəcək');
      return;
    }
    
    // Create a clean question with only filled options and adjusted correct_answer
    const cleanQuestion = {
      ...currentQuestion,
      options: filledOptions,
      // Adjust correct_answer index if empty options were removed before the correct one
      correct_answer: filledOptions.findIndex((option, index) => {
        return currentQuestion.options[currentQuestion.correct_answer] === option;
      })
    };

    if (isEditing) {
      const newQuestions = [...quiz.questions];
      newQuestions[editingIndex] = cleanQuestion;
      setQuiz(prev => ({ ...prev, questions: newQuestions }));
      setIsEditing(false);
      setEditingIndex(-1);
      toast.success('Sual yeniləndi');
    } else {
      setQuiz(prev => ({
        ...prev,
        questions: [...prev.questions, cleanQuestion]
      }));
      toast.success('Sual əlavə edildi');
    }

    // Reset form
    setCurrentQuestion({
      question_text: '',
      options: ['', '', '', ''],
      correct_answer: 0,
      explanation: ''
    });
  };

  const editQuestion = (index) => {
    setCurrentQuestion(quiz.questions[index]);
    setIsEditing(true);
    setEditingIndex(index);
  };

  const deleteQuestion = (index) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
    toast.success('Sual silindi');
  };

  const saveQuiz = async () => {
    if (!quiz.title.trim()) {
      toast.error('Quiz adı daxil edin');
      return;
    }
    
    if (quiz.questions.length < 5) {
      toast.error('Zəhmət olmasa minimum 5 sual daxil edin');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/user-quizzes/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quiz)
      });

      if (!response.ok) {
        throw new Error('Quiz yadda saxlanıla bilmədi');
      }

      const data = await response.json();
      
      // Use the quiz data returned from the create endpoint
      if (data.quiz) {
        setCreatedQuiz(data.quiz);
        setShowShareModal(true);
      }
      
      toast.success('Quiz uğurla yaradıldı! 🎉');
    } catch (error) {
      console.error('Quiz creation error:', error);
      if (error.message.includes('401')) {
        toast.error('Giriş vaxtınız bitişdi. Yənidən giriş edin.');
        localStorage.removeItem('token');
        navigate('/login');
      } else if (error.message.includes('400')) {
        toast.error('Quiz məlumatlarında xəta var. Yənidən yoxlayın.');
      } else {
        toast.error(error.message || 'Xəta baş verdi. Yənidən cəhd edin.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const generateShareLink = (quiz) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared-quiz/${quiz.share_code}`;
  };

  const copyShareLink = async (quiz) => {
    const shareLink = generateShareLink(quiz);
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success('Link köçürüldü! 📋');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Link köçürülə bilmədi');
    }
  };

  const shareViaWhatsApp = (quiz) => {
    const shareLink = generateShareLink(quiz);
    const message = `${quiz.title} - Quiz həll et: ${shareLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareViaTelegram = (quiz) => {
    const shareLink = generateShareLink(quiz);
    const message = `${quiz.title} - Quiz həll et:`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(message)}`, '_blank');
  };

  // Share Modal Component
  const ShareModal = ({ quiz, onClose, onGoToQuizzes }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <Share2 className="w-8 h-8 text-green-600" />
        </div>
        
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Quiz Uğurla Yaradıldı! 🎉
        </h3>
        <p className="text-gray-600 mb-6">
          İndi quizinizi dostlarınızla paylaşın və onlar həll etdikdə bildiriş alın!
        </p>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Paylaşım Linki:</p>
          <div className="flex items-center justify-between bg-white p-2 rounded border">
            <code className="text-sm text-gray-700 flex-1 mr-2 break-all">
              {generateShareLink(quiz)}
            </code>
            <Button
              onClick={() => copyShareLink(quiz)}
              size="sm"
              variant="outline"
              className="ml-2"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        <div className="space-y-3 mb-6">
          <Button
            onClick={() => shareViaWhatsApp(quiz)}
            className="w-full bg-green-500 hover:bg-green-600 text-white"
          >
            <span className="mr-2">📱</span>
            WhatsApp ilə Paylaş
          </Button>
          
          <Button
            onClick={() => shareViaTelegram(quiz)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            <span className="mr-2">✈️</span>
            Telegram ilə Paylaş
          </Button>
        </div>
        
        <div className="flex space-x-3">
          <Button
            onClick={onGoToQuizzes}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Mənim Quizlərim
          </Button>
          
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Yeni Quiz Yarat
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                size="sm"
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Button>
              <h1 className="text-2xl font-bold gradient-text font-['Space_Grotesk']">
                Quiz Yarat
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={saveQuiz}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSaving ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
                    Saxlanılır...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Quiz Saxla
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quiz Settings */}
          <div className="space-y-6">
            <Card className="glass-card border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Quiz Məlumatları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Quiz Adı</label>
                  <input
                    type="text"
                    value={quiz.title}
                    onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Quiz adını daxil edin..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Təsvir</label>
                  <textarea
                    value={quiz.description}
                    onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Quiz haqqında məlumat..."
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Kateqoriya</label>
                  <select
                    value={quiz.category}
                    onChange={(e) => setQuiz(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={quiz.is_public}
                    onChange={(e) => setQuiz(prev => ({ ...prev, is_public: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="isPublic" className="text-sm">
                    Hamı üçün açıq olsun
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Question Form */}
            <Card className="glass-card border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  {isEditing ? 'Sualı Redaktə Et' : 'Yeni Sual Əlavə Et'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Sual</label>
                  <textarea
                    value={currentQuestion.question_text}
                    onChange={(e) => handleQuestionChange('question_text', e.target.value)}
                    placeholder="Sualı daxil edin..."
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Cavab Variantları</label>
                  <div className="space-y-2">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = currentQuestion.correct_answer === index;
                      const hasValue = option.trim() !== '';
                      
                      return (
                        <div key={index} className={`flex items-center space-x-2 p-2 rounded-lg transition-all ${
                          isSelected && hasValue ? 'bg-green-50 border border-green-200' : 'border border-transparent'
                        }`}>
                          <input
                            type="radio"
                            name="correct"
                            checked={isSelected}
                            onChange={() => handleQuestionChange('correct_answer', index)}
                            className="text-green-500"
                            disabled={!hasValue}
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`${index + 1}. cavab variantı`}
                            className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
                              isSelected && hasValue ? 'border-green-300 bg-green-50' : 'border-gray-300'
                            }`}
                          />
                          {isSelected && hasValue && (
                            <span className="text-green-600 text-sm font-medium flex items-center">
                              ✓ Düzgün cavab
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    📝 Düzgün cavabı seçin və variantları doldurun. Boş variantlar avtomatik silinəcək.
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">İzahat (ixtiyari)</label>
                  <textarea
                    value={currentQuestion.explanation}
                    onChange={(e) => handleQuestionChange('explanation', e.target.value)}
                    placeholder="Cavabın izahatı..."
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={addQuestion}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isEditing ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Sualı Yenilə
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Sual Əlavə Et
                      </>
                    )}
                  </Button>
                  
                  {isEditing && (
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setEditingIndex(-1);
                        setCurrentQuestion({
                          question_text: '',
                          options: ['', '', '', ''],
                          correct_answer: 0,
                          explanation: ''
                        });
                      }}
                      variant="outline"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Questions List */}
          <div>
            <Card className="glass-card border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Əlavə Edilmiş Suallar ({quiz.questions.length})
                  </span>
                  {quiz.questions.length >= 5 && (
                    <span className="text-green-600 text-sm font-medium">
                      ✓ Saxlamağa hazır
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quiz.questions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Hələ sual əlavə edilməyib</p>
                    <p className="text-sm">Minimum 5 sual lazımdır</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {quiz.questions.map((question, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-800">
                            {index + 1}. {question.question_text}
                          </h4>
                          <div className="flex space-x-1">
                            <Button
                              onClick={() => editQuestion(index)}
                              size="sm"
                              variant="ghost"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => deleteQuestion(index)}
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          {question.options.map((option, optIndex) => (
                            option.trim() && (
                              <div
                                key={optIndex}
                                className={`text-sm px-2 py-1 rounded ${
                                  optIndex === question.correct_answer
                                    ? 'bg-green-100 text-green-800 font-medium'
                                    : 'text-gray-600'
                                }`}
                              >
                                {String.fromCharCode(65 + optIndex)}. {option}
                                {optIndex === question.correct_answer && ' ✓'}
                              </div>
                            )
                          ))}
                        </div>
                        
                        {question.explanation && (
                          <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                            <strong>İzahat:</strong> {question.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Share Modal */}
      {showShareModal && createdQuiz && (
        <ShareModal
          quiz={createdQuiz}
          onClose={() => {
            setShowShareModal(false);
            setCreatedQuiz(null);
            // Reset form for new quiz
            setQuiz({
              title: '',
              description: '',
              category: 'Ümumi',
              is_public: true,
              questions: []
            });
          }}
          onGoToQuizzes={() => {
            setShowShareModal(false);
            navigate('/my-quizzes');
          }}
        />
      )}
    </div>
  );
};

export default CreateQuizPage;