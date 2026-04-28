import { useState } from 'react';
import { Platform, TextInput, View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useV2 } from '@/constants/designTokensV2';
import { SUPABASE_URL, SUPABASE_ANON_KEY, APP_VERSION, PROJECT_NAME } from '@/constants/app';
import { checkInternetConnection } from '@/lib/network';

const MAX_MESSAGE_LENGTH = 500;

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const v2 = useV2();
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setMessage(''); setEmail(''); setError(null); setSuccess(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!message.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    const isConnected = await checkInternetConnection();
    if (!isConnected) {
      setError(t('errors.noInternet'));
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim() || null,
          app_version: APP_VERSION,
          device_platform: Platform.OS,
          project: PROJECT_NAME,
        }),
      });
      if (!response.ok) throw new Error('Failed to submit feedback');
      setSuccess(true);
      setTimeout(() => { resetForm(); onClose(); }, 2000);
    } catch {
      setError(t('feedback.errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={handleClose}
      title={t('feedback.modalTitle')}
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={handleClose}
            disabled={isSubmitting}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 12,
              borderWidth: 1, borderColor: v2.hairlineStrong,
              alignItems: 'center', justifyContent: 'center',
              opacity: isSubmitting ? 0.5 : 1,
            }}
          >
            <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '600', color: v2.ink }}>
              {t('common.cancel')}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            disabled={!message.trim() || isSubmitting}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 12,
              backgroundColor: v2.bgInk,
              alignItems: 'center', justifyContent: 'center',
              opacity: !message.trim() || isSubmitting ? 0.5 : 1,
            }}
          >
            <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.inkOnDark }}>
              {isSubmitting ? t('feedback.sending') : t('feedback.send')}
            </Text>
          </Pressable>
        </View>
      }
    >
      <View style={{ gap: 16 }}>
        <Field v2={v2} label={t('feedback.messageLabel')}>
          <View
            style={{
              backgroundColor: v2.bgRaised, borderRadius: 12,
              paddingHorizontal: 14, paddingVertical: 12,
            }}
          >
            <TextInput
              placeholder={t('feedback.messagePlaceholder')}
              placeholderTextColor={v2.inkSubtle}
              value={message}
              onChangeText={setMessage}
              maxLength={MAX_MESSAGE_LENGTH}
              multiline
              style={{
                fontFamily: v2.fontUI, fontSize: 14, color: v2.ink,
                padding: 0, minHeight: 100, textAlignVertical: 'top',
              }}
            />
          </View>
          <Text
            style={{
              marginTop: 4, textAlign: 'right',
              fontFamily: v2.fontUI, fontSize: 10,
              color: v2.inkSubtle, fontVariant: ['tabular-nums'],
            }}
          >
            {message.length} / {MAX_MESSAGE_LENGTH}
          </Text>
        </Field>

        <Field v2={v2} label={t('feedback.emailLabel')}>
          <View
            style={{
              backgroundColor: v2.bgRaised, borderRadius: 12,
              paddingHorizontal: 14, paddingVertical: 12,
            }}
          >
            <TextInput
              placeholder={t('feedback.emailPlaceholder')}
              placeholderTextColor={v2.inkSubtle}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ fontFamily: v2.fontUI, fontSize: 14, color: v2.ink, padding: 0 }}
            />
          </View>
        </Field>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="wifi-outline" size={14} color={v2.inkSubtle} />
          <Text style={{ fontFamily: v2.fontUI, fontSize: 11, color: v2.inkSubtle }}>
            {t('feedback.requiresInternet')}
          </Text>
        </View>

        {success ? (
          <View
            style={{
              padding: 12, borderRadius: 12,
              backgroundColor: v2.goodSoft,
              flexDirection: 'row', alignItems: 'center', gap: 8,
            }}
          >
            <Ionicons name="checkmark-circle" size={18} color={v2.good} />
            <Text style={{ fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.good }}>
              {t('feedback.successMessage')}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View
            style={{
              padding: 12, borderRadius: 12,
              backgroundColor: v2.badSoft,
              flexDirection: 'row', alignItems: 'center', gap: 8,
            }}
          >
            <Ionicons name="alert-circle" size={18} color={v2.bad} />
            <Text style={{ flex: 1, fontFamily: v2.fontUI, fontSize: 13, fontWeight: '700', color: v2.bad }}>
              {error}
            </Text>
          </View>
        ) : null}
      </View>
    </BottomSheet>
  );
}

interface FieldProps { v2: ReturnType<typeof useV2>; label: string; children: React.ReactNode; }
function Field({ v2, label, children }: FieldProps) {
  return (
    <View>
      <Text
        style={{
          fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700',
          letterSpacing: 1.5, textTransform: 'uppercase',
          color: v2.inkSubtle, marginBottom: 8,
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}
