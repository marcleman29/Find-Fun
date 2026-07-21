import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// Supabase returns a message like "Email not confirmed" for this case, but
// matching on "confirm" rather than the exact string is more robust to
// wording changes across SDK versions.
function isUnconfirmedEmailError(message: string): boolean {
  return message.toLowerCase().includes('confirm');
}

// Sign-up gets its own accent so the two forms read as visually distinct
// screens rather than one form with a different button label.
const MODE_THEME = {
  signIn: { accent: '#1a1a2e', emoji: '🔑', headline: 'Welcome back', subtitle: 'Sign in to continue' },
  signUp: {
    accent: '#0d9488',
    emoji: '✨',
    headline: 'Join Find Fun',
    subtitle: 'Create an account to get personalized picks',
  },
} as const;

export default function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const theme = MODE_THEME[mode];

  const handleSubmit = async () => {
    setError(null);
    setResent(false);

    if (mode === 'signUp' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const result = mode === 'signIn' ? await signIn(email, password) : await signUp(email, password);
    setSubmitting(false);

    if (result.error) {
      if (isUnconfirmedEmailError(result.error)) {
        setPendingVerificationEmail(email);
      } else {
        setError(result.error);
      }
      return;
    }

    if (mode === 'signUp') {
      // Land them on the sign-in form with the pending-verification banner
      // showing, rather than a dead-end "check your email" screen.
      setPendingVerificationEmail(email);
      setMode('signIn');
    } else {
      setPendingVerificationEmail(null);
    }
  };

  const handleResend = async () => {
    if (!pendingVerificationEmail) return;
    setResending(true);
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: pendingVerificationEmail,
    });
    setResending(false);
    setResent(!resendError);
  };

  const switchMode = () => {
    setMode(mode === 'signIn' ? 'signUp' : 'signIn');
    setError(null);
    setPendingVerificationEmail(null);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.emoji}>{theme.emoji}</Text>
        <Text style={styles.title}>{theme.headline}</Text>
        <Text style={styles.subtitle}>{theme.subtitle}</Text>

        {pendingVerificationEmail && (
          <View style={styles.verificationBanner}>
            <Text style={styles.verificationText}>
              Verification pending for {pendingVerificationEmail}. Check your inbox for a confirmation link,
              then sign in below.
            </Text>
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={styles.resendText}>
                {resending ? 'Resending…' : resent ? 'Email resent' : 'Resend confirmation email'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity style={styles.showToggle} onPress={() => setShowPassword((v) => !v)} hitSlop={12}>
              <Text style={[styles.showToggleText, { color: theme.accent }]}>
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'signUp' && (
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm password"
              placeholderTextColor="#999"
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
          )}

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.accent }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{mode === 'signIn' ? 'Sign In' : 'Create Account'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={switchMode}>
            <Text style={[styles.toggleText, { color: theme.accent }]}>
              {mode === 'signIn' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7fb',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emoji: {
    fontSize: 40,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#777',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  verificationBanner: {
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  verificationText: {
    color: '#3949ab',
    fontSize: 13,
    marginBottom: 6,
    lineHeight: 18,
  },
  resendText: {
    color: '#1a1a2e',
    fontWeight: '600',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    color: '#1a1a2e',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    marginBottom: 0,
  },
  showToggle: {
    paddingHorizontal: 12,
  },
  showToggleText: {
    fontWeight: '600',
    fontSize: 13,
  },
  error: {
    color: '#c0392b',
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  toggleText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
});
