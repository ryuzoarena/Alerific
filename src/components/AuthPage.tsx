import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Check, Eye, EyeOff, Github, Lock, Mail, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthPageProps {
  onBack: () => void;
  onSignIn: (email: string, password: string) => Promise<{ error: any }>;
  onSignUp: (email: string, password: string, displayName: string) => Promise<{ error: any }>;
}

type FieldErrors = Partial<Record<'email' | 'password' | 'displayName' | 'form', string>>;

const visualizerBars = Array.from({ length: 40 }, (_, index) => ({
  id: index,
  height: 22 + ((index * 37) % 78),
  duration: 0.65 + ((index * 11) % 10) / 10,
  delay: -((index * 7) % 12) / 10,
}));

const albumCards = [
  { title: 'Iris', artist: 'Goo Goo Dolls', gradient: 'from-amber-300 via-orange-600 to-stone-950', className: 'left-[12%] top-[20%]', rotate: '-5deg', delay: '0s' },
  { title: 'Die For You', artist: 'The Weeknd', gradient: 'from-fuchsia-400 via-purple-800 to-slate-950', className: 'right-[14%] top-[28%]', rotate: '3deg', delay: '-1.2s' },
  { title: 'Closing Night', artist: 'The Weeknd', gradient: 'from-emerald-300 via-cyan-800 to-zinc-950', className: 'left-[23%] bottom-[18%]', rotate: '-2deg', delay: '-2.1s' },
];

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
  </svg>
);

