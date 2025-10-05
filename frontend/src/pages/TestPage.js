import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { useAuth } from '../App';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Code,
  Clock,
  CheckCircle2,
  Circle,
  Flag,
  AlertCircle
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

const TestPage = () => {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [testData, setTestData] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalTimeLeft, setTotalTimeLeft] = useState(null);
  const [hardLimit, setHardLimit] = useState(null);
  const [timeUp, setTimeUp] = useState(false);
  const [answeredByIndex, setAnsweredByIndex] = useState({});

  useEffect(() => {
    // Read query params for quick modes
    const params = new URLSearchParams(location.search);
    const limitParam = params.get('limit');
    const timeParam = params.get('time');
    if (limitParam) {
      const lim = parseInt(limitParam, 10);
      if (!isNaN(lim) && lim > 0) setHardLimit(lim);
    }
    if (timeParam) {
      const t = parseInt(timeParam, 10);
      if (!isNaN(t) && t > 0) setTotalTimeLeft(t);
    }
    loadQuestion(0);
  }, [sessionId]);

  // Reset and start 30s timer on question change
  useEffect(() => {
    if (!testData) return;
    // Quick modes: global timer var, per-sual 30s taymeri söndür
    if (totalTimeLeft !== null) return;
    setTimeLeft(30);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoAdvance();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [testData?.question?.id, currentQuestion, totalTimeLeft]);

  // Global timer for quick modes
  useEffect(() => {
    if (totalTimeLeft === null) return;
    if (timeUp) return;
    const interval = setInterval(() => {
      setTotalTimeLeft((prev) => {
        if (prev === null) return prev;
        if (prev <= 1) {
          clearInterval(interval);
          setTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [totalTimeLeft, timeUp]);

  const loadQuestion = async (questionIndex) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/tests/${sessionId}/question/${questionIndex}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Sual yüklənə bilmədi');
      }

      const data = await response.json();
      setTestData(data);
      setCurrentQuestion(questionIndex);
      setSelectedOption(data.user_answer !== undefined ? data.user_answer : null);
      if (data.user_answer !== undefined) {
        setAnsweredByIndex(prev => ({ ...prev, [questionIndex]: data.user_answer }));
      }
      setLoading(false);
    } catch (error) {
      toast.error(error.message);
      navigate('/dashboard');
    }
  };

  const submitAnswer = async () => {
    if (selectedOption === null) return;

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/tests/${sessionId}/answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: String(testData.question.id || testData.question._id),
          selected_option: selectedOption
        })

      });

      if (!response.ok) {
        throw new Error('Server cavabı uğursuz oldu');
      }

      setAnswers(prev => ({
        ...prev,
        [testData.question.id || testData.question._id]: selectedOption
      }));
      setAnsweredByIndex(prev => ({ ...prev, [currentQuestion]: selectedOption }));

    } catch (error) {
      toast.error('Cavab saxlanıla bilmədi');
    }
  };

  const handleNext = async () => {
    await submitAnswer();
    const maxQuestions = hardLimit ? hardLimit : testData.total_questions;
    if (currentQuestion < maxQuestions - 1) {
      loadQuestion(currentQuestion + 1);
    } else {
      await handleFinishTest();
    }
  };


  const handlePrevious = async () => {
    await submitAnswer();
    if (currentQuestion > 0) {
      loadQuestion(currentQuestion - 1);
    }
  };

  // Auto-advance when time runs out (skip saving if no answer)
  const handleAutoAdvance = async () => {
    if (currentQuestion === testData.total_questions - 1) {
      if (selectedOption !== null) {
        await submitAnswer();
      }
      await handleFinishTest();
      return;
    }
    if (selectedOption !== null) {
      await submitAnswer();
    }
    loadQuestion(currentQuestion + 1);
  };

  const handleQuestionJump = async (questionIndex) => {
    await submitAnswer();
    // Restrict jumping beyond limit if set
    const maxQuestions = hardLimit ? hardLimit : testData.total_questions;
    if (questionIndex < maxQuestions) {
      loadQuestion(questionIndex);
    }
  };

  const handleFinishTest = async () => {
    await submitAnswer();

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/tests/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Test tamamlana bilmədi');
      }

      await response.json();
      navigate(`/result/${sessionId}`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600">Test yüklənir...</p>
        </div>
      </div>
    );
  }

  const totalForDisplay = hardLimit ? Math.min(hardLimit, testData.total_questions) : testData.total_questions;
  const progressPercentage = ((currentQuestion + 1) / totalForDisplay) * 100;
  const answeredCount = Object.keys(answers).length + (selectedOption !== null ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                <Code className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold gradient-text">İnformatika testləri</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {user?.full_name}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Section */}
        <div className="mb-8 slide-up">
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Test İrəliləməsi
                </h2>
              <div className="text-sm text-gray-600 flex items-center gap-3">
                {totalTimeLeft === null && (
                  <span className="px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 font-medium">
                    {timeLeft}s
                  </span>
                )}
                {totalTimeLeft !== null && (
                  <span className="px-2 py-1 rounded-md bg-red-100 text-red-700 font-medium">
                    {totalTimeLeft}s
                  </span>
                )}
                <span>
                  {currentQuestion + 1}/{totalForDisplay} sual
                </span>
              </div>
              </div>

              <Progress
                value={progressPercentage}
                className="h-3 mb-4 progress-animation"
              />

              <div className="flex justify-between text-sm text-gray-600">
                <span>Cavablanmış: {answeredCount}</span>
                <span>{Math.round(progressPercentage)}% tamamlandı</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <AlertCircle className="w-5 h-5 mr-2 text-indigo-600" />
                  Sual Naviqasiyası
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: totalForDisplay }, (_, index) => {
                    const isAnswered = answeredByIndex[index] !== undefined ||
                      (index === currentQuestion && selectedOption !== null);
                    const isCurrent = index === currentQuestion;

                    return (
                      <button
                        key={index}
                        onClick={() => handleQuestionJump(index)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${isCurrent
                          ? 'bg-indigo-500 text-white shadow-lg'
                          : isAnswered
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-indigo-500 rounded mr-2"></div>
                    <span className="text-gray-600">Cari sual</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded mr-2"></div>
                    <span className="text-gray-600">Cavablanmış</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-100 border-2 border-gray-300 rounded mr-2"></div>
                    <span className="text-gray-600">Cavablanmamış</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg scale-in">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-indigo-600 font-semibold">{currentQuestion + 1}</span>
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-800">
                        Sual {currentQuestion + 1}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Kateqoriya: {testData.question.category}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Question */}
                <div className="bg-indigo-50 p-6 rounded-xl">
                  <p className="text-lg text-gray-800 leading-relaxed">
                    {testData.question.question_text}
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {testData.question.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedOption(index)}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all hover:shadow-md ${selectedOption === index
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${selectedOption === index
                          ? 'border-indigo-500 bg-indigo-500'
                          : 'border-gray-300'
                          }`}>
                          {selectedOption === index && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 mr-2">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          <span className="text-gray-800">{option}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                  <Button
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    variant="outline"
                    className="btn-3d"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Əvvəlki
                  </Button>

                  <div className="text-sm text-gray-600">
                    {selectedOption !== null ? (
                      <span className="text-green-600 flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Cavab seçildi
                      </span>
                    ) : (
                      <span className="text-orange-600 flex items-center">
                        <Circle className="w-4 h-4 mr-1" />
                        Cavab seçin
                      </span>
                    )}
                  </div>

                  {currentQuestion === totalForDisplay - 1 ? (
                    <Button
                      onClick={handleFinishTest}
                      className="bg-green-600 hover:bg-green-700 btn-3d"
                    >
                      <Flag className="w-4 h-4 mr-2" />
                      Testi Bitir
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      className="btn-3d"
                    >
                      Növbəti
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {timeUp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Vaxt bitdi</h3>
            <p className="text-gray-600 mb-6">Məğlub oldunuz. Yenidən sınayın!</p>
            <div className="flex items-center justify-center gap-3">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => navigate('/missions')}>Missiyalara qayıt</Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>Ana səhifə</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestPage;  