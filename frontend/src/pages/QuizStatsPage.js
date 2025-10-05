import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { 
  ArrowLeft,
  Users,
  TrendingUp,
  Clock,
  Trophy,
  User,
  Target,
  Calendar,
  BarChart3,
  Share2
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

const QuizStatsPage = () => {
  const { quizId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizStats();
  }, [quizId]);

  const fetchQuizStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/quiz-stats/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        throw new Error('İstatistikalar yüklənə bilmədi');
      }
    } catch (error) {
      toast.error(error.message);
      navigate('/my-quizzes');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('az-AZ');
  };

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
                onClick={() => navigate('/my-quizzes')}
                variant="ghost"
                size="sm"
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Button>
              <h1 className="text-2xl font-bold gradient-text font-['Space_Grotesk']">
                Quiz Statistikaları
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quiz Info */}
        <Card className="glass-card border-0 shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-6 h-6 mr-3" />
              {stats.quiz_title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl text-center">
                <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">{stats.total_attempts}</div>
                <div className="text-gray-600">Ümumi həllci</div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl text-center">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">{stats.average_score}%</div>
                <div className="text-gray-600">Ortalama nəticə</div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl text-center">
                <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">
                  {stats.attempts.length > 0 ? Math.max(...stats.attempts.map(a => a.score)) : 0}%
                </div>
                <div className="text-gray-600">Ən yüksək nəticə</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attempts List */}
        <Card className="glass-card border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-6 h-6 mr-3" />
              Son Həlledənlər ({stats.attempts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.attempts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Hələ heç kim bu quizi həll etməyib</p>
                <p className="text-sm">Quizi paylaşın ki, dostlarınız həll etsin</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {stats.attempts
                  .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
                  .map((attempt, index) => (
                    <div 
                      key={attempt.id || index} 
                      className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            {attempt.solver_name}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(attempt.completed_at)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className={`text-lg font-bold ${
                            attempt.score >= 80 ? 'text-green-600' : 
                            attempt.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {attempt.score}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {attempt.correct_answers}/{attempt.total_questions}
                          </div>
                        </div>
                        
                        <div className={`w-3 h-3 rounded-full ${
                          attempt.score >= 80 ? 'bg-green-500' : 
                          attempt.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Share Reminder */}
        {stats.total_attempts === 0 && (
          <Card className="glass-card border-0 shadow-xl mt-8 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-8 text-center">
              <Share2 className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Quizinizi Paylaşın! 🚀
              </h3>
              <p className="text-gray-600 mb-6">
                Quiz linkini dostlarınızla paylaşın ki, həll etdikdə bildiriş alın və statistikalarınızı görün.
              </p>
              <Button
                onClick={() => navigate('/my-quizzes')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Paylaşmağa Qayıt
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QuizStatsPage;