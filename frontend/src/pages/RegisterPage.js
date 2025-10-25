import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { Eye, EyeOff, Code, UserPlus, Sparkles } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    bio: '',
    notify_new_questions: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Şifrələr uyğun gəlmir');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Şifrə ən azı 6 simvol olmalıdır');
      return;
    }

    setIsLoading(true);

    try {
      const registerData = {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        bio: formData.bio,
        notify_new_questions: formData.notify_new_questions
      };
      await register(registerData.email, registerData.password, registerData.full_name, registerData.bio, registerData.notify_new_questions);
      toast.success('Uğurla qeydiyyatdan keçdiniz!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Qeydiyyat xətası baş verdi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-800 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute top-20 left-20 float-animation">
        <UserPlus className="w-8 h-8 text-white/30" />
      </div>
      <div className="absolute top-32 right-32 float-animation" style={{animationDelay: '1s'}}>
        <Sparkles className="w-6 h-6 text-white/30" />
      </div>

      <div className="w-full max-w-lg relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-6 slide-up">
          <div className="mb-4">
            <div className="w-20 h-20 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-2xl">
              <Code className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 font-['Space_Grotesk']">
            İnformatika testləri
          </h1>
          <p className="text-violet-200 text-lg">
            Bizə qoşulun və biliklərinizi sınayın
          </p>
        </div>

        {/* Register Card */}
        <Card className="glass-card border-0 shadow-2xl scale-in">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-white">
              Qeydiyyat
            </CardTitle>
            <CardDescription className="text-violet-200">
              Yeni hesab yaradın və İnformatika testlərinə başlayın
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-white font-medium">
                  Ad və Soyad
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="modern-input bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11"
                  placeholder="Adınız və soyadınız"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="modern-input bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11"
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
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    className="modern-input bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11 pr-12"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white font-medium">
                  Şifrəni Təsdiq Et
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="modern-input bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11 pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-white font-medium">
                  Bio (İxtiyari)
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="modern-input bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none"
                  placeholder="Özünüz haqqında qısa məlumat..."
                  rows={3}
                />
              </div>

              <div className="flex items-start space-x-3 bg-white/5 p-4 rounded-lg border border-white/10">
                <input
                  type="checkbox"
                  id="notify_new_questions"
                  name="notify_new_questions"
                  checked={formData.notify_new_questions}
                  onChange={handleChange}
                  className="w-4 h-4 text-violet-600 bg-white/10 border-white/30 rounded focus:ring-violet-500 focus:ring-2 mt-1"
                />
                <div>
                  <Label htmlFor="notify_new_questions" className="text-white font-medium cursor-pointer">
                    Yeni Suallar Haqqında Bildiriş
                  </Label>
                  <p className="text-white/70 text-sm mt-1">
                    Admin tərəfindən yeni suallar əlavə edildikdə bildiriş almaq istəyirəm
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-semibold text-lg btn-3d ripple shadow-lg mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  'Qeydiyyatdan Keç'
                )}
              </Button>
            </form>

            <div className="text-center pt-4">
              <p className="text-white/70">
                Artıq hesabınız var?{' '}
                <Link
                  to="/login"
                  className="text-violet-300 hover:text-violet-200 font-semibold transition-colors underline underline-offset-4"
                >
                  Daxil Olun
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;