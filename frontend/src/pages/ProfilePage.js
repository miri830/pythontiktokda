import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar } from '../components/ui/avatar';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { 
  User, 
  ArrowLeft, 
  Trophy, 
  Calendar, 
  Target,
  TrendingUp,
  Award,
  BookOpen,
  Camera,
  Edit,
  Flame,
  Star,
  Lock
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [recentTests, setRecentTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE}/users/${userId}/profile`);
      if (!response.ok) {
        throw new Error('Profil yüklənə bilmədi');
      }
      const data = await response.json();
      setProfile(data.user);
      setRecentTests(data.recent_tests || []);
    } catch (error) {
      toast.error(error.message);
      navigate('/leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Yalnız şəkil faylları seçin');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Şəkil ölçüsü 5MB-dan kiçik olmalıdır');
      return;
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/profile/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Şəkil yüklənə bilmədi');
      }

      const data = await response.json();
      
      // Update profile state
      setProfile(prev => ({ ...prev, profile_image: data.profile_image }));
      
      // Update current user if it's own profile
      if (isOwnProfile) {
        updateUser({ ...currentUser, profile_image: data.profile_image });
      }
      
      toast.success('Profil şəkli yeniləndi!');
    } catch (error) {
      toast.error(error.message || 'Şəkil yüklənə bilmədi');
    } finally {
      setUploadingImage(false);
    }
  };

  const formatDate = (dateString) => {
    const dt = new Date(dateString);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  // Badge collection computed from profile stats (demo)
  const computeBadges = (p) => {
    const list = [];
    if (!p) return list;
    // Level badges
    const level = p.level || 1;
    if (level >= 5) list.push({ key: 'level5', title: 'Lv 5+', icon: Award, color: 'from-yellow-400 to-orange-500' });
    if (level >= 10) list.push({ key: 'level10', title: 'Lv 10+', icon: Star, color: 'from-indigo-500 to-purple-600' });
    // Streak badges
    const streak = p.streak_best || 0;
    if (streak >= 3) list.push({ key: 'streak3', title: '3 gün streak', icon: Flame, color: 'from-red-500 to-pink-500' });
    if (streak >= 7) list.push({ key: 'streak7', title: '7 gün streak', icon: Flame, color: 'from-rose-500 to-fuchsia-600' });
    // Tests completed
    if ((p.total_tests || 0) >= 10) list.push({ key: 'tests10', title: '10 test', icon: Trophy, color: 'from-green-500 to-emerald-600' });
    return list;
  };
  const earnedBadges = computeBadges(profile);
  const earnedKeys = new Set(earnedBadges.map(b => b.key));

  // Full catalog (locked by default until earned)
  const ALL_BADGES = [
    { key: 'level5', title: 'Lv 5+', icon: Award, color: 'from-yellow-400 to-orange-500' },
    { key: 'level10', title: 'Lv 10+', icon: Star, color: 'from-indigo-500 to-purple-600' },
    { key: 'streak3', title: '3 gün streak', icon: Flame, color: 'from-red-500 to-pink-500' },
    { key: 'streak7', title: '7 gün streak', icon: Flame, color: 'from-rose-500 to-fuchsia-600' },
    { key: 'tests10', title: '10 test', icon: Trophy, color: 'from-green-500 to-emerald-600' },
    // əlavə nümunə nişanlar (kilidli görünəcək):
    { key: 'speed3', title: 'Sürətli: 3 sual/1 dəq', icon: Trophy, color: 'from-cyan-500 to-sky-600' },
    { key: 'perfect80', title: '80%+ nəticə', icon: Star, color: 'from-amber-400 to-orange-600' },
    { key: 'perfect90', title: '90%+ nəticə', icon: Star, color: 'from-yellow-400 to-lime-500' },
    { key: 'topicMaster', title: 'Mövzu ustası', icon: Award, color: 'from-purple-500 to-fuchsia-600' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600">Profil yüklənir...</p>
        </div>
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
                onClick={() => navigate('/leaderboard')}
                variant="ghost"
                size="sm"
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Button>
              <User className="w-8 h-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold gradient-text font-['Space_Grotesk']">
                İstifadəçi Profili
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg mb-8 slide-up">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Profile Image */}
              <div className="relative">
                <div className={`w-32 h-32 rounded-full overflow-hidden bg-gray-200 shadow-xl ${profile.is_premium ? 'ring-4 ring-yellow-400 ring-offset-4 ring-offset-white animate-pulse' : ''}`}>
                  {profile.profile_image ? (
                    <img
                      src={profile.profile_image}
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-100">
                      <User className="w-16 h-16 text-indigo-600" />
                    </div>
                  )}
                </div>
                
                {isOwnProfile && (
                  <div className="absolute bottom-2 right-2">
                    <label className="cursor-pointer">
                      <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-indigo-600 transition-colors">
                        {uploadingImage ? (
                          <div className="loading-spinner w-4 h-4"></div>
                        ) : (
                          <Camera className="w-5 h-5" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-gray-800 mb-2 font-['Space_Grotesk']">
                  {editingName ? (
                    <input
                      className="border border-gray-300 rounded-md px-3 py-1 text-lg"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                    />
                  ) : (
                    profile.full_name
                  )}
                  {profile.is_admin && (
                    <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                      Admin
                    </span>
                  )}
                  {profile.is_premium && (
                    <span className="ml-3 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full shadow-sm border border-yellow-200">
                      Premium istifadəçi
                    </span>
                  )}
                </h2>
                {isOwnProfile && (
                  <div className="flex items-center gap-2 mb-4">
                    {!editingName ? (
                      <Button variant="outline" size="sm" onClick={() => { setEditingName(true); setTempName(profile.full_name || ''); }}>Adı Düzəlt</Button>
                    ) : (
                      <>
                        <Button size="sm" onClick={async () => {
                          try {
                            const token = localStorage.getItem('token');
                            const res = await fetch(`${API_BASE}/profile/update-name`, {
                              method: 'POST',
                              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                              body: JSON.stringify({ full_name: tempName })
                            });
                            if (!res.ok) {
                              const err = await res.json().catch(() => ({}));
                              throw new Error(err.detail || 'Ad yenilənmədi');
                            }
                            const data = await res.json();
                            setProfile(prev => ({ ...prev, full_name: data.full_name }));
                            updateUser({ ...currentUser, full_name: data.full_name });
                            setEditingName(false);
                            toast.success('Ad yeniləndi');
                          } catch (e) {
                            toast.error(e.message || 'Xəta baş verdi');
                          }
                        }}>Yadda saxla</Button>
                        <Button variant="outline" size="sm" onClick={() => setEditingName(false)}>Ləğv et</Button>
                      </>
                    )}
                  </div>
                )}
                
                <p className="text-gray-600 text-lg mb-4">
                  {profile.email}
                </p>
                
                {isOwnProfile ? (
                  <div className="mb-6 max-w-md">
                    <textarea
                      className="w-full rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                      placeholder="Bio yazın..."
                      value={profile.bio || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    />
                    <div className="mt-2 flex justify-end">
                      <Button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('token');
                            const res = await fetch(`${API_BASE}/profile/update-bio`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({ bio: profile.bio || '' })
                            });
                            if (!res.ok) {
                              const err = await res.json().catch(() => ({}));
                              throw new Error(err.detail || 'Bio yenilənmədi');
                            }
                            const data = await res.json();
                            setProfile(prev => ({ ...prev, bio: data.bio }));
                            if (isOwnProfile) {
                              updateUser({ ...currentUser, bio: data.bio });
                            }
                            toast.success('Bio yeniləndi');
                          } catch (err) {
                            toast.error(err.message || 'Xəta baş verdi');
                          }
                        }}
                        className="px-4"
                      >
                        Bio-nu Saxla
                      </Button>
                    </div>
                  </div>
                ) : (
                  profile.bio && (
                    <p className="text-gray-700 mb-6 max-w-md">
                      {profile.bio}
                    </p>
                  )
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {profile.total_tests}
                    </div>
                    <div className="text-sm text-gray-600">Test</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(profile.average_score)}`}>
                      {profile.average_score.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Ortalama</div>
                  </div>
                  <div className="text-center col-span-2 md:col-span-1">
                    <div className="text-2xl font-bold text-green-600">
                      {formatDate(profile.created_at)}
                    </div>
                    <div className="text-sm text-gray-600">Qoşulub</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badge Collection */}
        <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Award className="w-6 h-6 mr-2 text-yellow-500" />
              Nişan Kolleksiyası
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {ALL_BADGES.map((b) => {
                const unlocked = earnedKeys.has(b.key);
                return (
                  <div key={b.key} className={`p-4 rounded-xl border flex flex-col items-center text-center ${unlocked ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg mb-2 ${unlocked ? b.color : 'from-gray-300 to-gray-400'} ${unlocked ? '' : 'opacity-60'}`}>
                      {unlocked ? (
                        <b.icon className="w-8 h-8 text-white" />
                      ) : (
                        <Lock className="w-7 h-7 text-white/90" />
                      )}
                    </div>
                    <div className={`text-sm font-medium ${unlocked ? 'text-gray-800' : 'text-gray-400'}`}>{b.title}</div>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-4 text-sm text-gray-500">və daha çoxu...</div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 scale-in">
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">{profile.total_tests}</h3>
              <p className="text-gray-600">Toplam Test</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-green-600" />  
              </div>
              <h3 className={`text-2xl font-bold ${getScoreColor(profile.average_score)}`}>
                {profile.average_score.toFixed(1)}%
              </h3>
              <p className="text-gray-600">Ortalama Bal</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                {profile.average_score >= 90 ? 'Əla' : 
                 profile.average_score >= 80 ? 'Yaxşı' : 
                 profile.average_score >= 60 ? 'Orta' : 'Zəif'}
              </h3>
              <p className="text-gray-600">Səviyyə</p>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <Award className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">
                {Math.max(0, Math.round((profile.average_score - 50) / 10))}
              </h3>
              <p className="text-gray-600">Nailiyyət</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tests */}
        {recentTests.length > 0 && (
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg fade-in">
            <CardHeader>
              <CardTitle className="flex items-center text-xl">
                <Target className="w-6 h-6 mr-2 text-indigo-600" />
                Son Testlər
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTests.map((test, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          test.percentage >= 80 
                            ? 'bg-green-100' 
                            : test.percentage >= 60 
                            ? 'bg-blue-100' 
                            : 'bg-red-100'
                        }`}>
                          <Trophy className={`w-6 h-6 ${
                            test.percentage >= 80 
                              ? 'text-green-600' 
                              : test.percentage >= 60 
                              ? 'text-blue-600' 
                              : 'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            İnformatika testləri
                          </h3>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(test.completed_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getScoreColor(test.percentage)}`}>
                          {test.percentage}%
                        </p>
                        <p className="text-sm text-gray-600">
                          {test.correct_answers}/{test.total_questions} doğru
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Tests Message */}
        {recentTests.length === 0 && (
          <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg fade-in">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-600 mb-2">
                {isOwnProfile ? 'Hələ test etməmisiniz' : 'Bu istifadəçi hələ test etməyib'}
              </h3>
              <p className="text-gray-500 mb-6">
                {isOwnProfile 
                  ? 'İlk testinizi edərək İnformatika biliklərinizi sınayın!'
                  : 'Test nəticələri burada görünəcək'}
              </p>
              {isOwnProfile && (
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold px-6 py-3 btn-3d"
                >
                  <Target className="w-5 h-5 mr-2" />
                  İlk Testə Başla
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;