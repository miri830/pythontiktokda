import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Mail, MessageCircle, Phone, User, ExternalLink, Heart } from 'lucide-react';

const ContactPage = () => {
  const navigate = useNavigate();

  const socialLinks = [
    {
      name: 'Instagram',
      handle: '@dadashoff_018',
      url: 'https://instagram.com/dadashoff_018',
      icon: '📷',
      color: 'from-pink-500 to-rose-500',
      description: 'Günlük paylaşımlar və yeniliklər'
    },
    {
      name: 'TikTok',
      handle: '@learnwithmirze',
      url: 'https://tiktok.com/@learnwithmirze',
      icon: '🎵',
      color: 'from-black to-gray-800',
      description: 'Proqramlaşdırma dərsləri və məsləhətlər'
    },
    {
      name: 'WhatsApp',
      handle: '+994 10 384 95 84',
      url: 'https://wa.me/9940103849584',
      icon: '💬',
      color: 'from-green-500 to-green-600',
      description: 'Birbaşa əlaqə üçün'
    },
    {
      name: 'Email',
      handle: 'mirzedadas111@icloud.com',
      url: 'mailto:mirzedadas111@icloud.com',
      icon: '✉️',
      color: 'from-blue-500 to-blue-600',
      description: 'Formal sorğular və əməkdaşlıq'
    }
  ];

  const openLink = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
              <Mail className="w-8 h-8 text-indigo-600 mr-3" />
              <h1 className="text-2xl font-bold gradient-text font-['Space_Grotesk']">
                Əlaqə
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12 slide-up">
          <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl float-animation">
            <User className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4 font-['Space_Grotesk']">
            Bizimlə Əlaqə ✨
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            İnformatika testləri platformasının yaradıcısı ilə əlaqə saxlayın. 
            Suallarınız, təklifləriniz və ya sadəcə salamlaşmaq üçün!
          </p>
        </div>

        {/* Creator Info */}
        <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg mb-12 scale-in">
          <CardContent className="p-8 text-center">
            <div className="w-32 h-32 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl">
              <span className="text-4xl text-white font-bold">M</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Mirzə Dadaşov
            </h3>
            <p className="text-lg text-gray-600 mb-4">
              İnformatika testləri platforması yaradıcısı
            </p>
            <p className="text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Proqramlaşdırma həvəskarı və təhsil sahəsində innovasiyaları dəstəkləyən developer. 
              Bu platformanı İnformatika sahəsində öyrənənlər üçün yaratdım. 
              Məqsədim bilikləri əlçatan və əyləncəli etməkdir! 🚀
            </p>
          </CardContent>
        </Card>

        {/* Social Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 fade-in">
          {socialLinks.map((link, index) => (
            <Card 
              key={index} 
              className="card-hover bg-white/60 backdrop-blur-sm border-0 shadow-lg cursor-pointer"
              onClick={() => openLink(link.url)}
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${link.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>
                    {link.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      {link.name}
                    </h3>
                    <p className="text-indigo-600 font-medium mb-2">
                      {link.handle}
                    </p>
                    <p className="text-sm text-gray-600">
                      {link.description}
                    </p>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 fade-in" style={{animationDelay: '0.5s'}}>
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-bold mb-2">Sürətli Mesaj</h3>
              <p className="text-sm opacity-90 mb-4">
                WhatsApp vasitəsilə birbaşa yazın
              </p>
              <Button 
                onClick={() => openLink('https://wa.me/9940103849584')}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                WhatsApp Aç
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <Mail className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-bold mb-2">Email Göndər</h3>
              <p className="text-sm opacity-90 mb-4">
                Formal sorğular üçün email yazın
              </p>
              <Button 
                onClick={() => openLink('mailto:mirzedadas111@icloud.com')}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                Email Aç
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <Heart className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-bold mb-2">İzləyin</h3>
              <p className="text-sm opacity-90 mb-4">
                Sosial şəbəkələrdə izləyin
              </p>
              <Button 
                onClick={() => openLink('https://instagram.com/dadashoff_018')}
                variant="secondary"
                size="sm"
                className="w-full"
              >
                Instagram Aç
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer Message */}
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-lg fade-in" style={{animationDelay: '0.7s'}}>
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">
              Təşəkkür edirik! 🙏
            </h3>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              İnformatika testləri platformasını istifadə etdiyiniz üçün təşəkkür edirik. 
              Fikirləriniz və təklifləriniz bizim üçün çox dəyərlidir. 
              Birgə daha yaxşı bir təhsil platforması yaradaq! 💪
            </p>
          </CardContent>
        </Card>

        {/* Back to Dashboard */}
        <div className="text-center mt-12">
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold px-8 py-3 text-lg btn-3d"
          >
            Ana Səhifəyə Qayıt
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;