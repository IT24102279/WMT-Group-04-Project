import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Dimensions, 
  Pressable, 
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Briefcase,
  Paperclip,
  X,
  ChevronRight,
  Filter
} from 'lucide-react-native';

import {
  getTransactions,
  getPaymentReminders,
  getCheckReminders,
  createTransaction,
  updateTransaction,
  deleteTransaction
} from '../../services/financeService';
import {
  financeChartColors,
  formatCurrency,
  sanitizeChartLabels,
  sortLegendLabels
} from '../../utils/financeChartRules';
import DatePickerField from '../../components/DatePickerField';
import { hasRequiredValues, sanitizeDecimal } from '../../utils/validation';
import { showToast } from '../../utils/toast';
import AttachmentPreview from '../../components/AttachmentPreview';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import Card from '../../components/Card';

const FinanceDashboardScreen = () => {
  const chartWidth = Dimensions.get('window').width - (SPACING.md * 2) - SPACING.md;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [paymentReminders, setPaymentReminders] = useState([]);
  const [checkReminders, setCheckReminders] = useState([]);
  const [selectedTransactionId, setSelectedTransactionId] = useState('');
  const [selectedReminderId, setSelectedReminderId] = useState('');
  const [documentAsset, setDocumentAsset] = useState(null);
  
  const initialForm = {
    type: 'expense',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    status: 'pending'
  };
  
  const [form, setForm] = useState(initialForm);

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [tx, pay, check] = await Promise.all([
        getTransactions(),
        getPaymentReminders(),
        getCheckReminders()
      ]);
      setTransactions(tx.data || []);
      setPaymentReminders(pay.data || []);
      setCheckReminders(check.data || []);
    } catch (error) {
      console.log('Finance dashboard load failed', error?.response?.data || error.message);
      showToast('Failed to load financial data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
  }, []);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false
      });
      if (!result.canceled && result.assets?.length) {
        setDocumentAsset(result.assets[0]);
      }
    } catch (error) {
      console.log('Document picker failed', error?.message || error);
      showToast('Could not pick document');
    }
  };

  const validateForm = () => {
    if (!hasRequiredValues(form, ['type', 'amount', 'date', 'status'])) {
      showToast('Please fill in all required fields');
      return false;
    }
    if (Number(form.amount) <= 0) {
      showToast('Amount must be greater than 0');
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setForm(initialForm);
    setSelectedTransactionId('');
    setSelectedReminderId('');
    setDocumentAsset(null);
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await createTransaction(form, documentAsset);
      resetForm();
      await loadData(false);
      showToast('Transaction recorded successfully');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to record transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedTransactionId) return;
    if (!validateForm()) return;
    setLoading(true);
    try {
      await updateTransaction(selectedTransactionId, form, documentAsset);
      resetForm();
      await loadData(false);
      showToast('Transaction updated successfully');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to update transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteTransaction(id);
              if (selectedTransactionId === id) resetForm();
              await loadData(false);
              showToast('Transaction deleted');
            } catch (error) {
              showToast(error?.response?.data?.message || 'Delete failed');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateTransaction(id, { status: newStatus });
      await loadData(false);
      showToast(`Marked as ${newStatus}`);
    } catch (error) {
      showToast('Failed to update status');
    }
  };

  const preloadTransaction = (item) => {
    setSelectedTransactionId(item._id);
    setSelectedReminderId('');
    setForm({
      type: item.type,
      amount: String(item.amount),
      date: new Date(item.date).toISOString().slice(0, 10),
      description: item.description || '',
      status: item.status
    });
  };

  const incomeTotal = transactions
    .filter((item) => item.type === 'income')
    .reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const expenseTotal = transactions
    .filter((item) => item.type === 'expense')
    .reduce((acc, item) => acc + Number(item.amount || 0), 0);

  const barData = {
    labels: ['Income', 'Expense'],
    datasets: [{ data: [incomeTotal, expenseTotal] }]
  };

  const chartConfig = {
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(6, 78, 59, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: { borderRadius: RADIUS.lg },
    propsForBackgroundLines: { strokeDasharray: '', stroke: COLORS.border }
  };

  if (loading && !refreshing && transactions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Analyzing financials...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Finance Center</Text>
          <Text style={styles.subtitle}>Track your pharmacy's cash flow</Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Net Balance</Text>
          <Text style={[styles.balanceValue, { color: incomeTotal >= expenseTotal ? COLORS.success : COLORS.error }]}>
            {formatCurrency(incomeTotal - expenseTotal, 'LKR')}
          </Text>
        </View>
      </View>

      {/* Analytics Section */}
      <View style={styles.statsRow}>
        <View style={[styles.statItem, { backgroundColor: '#ECFDF5' }]}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.success }]}>
            <TrendingUp size={16} color={COLORS.white} />
          </View>
          <Text style={styles.statLabel}>Income</Text>
          <Text style={styles.statValue}>{formatCurrency(incomeTotal, 'LKR')}</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: '#FEF2F2' }]}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.error }]}>
            <TrendingDown size={16} color={COLORS.white} />
          </View>
          <Text style={styles.statLabel}>Expenses</Text>
          <Text style={styles.statValue}>{formatCurrency(expenseTotal, 'LKR')}</Text>
        </View>
      </View>

      <Card style={styles.chartCard}>
        <Text style={styles.cardHeader}>Financial Overview</Text>
        <BarChart
          data={barData}
          width={chartWidth}
          height={200}
          fromZero
          chartConfig={chartConfig}
          yAxisLabel="Rs "
          showValuesOnTopOfBars
          style={{ marginVertical: SPACING.md, borderRadius: RADIUS.lg }}
        />
      </Card>

      {/* Form Section */}
      <Card style={styles.formCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeader}>
            {selectedTransactionId ? 'Edit Transaction' : 'Record Transaction'}
          </Text>
          {selectedTransactionId && (
            <Pressable onPress={resetForm} style={styles.closeButton}>
              <X size={20} color={COLORS.textLight} />
            </Pressable>
          )}
        </View>

        <Text style={styles.inputLabel}>Transaction Type</Text>
        <View style={styles.typeSelector}>
          <Pressable 
            style={[styles.typeButton, form.type === 'income' && styles.typeButtonActiveIncome]} 
            onPress={() => updateForm('type', 'income')}
          >
            <TrendingUp size={18} color={form.type === 'income' ? COLORS.white : COLORS.success} />
            <Text style={[styles.typeButtonText, form.type === 'income' && styles.typeButtonTextActive]}>Income</Text>
          </Pressable>
          <Pressable 
            style={[styles.typeButton, form.type === 'expense' && styles.typeButtonActiveExpense]} 
            onPress={() => updateForm('type', 'expense')}
          >
            <TrendingDown size={18} color={form.type === 'expense' ? COLORS.white : COLORS.error} />
            <Text style={[styles.typeButtonText, form.type === 'expense' && styles.typeButtonTextActive]}>Expense</Text>
          </Pressable>
        </View>

        <CustomInput
          label="Amount"
          placeholder="0.00"
          value={form.amount}
          onChangeText={(v) => updateForm('amount', sanitizeDecimal(v))}
          keyboardType="decimal-pad"
          icon={DollarSign}
        />

        <DatePickerField 
          label="Transaction Date" 
          value={form.date} 
          onChange={(v) => updateForm('date', v)} 
        />

        <CustomInput
          label="Description"
          placeholder="e.g. Medicine purchase, Patient payment"
          value={form.description}
          onChangeText={(v) => updateForm('description', v)}
          icon={FileText}
        />

        <Text style={styles.inputLabel}>Status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusScroll} contentContainerStyle={{ gap: SPACING.xs }}>
          {['pending', 'completed', 'overdue'].map((s) => (
            <Pressable 
              key={s}
              style={[styles.statusTag, form.status === s && styles.statusTagActive]}
              onPress={() => updateForm('status', s)}
            >
              <Text style={[styles.statusTagText, form.status === s && styles.statusTagTextActive]}>
                {s.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable style={styles.attachmentButton} onPress={pickDocument}>
          <Paperclip size={20} color={COLORS.primary} />
          <Text style={styles.attachmentText}>
            {documentAsset ? documentAsset.name : 'Attach Receipt/Document'}
          </Text>
          {documentAsset && (
            <Pressable onPress={() => setDocumentAsset(null)}>
              <X size={16} color={COLORS.error} />
            </Pressable>
          )}
        </Pressable>

        <View style={styles.formActions}>
          <CustomButton
            title={selectedTransactionId ? 'Update Record' : 'Record Transaction'}
            onPress={selectedTransactionId ? handleUpdate : handleCreate}
            icon={selectedTransactionId ? Edit3 : Plus}
            style={{ flex: 2 }}
          />
          {selectedTransactionId && (
            <CustomButton
              title=""
              variant="outline"
              onPress={() => handleDelete(selectedTransactionId)}
              icon={Trash2}
              style={{ flex: 0.5, borderColor: COLORS.error }}
              textStyle={{ color: COLORS.error }}
            />
          )}
        </View>
      </Card>

      {/* Reminders Section */}
      {(paymentReminders.length > 0 || checkReminders.length > 0) && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={COLORS.accent} />
            <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
          </View>
          
          {[...paymentReminders, ...checkReminders].map((r) => (
            <View key={r._id} style={[styles.reminderCard, r.status === 'overdue' && styles.overdueBorder]}>
              <View style={styles.reminderInfo}>
                <Text style={styles.reminderDesc}>{r.description || 'Unnamed Reminder'}</Text>
                <Text style={styles.reminderMeta}>
                  Due: {new Date(r.date).toLocaleDateString()} • {formatCurrency(r.amount, 'LKR')}
                </Text>
              </View>
              <View style={styles.reminderActions}>
                <Pressable 
                  style={styles.reminderActionButton} 
                  onPress={() => handleStatusUpdate(r._id, 'completed')}
                >
                  <CheckCircle size={20} color={COLORS.success} />
                </Pressable>
                <Pressable 
                  style={styles.reminderActionButton} 
                  onPress={() => preloadTransaction(r)}
                >
                  <Edit3 size={20} color={COLORS.primary} />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Transaction List */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Briefcase size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertCircle size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No transactions recorded yet.</Text>
          </View>
        ) : (
          transactions.map((item) => (
            <Pressable 
              key={item._id} 
              style={[styles.transactionCard, selectedTransactionId === item._id && styles.selectedTransaction]}
              onPress={() => preloadTransaction(item)}
            >
              <View style={styles.transactionCardContent}>
                <View style={[styles.transactionIcon, { backgroundColor: item.type === 'income' ? '#ECFDF5' : '#FEF2F2' }]}>
                  {item.type === 'income' ? (
                    <TrendingUp size={20} color={COLORS.success} />
                  ) : (
                    <TrendingDown size={20} color={COLORS.error} />
                  )}
                </View>
                <View style={styles.transactionMain}>
                  <Text style={styles.transactionTitle} numberOfLines={1}>
                    {item.description || 'Transaction'}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(item.date).toLocaleDateString()} • {item.status.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={[styles.transactionAmount, { color: item.type === 'income' ? COLORS.success : COLORS.error }]}>
                    {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount, 'LKR')}
                  </Text>
                </View>
              </View>
              {item.documentUrl && (
                <View style={styles.listAttachment}>
                  <AttachmentPreview 
                    url={item.documentUrl} 
                    imageLabel="Receipt Preview"
                    pdfLabel="View PDF Receipt"
                  />
                </View>
              )}
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  content: { 
    padding: SPACING.md,
    paddingBottom: SPACING.xxl
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.md,
    color: COLORS.textLight
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm
  },
  title: { 
    ...TYPOGRAPHY.h1, 
    color: COLORS.primary,
    fontSize: 28
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  balanceCard: {
    alignItems: 'flex-end'
  },
  balanceLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontWeight: '600'
  },
  balanceValue: {
    ...TYPOGRAPHY.h2,
    fontSize: 22
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.lg
  },
  statItem: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    ...SHADOWS.light
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontWeight: '600'
  },
  statValue: {
    ...TYPOGRAPHY.h3,
    fontSize: 18,
    color: COLORS.text
  },
  chartCard: {
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: 'center'
  },
  cardHeader: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
    width: '100%'
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  formCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.xl
  },
  inputLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '700',
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm
  },
  typeSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white
  },
  typeButtonActiveIncome: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success
  },
  typeButtonActiveExpense: {
    backgroundColor: COLORS.error,
    borderColor: COLORS.error
  },
  typeButtonText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight
  },
  typeButtonTextActive: {
    color: COLORS.white
  },
  statusScroll: {
    marginBottom: SPACING.md
  },
  statusTag: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white
  },
  statusTagActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textLight
  },
  statusTagTextActive: {
    color: COLORS.white
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDF4',
    marginBottom: SPACING.lg
  },
  attachmentText: {
    flex: 1,
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600'
  },
  formActions: {
    flexDirection: 'row',
    gap: SPACING.sm
  },
  section: {
    marginBottom: SPACING.xl
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text
  },
  reminderCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
    ...SHADOWS.light
  },
  overdueBorder: {
    borderLeftColor: COLORS.error
  },
  reminderInfo: {
    flex: 1
  },
  reminderDesc: {
    ...TYPOGRAPHY.body,
    fontWeight: '600'
  },
  reminderMeta: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight
  },
  reminderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm
  },
  reminderActionButton: {
    padding: SPACING.xs
  },
  transactionCard: {
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.light
  },
  transactionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listAttachment: {
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  selectedTransaction: {
    borderColor: COLORS.primary,
    borderWidth: 1.5
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md
  },
  transactionMain: {
    flex: 1
  },
  transactionTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text
  },
  transactionDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: SPACING.xs
  },
  transactionAmount: {
    ...TYPOGRAPHY.body,
    fontWeight: '700'
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xxl,
    opacity: 0.5
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    marginTop: SPACING.md,
    color: COLORS.textLight
  },
  closeButton: {
    padding: SPACING.xs
  }
});

export default FinanceDashboardScreen;
