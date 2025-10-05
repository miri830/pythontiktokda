import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Share2,
  Trophy,
  Target,
  BookOpen
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

const SharedQuizPage = () => {
  const { shareCode } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [showExplanation, setShowExplanation] = useState({});

  useEffect(() => {
    fetchSharedQuiz();
  }, [shareCode]);

  useEffect(() => {
    let timer;
    if (hasStarted && timeLeft > 0 && !results) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            submitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [hasStarted, timeLeft, results]);

  const fetchSharedQuiz = async () => {
    try {
      const response = await fetch(`${API_BASE}/shared-quiz/${shareCode}`);
      
      if (!response.ok) {
        throw new Error('Quiz tapılmadı');
      }

      const data = await response.json();
      setQuiz(data);
      setTimeLeft(data.questions.length * 60); // 1 minute per question
    } catch (error) {
      toast.error(error.message || 'Quiz yüklənə bilmədi');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    setHasStarted(true);
  };

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitQuiz = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/shared-quiz/${shareCode}/submit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          answers: selectedAnswers,
          user_name: user?.full_name || 'Anonim İstifadəçi'
        })
      });

      if (!response.ok) {
        throw new Error('Cavablar göndərilə bilmədi');
      }

      const results = await response.json();
      setResults(results);
      toast.success('Quiz tamamlandı! 🎉');
    } catch (error) {
      toast.error(error.message || 'Xəta baş verdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleExplanation = (questionIndex) => {
    setShowExplanation(prev => ({
      ...prev,
      [questionIndex]: !prev[questionIndex]
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p>Quiz yüklənir...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Quiz tapılmadı</h2>
          <p className="text-gray-600 mb-8">Bu link mövcud deyil və ya vaxtı bitib.</p>
          <Button onClick={() => navigate('/')} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            Ana səhifəyə qayıt
          </Button>
        </div>
      </div>
    );
  }

  // Results View
  if (results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Results Header */}
          <Card className="glass-card border-0 shadow-2xl mb-8">
            <CardContent className="p-8 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">Quiz Tamamlandı! 🎉</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl">
                  <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">{results.score}%</div>
                  <div className="text-gray-600">Nəticə</div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">{results.correct_answers}</div>
                  <div className="text-gray-600">Düzgün cavab</div>
                </div>
                <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl">
                  <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-800">{quiz.questions.length}</div>
                  <div className="text-gray-600">Ümumi sual</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quiz Info */}
          <Card className="glass-card border-0 shadow-xl mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                "{quiz.title}" quizi tamamlandı
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{quiz.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  Quiz yaradıcısı: {quiz.creator_name}
                </span>
                <span className="text-sm text-gray-500">
                  Kateqoriya: {quiz.category}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="space-y-4">
            {quiz.questions.map((question, index) => (
              <Card key={index} className="glass-card border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-medium text-gray-800 flex-1">
                      {index + 1}. {question.question_text}
                    </h3>
                    <div className="ml-4">
                      {selectedAnswers[index] === question.correct_answer ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      option.trim() && (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-lg border ${
                            optIndex === question.correct_answer
                              ? 'bg-green-100 border-green-300 text-green-800'
                              : selectedAnswers[index] === optIndex
                              ? 'bg-red-100 border-red-300 text-red-800'
                              : 'bg-gray-50 border-gray-200 text-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{String.fromCharCode(65 + optIndex)}. {option}</span>
                            <div className="flex items-center space-x-1">
                              {optIndex === question.correct_answer && (
                                <span className="text-green-600 font-medium">✓ Düzgün</span>
                              )}
                              {selectedAnswers[index] === optIndex && optIndex !== question.correct_answer && (
                                <span className="text-red-600 font-medium">✗ Seçiminiz</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                  
                  {question.explanation && (
                    <div className="mt-4">
                      <Button
                        onClick={() => toggleExplanation(index)}
                        variant="outline"
                        size="sm"
                      >
                        {showExplanation[index] ? 'İzahatı gizlət' : 'İzahatı göstər'}
                      </Button>
                      
                      {showExplanation[index] && (
                        <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-blue-800">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Dashboard-a qayıt
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Quiz Start Screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="glass-card border-0 shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{quiz.title}</h1>
              
              {quiz.description && (
                <p className="text-gray-600 mb-6">{quiz.description}</p>
              )}
              
              <div className="bg-white/60 backdrop-blur-sm p-6 rounded-xl mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{quiz.questions.length}</div>
                    <div className="text-gray-600">Sual sayı</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{formatTime(timeLeft)}</div>
                    <div className="text-gray-600">Vaxt limiti</div>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-500 mb-8">
                <p>Quiz yaradıcısı: <strong>{quiz.creator_name}</strong></p>
                <p>Kateqoriya: {quiz.category}</p>
              </div>
              
              <Button
                onClick={startQuiz}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 text-lg"
              >
                <Play className="w-5 h-5 mr-2" />
                Quizi Başlat
              </Button>
              
              <p className="text-xs text-gray-500 mt-4">
                Quiz başladıqdan sonra vaxt sayımına başlayacaq
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Quiz Taking View
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const answeredQuestions = Object.keys(selectedAnswers).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">{quiz.title}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-white px-3 py-1 rounded-lg">
                <Clock className="w-4 h-4 mr-2 text-red-600" />
                <span className={`font-mono ${timeLeft <= 60 ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              
              <div className="bg-white px-3 py-1 rounded-lg">
                <span className="text-gray-700">
                  {currentQuestionIndex + 1} / {quiz.questions.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>İrəliləyiş</span>
            <span>{answeredQuestions}/{quiz.questions.length} cavablandı</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-2 bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${(answeredQuestions / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <Card className="glass-card border-0 shadow-xl mb-8">
          <CardContent className="p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              {currentQuestionIndex + 1}. {currentQuestion.question_text}
            </h2>
            
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                option.trim() && (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
                    className={`w-full p-4 text-left rounded-lg border transition-all ${
                      selectedAnswers[currentQuestionIndex] === index
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                        : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="font-medium mr-3">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </button>
                )
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            variant="outline"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Əvvəlki
          </Button>
          
          <div className="flex space-x-2">
            {isLastQuestion && answeredQuestions === quiz.questions.length ? (
              <Button
                onClick={submitQuiz}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
                    Göndərilir...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Quizi Bitir
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={nextQuestion}
                disabled={isLastQuestion}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Növbəti
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedQuizPage;