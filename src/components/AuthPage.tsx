import { useState } from 'react';
import { useTimeTheme } from '@/hooks/useTimeTheme';
import { cn } from '@/lib/utils';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';

interface AuthPageProps {
  onBack: () => void;
  onSignIn: (email: string, password: string) => Promise<{ error: any }>;
  onSignUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
}

export function AuthPage({ onBack, onSignIn, onSignUp }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const timeTheme = useTimeTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!displayName.trim()) {
          setError('Nama wajib diisi');
          setLoading(false);
          return;
        }
        const { error } = await onSignUp(email, password, displayName.trim());
        if (error) {
          setError(error.message);
        } else {
          setSignupSuccess(true);
        }
      } else {
        const { error } = await onSignIn(email, password);
        if (error) {
          setError(error.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (signupSuccess) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b theme-transition ${timeTheme.gradient}`}>
        <div className="w-full max-w-sm text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Cek Email Kamu! 📧</h1>
          <p className="text-muted-foreground">
            Kami sudah mengirim link verifikasi ke <strong className="text-foreground">{email}</strong>. 
            Klik link tersebut untuk mengaktifkan akunmu.
          </p>
          <button
            onClick={onBack}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Kembali ke beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-b theme-transition ${timeTheme.gradient}`}>
      {/* Back button */}
      <div className="p-4">
        <button onClick={onBack} className="text-foreground p-2">
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {mode === 'login' ? 'Selamat Datang' : 'Buat Akun'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {mode === 'login' ? 'Masuk ke akunmu' : 'Daftar untuk mulai mendengarkan'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nama</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nama tampilan"
                  className="w-full px-4 py-3 bg-secondary rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="w-full px-4 py-3 bg-secondary rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-4 py-3 bg-secondary rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-destructive text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full py-3 rounded-full text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-50",
                timeTheme.accentBg, timeTheme.buttonText
              )}
            >
              {loading ? '...' : mode === 'login' ? 'Masuk' : 'Daftar'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
              className="text-primary font-semibold hover:underline"
            >
              {mode === 'login' ? 'Daftar' : 'Masuk'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
