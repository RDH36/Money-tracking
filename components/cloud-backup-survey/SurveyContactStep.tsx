import { View, Text, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useV2 } from '@/constants/designTokensV2';

interface SurveyContactStepProps {
  email: string;
  onEmailChange: (v: string) => void;
  comment: string;
  onCommentChange: (v: string) => void;
}

const MAX_COMMENT = 300;

/** Dernière étape du sondage : email (qui répond) + opinion libre. Tous deux optionnels. */
export function SurveyContactStep({ email, onEmailChange, comment, onCommentChange }: SurveyContactStepProps) {
  const v2 = useV2();
  const { t } = useTranslation();

  return (
    <View style={{ gap: 14 }}>
      <Field v2={v2} label={t('cloudSurvey.emailLabel')}>
        <View style={{ backgroundColor: v2.bgRaised, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
          <TextInput
            placeholder={t('cloudSurvey.emailPlaceholder')}
            placeholderTextColor={v2.inkSubtle}
            value={email}
            onChangeText={onEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ fontFamily: v2.fontUI, fontSize: 14, color: v2.ink, padding: 0 }}
          />
        </View>
      </Field>

      <Field v2={v2} label={t('cloudSurvey.commentLabel')}>
        <View style={{ backgroundColor: v2.bgRaised, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }}>
          <TextInput
            placeholder={t('cloudSurvey.commentPlaceholder')}
            placeholderTextColor={v2.inkSubtle}
            value={comment}
            onChangeText={onCommentChange}
            maxLength={MAX_COMMENT}
            multiline
            style={{ fontFamily: v2.fontUI, fontSize: 14, color: v2.ink, padding: 0, minHeight: 80, textAlignVertical: 'top' }}
          />
        </View>
        <Text style={{ marginTop: 4, textAlign: 'right', fontFamily: v2.fontUI, fontSize: 10, color: v2.inkSubtle, fontVariant: ['tabular-nums'] }}>
          {comment.length} / {MAX_COMMENT}
        </Text>
      </Field>
    </View>
  );
}

interface FieldProps { v2: ReturnType<typeof useV2>; label: string; children: React.ReactNode; }
function Field({ v2, label, children }: FieldProps) {
  return (
    <View>
      <Text style={{ fontFamily: v2.fontUI, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: v2.inkSubtle, marginBottom: 8 }}>
        {label}
      </Text>
      {children}
    </View>
  );
}
