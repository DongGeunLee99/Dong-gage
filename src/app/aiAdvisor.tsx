import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { SparkleIcon } from '@/components/icons';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/store/settingsContext';
import { TODAY } from '@/store/transactionsContext';
import { createStyles } from '@/styles/aiAdvisorStyles';

type ChatMessage = { role: 'user' | 'model'; text: string; error?: boolean };

type AiAdvisorResponse = { text: string };

const SUGGESTION_KEYS = ['aiAdvisor.suggestion1', 'aiAdvisor.suggestion2', 'aiAdvisor.suggestion3'] as const;

export default function AiAdvisorModal() {
  const { t, i18n } = useTranslation();
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(id);
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const history = messages.filter((m) => !m.error).map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<AiAdvisorResponse>('ai-advisor', {
        body: { history, message: trimmed, today: TODAY.dateStr, language: i18n.language },
      });
      if (error || !data?.text) throw error ?? new Error('empty response');
      setMessages((prev) => [...prev, { role: 'model', text: data.text }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'model', text: t('aiAdvisor.errorText'), error: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.sheet} behavior={Platform.OS === 'android' ? 'height' : undefined}>
      <View style={styles.handle} />
      <View style={styles.sheetHead}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.btnCancel}>{t('common.cancel')}</Text>
        </Pressable>
        <Text style={styles.sheetTitle}>{t('aiAdvisor.title')}</Text>
        <View style={styles.headSpacer} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets>
        {messages.length === 0 && (
          <View style={styles.introWrap}>
            <View style={styles.introIcon}>
              <SparkleIcon size={22} color={colors.ink} />
            </View>
            <Text style={styles.introText}>{t('aiAdvisor.introText')}</Text>
            <View style={styles.suggestionWrap}>
              {SUGGESTION_KEYS.map((key) => (
                <Pressable key={key} style={styles.suggestionChip} onPress={() => send(t(key))}>
                  <Text style={styles.suggestionText}>{t(key)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {messages.map((m, i) => (
          <View key={i} style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleModel, m.error && styles.bubbleError]}>
            <Text style={[styles.bubbleText, m.role === 'user' && styles.bubbleTextUser]}>{m.text}</Text>
          </View>
        ))}

        {loading && (
          <View style={[styles.bubble, styles.bubbleModel]}>
            <ActivityIndicator size="small" color={colors.muted} />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={t('aiAdvisor.inputPlaceholder')}
          placeholderTextColor={colors.mutedLight}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
          editable={!loading}
          multiline
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          disabled={!input.trim() || loading}
          onPress={() => send(input)}>
          <Text style={styles.sendBtnText}>{t('aiAdvisor.send')}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
