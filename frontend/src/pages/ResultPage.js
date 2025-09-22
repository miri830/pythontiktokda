import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { useAuth } from '../App';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Trophy,
  Target,
  RotateCcw,
  Home,
  TrendingUp,
  BookOpen,
  Share2,
  Star
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

const ResultPage = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_BASE}/tests/${resultId}/result`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });


        console.log("Backend cavabı status:", res.status);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error("Backend error detail:", errData);
          throw new Error("Nəticə yüklənmədi");
        }

        const data = await res.json();
        console.log("Backenddən nəticə:", data);
        setResult(data);
      } catch (err) {
        console.error("Result fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [resultId]);

  const getScoreColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreMessage = (percentage) => {
    if (percentage >= 90) return { message: "Əla nəticə! 🏆", color: "text-green-600" };
    if (percentage >= 80) return { message: "Çox yaxşı! 🌟", color: "text-blue-600" };
    if (percentage >= 70) return { message: "Yaxşı nəticə! 👍", color: "text-yellow-600" };
    if (percentage >= 60) return { message: "Orta nəticə 📚", color: "text-orange-600" };
    return { message: "Daha çox məşq lazımdır 💪", color: "text-red-600" };
  };

  const shareResult = () => {
    if (!result) return;
    if (navigator.share) {
      navigator.share({
        title: 'Python Test Nəticəm',
        text: `Python testində ${result.percentage}% nəticə əldə etdim! 🎉`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(
        `Python testində ${result.percentage}% nəticə əldə etdim! 🎉 ${window.location.href}`
      );
      toast.success('Nəticə kopyalandı!');
    }
  };

  // 1) Yüklənmə vaxtı
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600">Nəticə hazırlanır...</p>
        </div>
      </div>
    );
  }

  // 2) Nəticə tapılmayıbsa
  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Nəticə tapılmadı və ya yüklənmədi.</p>
      </div>
    );
  }

  const scoreMessage = getScoreMessage(result.percentage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="text-center mb-12 slide-up">
          <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl float-animation ${result.percentage >= 80
            ? 'bg-gradient-to-r from-green-400 to-green-600'
            : result.percentage >= 60
              ? 'bg-gradient-to-r from-blue-400 to-blue-600'
              : 'bg-gradient-to-r from-orange-400 to-red-500'
            }`}>
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4 font-['Space_Grotesk']">
            Test Tamamlandı! 🎉
          </h1>
          <p className="text-xl text-gray-600">
            Aşağıda ətraflı nəticələrinizi görə bilərsiniz
          </p>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 scale-in">
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-800">{result.score}/{result.total_questions}</h3>
              <p className="text-gray-600">Doğru Cavab</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className={`text-3xl font-bold ${getScoreColor(result.percentage)}`}>
                {result.percentage}%
              </h3>
              <p className="text-gray-600">Nəticə</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-green-600">{result.correct_answers}</h3>
              <p className="text-gray-600">Doğru</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-3xl font-bold text-red-600">
                {result.total_questions - result.correct_answers}
              </h3>
              <p className="text-gray-600">Yanlış</p>
            </CardContent>
          </Card>
        </div>

        {/* Score Message & Progress */}
        <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg mb-12 fade-in">
          <CardContent className="p-8 text-center">
            <h2 className={`text-3xl font-bold mb-4 ${scoreMessage.color}`}>
              {scoreMessage.message}
            </h2>
            <div className="max-w-md mx-auto">
              <Progress
                value={result.percentage}
                className="h-4 mb-4 progress-animation"
              />
              <p className="text-gray-600">
                {result.total_questions} sualdan {result.correct_answers} düzgün cavab verdiniz
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mb-12 fade-in" style={{ animationDelay: '0.3s' }}>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 py-3 btn-3d"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Yeni Test
          </Button>

          <Button
            onClick={() => navigate('/leaderboard')}
            variant="outline"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold px-6 py-3 btn-3d"
          >
            <Trophy className="w-5 h-5 mr-2" />
            Liderlik Tablosu
          </Button>

          <Button
            onClick={shareResult}
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold px-6 py-3 btn-3d"
          >
            <Share2 className="w-5 h-5 mr-2" />
            Paylaş
          </Button>
        </div>

        {/* Detailed Results */}
        <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg fade-in" style={{ animationDelay: '0.5s' }}>
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <BookOpen className="w-6 h-6 mr-2 text-indigo-600" />
              Təfərrüatlı Nəticələr
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {result.questions_with_answers.map((item, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl border-2 ${item.is_correct
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                    }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.is_correct
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                      }`}>
                      {item.is_correct ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-800">
                          Sual {index + 1}
                        </h3>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                          {item.category}
                        </span>
                      </div>

                      <p className="text-gray-800 mb-4 leading-relaxed">
                        {item.question}
                      </p>
                      <div className="grid grid-cols-1 gap-3 mb-4">
                        {/* İstifadəçinin cavabı */}
                        <div
                          className={`p-3 rounded-lg border-2 ${item.is_correct
                            ? 'border-green-500 bg-green-100 text-green-800'
                            : 'border-red-500 bg-red-100 text-red-800'
                            }`}
                        >
                          <div className="flex items-center">
                            <span className="font-medium mr-2">Sənin cavabın:</span>
                            <span>{item.options[item.user_answer]}</span>
                            {!item.is_correct && (
                              <XCircle className="w-4 h-4 ml-auto text-red-600" />
                            )}
                          </div>
                        </div>

                        {/* Doğru cavab (əgər səhv edibsə göstərilir) */}
                        {!item.is_correct && (
                          <div className="p-3 rounded-lg border-2 border-green-500 bg-green-100 text-green-800">
                            <div className="flex items-center">
                              <span className="font-medium mr-2">Doğru cavab:</span>
                              <span>{item.options[item.correct_answer]}</span>
                              <CheckCircle2 className="w-4 h-4 ml-auto text-green-600" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                          <Star className="w-4 h-4 mr-2" />
                          İzah:
                        </h4>
                        <p className="text-blue-700 text-sm leading-relaxed">
                          {item.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Back to Dashboard */}
        <div className="text-center mt-12">
          <Link to="/dashboard">
            <Button variant="ghost" className="text-gray-600 hover:text-gray-800">
              <Home className="w-4 h-4 mr-2" />
              Əsas Səhifəyə Qayıt
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;

