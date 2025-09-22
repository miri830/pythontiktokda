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
    Target
  } from 'lucide-react';

  const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

  const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isStarting, setIsStarting] = useState(false);

    const handleStartTest = async () => {
      setIsStarting(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE}/tests/start`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
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

    const menuItems = [
      {
        title: 'Liderlik Tablosu',
        description: 'Ən yaxşı nəticələrə baxın',
        icon: Trophy,
        path: '/leaderboard',
        gradient: 'from-yellow-500 to-orange-500'
      },
      {
        title: 'Əlaqə',
        description: 'Bizimlə əlaqə saxlayın',
        icon: Contact,
        path: '/contact',
        gradient: 'from-green-500 to-emerald-500'
      }
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
                  Python Test
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-2 rounded-lg">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span className="text-indigo-800 font-medium">{user?.full_name}</span>
                </div>
                
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
              Python biliklərinizi sınayın və digər proqramçılarla müqayisə edin. 
              Hər test 8 sualdan ibarətdir və 4 kateqoriyadan təsadüfi seçilir.
            </p>
          </div>

          {/* Main Test Card */}
          <div className="mb-12 scale-in">
            <Card className="glass-card border-0 shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-bold mb-2 font-['Space_Grotesk']">
                      Python Test Başlat
                    </h3>
                    <p className="text-indigo-100 text-lg mb-6">
                      8 sual • 4 kateqoriya • Real vaxt nəticələri
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-white/20 rounded-xl mx-auto mb-2 flex items-center justify-center">
                          <Code className="w-6 h-6" />
                        </div>
                        <p className="text-sm">Python Sintaksisi</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-white/20 rounded-xl mx-auto mb-2 flex items-center justify-center">
                          <Target className="w-6 h-6" />
                        </div>
                        <p className="text-sm">Alqorimlər</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-white/20 rounded-xl mx-auto mb-2 flex items-center justify-center">
                          <BookOpen className="w-6 h-6" />
                        </div>
                        <p className="text-sm">OOP</p>
                      </div>
                      <div className="text-center">
                        <div className="w-12 h-12 bg-white/20 rounded-xl mx-auto mb-2 flex items-center justify-center">
                          <Clock className="w-6 h-6" />
                        </div>
                        <p className="text-sm">Məlumat Strukturları</p>
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
      </div>
    </div>
  );
};

export default Dashboard;