export function AuthPage({ onBack, onSignIn, onSignUp }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Partial<Record<'email' | 'password' | 'displayName', boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const emailValid = email.includes('@') && email.trim().length > 3;
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 6) score += 1;
    if (/[A-Z0-9]/.test(password) && password.length >= 8) score += 1;
    if (/[^A-Za-z0-9]/.test(password) && password.length >= 10) score += 1;
    return Math.max(0, Math.min(3, score));
  }, [password]);

  const validate = () => {
    const nextErrors: FieldErrors = {};
    if (mode === 'signup' && !displayName.trim()) nextErrors.displayName = 'Nama tidak boleh kosong';
    if (!email.trim()) nextErrors.email = 'Email tidak boleh kosong';
    if (password.length < 6) nextErrors.password = 'Password minimal 6 karakter';
    setErrors(nextErrors);
    setTouched({ email: true, password: true, displayName: true });
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await onSignUp(email.trim(), password, displayName.trim());
        if (error) setErrors({ form: error.message });
        else setSignupSuccess(true);
      } else {
        const { error } = await onSignIn(email.trim(), password);
        if (error) {
          setErrors({ form: error.message });
        } else {
          setSuccess(true);
          toast.success('Selamat datang kembali! 👋', { position: 'top-center' });
          setTimeout(() => onBack(), 1000);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setErrors({});
    setTouched({});
    setSignupSuccess(false);
  };

  if (signupSuccess) {
    return (
      <div className="auth-page min-h-screen auth-mobile-bg flex items-center justify-center p-6 text-white">
        <div className="max-w-md text-center animate-scale-in">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <Mail size={30} />
          </div>
          <h1 className="mb-3 text-3xl font-bold">Cek Email Kamu! 📧</h1>
          <p className="text-sm leading-6 text-white/55">Kami sudah mengirim link verifikasi ke <span className="text-white">{email}</span>. Klik link tersebut untuk mengaktifkan akunmu.</p>
          <button onClick={onBack} className="mt-8 text-sm font-semibold text-primary hover:underline">Kembali ke beranda</button>
        </div>
      </div>
    );
  }

  return (
    <main className="auth-page min-h-screen bg-[hsl(var(--auth-bg-dark))] text-white md:grid md:grid-cols-[55%_45%]">
      <section className="auth-left-panel relative hidden overflow-hidden md:flex items-center justify-center">
        <div className="absolute inset-x-10 bottom-20 top-20 flex items-end justify-center gap-1 opacity-80" aria-hidden="true">
          {visualizerBars.map((bar) => (
            <span key={bar.id} className="w-2 origin-bottom rounded-full bg-[hsl(var(--auth-accent)/0.3)]" style={{ height: `${bar.height}%`, animation: `auth-visualizer ${bar.duration}s ease-in-out ${bar.delay}s infinite` }} />
          ))}
        </div>

        {albumCards.map((card) => (
          <div key={card.title} className={cn('absolute h-[120px] w-[120px] overflow-hidden rounded-xl shadow-[0_24px_70px_rgba(0,0,0,0.45)]', card.className)} style={{ '--card-rotate': card.rotate, animation: `auth-float 4s ease-in-out ${card.delay} infinite` } as React.CSSProperties}>
            <div className={cn('h-full w-full bg-gradient-to-br p-3', card.gradient)}>
              <div className="flex h-full flex-col justify-end rounded-lg bg-black/10 p-2 backdrop-blur-[1px]">
                <p className="truncate text-xs font-bold">{card.title}</p>
                <p className="truncate text-[10px] text-white/55">{card.artist}</p>
              </div>
            </div>
          </div>
        ))}

        <div className="relative z-10 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[28px] bg-white/8 shadow-[0_0_80px_hsl(var(--auth-accent)/0.28)] ring-1 ring-white/10 backdrop-blur-md">
            <Music2 size={48} className="text-[hsl(var(--auth-accent))]" />
          </div>
          <h1 className="text-7xl font-bold tracking-tight">Sybau</h1>
          <p className="mt-4 font-['Playfair_Display'] text-[28px] italic text-white/70">Musik yang menemanimu</p>
        </div>

        <p className="absolute bottom-8 left-8 text-[11px] tracking-wide text-white/30">10+ lagu tersimpan • Web Audio API</p>
      </section>

      <section className="auth-mobile-bg md:bg-none relative flex min-h-screen items-center justify-center overflow-hidden border-white/6 bg-[rgba(15,15,20,0.95)] px-6 py-10 backdrop-blur-[10px] md:border-l">
        <div className="absolute -right-24 -top-24 h-[300px] w-[300px] rounded-full bg-[radial-gradient(circle,hsl(var(--auth-accent)/0.15),transparent_68%)]" aria-hidden="true" />
        <div className="absolute -bottom-12 -left-12 h-[200px] w-[200px] rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.1),transparent_68%)]" aria-hidden="true" />

        <button onClick={onBack} className="absolute left-5 top-5 rounded-full p-3 text-white/60 transition-colors hover:bg-white/10 hover:text-white" aria-label="Kembali">
          <ArrowLeft size={20} />
        </button>

        <div className={cn('relative z-10 w-full max-w-[390px] transition-all duration-500', success && 'translate-y-2 opacity-0')}>
          <header className="mb-10 text-center">
            <div className="mx-auto mb-5 flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--auth-accent)/0.16)] text-[hsl(var(--auth-accent))] ring-1 ring-[hsl(var(--auth-accent)/0.25)]">
              <Music2 size={18} />
            </div>
            <h2 className="text-[32px] font-bold leading-tight text-white">{mode === 'login' ? 'Selamat Datang' : 'Buat Akun'}</h2>
            <p className="mt-2 text-sm text-white/40">{mode === 'login' ? 'Masuk ke akunmu' : 'Daftar untuk mulai mendengarkan'}</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {mode === 'signup' && (
              <FloatingInput label="Nama" value={displayName} onChange={setDisplayName} onBlur={() => setTouched((prev) => ({ ...prev, displayName: true }))} error={touched.displayName ? errors.displayName : undefined} icon={<Music2 size={18} />} placeholder="Nama tampilan" />
            )}

            <FloatingInput label="Email" value={email} onChange={setEmail} onBlur={() => setTouched((prev) => ({ ...prev, email: true }))} error={touched.email ? errors.email : undefined} icon={<Mail size={18} />} placeholder="email@contoh.com" type="email" right={emailValid ? <Check size={18} className="text-emerald-400" /> : null} />

            <div>
              <FloatingInput label="Password" value={password} onChange={setPassword} onBlur={() => setTouched((prev) => ({ ...prev, password: true }))} error={touched.password ? errors.password : undefined} icon={<Lock size={18} />} placeholder="Minimal 6 karakter" type={showPassword ? 'text' : 'password'} right={<button type="button" onClick={() => setShowPassword((value) => !value)} className="text-white/45 transition-colors hover:text-white">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>} />
              {password.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  {[1, 2, 3].map((step) => <span key={step} className={cn('h-1 rounded-full bg-white/10 transition-colors', passwordStrength >= step && (passwordStrength === 1 ? 'bg-red-400' : passwordStrength === 2 ? 'bg-yellow-400' : 'bg-emerald-400'))} />)}
                </div>
              )}
            </div>

            {errors.form && <p className="text-sm text-red-300">{errors.form}</p>}

            <button type="submit" disabled={loading || success} className={cn('flex h-[52px] w-full items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--auth-accent))] to-[hsl(var(--auth-accent-dark))] text-[15px] font-semibold text-white transition-all duration-200 hover:-translate-y-px hover:brightness-110 hover:shadow-[0_8px_25px_hsl(var(--auth-accent)/0.4)] active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-80', success && 'from-emerald-500 to-emerald-600')}>
              {loading ? <><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Memproses...</> : success ? <><Check size={18} className="mr-2" /> Berhasil</> : mode === 'login' ? 'Masuk' : 'Daftar'}
            </button>
          </form>

          <div className="my-7 flex items-center gap-4 text-xs text-white/35"><span className="h-px flex-1 bg-white/10" />atau masuk dengan<span className="h-px flex-1 bg-white/10" /></div>

          <div className="grid grid-cols-2 gap-3">
            <button type="button" className="flex h-11 items-center justify-center gap-2 rounded-[10px] bg-white text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"><GoogleIcon />Google</button>
            <button type="button" className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-white/10 bg-zinc-900 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-zinc-800"><Github size={17} />GitHub</button>
          </div>

          <p className="mt-8 text-center text-sm text-white/40">
            {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <button onClick={switchMode} className="font-semibold text-[hsl(var(--auth-accent))] hover:underline">{mode === 'login' ? 'Daftar' : 'Masuk'}</button>
          </p>
        </div>
      </section>
    </main>
  );
}

interface FloatingInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  icon: React.ReactNode;
  right?: React.ReactNode;
  type?: string;
  placeholder: string;
}

function FloatingInput({ label, value, onChange, onBlur, error, icon, right, type = 'text', placeholder }: FloatingInputProps) {
  const isFloating = value.length > 0;
  return (
    <div className={cn(error && 'auth-shake')}>
      <div className={cn('auth-input-shell relative flex h-[52px] items-center rounded-xl border bg-[hsl(var(--auth-card))] px-4 transition-all duration-200', error ? 'border-red-400/80' : 'border-white/10')}>
        <span className="mr-3 text-white/35">{icon}</span>
        <label className={cn('auth-field-label pointer-events-none absolute left-[50px] top-1/2 -translate-y-1/2 text-sm text-white/40', isFloating && 'is-floating')}>{label}</label>
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={isFloating ? placeholder : ''} className="h-full min-w-0 flex-1 bg-transparent pt-2 text-sm text-white outline-none placeholder:text-white/30" />
        {right && <span className="ml-3 flex items-center">{right}</span>}
      </div>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}