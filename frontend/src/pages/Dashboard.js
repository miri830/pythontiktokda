  import React, { useState, useEffect } from 'react';
  import { useNavigate, Link } from 'react-router-dom';
  import { Button } from '../components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
  import { useAuth } from '../App';
  import { toast } from 'sonner';
  import { 
    Code, 
    Trophy, 
    Users, 
    Play, 
    LogOut, 
    User, 
    Settings,
    BookOpen,
    Award,
    TrendingUp,
    Contact,
    Sparkles,
    Clock,
    Target,
    Info,
    Binary,
    Layers,
    Cpu,
    Cog,
    Monitor,
    Mail,
    FileText,
    Table,
    Database,
    Image,
    GitBranch,
    Code2,
    Network,
    Globe,
    Shield,
    Crown,
    Zap,
    Star,
    CheckCircle,
    Infinity,
    Plus,
    Bell,
    Eye
  } from 'lucide-react';

  const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

  const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isStarting, setIsStarting] = useState(false);
    const [gami, setGami] = useState(null);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    const handleStartTest = async () => {
      setIsStarting(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Sessiya bitib. Zəhmət olmasa yenidən daxil olun.');
          navigate('/login');
          return;
        }
        const response = await fetch(`${API_BASE}/tests/start`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast.error('İcazə yoxdur (401). Zəhmət olmasa yenidən daxil olun.');
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          throw new Error('Test başladıla bilmədi');
        }

        const data = await response.json();
        navigate(`/test/${data.session_id}`);
      } catch (error) {
        toast.error(error.message || 'Xəta baş verdi');
      } finally {
        setIsStarting(false);
      }
    };

    const handleLogout = () => {
      logout();
      toast.success('Çıxış etdiniz');
    };

    // Initialize data if needed
    useEffect(() => {
      const initializeData = async () => {
        try {
          const response = await fetch(`${API_BASE}/init-data`, {
            method: 'POST'
          });
          if (response.ok) {
            const data = await response.json();
            if (data.message.includes('əlavə edildi')) {
              toast.success('Sistem hazırlandı');
            }
          }
        } catch (error) {
          console.log('Init data error:', error);
        }
      };

      initializeData();
    }, []);

    // Gamification summary
    useEffect(() => {
      const fetchGami = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_BASE}/gamification/summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setGami(data);
          }
        } catch (e) {
          console.log('Gamification fetch error', e);
        }
      };
      fetchGami();
    }, []);

    // Fetch unread notifications count
    useEffect(() => {
      const fetchNotifications = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`${API_BASE}/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const unreadCount = data.filter(n => !n.read).length;
            setUnreadNotifications(unreadCount);
          }
        } catch (e) {
          console.log('Notifications fetch error', e);
        }
      };
      fetchNotifications();
    }, []);

    const menuItems = [
      {
        title: 'Quiz Yarat',
        description: 'Öz quizinizi yaradın və paylaşın',
        icon: Plus,
        path: '/create-quiz',
        gradient: 'from-emerald-500 to-teal-500'
      },
      {
        title: 'Mənim Quizlərim',
        description: 'Yaratdığınız quizləri idarə edin',
        icon: Eye,
        path: '/my-quizzes',
        gradient: 'from-cyan-500 to-blue-500'
      },
      {
        title: 'Liderlik Tablosu',
        description: 'Ən yaxşı nəticələrə baxın',
        icon: Trophy,
        path: '/leaderboard',
        gradient: 'from-yellow-500 to-orange-500'
      },
      {
        title: 'Sual Göndər',
        description: 'Öz suallarınızı əlavə edin',
        icon: Plus,
        path: '/submit-question',
        gradient: 'from-blue-500 to-indigo-500'
      },
      {
        title: 'Bildirişlər',
        description: 'Bildirişlərinizi görün',
        icon: Bell,
        path: '/notifications',
        gradient: 'from-purple-500 to-pink-500'
      },
      {
        title: 'Əlaqə',
        description: 'Bizimlə əlaqə saxlayın',
        icon: Contact,
        path: '/contact',
        gradient: 'from-green-500 to-emerald-500'
      }
    ];

    // İnformatika mövzuları (ikonlarla)
    const topics = [
      { label: 'İnformasiya və informasiya prosesləri', icon: Info },
      { label: 'Say sistemləri', icon: Binary },
      { label: 'İnformasiyanın kodlaşdırılması və miqdarının ölçülməsi', icon: Binary },
      { label: 'Modelləşdirmə', icon: Layers },
      { label: 'Kompüterin aparat təminatı', icon: Cpu },
      { label: 'Kompüterin proqram təminatı', icon: Cog },
      { label: 'Əməliyyat sistemi', icon: Monitor },
      { label: 'Mətnlərin email', icon: Mail },
      { label: 'Elektron cədvəllər', icon: Table },
      { label: 'Verilənlər bazası', icon: Database },
      { label: 'Kompüter qrafikası', icon: Image },
      { label: 'Alqoritm', icon: GitBranch },
      { label: 'Proqramlaşdırma', icon: Code },
      { label: 'Kompüter şəbəkəsi', icon: Network },
      { label: 'İnternet', icon: Globe },
      { label: 'Veb-proqramlaşdırma', icon: Code2 },
      { label: 'İnformasiya təhlükəsizliyi', icon: Shield }
    ];

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
                <h1 className="text-2xl font-bold gradient-text font-['Space_Grotesk']">
                  İnformatika testləri
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/notifications')}
                  className="relative flex items-center space-x-2 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition"
                  title="Bildirişlər"
                >
                  <Bell className="w-4 h-4 text-indigo-600" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => navigate(`/profile/${user?.id}`)}
                  className="flex items-center space-x-2 bg-indigo-50 px-3 py-2 rounded-lg hover:bg-indigo-100 transition"
                  title="Profilə bax"
                >
                  <User className="w-4 h-4 text-indigo-600" />
                  <span className="text-indigo-800 font-medium">{user?.full_name}</span>
                </button>
                
                {user?.is_admin && (
                  <Button
                    onClick={() => navigate('/admin')}
                    variant="outline"
                    size="sm"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                )}
                
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Çıxış
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="text-center mb-12 slide-up">
            <div className="mb-6">
              <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl float-animation">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-800 mb-4 font-['Space_Grotesk']">
              Xoş gəldiniz, {user?.full_name}! 🎉
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              İnformatika biliklərinizi sınayın və digərləri ilə müqayisə edin.
              Hər test 8 sualdan ibarətdir və 17 kateqoriyadan təsadüfi seçilir.
            </p>
          </div>

          {/* Main Test Card */}
          <div className="mb-12 scale-in">
            <Card className="glass-card border-0 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-bold mb-2 font-['Space_Grotesk']">
                      İnformatika testini başlat
                    </h3>
                    <p className="text-indigo-100 text-lg mb-6">
                      8 sual • 17 kateqoriya • Real vaxt nəticələri
                    </p>
                    
                    <div className="mb-6">
                      <div className="flex flex-wrap gap-2 justify-start">
                        {topics.map((topic, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-white text-xs md:text-sm backdrop-blur-sm"
                          >
                            <topic.icon className="w-4 h-4" />
                            {topic.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleStartTest}
                      disabled={isStarting}
                      className="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold px-8 py-3 text-lg btn-3d ripple"
                    >
                      {isStarting ? (
                        <>
                          <div className="loading-spinner mr-2"></div>
                          Başladılır...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Testə Başla
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="hidden md:block">
                  <div className="w-32 h-32 bg-white/10 rounded-3xl flex items-center justify-center">
                    <Code className="w-16 h-16 text-white/80" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Level / Missions */}
        {gami && (
          <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 fade-in">
            <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">Səviyyə</h3>
                    <div className="text-3xl font-extrabold">Lv {gami.level}</div>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                    <Award className="w-8 h-8" />
                  </div>
                </div>
                <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-3 bg-white rounded-full" style={{width: `${gami.xp_progress}%`}} />
                </div>
                <div className="mt-2 text-white/80 text-sm">XP: {gami.xp}</div>
                <div className="mt-2 text-white/80 text-sm">Streak: {gami.streak_current} (rekord: {gami.streak_best})</div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Gündəlik Missiya</h3>
                <p className="text-sm text-gray-600 mb-3">Bu gün ən azı 1 test tamamla</p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-2 bg-green-500 rounded-full" style={{width: `${Math.min(100, (gami.daily.done / gami.daily.target) * 100)}%`}} />
                </div>
                <div className="mt-2 text-sm text-gray-700">{gami.daily.done}/{gami.daily.target} tamamlandı</div>
                <div className="mt-4">
                  <Button onClick={() => navigate('/missions')} className="bg-indigo-600 hover:bg-indigo-700 text-white">Missiyalara Bax</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Həftəlik Missiya</h3>
                <p className="text-sm text-gray-600 mb-3">Bu həftə 5 test tamamla</p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-2 bg-blue-500 rounded-full" style={{width: `${Math.min(100, (gami.weekly.done / gami.weekly.target) * 100)}%`}} />
                </div>
                <div className="mt-2 text-sm text-gray-700">{gami.weekly.done}/{gami.weekly.target} tamamlandı</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* User Stats */}
        {user?.total_tests > 0 && (
          <div className="mb-12 fade-in">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Statistikalarınız
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="card-hover bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-800">{user.total_tests}</h4>
                  <p className="text-gray-600">Tamamlanmış Test</p>
                </CardContent>
              </Card>
              
              <Card className="card-hover bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-800">{user.average_score.toFixed(1)}%</h4>
                  <p className="text-gray-600">Ortalama Nəticə</p>
                </CardContent>
              </Card>
              
              <Card className="card-hover bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <Award className="w-8 h-8 text-purple-600" />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-800">
                    {user.average_score >= 80 ? 'Əla' : user.average_score >= 60 ? 'Yaxşı' : 'Orta'}
                  </h4>
                  <p className="text-gray-600">Səviyyə</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 fade-in" style={{animationDelay: '0.3s'}}>
          {menuItems.map((item, index) => (
            <Link key={index} to={item.path}>
              <Card className="card-hover bg-white/60 backdrop-blur-sm border-0 shadow-lg h-full">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${item.gradient} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                      <item.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Premium Package Section */}
        {
          <div className="mt-12 fade-in" style={{animationDelay: '0.5s'}}>
            <Card className={`bg-gradient-to-br ${user?.is_premium ? 'from-green-600 via-emerald-600 to-teal-700' : 'from-purple-600 via-blue-600 to-indigo-700'} border-0 shadow-2xl overflow-hidden relative`}>
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-500/20"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/30 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/30 rounded-full translate-y-12 -translate-x-12"></div>
              
              <CardContent className="p-10 relative z-10">
                {user?.is_premium ? (
                  // Premium user view - show their benefits
                  <>
                    <div className="text-center mb-10">
                      <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl">
                        <Crown className="w-12 h-12 text-white" />
                      </div>
                      <h2 className="text-4xl font-bold text-white mb-3 font-['Space_Grotesk']">
                        ✨ Premium Aktivdir ✨
                      </h2>
                      <p className="text-white/90 text-xl max-w-2xl mx-auto leading-relaxed">
                        Siz artıq premium üzvsünüz! Bütün premium imkanlardan yararlanın.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-5">
                          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-lg">Limitsiz Test Həlli ✓</h4>
                            <p className="text-white/80">Aktiv - istədiyiniz qədər test edin</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-5">
                          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-lg">Premium Suallar ✓</h4>
                            <p className="text-white/80">Aktiv - ekskluziv suallar əlçatandır</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-5">
                          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-lg">Detallı Statistika ✓</h4>
                            <p className="text-white/80">Aktiv - ətraflı analiz əlçatandır</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right Column */}
                      <div className="space-y-4">
                        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-5">
                          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-lg">Qızıl Status ✓</h4>
                            <p className="text-white/80">Aktiv - liderlik tablosunda parıldayırsınız</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-5">
                          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-lg">Prioritet Dəstək ✓</h4>
                            <p className="text-white/80">Aktiv - prioritetli kömək alırsınız</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-5">
                          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-lg">Erkən Giriş ✓</h4>
                            <p className="text-white/80">Aktiv - yeni funksiyalardan ilk siz xəbərdar olursunuz</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                      <div className="mb-6">
                        <p className="text-white text-2xl font-bold mb-4">🎉 Premium üzvlüyünüz aktivdir!</p>
                        <p className="text-white/90 text-lg">Təşəkkür edirik ki, bizə dəstək olursunuz!</p>
                      </div>
                      
                      <Button 
                        className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold px-10 py-4 text-lg rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300"
                        onClick={() => {
                          toast.success('Premium imkanlarınızdan tam istifadə edin! 🚀');
                        }}
                      >
                        <Star className="w-6 h-6 mr-3" />
                        ⭐ Premium Faydalarını Görün
                      </Button>
                    </div>
                  </>
                ) : (
                  // Non-premium user view - show promotional content
                  <>
                    <div className="text-center mb-10">
                      <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl animate-pulse">
                        <Crown className="w-12 h-12 text-white" />
                      </div>
                      <h2 className="text-4xl font-bold text-white mb-3 font-['Space_Grotesk']">
                        💎 Premium Üzvlük 💎
                      </h2>
                      <p className="text-white/90 text-xl max-w-2xl mx-auto leading-relaxed">
                        Biliklərinizi səviyyəsiz inkişaf etdirin və liderlik tablosunda parıldayın!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                      {/* Left Column */}
                      <div className="space-y-4">
                        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-5 hover:bg-white/20 transition-all">
                          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mr-4">
                            <Infinity className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-lg">Limitsiz Test Həlli</h4>
                            <p className="text-white/80">Gündəlik məhdudiyyət olmadan istədiyiniz qədər test edin</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-5 hover:bg-white/20 transition-all">
                          <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mr-4">
                            <Star className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-lg">Premium Suallar</h4>
                            <p className="text-white/80">Ekskluziv premium suallar və çətin məsələlər</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-5 hover:bg-white/20 transition-all">
                          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mr-4">
                            <TrendingUp className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-lg">Detallı Statistika</h4>
                            <p className="text-white/80">Performansınızın ətraflı analizi və təkmilləşdirmə təklifləri</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right Column */}
                      <div className="space-y-4">
                        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-5 hover:bg-white/20 transition-all">
                          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center mr-4">
                            <Crown className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-lg">Qızıl Status</h4>
                            <p className="text-white/80">Liderlik tablosunda qızıl halqa ilə fərqlənin</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-5 hover:bg-white/20 transition-all">
                          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mr-4">
                            <Zap className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-lg">Prioritet Dəstək</h4>
                            <p className="text-white/80">Suallarınız üçün prioritetli cavab və kömək</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl p-5 hover:bg-white/20 transition-all">
                          <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mr-4">
                            <CheckCircle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-white font-bold text-lg">Erkən Giriş</h4>
                            <p className="text-white/80">Yeni funksiyalara ilk siz sahib olun</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                      <div className="mb-6">
                        <p className="text-white/90 text-lg mb-2">💰 Qiymət planları:</p>
                        <div className="flex justify-center items-center gap-8">
                          <div className="text-center">
                            <p className="text-white font-bold text-2xl">7₼/ay</p>
                            <p className="text-white/70">Aylıq</p>
                          </div>
                          <div className="text-center relative">
                            <div className="absolute -top-3 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                              30% ENDİRİM
                            </div>
                            <p className="text-yellow-300 font-bold text-3xl">60₼/il</p>
                            <p className="text-white/70">İllik (5₼/ay)</p>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold px-10 py-4 text-lg rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-300"
                        onClick={() => {
                          toast.info('Premium paket tezliklə aktiv olacaq! 🚀\n\nBizə dəstək üçün əlaqə saxlayın.');
                        }}
                      >
                        <Crown className="w-6 h-6 mr-3" />
                        🔥 İndi Premium Ol!
                      </Button>
                      <p className="text-white/80 text-sm mt-4">
                        ⚡ Saytın inkişafına dəstək olun və premium imkanlardan yararlanın!
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        }
      </div>
    </div>
  );
};

export default Dashboard;