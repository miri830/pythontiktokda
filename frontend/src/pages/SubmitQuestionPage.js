import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Send, 
  HelpCircle,
  BookOpen,
  Plus,
  CheckCircle
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL + '/api';

const SubmitQuestionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    category: '',
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    explanation: ''
  });

  const categories = [
    'İnformasiya və informasiya prosesləri',
    'Say sistemləri',
    'İnformasiyanın kodlaşdırılması və miqdarının ölçülməsi',
    'Modelləşdirmə',
    'Kompüterin aparat təminatı',
    'Kompüterin proqram təminatı',
    'Əməliyyat sistemi',
    'Mətnlərin email',
    'Elektron cədvəllər',
    'Verilənlər bazası',
    'Kompüter qrafikası',
    'Alqoritm',
    'Proqramlaşdırma',
    'Kompüter şəbəkəsi',
    'İnternet',
    'Veb-proqramlaşdırma',
    'İnformasiya təhlükəsizliyi'
  ];

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category || !formData.question_text || !formData.explanation) {
      toast.error('Bütün məcburi sahələri doldurun');
      return;
    }

    const filledOptions = formData.options.filter(opt => opt.trim() !== '');
    if (filledOptions.length < 2) {
      toast.error('Ən azı 2 cavab variantı əlavə edin');
      return;
    }

    if (formData.correct_answer >= filledOptions.length) {
      toast.error('Düzgün cavab seçimi səhvdir');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/submit-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          options: filledOptions
        })
      });

      if (!response.ok) {
        throw new Error('Sual göndərilə bilmədi');
      }

      const data = await response.json();
      toast.success('Sualınız təsdiqləmək üçün göndərildi! 🎉');
      
      // Reset form
      setFormData({
        category: '',
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: 0,
        explanation: ''
      });
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
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
              <HelpCircle className="w-8 h-8 text-blue-500 mr-3" />
              <h1 className="text-2xl font-bold gradient-text font-['Space_Grotesk']">
                Sual Göndər
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12 slide-up">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl float-animation">
            <Plus className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4 font-['Space_Grotesk']">
            Öz Sualınızı Əlavə Edin 📝
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Bilik paylaşın və digər tələbələrə kömək edin! Sualınız admin tərəfindən təsdiqlənəndən sonra sistemə əlavə olunacaq.
          </p>
        </div>

        {/* Form */}
        <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg fade-in">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <BookOpen className="w-6 h-6 mr-2 text-indigo-600" />
              Sual Məlumatları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category */}
              <div>
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                  Kateqoriya *
                </Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Kateqoriya seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Question Text */}
              <div>
                <Label htmlFor="question_text" className="text-sm font-medium text-gray-700">
                  Sual Mətni *
                </Label>
                <Textarea
                  id="question_text"
                  value={formData.question_text}
                  onChange={(e) => setFormData({...formData, question_text: e.target.value})}
                  placeholder="Sualınızın mətnini daxil edin..."
                  className="mt-1"
                  rows={3}
                  required
                />
              </div>

              {/* Options */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Cavab Variantları * (ən azı 2 variant)
                </Label>
                <div className="space-y-3">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {String.fromCharCode(65 + index)}
                        </span>
                      </div>
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`${String.fromCharCode(65 + index)} variantı${index < 2 ? ' *' : ' (opsional)'}`}
                        className="flex-1"
                        required={index < 2}
                      />
                      <div className="flex-shrink-0">
                        <input
                          type="radio"
                          name="correct_answer"
                          checked={formData.correct_answer === index}
                          onChange={() => setFormData({...formData, correct_answer: index})}
                          className="w-4 h-4 text-green-600"
                          title="Düzgün cavab"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  💡 Radio düyməsini sıxaraq düzgün cavabı seçin
                </p>
              </div>

              {/* Explanation */}
              <div>
                <Label htmlFor="explanation" className="text-sm font-medium text-gray-700">
                  İzahat *
                </Label>
                <Textarea
                  id="explanation"
                  value={formData.explanation}
                  onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                  placeholder="Cavabın izahatını yazın..."
                  className="mt-1"
                  rows={3}
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-3 text-lg btn-3d"
                >
                  {isSubmitting ? (
                    <>
                      <div className="loading-spinner mr-2"></div>
                      Göndərilir...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Sualı Göndər
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="bg-blue-50 border-blue-200 mt-8 fade-in" style={{animationDelay: '0.3s'}}>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  📋 Təsdiqləmə Prosesi
                </h3>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li>• Sualınız admin tərəfindən yoxlanılacaq</li>
                  <li>• Təsdiqlənəndən sonra sistemə əlavə olunacaq</li>
                  <li>• Nəticə haqqında bildiriş alacaqsınız</li>
                  <li>• Keyfiyyətli suallar təşviq edilir</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubmitQuestionPage;