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
  Edit
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
    return new Date(dateString).toLocaleDateString('az-AZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

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
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 shadow-xl">
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
                  {profile.full_name}
                  {profile.is_admin && (
                    <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                      Admin
                    </span>
                  )}
                </h2>
                
                <p className="text-gray-600 text-lg mb-4">
                  {profile.email}
                </p>
                
                {profile.bio && (
                  <p className="text-gray-700 mb-6 max-w-md">
                    {profile.bio}
                  </p>
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
                            Python Test
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
                  ? 'İlk testinizi edərək Python biliklərinizi sınayın!'
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