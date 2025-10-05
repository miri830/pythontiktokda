import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Award, ArrowLeft, Flame, Star, Target, Zap } from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

const MissionsPage = () => {
  const navigate = useNavigate();
  const [gami, setGami] = useState(null);
  const [startingKey, setStartingKey] = useState(null);

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
        // noop
      }
    };
    fetchGami();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button onClick={() => navigate('/dashboard')} variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Geri
              </Button>
              <Target className="w-7 h-7 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold gradient-text font-['Space_Grotesk']">Missiyalar</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {gami && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                  <div className="h-3 bg-white rounded-full" style={{ width: `${gami.xp_progress}%` }} />
                </div>
                <div className="mt-2 text-white/80 text-sm">XP: {gami.xp}</div>
                <div className="mt-2 text-white/80 text-sm">Streak: {gami.streak_current} (rekord: {gami.streak_best})</div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800">Gündəlik Missiya</h3>
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <p className="text-sm text-gray-600 mb-3">Bu gün ən azı 1 test tamamla</p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-2 bg-green-500 rounded-full" style={{ width: `${Math.min(100, (gami.daily.done / gami.daily.target) * 100)}%` }} />
                </div>
                <div className="mt-2 text-sm text-gray-700">{gami.daily.done}/{gami.daily.target} tamamlandı</div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800">Həftəlik Missiya</h3>
                  <Star className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm text-gray-600 mb-3">Bu həftə 5 test tamamla</p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${Math.min(100, (gami.weekly.done / gami.weekly.target) * 100)}%` }} />
                </div>
                <div className="mt-2 text-sm text-gray-700">{gami.weekly.done}/{gami.weekly.target} tamamlandı</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 text-yellow-500 mr-2" /> Sürətli Tapşırıqlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span>1 dəqiqəyə 3 sual</span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">50 XP</span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700"
                    disabled={startingKey === 'quick3'}
                    onClick={async () => {
                      try {
                        setStartingKey('quick3');
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${API_BASE}/tests/start`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ limit: 3 })
                        });
                        if (!res.ok) throw new Error('Başlatmaq alınmadı');
                        const data = await res.json();
                        navigate(`/test/${data.session_id}?mode=quick3&limit=3&time=60&xp=50`);
                      } catch (e) {
                      } finally {
                        setStartingKey(null);
                      }
                    }}
                  >
                    {startingKey === 'quick3' ? 'Başladılır...' : 'Başla'}
                  </Button>
                </li>
                <li className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span>Zəif mövzudan 5 sual</span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">30 XP</span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700"
                    disabled={startingKey === 'weak5'}
                    onClick={async () => {
                      try {
                        setStartingKey('weak5');
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${API_BASE}/tests/start`, {
                          method: 'POST',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ limit: 5 })
                        });
                        if (!res.ok) throw new Error('Başlatmaq alınmadı');
                        const data = await res.json();
                        navigate(`/test/${data.session_id}?mode=weak5&limit=5&time=120&xp=30`);
                      } catch (e) {
                      } finally {
                        setStartingKey(null);
                      }
                    }}
                  >
                    {startingKey === 'weak5' ? 'Başladılır...' : 'Başla'}
                  </Button>
                </li>
              </ul>
            </CardContent>
          </Card>

          
        </div>
      </div>
    </div>
  );
};

export default MissionsPage;
