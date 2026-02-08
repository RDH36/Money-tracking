import { useState } from 'react';
import { Platform, TextInput } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Box } from '@/components/ui/box';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Button, ButtonText } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { useTheme } from '@/contexts';
import { useEffectiveColorScheme } from '@/components/ui/gluestack-ui-provider';
import { getDarkModeColors } from '@/constants/darkMode';
import { SUPABASE_URL, SUPABASE_ANON_KEY, APP_VERSION, PROJECT_NAME } from '@/constants/app';
import { checkInternetConnection } from '@/lib/network';

const MAX_MESSAGE_LENGTH = 500;

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const effectiveScheme = useEffectiveColorScheme();
  const isDark = effectiveScheme === 'dark';
  const darkModeColors = getDarkModeColors(isDark);

  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setMessage('');
    setEmail('');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
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
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim() || null,
          app_version: APP_VERSION,
          device_platform: Platform.OS,
          project: PROJECT_NAME,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSuccess(true);
      setTimeout(() => {
        resetForm();
        onClose();
      }, 2000);
    } catch {
      setError(t('feedback.errorMessage'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog isOpen={isOpen} onClose={handleClose}>
      <AlertDialogBackdrop />
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <HStack space="sm" className="items-center">
            <Box
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: theme.colors.primaryLight }}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color={theme.colors.primary} />
            </Box>
            <Heading size="md" className="text-typography-900">{t('feedback.modalTitle')}</Heading>
          </HStack>
        </AlertDialogHeader>
        <AlertDialogBody className="mt-3 mb-4">
          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bottomOffset={20}
            style={{ maxHeight: 350 }}
          >
            <VStack space="lg">
              <VStack space="sm">
                <Text className="text-typography-700 font-medium">{t('feedback.messageLabel')}</Text>
                <Box
                  className="rounded-lg border border-outline-300 p-3"
                  style={{ backgroundColor: darkModeColors.inputBg }}
                >
                  <TextInput
                    placeholder={t('feedback.messagePlaceholder')}
                    placeholderTextColor={darkModeColors.textMuted}
                    value={message}
                    onChangeText={setMessage}
                    maxLength={MAX_MESSAGE_LENGTH}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={{
                      minHeight: 100,
                      color: isDark ? '#FFFFFF' : '#1F2937',
                      fontSize: 14,
                    }}
                  />
                </Box>
                <Text className="text-typography-400 text-xs text-right">
                  {t('common.characters', { current: message.length, max: MAX_MESSAGE_LENGTH })}
                </Text>
              </VStack>

              <VStack space="sm">
                <Text className="text-typography-700 font-medium">{t('feedback.emailLabel')}</Text>
                <Input size="md">
                  <InputField
                    placeholder={t('feedback.emailPlaceholder')}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </Input>
              </VStack>

              <HStack space="xs" className="items-center">
                <Ionicons name="wifi" size={14} color={darkModeColors.textMuted} />
                <Text className="text-typography-400 text-xs">{t('feedback.requiresInternet')}</Text>
              </HStack>

              {success && (
                <Box className="p-3 rounded-xl" style={{ backgroundColor: isDark ? '#052E16' : '#F0FDF4' }}>
                  <HStack space="sm" className="items-center">
                    <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                    <Text className="text-success-700 font-medium">{t('feedback.successMessage')}</Text>
                  </HStack>
                </Box>
              )}

              {error && (
                <Box className="p-3 rounded-xl" style={{ backgroundColor: isDark ? '#450A0A' : '#FEF2F2' }}>
                  <HStack space="sm" className="items-center">
                    <Ionicons name="alert-circle" size={20} color="#EF4444" />
                    <Text className="text-error-700 font-medium">{error}</Text>
                  </HStack>
                </Box>
              )}
            </VStack>
          </KeyboardAwareScrollView>
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button variant="outline" onPress={handleClose} isDisabled={isSubmitting}>
            <ButtonText>{t('common.cancel')}</ButtonText>
          </Button>
          <Button
            style={{ backgroundColor: theme.colors.primary }}
            onPress={handleSubmit}
            isDisabled={!message.trim() || isSubmitting}
          >
            <ButtonText className="text-white">
              {isSubmitting ? t('feedback.sending') : t('feedback.send')}
            </ButtonText>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
