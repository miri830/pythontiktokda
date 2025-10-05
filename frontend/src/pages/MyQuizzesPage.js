import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { 
  Plus, 
  Share2, 
  Eye, 
  Edit3,
  Trash2,
  ArrowLeft,
  Copy,
  ExternalLink,
  Users,
  Calendar,
  BarChart3,
  Globe,
  Lock,
  CheckCircle
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

const MyQuizzesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareModal, setShareModal] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchMyQuizzes();
  }, []);

  const fetchMyQuizzes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/user-quizzes/my-quizzes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      toast.error('Quizlər yüklənə bilmədi');
    } finally {
      setLoading(false);
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

  const deleteQuiz = async (quizId) => {
    if (!window.confirm('Bu quizi silmək istədiyinizdən əminsiniz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/user-quizzes/${quizId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setQuizzes(prev => prev.filter(q => q.id !== quizId));
        toast.success('Quiz silindi');
      } else {
        throw new Error('Quiz silinə bilmədi');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const ShareModal = ({ quiz, onClose }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold mb-4">Quiz Paylaş</h3>
        <p className="text-gray-600 mb-4">
          Bu linki dostlarınızla paylaşın. Onlar quizi həll etdikdə sizə bildiris gələcək.
        </p>
        
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <code className="text-sm text-gray-700 flex-1 mr-2">
              {generateShareLink(quiz)}
            </code>
            <Button
              onClick={() => copyShareLink(quiz)}
              size="sm"
              variant="outline"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Quiz həll et: ${generateShareLink(quiz)}`)}`)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
          >
            WhatsApp
          </Button>
          <Button
            onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(generateShareLink(quiz))}`)}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
          >
            Telegram
          </Button>
        </div>
        
        <Button
          onClick={onClose}
          variant="outline"
          className="w-full mt-3"
        >
          Bağla
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

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
                Mənim Quizlərim
              </h1>
            </div>
            
            <Button
              onClick={() => navigate('/create-quiz')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Yeni Quiz
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {quizzes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-indigo-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Plus className="w-12 h-12 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Hələ quiz yaratmamısınız
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              İlk quizinizi yaradın və dostlarınızla paylaşın. Onlar həll etdikdə bildiriş alacaqsınız.
            </p>
            <Button
              onClick={() => navigate('/create-quiz')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              İlk Quiz Yaradın
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="glass-card border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-gray-800 mb-2">
                        {quiz.title}
                      </CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          {quiz.is_public ? (
                            <Globe className="w-4 h-4 mr-1" />
                          ) : (
                            <Lock className="w-4 h-4 mr-1" />
                          )}
                          {quiz.is_public ? 'Açıq' : 'Gizli'}
                        </span>
                        <span>•</span>
                        <span>{quiz.questions?.length || 0} sual</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {quiz.description || 'Təsvir əlavə edilməyib'}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-500">
                        <Users className="w-4 h-4 mr-1" />
                        {quiz.total_attempts || 0} həllci
                      </span>
                      <span className="flex items-center text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(quiz.created_at).toLocaleDateString('az-AZ')}
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setShareModal(quiz)}
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Share2 className="w-4 h-4 mr-1" />
                        Paylaş
                      </Button>
                      
                      <Button
                        onClick={() => navigate(`/quiz-stats/${quiz.id}`)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <BarChart3 className="w-4 h-4 mr-1" />
                        Statistika
                      </Button>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => navigate(`/edit-quiz/${quiz.id}`)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Redaktə
                      </Button>
                      
                      <Button
                        onClick={() => deleteQuiz(quiz.id)}
                        size="sm"
                        variant="outline"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Sil
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {shareModal && (
        <ShareModal
          quiz={shareModal}
          onClose={() => setShareModal(null)}
        />
      )}
    </div>
  );
};

export default MyQuizzesPage;