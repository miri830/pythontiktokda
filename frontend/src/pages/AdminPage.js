import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { useAuth } from '../App';
import { toast } from 'sonner';
import {
  Settings,
  Users,
  BookOpen,
  Plus,
  Trash2,
  ArrowLeft,
  BarChart3,
  AlertTriangle,
  User,
  Target,
  Crown
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';
// (QEYD) handleAddQuestion komponent daxilində elan ediləcək


const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [questionSubmissions, setQuestionSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // New question form
  const [newQuestion, setNewQuestion] = useState({
    category: '',
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    explanation: '',
    is_premium: false
  });

  const handleAddQuestion = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    try {
      setIsAddingQuestion(true);

      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Əvvəlcə admin olaraq login olun.');
        setIsAddingQuestion(false);
        return;
      }

      const cleanedOptions = (newQuestion.options || [])
        .map(opt => (typeof opt === 'string' ? opt.trim() : opt))
        .filter(opt => opt && opt.length > 0);

      if (!newQuestion.category || !newQuestion.question_text || cleanedOptions.length < 2) {
        toast.error('Kateqoriya, sual mətni və ən azı 2 variant əlavə edin.');
        setIsAddingQuestion(false);
        return;
      }

      // Kateqoriya artıq 17 mövzudan birinin tam adı kimi saxlanacaq
      const category = newQuestion.category;

      const correct = Number(newQuestion.correct_answer);
      if (Number.isNaN(correct) || correct < 0 || correct >= cleanedOptions.length) {
        toast.error('Düzgün cavabın index-i səhvdir.');
        setIsAddingQuestion(false);
        return;
      }

      const payload = {
        category,
        question_text: newQuestion.question_text.trim(),
        options: cleanedOptions,
        correct_answer: correct,
        explanation: (newQuestion.explanation || '').trim(),
        is_premium: Boolean(newQuestion.is_premium)
      };

      const res = await fetch(`${API_BASE}/admin/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        let err = { detail: 'Sual əlavə edilə bilmədi' };
        try { err = await res.json(); } catch (e) {}
        throw new Error(err.detail || `Status ${res.status}`);
      }

      const created = await res.json();
      toast.success('Sual uğurla əlavə olundu');

      setQuestions(prev => [...prev, created]);

      setNewQuestion({
        category: '',
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: 0,
        explanation: ''
      });

    } catch (err) {
      console.error('Sual əlavə olunmadı:', err);
      toast.error(err.message || 'Sual əlavə edilərkən xəta baş verdi');
    } finally {
      setIsAddingQuestion(false);
    }
  };

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch stats
      const statsResponse = await fetch(`${API_BASE}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch users
      const usersResponse = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }

      // Fetch questions
      const questionsResponse = await fetch(`${API_BASE}/admin/questions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData);
      }

      // Fetch question submissions
      const submissionsResponse = await fetch(`${API_BASE}/admin/question-submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (submissionsResponse.ok) {
        const submissionsData = await submissionsResponse.json();
        setQuestionSubmissions(submissionsData);
      }

    } catch (error) {
      toast.error('Məlumatlar yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Bu istifadəçini silməkdə əminsinizmi?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('İstifadəçi silindi');
        setUsers(users.filter(u => u._id !== userId));
      } else {
        throw new Error('Silmə əməliyyatı uğursuz oldu');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Question submission approval/rejection
  const handleApproveSubmission = async (submissionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/admin/question-submissions/${submissionId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Təsdiqlənə bilmədi');
      
      toast.success('Sual təsdiqlədi və əlavə olundu! 🎉');
      
      // Update submissions list
      setQuestionSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, status: 'approved' }
            : sub
        )
      );
      
      // Refresh questions list
      fetchData();
      
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleRejectSubmission = async (submissionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/admin/question-submissions/${submissionId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Ləğv edilə bilmədi');
      
      toast.success('Sual ləğv edildi');
      
      // Update submissions list
      setQuestionSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, status: 'rejected' }
            : sub
        )
      );
      
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Toggle premium for user
  const handleTogglePremium = async (userId, makePremium) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/admin/users/${userId}/toggle-premium`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Premium dəyişdirilə bilmədi');
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_premium: updated.is_premium } : u));
      toast.success(updated.is_premium ? 'Premium aktivləşdirildi' : 'Premium ləğv edildi');
    } catch (e) {
      toast.error(e.message || 'Xəta baş verdi');
    }
  };

  // Sual silmə funksiyası
  const handleDeleteQuestion = async (question) => {
    const questionId = question._id || question.id || question.questionId;
    if (!questionId) {
      console.error("Sualın ID-si tapılmadı:", question);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/admin/questions/${questionId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      setQuestions(prev => prev.filter(q => (q._id || q.id || q.questionId) !== questionId));
      console.log("Sual silindi:", questionId);
    } catch (err) {
      console.error(err);
    }
  };


  const handleOptionChange = (index, value) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion({ ...newQuestion, options: newOptions });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600">Admin paneli yüklənir...</p>
        </div>
      </div>
    );
  }

  const categories = [
    'İnformasiya və informasiya prosesləri',
    'Say sistemləri',
    'İnformasiyanın kodlaşdırılması və miqdarının ölçülməsi',
    'Modelləşdirmə',
    'Kompüterin aparat təminatı',
    'Kompüterin proqram təminatı',
    'Əməliyyat sistemi',
    'Mətnlərin email',
    'Elektron cədvəllər',
    'Verilənlər bazası',
    'Kompüter qrafikası',
    'Alqoritm',
    'Proqramlaşdırma',
    'Kompüter şəbəkəsi',
    'İnternet',
    'Veb-proqramlaşdırma',
    'İnformasiya təhlükəsizliyi'
  ];

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
              <Settings className="w-8 h-8 text-purple-600 mr-3" />
              <h1 className="text-2xl font-bold gradient-text font-['Space_Grotesk']">
                Admin Panel
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-800 font-medium">{user?.full_name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 mb-8 slide-up">
          {[
            { id: 'dashboard', label: 'İstatistika', icon: BarChart3 },
            { id: 'users', label: 'İstifadəçilər', icon: Users },
            { id: 'questions', label: 'Suallar', icon: BookOpen },
            { id: 'submissions', label: 'Sual Təqdimləri', icon: AlertTriangle }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${activeTab === tab.id
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
            >
              <tab.icon className="w-5 h-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 scale-in">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800">{stats.total_users}</h3>
                  <p className="text-gray-600">İstifadəçi</p>
                </CardContent>
              </Card>

              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800">{stats.total_questions}</h3>
                  <p className="text-gray-600">Sual</p>
                </CardContent>
              </Card>

              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Target className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800">{stats.total_tests}</h3>
                  <p className="text-gray-600">Test</p>
                </CardContent>
              </Card>

              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-yellow-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <BarChart3 className="w-8 h-8 text-yellow-600" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-800">
                    {stats.total_tests > 0 ? ((stats.total_tests / stats.total_users) || 0).toFixed(1) : '0'}
                  </h3>
                  <p className="text-gray-600">Ortalama Test</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Users */}
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-6 h-6 mr-2 text-indigo-600" />
                  Son Qeydiyyatlar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recent_users?.slice(0, 5).map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-white border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">{user.full_name}</h4>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {user.total_tests} test
                        </p>
                        <p className="text-sm text-gray-500">
                          {(() => { const dt=new Date(user.created_at); const y=dt.getFullYear(); const m=String(dt.getMonth()+1).padStart(2,'0'); const d=String(dt.getDate()).padStart(2,'0'); return `${y}.${m}.${d}`; })()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg scale-in">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="w-6 h-6 mr-2 text-indigo-600" />
                Bütün İstifadəçilər ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 rounded-lg bg-white border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                        {user.profile_image ? (
                          <img src={user.profile_image} alt={user.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-indigo-100">
                            <User className="w-6 h-6 text-indigo-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800 flex items-center">
                          {user.full_name}
                          {user.is_admin && (
                            <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                              Admin
                            </span>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.bio && (
                          <p className="text-sm text-gray-500 truncate max-w-md">{user.bio}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-800">
                          {user.total_tests} test
                        </p>
                        <p className="text-sm text-gray-600">
                          {user.average_score ? user.average_score.toFixed(1) : 0}% ortalama
                        </p>

                        <p className="text-xs text-gray-500">
                          {(() => { const dt=new Date(user.created_at); const y=dt.getFullYear(); const m=String(dt.getMonth()+1).padStart(2,'0'); const d=String(dt.getDate()).padStart(2,'0'); return `${y}.${m}.${d}`; })()}
                        </p>
                        {user.is_premium && (
                          <p className="text-xs text-yellow-700 font-semibold">Premium</p>
                        )}
                      </div>
                      {!user.is_admin && (
                        <Button
                          onClick={() => handleDeleteUser(user.id)}
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      {!user.is_admin && (
                        <Button
                          onClick={() => handleTogglePremium(user.id, !user.is_premium)}
                          variant="outline"
                          size="sm"
                          className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                        >
                          {user.is_premium ? 'Premiumu ləğv et' : 'Premium edin'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-6 scale-in">
            {/* Add Question Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">
                Suallar ({questions.length})
              </h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white btn-3d">
                    <Plus className="w-5 h-5 mr-2" />
                    Yeni Sual
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Yeni Sual Əlavə Et</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="category">Kateqoriya</Label>
                      <Select value={newQuestion.category} onValueChange={(value) => setNewQuestion({ ...newQuestion, category: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Kateqoriya seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="question">Sual</Label>
                      <Textarea
                        id="question"
                        value={newQuestion.question_text}
                        onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                        placeholder="Sualınızı yazın..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Cavab Variantları</Label>
                      <div className="space-y-2">
                        {newQuestion.options.map((opt, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={opt}
                              onChange={(e) => {
                                const updatedOptions = [...newQuestion.options];
                                updatedOptions[index] = e.target.value;
                                setNewQuestion({ ...newQuestion, options: updatedOptions });
                              }}
                              placeholder={`${String.fromCharCode(65 + index)} variantı`}
                              className="flex-1"
                            />
                            <input
                              type="radio"
                              name="correct_answer"
                              checked={newQuestion.correct_answer === index}
                              onChange={() =>
                                setNewQuestion({
                                  ...newQuestion,
                                  correct_answer: Number(index), // Number vacibdir
                                })
                              }
                              className="w-4 h-4 text-green-600"
                            />
                          </div>
                        ))}
                      </div>

                      <p className="text-sm text-gray-600 mt-2">
                        Doğru cavabın yanındakı radio button-u seçin
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="explanation">İzah</Label>
                      <Textarea
                        id="explanation"
                        value={newQuestion.explanation}
                        onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                        placeholder="Sualın izahını yazın..."
                        rows={3}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="premiumQuestion"
                        type="checkbox"
                        checked={newQuestion.is_premium}
                        onChange={(e) => setNewQuestion({ ...newQuestion, is_premium: e.target.checked })}
                      />
                      <Label htmlFor="premiumQuestion">Premium sual</Label>
                    </div>

                    <Button
                      onClick={handleAddQuestion}
                      disabled={isAddingQuestion}
                      className="w-full btn-3d"
                    >
                      {isAddingQuestion ? 'Əlavə edilir...' : 'Sual Əlavə Et'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Questions List */}
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {questions?.map((question, index) => {
                    // Konsolda bütün sual obyektini göstər
                    console.log('Question object:', question);

                    // Doğru ID-nin hansını istifadə edəcəyimizi seçirik
                    const questionId = question._id || question.id || question.questionId; // backend-dən gələn property-yə uyğun dəyiş

                    return (
                      <div key={questionId || index} className="p-6 rounded-xl border-2 border-gray-200 bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <span className="text-indigo-600 font-semibold">{index + 1}</span>
                            </div>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                              {question.category}
                            </span>
                          </div>
                          <Button
                            onClick={() => handleDeleteQuestion(question)}
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>

                        </div>

                        <p className="text-gray-800 mb-4 leading-relaxed">
                          {question.question_text}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          {question.options?.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`p-3 rounded-lg border-2 ${optionIndex === question.correct_answer
                                ? 'border-green-500 bg-green-100 text-green-800'
                                : 'border-gray-200 bg-gray-50 text-gray-700'
                                }`}
                            >
                              <span className="font-medium mr-2">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              {option}
                            </div>
                          ))}
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-800 mb-2">İzah:</h4>
                          <p className="text-blue-700 text-sm leading-relaxed">
                            {question.explanation}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Submissions Tab */}
        {activeTab === 'submissions' && (
          <div className="space-y-6 scale-in">
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-6 h-6 mr-2 text-orange-600" />
                  İstifadəçi Sual Təqdimləri ({questionSubmissions.filter(s => s.status === 'pending').length} gözləyir)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {questionSubmissions.length === 0 ? (
                    <div className="text-center py-12">
                      <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-gray-600 mb-2">
                        Sual təqdimi yoxdur
                      </h3>
                      <p className="text-gray-500">
                        İstifadəçilər helə sual göndərməyib
                      </p>
                    </div>
                  ) : (
                    questionSubmissions.map((submission) => (
                      <div key={submission.id} className="bg-white rounded-xl border-2 border-gray-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{submission.user_name}</h4>
                              <p className="text-sm text-gray-500">
                                {new Date(submission.submitted_at).toLocaleDateString('az-AZ')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {submission.status === 'pending' ? 'Gözləyir' :
                               submission.status === 'approved' ? 'Təsdiqləndi' : 'Ləğv edildi'}
                            </span>
                            {submission.status === 'pending' && (
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => handleApproveSubmission(submission.id)}
                                  size="sm"
                                  className="bg-green-500 hover:bg-green-600 text-white"
                                >
                                  🎉 Təsdiqlə
                                </Button>
                                <Button
                                  onClick={() => handleRejectSubmission(submission.id)}
                                  variant="outline"
                                  size="sm"
                                  className="border-red-200 text-red-700 hover:bg-red-50"
                                >
                                  ❌ Ləğv et
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mb-3">
                          <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                            {submission.category}
                          </span>
                        </div>

                        <p className="text-gray-800 mb-4 leading-relaxed font-medium">
                          {submission.question_text}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          {submission.options?.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`p-3 rounded-lg border-2 ${
                                optionIndex === submission.correct_answer
                                  ? 'border-green-500 bg-green-100 text-green-800'
                                  : 'border-gray-200 bg-gray-50 text-gray-700'
                              }`}
                            >
                              <span className="font-medium mr-2">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              {option}
                              {optionIndex === submission.correct_answer && (
                                <span className="ml-2 text-green-600">✓</span>
                              )}
                            </div>
                          ))}
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-medium text-blue-800 mb-2">📝 İzahat:</h4>
                          <p className="text-blue-700 text-sm leading-relaxed">
                            {submission.explanation}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage; 