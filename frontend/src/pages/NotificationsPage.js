import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Bell, 
  CheckCircle,
  AlertCircle,
  Info,
  X,
  BellRing,
  Eye,
  Trash2
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      toast.error('Bildirişlər yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/notifications/${notificationId}/mark-read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, read: true }
              : notif
          )
        );
      }
    } catch (error) {
      toast.error('Bildiriş yenilənə bilmədi');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
      case 'error':
        return <X className="w-6 h-6 text-red-500" />;
      default:
        return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getNotificationBgColor = (type, read) => {
    const baseColor = read ? 'bg-gray-50' : 'bg-white';
    switch (type) {
      case 'success':
        return read ? 'bg-green-50 border-green-200' : 'bg-green-100 border-green-300';
      case 'warning':
        return read ? 'bg-yellow-50 border-yellow-200' : 'bg-yellow-100 border-yellow-300';
      case 'error':
        return read ? 'bg-red-50 border-red-200' : 'bg-red-100 border-red-300';
      default:
        return read ? 'bg-blue-50 border-blue-200' : 'bg-blue-100 border-blue-300';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'İndi';
    if (diffMins < 60) return `${diffMins} dəqiqə əvvəl`;
    if (diffHours < 24) return `${diffHours} saat əvvəl`;
    if (diffDays < 7) return `${diffDays} gün əvvəl`;
    
    return date.toLocaleDateString('az-AZ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mb-4"></div>
          <p className="text-gray-600">Bildirişlər yüklənir...</p>
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
              <Bell className="w-8 h-8 text-indigo-500 mr-3" />
              <h1 className="text-2xl font-bold gradient-text font-['Space_Grotesk']">
                Bildirişlər
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {notifications.filter(n => !n.read).length} oxunmamış
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12 slide-up">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl float-animation">
            <BellRing className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4 font-['Space_Grotesk']">
            Bildirişləriniz 🔔
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Sual təqdimlərinizdən və sistem yeniliklərindən xəbərdar olun
          </p>
        </div>

        {/* Notifications List */}
        <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg fade-in">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Bell className="w-6 h-6 mr-2 text-indigo-600" />
                Bütün Bildirişlər ({notifications.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">
                  Bildiriş yoxdur
                </h3>
                <p className="text-gray-500">
                  Hələ heç bir bildirişiniz yoxdur. Sual göndərdikdə burada görəcəksiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-5 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                      getNotificationBgColor(notification.type, notification.read)
                    } ${!notification.read ? 'ring-2 ring-opacity-50 ring-indigo-300' : ''}`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className={`text-lg font-semibold ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                            <p className={`mt-1 text-sm leading-relaxed ${
                              !notification.read ? 'text-gray-800' : 'text-gray-600'
                            }`}>
                              {notification.message}
                            </p>
                            <p className="mt-2 text-xs text-gray-500">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.read && (
                              <>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Oxu
                                </Button>
                                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
                              </>
                            )}
                            {notification.read && (
                              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded-full">
                                Oxunub
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        {notifications.length > 0 && (
          <Card className="bg-indigo-50 border-indigo-200 mt-8 fade-in" style={{animationDelay: '0.3s'}}>
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-700">
                    {notifications.length}
                  </div>
                  <div className="text-sm text-indigo-600">Ümumi bildiriş</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {notifications.filter(n => n.read).length}
                  </div>
                  <div className="text-sm text-green-600">Oxunmuş</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-700">
                    {notifications.filter(n => !n.read).length}
                  </div>
                  <div className="text-sm text-orange-600">Oxunmamış</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;