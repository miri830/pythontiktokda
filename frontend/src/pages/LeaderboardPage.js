import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar } from '../components/ui/avatar';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { 
  Trophy, 
  Medal, 
  Award, 
  User, 
  ArrowLeft, 
  Crown,
  Target,
  TrendingUp,
  Users,
  Star
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_BASE}/leaderboard`);
      if (!response.ok) {
        throw new Error('Liderlik tablosu yüklənə bilmədi');
      }
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-500" />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3:
        return 'bg-gradient-to-r from-orange-400 to-orange-600';
      default:
        return 'bg-gradient-to-r from-indigo-400 to-purple-600';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600">Liderlik tablosu yüklənir...</p>
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
                onClick={() => navigate('/dashboard')}
                variant="ghost"
                size="sm"
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Button>
              <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
              <h1 className="text-2xl font-bold gradient-text font-['Space_Grotesk']">
                Liderlik Tablosu
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12 slide-up">
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl float-animation">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4 font-['Space_Grotesk']">
            Ən Yaxşı Nəticələr 🏆
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Ən yüksək ortalama bal əldə edən istifadəçilər. Siz də testləri həll edərək liderlik tablosunda yerinizi alın!
          </p>
        </div>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="mb-12 scale-in">
            <div className="flex justify-center items-end space-x-4 mb-8">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Link to={`/profile/${leaderboard[1].id}`}>
                    <div className="w-20 h-20 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform cursor-pointer">
                      {leaderboard[1].profile_image ? (
                        <img
                          src={leaderboard[1].profile_image}
                          alt={leaderboard[1].full_name}
                          className="w-18 h-18 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-white" />
                      )}
                    </div>
                  </Link>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                    <Medal className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <h3 className="font-bold text-gray-800">{leaderboard[1].full_name}</h3>
                  <p className="text-2xl font-bold text-gray-600">{leaderboard[1].average_score}%</p>
                  <p className="text-sm text-gray-500">{leaderboard[1].total_tests} test</p>
                </div>
                <div className="w-20 h-24 bg-gradient-to-t from-gray-300 to-gray-400 rounded-t-lg mt-2"></div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Link to={`/profile/${leaderboard[0].id}`}>
                    <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform cursor-pointer">
                      {leaderboard[0].profile_image ? (
                        <img
                          src={leaderboard[0].profile_image}
                          alt={leaderboard[0].full_name}
                          className="w-22 h-22 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-white" />
                      )}
                    </div>
                  </Link>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <h3 className="font-bold text-gray-800 text-lg">{leaderboard[0].full_name}</h3>
                  <p className="text-3xl font-bold text-yellow-600">{leaderboard[0].average_score}%</p>
                  <p className="text-sm text-gray-500">{leaderboard[0].total_tests} test</p>
                </div>
                <div className="w-24 h-32 bg-gradient-to-t from-yellow-400 to-yellow-500 rounded-t-lg mt-2"></div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Link to={`/profile/${leaderboard[2].id}`}>
                    <div className="w-20 h-20 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform cursor-pointer">
                      {leaderboard[2].profile_image ? (
                        <img
                          src={leaderboard[2].profile_image}
                          alt={leaderboard[2].full_name}
                          className="w-18 h-18 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-white" />
                      )}
                    </div>
                  </Link>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <h3 className="font-bold text-gray-800">{leaderboard[2].full_name}</h3>
                  <p className="text-2xl font-bold text-orange-600">{leaderboard[2].average_score}%</p>
                  <p className="text-sm text-gray-500">{leaderboard[2].total_tests} test</p>
                </div>
                <div className="w-20 h-20 bg-gradient-to-t from-orange-400 to-orange-500 rounded-t-lg mt-2"></div>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg fade-in">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <Users className="w-6 h-6 mr-2 text-indigo-600" />
              Bütün İstifadəçilər
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaderboard.map((entry, index) => (
                <Link
                  key={entry.id}
                  to={`/profile/${entry.id}`}
                  className="block"
                >
                  <div className={`p-4 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer ${
                    entry.id === user?.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* Rank */}
                        <div className={`w-12 h-12 ${getRankBadgeColor(entry.rank)} rounded-xl flex items-center justify-center text-white font-bold shadow-lg`}>
                          {entry.rank <= 3 ? getRankIcon(entry.rank) : entry.rank}
                        </div>

                        {/* Profile */}
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden">
                            {entry.profile_image ? (
                              <img
                                src={entry.profile_image}
                                alt={entry.full_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-indigo-100">
                                <User className="w-6 h-6 text-indigo-600" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800 flex items-center">
                              {entry.full_name}
                              {entry.id === user?.id && (
                                <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                                  Siz
                                </span>
                              )}
                            </h3>
                            {entry.bio && (
                              <p className="text-sm text-gray-600 truncate max-w-xs">
                                {entry.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className={`text-2xl font-bold ${getScoreColor(entry.average_score)}`}>
                            {entry.average_score}%
                          </p>
                          <p className="text-xs text-gray-500">Ortalama</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-gray-700">
                            {entry.total_tests}
                          </p>
                          <p className="text-xs text-gray-500">Test</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 mr-1" />
                            <span className="text-sm font-medium text-gray-700">
                              {entry.rank <= 10 ? 'Top 10' : entry.rank <= 50 ? 'Top 50' : 'Aktiv'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {leaderboard.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">
                  Hələ heç kim test etməyib
                </h3>
                <p className="text-gray-500">
                  İlk olan siz olun və liderlik tablosunda yerinizi alın!
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call to Action */}
        {leaderboard.length > 0 && (
          <div className="text-center mt-12 fade-in" style={{animationDelay: '0.5s'}}>
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold px-8 py-3 text-lg btn-3d"
            >
              <Target className="w-5 h-5 mr-2" />
              Test Həll Et və Lider Ol!
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;