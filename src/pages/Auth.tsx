import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Mail,
  ArrowLeft,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAppSelector } from '@/store';
import { Navbar } from '@/components/layout/Navbar';

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const { user, loading: authLoading } = useAppSelector((state) => state.auth);
  const [isSignUp, setIsSignUp] = useState(mode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isResetMode, setIsResetMode] = useState(mode === 'reset');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);
  const [forgotPasswordSocialProvider, setForgotPasswordSocialProvider] =
    useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Redirect to dashboard if user is authenticated (unless in reset mode or password just updated)
    if (!authLoading && user && !isResetMode && !passwordResetSuccess) {
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate, isResetMode, passwordResetSuccess]);

  useEffect(() => {
    setIsSignUp(mode === 'signup');
    setIsResetMode(mode === 'reset');
  }, [mode]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (error) throw error;

        setEmailSent(true);
        toast({
          title: 'Success!',
          description: 'Check your email to confirm your account.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: 'Welcome back!',
          description: 'Successfully signed in.',
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      console.log(window.location.origin);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send the password reset email directly
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });

      if (error) throw error;

      setResetEmailSent(true);
      toast({
        title: 'Request received',
        description: 'If an account exists, a reset link will be sent.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Passwords do not match.',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Password must be at least 6 characters.',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setPasswordResetSuccess(true);
      toast({
        title: 'Password updated!',
        description: 'Your password has been successfully changed.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-center text-primary">
              {isResetMode
                ? 'Set New Password'
                : isForgotPassword
                ? 'Reset Password'
                : isSignUp
                ? 'Join Gigpass'
                : 'Welcome Back'}
            </CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              {isResetMode
                ? 'Enter your new password below'
                : isForgotPassword
                ? "Enter your email and we'll send you a reset link"
                : isSignUp
                ? 'Create an account to start claiming unlimited tickets'
                : 'Sign in to your account'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {passwordResetSuccess ? (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Password Updated</h3>
                  <p className="text-muted-foreground text-sm">
                    Your password has been successfully changed.
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Continue to Dashboard
                </Button>
              </div>
            ) : isResetMode ? (
              <form
                onSubmit={handleUpdatePassword}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-background border-border pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-background border-border pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Update Password
                </Button>
              </form>
            ) : emailSent || resetEmailSent ? (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  {resetEmailSent ? (
                    <KeyRound className="h-6 w-6 text-primary" />
                  ) : (
                    <Mail className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Check your email</h3>
                  <p className="text-muted-foreground text-sm">
                    {resetEmailSent
                      ? 'If an account exists for '
                      : "We've sent a confirmation link to "}
                    <span className="font-medium text-foreground">{email}</span>
                    {resetEmailSent && ", we've sent a password reset link."}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEmailSent(false);
                    setResetEmailSent(false);
                    setIsForgotPassword(false);
                  }}
                  className="text-primary hover:underline text-sm"
                >
                  <ArrowLeft className="inline h-4 w-4 mr-1" />
                  Back to sign in
                </button>
              </div>
            ) : isForgotPassword && forgotPasswordSocialProvider ? (
              <div className="text-center space-y-4 py-4">
                <div className="mx-auto w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-amber-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No Password Needed</h3>
                  <p className="text-muted-foreground text-sm">
                    The account for{' '}
                    <span className="font-medium text-foreground">{email}</span>{' '}
                    uses{' '}
                    <span className="font-medium text-foreground capitalize">
                      {forgotPasswordSocialProvider}
                    </span>{' '}
                    to sign in. You don't need to reset your password.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setIsForgotPassword(false);
                    setForgotPasswordSocialProvider(null);
                  }}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Back to Sign In
                </Button>
                <p className="text-xs text-muted-foreground">
                  Just click "Continue with{' '}
                  {forgotPasswordSocialProvider === 'google'
                    ? 'Google'
                    : forgotPasswordSocialProvider}
                  " to sign in.
                </p>
              </div>
            ) : isForgotPassword ? (
              <>
                <form
                  onSubmit={handleForgotPassword}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-background border-border"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Send Reset Link
                  </Button>
                </form>
                <div className="text-center text-sm">
                  <button
                    onClick={() => setIsForgotPassword(false)}
                    className="text-primary hover:underline"
                  >
                    <ArrowLeft className="inline h-4 w-4 mr-1" />
                    Back to sign in
                  </button>
                </div>
              </>
            ) : (
              <>
                <Button
                  onClick={handleGoogleAuth}
                  variant="outline"
                  className="w-full border-border hover:border-primary/50"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg
                      className="mr-2 h-4 w-4"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>

                <form
                  onSubmit={handleEmailAuth}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {!isSignUp && (
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-background border-border pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {isSignUp ? 'Sign Up' : 'Sign In'}
                  </Button>
                </form>

                <div className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      const nextIsSignUp = !isSignUp;
                      setIsSignUp(nextIsSignUp);
                      setEmail('');
                      setPassword('');
                      setEmailSent(false);
                      setResetEmailSent(false);
                      setIsForgotPassword(false);
                      setForgotPasswordSocialProvider(null);
                      setPasswordResetSuccess(false);
                      if (nextIsSignUp) {
                        setSearchParams({ mode: 'signup' });
                      } else {
                        setSearchParams({});
                      }
                    }}
                    className="text-primary hover:underline"
                  >
                    {isSignUp
                      ? 'Already have an account? Sign in'
                      : "Don't have an account? Sign up"}
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
