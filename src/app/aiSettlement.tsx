import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Circle, G, Svg } from 'react-native-svg';

import { CloseIcon, CopyIcon, PlusIcon } from '@/components/icons';
import { LedgerColors } from '@/constants/ledgerColors';
import { supabase } from '@/lib/supabase';
import { buildSettlementMessage, calculateSettlement, type SettlementExtra } from '@/lib/settlement';
import { useCategories } from '@/store/categoriesContext';
import { useSettings } from '@/store/settingsContext';
import { formatAmount, getDayTransactions, TODAY, useTransactions } from '@/store/transactionsContext';
import { createStyles } from '@/styles/aiSettlementStyles';

type AiSettlementResponse = {
  participants: string[];
  rounds: { id: string; attendees: string[]; extras: { label: string; amount: number; appliesTo: string[] }[] }[];
};

const DONUT_R = 70;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_R;

const CHART_COLORS = [
  LedgerColors.food,
  LedgerColors.transport,
  LedgerColors.shopping,
  LedgerColors.fixed,
  LedgerColors.etc,
  LedgerColors.housing,
  LedgerColors.health,
  LedgerColors.leisure,
  LedgerColors.events,
  LedgerColors.finance,
];

export default function AiSettlementModal() {
  const { t } = useTranslation();
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { transactions } = useTransactions();
  const { getCategoryMeta } = useCategories();

  const todayExpenses = useMemo(
    () => getDayTransactions(transactions, TODAY.dateStr).filter((tx) => tx.type === 'expense'),
    [transactions],
  );

  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [participantInput, setParticipantInput] = useState('');
  const [attendeesByTx, setAttendeesByTx] = useState<Record<string, string[]>>({});
  const [extrasByTx, setExtrasByTx] = useState<Record<string, SettlementExtra[]>>({});
  const [result, setResult] = useState<ReturnType<typeof calculateSettlement> | null>(null);
  const [copied, setCopied] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (!result) return;
    const id = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(id);
  }, [result]);

  const handleInputFocus = () => {
    if (Platform.OS !== 'ios') return;
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: scrollYRef.current + 20, animated: true });
    }, 10);
  };

  const toggleTx = (id: string) => {
    setSelectedTxIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      setAttendeesByTx((prevAttendees) => ({ ...prevAttendees, [id]: prevAttendees[id] ?? participants }));
      return [...prev, id];
    });
    setResult(null);
  };

  const handleAddParticipant = () => {
    const names = Array.from(new Set(participantInput.trim().split(/\s+/).filter(Boolean)));
    const newNames = names.filter((name) => !participants.includes(name));
    if (newNames.length === 0) {
      setParticipantInput('');
      return;
    }
    setParticipants((prev) => [...prev, ...newNames]);
    setAttendeesByTx((prev) => {
      const next = { ...prev };
      for (const id of selectedTxIds) next[id] = [...(next[id] ?? []), ...newNames];
      return next;
    });
    setParticipantInput('');
    setResult(null);
  };

  const handleRemoveParticipant = (name: string) => {
    setParticipants((prev) => prev.filter((p) => p !== name));
    setAttendeesByTx((prev) => {
      const next: Record<string, string[]> = {};
      for (const [id, list] of Object.entries(prev)) next[id] = list.filter((p) => p !== name);
      return next;
    });
    setExtrasByTx((prev) => {
      const next: Record<string, SettlementExtra[]> = {};
      for (const [id, list] of Object.entries(prev)) {
        next[id] = list.map((e) => ({ ...e, appliesTo: e.appliesTo.filter((p) => p !== name) }));
      }
      return next;
    });
    setResult(null);
  };

  const toggleAttendee = (txId: string, name: string) => {
    setAttendeesByTx((prev) => {
      const cur = prev[txId] ?? [];
      const next = cur.includes(name) ? cur.filter((p) => p !== name) : [...cur, name];
      return { ...prev, [txId]: next };
    });
    setResult(null);
  };

  const addExtra = (txId: string) => {
    setExtrasByTx((prev) => {
      const cur = prev[txId] ?? [];
      const newExtra: SettlementExtra = {
        id: `extra-${Date.now()}`,
        label: '',
        amount: 0,
        appliesTo: [...(attendeesByTx[txId] ?? [])],
      };
      return { ...prev, [txId]: [...cur, newExtra] };
    });
  };

  const updateExtra = (txId: string, extraId: string, patch: Partial<SettlementExtra>) => {
    setExtrasByTx((prev) => ({
      ...prev,
      [txId]: (prev[txId] ?? []).map((e) => (e.id === extraId ? { ...e, ...patch } : e)),
    }));
    setResult(null);
  };

  const removeExtra = (txId: string, extraId: string) => {
    setExtrasByTx((prev) => ({ ...prev, [txId]: (prev[txId] ?? []).filter((e) => e.id !== extraId) }));
    setResult(null);
  };

  const toggleExtraPerson = (txId: string, extraId: string, name: string) => {
    setExtrasByTx((prev) => ({
      ...prev,
      [txId]: (prev[txId] ?? []).map((e) => {
        if (e.id !== extraId) return e;
        const has = e.appliesTo.includes(name);
        return { ...e, appliesTo: has ? e.appliesTo.filter((p) => p !== name) : [...e.appliesTo, name] };
      }),
    }));
    setResult(null);
  };

  const canCalculate = selectedTxIds.length > 0 && participants.length > 0;

  const selectedTxList = selectedTxIds.map((id) => todayExpenses.find((tx) => tx.id === id)).filter((tx) => !!tx);

  const handleCalculate = () => {
    const rounds = selectedTxList.map((tx) => {
      const meta = getCategoryMeta(tx.categoryKey);
      return {
        id: tx.id,
        label: tx.memo || meta.name,
        total: tx.amount,
        attendees: attendeesByTx[tx.id] ?? [],
        extras: (extrasByTx[tx.id] ?? []).filter((e) => e.label.trim() && e.amount > 0 && e.appliesTo.length > 0),
      };
    });
    setResult(calculateSettlement(rounds));
  };

  const handleAiFill = async () => {
    if (!aiText.trim() || selectedTxList.length === 0) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke<AiSettlementResponse>('ai-settlement', {
        body: {
          text: aiText,
          participants,
          rounds: selectedTxList.map((tx) => ({
            id: tx.id,
            label: tx.memo || getCategoryMeta(tx.categoryKey).name,
            total: tx.amount,
          })),
        },
      });
      if (error || !data) throw error ?? new Error('empty response');

      setParticipants((prev) => Array.from(new Set([...prev, ...data.participants])));
      setAttendeesByTx((prev) => {
        const next = { ...prev };
        for (const r of data.rounds) next[r.id] = r.attendees;
        return next;
      });
      setExtrasByTx((prev) => {
        const next = { ...prev };
        for (const r of data.rounds) {
          if (r.extras.length === 0) continue;
          next[r.id] = r.extras.map((e, i) => ({
            id: `ai-extra-${r.id}-${i}-${Date.now()}`,
            label: e.label,
            amount: e.amount,
            appliesTo: e.appliesTo,
          }));
        }
        return next;
      });
      setAiText('');
      setResult(null);
    } catch {
      Alert.alert(t('aiSettlement.aiFillErrorTitle'), t('aiSettlement.aiFillErrorBody'));
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const roundLabels = selectedTxList.map((tx) => tx.memo || getCategoryMeta(tx.categoryKey).name);
    await Clipboard.setStringAsync(buildSettlementMessage(result, roundLabels));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.sheet}
      behavior={Platform.OS === 'android' ? 'height' : undefined}>
      <View style={styles.handle} />
      <View style={styles.sheetHead}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.btnCancel}>{t('common.cancel')}</Text>
        </Pressable>
        <Text style={styles.sheetTitle}>{t('aiSettlement.title')}</Text>
        <View style={styles.headSpacer} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        scrollEventThrottle={16}
        onScroll={(e) => {
          scrollYRef.current = e.nativeEvent.contentOffset.y;
        }}>
        <Text style={styles.introText}>{t('aiSettlement.introText')}</Text>

        <Text style={styles.sectionLabel}>{t('aiSettlement.pickTransactions')}</Text>
        {todayExpenses.length === 0 ? (
          <Text style={styles.emptyText}>{t('aiSettlement.noTodayTransactions')}</Text>
        ) : (
          todayExpenses.map((tx) => {
            const meta = getCategoryMeta(tx.categoryKey);
            const selected = selectedTxIds.includes(tx.id);
            return (
              <Pressable key={tx.id} style={[styles.txRow, selected && styles.txRowSelected]} onPress={() => toggleTx(tx.id)}>
                <View style={[styles.iconCircle, { backgroundColor: meta.color }]}>
                  <meta.Icon size={18} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txName}>{tx.memo || meta.name}</Text>
                  <Text style={styles.txMeta}>{tx.time}</Text>
                </View>
                <Text style={styles.txAmt}>
                  {formatAmount(tx.amount)}
                  {t('common.won')}
                </Text>
              </Pressable>
            );
          })
        )}

        <Text style={styles.sectionLabel}>{t('aiSettlement.participants')}</Text>
        <Text style={styles.hintText}>{t('aiSettlement.participantHint')}</Text>
        <View style={styles.subInputRow}>
          <TextInput
            style={styles.subInput}
            placeholder={t('aiSettlement.participantPlaceholder')}
            placeholderTextColor={colors.mutedLight}
            value={participantInput}
            onChangeText={setParticipantInput}
            onSubmitEditing={handleAddParticipant}
            onFocus={handleInputFocus}
            returnKeyType="done"
          />
          <Pressable style={styles.subAddBtn} onPress={handleAddParticipant}>
            <Text style={styles.subAddBtnText}>{t('common.add')}</Text>
          </Pressable>
        </View>
        {participants.length > 0 && (
          <View style={styles.subChipWrap}>
            {participants.map((name) => (
              <View key={name} style={styles.subChip}>
                <Text style={styles.subChipText}>{name}</Text>
                <Pressable style={styles.chipRemoveBtn} onPress={() => handleRemoveParticipant(name)} hitSlop={8}>
                  <CloseIcon size={10} color={colors.muted} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {selectedTxList.length > 0 && participants.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>{t('aiSettlement.aiFillLabel')}</Text>
            <Text style={styles.hintText}>{t('aiSettlement.aiFillHint')}</Text>
            <TextInput
              style={styles.aiInput}
              placeholder={t('aiSettlement.aiFillPlaceholder')}
              placeholderTextColor={colors.mutedLight}
              value={aiText}
              onChangeText={setAiText}
              onFocus={handleInputFocus}
              multiline
            />
            <Pressable
              style={[styles.aiFillBtn, (!aiText.trim() || aiLoading) && styles.calcBtnDisabled]}
              disabled={!aiText.trim() || aiLoading}
              onPress={handleAiFill}>
              <Text style={styles.aiFillBtnText}>{aiLoading ? t('aiSettlement.aiFilling') : t('aiSettlement.aiFillButton')}</Text>
            </Pressable>

            <Text style={styles.sectionLabel}>{t('aiSettlement.whoWasThere')}</Text>
            {selectedTxList.map((tx) => {
              const meta = getCategoryMeta(tx.categoryKey);
              const attendees = attendeesByTx[tx.id] ?? [];
              const extras = extrasByTx[tx.id] ?? [];
              return (
                <View key={tx.id} style={styles.roundCard}>
                  <View style={styles.roundHead}>
                    <Text style={styles.roundTitle}>{tx.memo || meta.name}</Text>
                    <Text style={styles.roundAmt}>
                      {formatAmount(tx.amount)}
                      {t('common.won')}
                    </Text>
                  </View>
                  <View style={styles.chipWrap}>
                    {participants.map((name) => {
                      const on = attendees.includes(name);
                      return (
                        <Pressable
                          key={name}
                          style={[styles.chip, on && styles.chipSelected]}
                          onPress={() => toggleAttendee(tx.id, name)}>
                          <Text style={[styles.chipText, on && styles.chipTextSelected]}>{name}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {extras.length > 0 && <Text style={styles.extraHint}>{t('aiSettlement.extraHint')}</Text>}

                  {extras.map((extra, extraIndex) => (
                    <View key={extra.id} style={styles.extraCard}>
                      <View style={styles.extraCardHead}>
                        <Text style={styles.extraCardLabel}>
                          {t('aiSettlement.extraItem')} {extraIndex + 1}
                        </Text>
                        <Pressable style={styles.chipRemoveBtn} onPress={() => removeExtra(tx.id, extra.id)} hitSlop={8}>
                          <CloseIcon size={10} color={colors.muted} />
                        </Pressable>
                      </View>
                      <View style={styles.extraInputRow}>
                        <TextInput
                          style={styles.extraLabelInput}
                          placeholder={t('aiSettlement.extraLabelPlaceholder')}
                          placeholderTextColor={colors.mutedLight}
                          value={extra.label}
                          onChangeText={(text) => updateExtra(tx.id, extra.id, { label: text })}
                          onFocus={handleInputFocus}
                        />
                        <TextInput
                          style={styles.extraAmountInput}
                          placeholder="0"
                          placeholderTextColor={colors.mutedLight}
                          keyboardType="number-pad"
                          value={extra.amount ? String(extra.amount) : ''}
                          onChangeText={(text) =>
                            updateExtra(tx.id, extra.id, { amount: parseInt(text.replace(/[^0-9]/g, ''), 10) || 0 })
                          }
                          onFocus={handleInputFocus}
                        />
                      </View>
                      <Text style={styles.extraSubLabel}>{t('aiSettlement.extraAppliesTo')}</Text>
                      <View style={styles.chipWrap}>
                        {attendees.map((name) => {
                          const on = extra.appliesTo.includes(name);
                          return (
                            <Pressable
                              key={name}
                              style={[styles.chipSmall, on && styles.chipSelected]}
                              onPress={() => toggleExtraPerson(tx.id, extra.id, name)}>
                              <Text style={[styles.chipTextSmall, on && styles.chipTextSelected]}>{name}</Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}

                  <Pressable style={styles.addExtraBtn} onPress={() => addExtra(tx.id)}>
                    <PlusIcon size={12} color={colors.ink2} />
                    <Text style={styles.addExtraBtnText}>{t('aiSettlement.addExtra')}</Text>
                  </Pressable>
                </View>
              );
            })}
          </>
        )}

        <Pressable style={[styles.calcBtn, !canCalculate && styles.calcBtnDisabled]} disabled={!canCalculate} onPress={handleCalculate}>
          <Text style={styles.calcBtnText}>{t('aiSettlement.calculate')}</Text>
        </Pressable>

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>{t('aiSettlement.resultTitle')}</Text>
            {result.perPerson.length === 0 ? (
              <Text style={styles.emptyText}>{t('aiSettlement.noResult')}</Text>
            ) : (
              <>
                <View style={styles.donutWrap}>
                  <Svg width={180} height={180} viewBox="0 0 200 200">
                    <Circle cx="100" cy="100" r={DONUT_R} fill="none" stroke={colors.lineLighter} strokeWidth={26} />
                    <G transform="rotate(-90, 100, 100)">
                      {(() => {
                        let offset = 0;
                        return result.perPerson.map((p, i) => {
                          const pct = result.total > 0 ? p.amount / result.total : 0;
                          const len = pct * CIRCUMFERENCE;
                          const el = (
                            <Circle
                              key={p.name}
                              cx="100"
                              cy="100"
                              r={DONUT_R}
                              fill="none"
                              stroke={CHART_COLORS[i % CHART_COLORS.length]}
                              strokeWidth={26}
                              strokeDasharray={`${len} ${CIRCUMFERENCE - len}`}
                              strokeDashoffset={-offset}
                            />
                          );
                          offset += len;
                          return el;
                        });
                      })()}
                    </G>
                  </Svg>
                  <View style={styles.donutCenter} pointerEvents="none">
                    <Text style={styles.donutTotal}>{formatAmount(result.total)}</Text>
                    <Text style={styles.donutSub}>{t('common.won')}</Text>
                  </View>
                </View>

                {result.perPerson.map((p, i) => (
                  <View key={p.name} style={styles.rankRow}>
                    <View style={[styles.rankDot, { backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }]} />
                    <Text style={styles.rankName}>{p.name}</Text>
                    <Text style={styles.rankAmt}>
                      {formatAmount(p.amount)}
                      {t('common.won')}
                    </Text>
                  </View>
                ))}

                <Pressable style={styles.copyBtn} onPress={handleCopy}>
                  <CopyIcon size={16} color="#fff" />
                  <Text style={styles.copyBtnText}>{copied ? t('aiSettlement.copied') : t('aiSettlement.copyText')}</Text>
                </Pressable>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
