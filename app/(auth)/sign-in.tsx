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

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// Supabase returns a message like "Email not confirmed" for this case, but
// matching on "confirm" rather than the exact string is more robust to
// wording changes across SDK versions.
function isUnconfirmedEmailError(message: string): boolean {
  return message.toLowerCase().includes('confirm');
}

export default function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    setResent(false);
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>Find Fun</Text>
      <Text style={styles.subtitle}>
        {mode === 'signIn' ? 'Sign in to continue' : 'Create an account to get started'}
      </Text>

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
            <Text style={styles.showToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{mode === 'signIn' ? 'Sign In' : 'Create Account'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setMode(mode === 'signIn' ? 'signUp' : 'signIn');
            setError(null);
            setPendingVerificationEmail(null);
          }}
        >
          <Text style={styles.toggleText}>
            {mode === 'signIn' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f7f7fb',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a2e',
    textAlign: 'center',
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
    color: '#3949ab',
    fontWeight: '600',
    fontSize: 13,
  },
  error: {
    color: '#c0392b',
    fontSize: 13,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#1a1a2e',
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
    color: '#3949ab',
    fontSize: 14,
  },
});
