import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useDynamicTitle } from '@/hooks/useDynamicTitle';

const authSchema = z.object({
  email: z.string().email("Noto'g'ri email formati"),
  password: z.string().min(6, "Parol kamida 6 ta belgi bo'lishi kerak"),
});

const Auth = () => {
  useDynamicTitle('Kirish');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user, isAdmin, loading, roleLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !roleLoading && user && isAdmin) {
      navigate('/admin');
    }
  }, [user, isAdmin, loading, roleLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error("Email yoki parol noto'g'ri");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Muvaffaqiyatli kirdingiz!");
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error("Bu email allaqachon ro'yxatdan o'tgan");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Muvaffaqiyatli ro'yxatdan o'tdingiz!");
        }
      }
    } catch (err) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <Card className="w-full max-w-md glass border-border/50 animate-scale-in relative z-10">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
            <span className="text-2xl font-display text-primary-foreground">BV</span>
          </div>
          <CardTitle className="text-2xl font-display">
            {isLogin ? 'Kirish' : "Ro'yxatdan o'tish"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isLogin 
              ? 'Admin panelga kirish uchun tizimga kiring' 
              : "Yangi hisob yaratish"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-muted/50 border-border/50"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Parol</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-muted/50 border-border/50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {isLogin ? 'Kirish' : "Ro'yxatdan o'tish"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-secondary transition-colors"
            >
              {isLogin 
                ? "Hisobingiz yo'qmi? Ro'yxatdan o'ting" 
                : "Hisobingiz bormi? Kiring"
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
