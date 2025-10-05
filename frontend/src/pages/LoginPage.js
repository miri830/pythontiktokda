import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { Eye, EyeOff, Code, Sparkles, Trophy } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Uğurla giriş etdiniz!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Giriş xətası baş verdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute top-20 left-20 float-animation">
        <Code className="w-8 h-8 text-white/30" />
      </div>
      <div className="absolute top-32 right-32 float-animation" style={{animationDelay: '1s'}}>
        <Sparkles className="w-6 h-6 text-white/30" />
      </div>
      <div className="absolute bottom-32 left-32 float-animation" style={{animationDelay: '2s'}}>
        <Trophy className="w-7 h-7 text-white/30" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8 slide-up">
          <div className="mb-4">
            <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-2xl">
              <Code className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 font-['Space_Grotesk']">
            İnformatika testləri
          </h1>
          <p className="text-indigo-200 text-lg">
            İnformatika biliklərinizi sınayın
          </p>
        </div>

        {/* Login Card */}
        <Card className="glass-card border-0 shadow-2xl scale-in">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-white">
              Daxil Olun
            </CardTitle>
            <CardDescription className="text-indigo-200">
              Hesabınıza daxil olaraq testə başlayın
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="modern-input bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 text-lg"
                  placeholder="misal@email.com"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-medium">
                  Şifrə
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="modern-input bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 text-lg pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold text-lg btn-3d ripple shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  'Daxil Ol'
                )}
              </Button>
            </form>

            {/* Demo sürətli giriş hissəsi UI-dan çıxarıldı */}

            <div className="text-center pt-4">
              <p className="text-white/70">
                Hesabınız yoxdur?{' '}
                <Link
                  to="/register"
                  className="text-indigo-300 hover:text-indigo-200 font-semibold transition-colors underline underline-offset-4"
                >
                  Qeydiyyat
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 fade-in" style={{animationDelay: '0.5s'}}>
          <div className="text-center">
            <div className="w-12 h-12 bg-white/10 rounded-xl mx-auto mb-2 flex items-center justify-center">
              <Code className="w-6 h-6 text-white" />
            </div>
            <p className="text-white/80 text-sm">40+ Sual</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white/10 rounded-xl mx-auto mb-2 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <p className="text-white/80 text-sm">Liderlik Tablosu</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-white/10 rounded-xl mx-auto mb-2 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <p className="text-white/80 text-sm">Nəticə Təhlili</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;