import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Pressable, Dimensions } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { BarChart, PieChart } from 'react-native-chart-kit';

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
import { Plus, Trash2, Edit3, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react-native';

const FinanceDashboardScreen = () => {
  const chartWidth = Dimensions.get('window').width - 56;
  const [transactions, setTransactions] = useState([]);
  const [paymentReminders, setPaymentReminders] = useState([]);
  const [checkReminders, setCheckReminders] = useState([]);
  const [selectedTransactionId, setSelectedTransactionId] = useState('');
  const [selectedReminderId, setSelectedReminderId] = useState('');
  const [documentAsset, setDocumentAsset] = useState(null);
  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    date: '',
    description: '',
    status: 'pending'
  });

  const loadData = async () => {
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
    }
  };

  useEffect(() => {
    loadData();
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
      showToast('Type, amount, date, and status are required');
      return false;
    }
    if (Number(form.amount) <= 0) {
      showToast('Amount must be greater than 0');
      return false;
    }
    return true;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      await createTransaction(form, documentAsset);
      setDocumentAsset(null);
      await loadData();
      showToast('Transaction created');
    } catch (error) {
      console.log('Create transaction failed', error?.response?.data || error.message);
      showToast(error?.response?.data?.message || 'Create transaction failed');
    }
  };

  const handleCreateReminder = async () => {
    if (!form.amount || !form.date) {
      showToast('Amount and date are required for reminders');
      return;
    }
    try {
      await createTransaction(
        {
          type: 'expense',
          amount: Number(form.amount || 0),
          date: form.date,
          description: form.description,
          status: 'pending',
          isReminder: true
        },
        null
      );
      await loadData();
      setForm((prev) => ({ ...prev, amount: '', date: '', description: '' }));
      showToast('Reminder created');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Create reminder failed');
    }
  };

  const handleUpdateReminder = async () => {
    if (!selectedReminderId) {
      showToast('Select a reminder first');
      return;
    }
    if (!form.amount || !form.date) {
      showToast('Amount and date are required for reminders');
      return;
    }
    try {
      await updateTransaction(selectedReminderId, {
        type: 'expense',
        amount: Number(form.amount || 0),
        date: form.date,
        description: form.description,
        status: 'pending',
        isReminder: true
      }, null);
      await loadData();
      setSelectedReminderId('');
      setForm((prev) => ({ ...prev, amount: '', date: '', description: '' }));
      showToast('Reminder updated');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Update reminder failed');
    }
  };

  const handleUpdate = async () => {
    if (!selectedTransactionId) {
      showToast('Select a transaction first');
      return;
    }
    if (!validateForm()) {
      return;
    }
    try {
      await updateTransaction(selectedTransactionId, form, documentAsset);
      setDocumentAsset(null);
      await loadData();
      showToast('Transaction updated');
    } catch (error) {
      console.log('Update transaction failed', error?.response?.data || error.message);
      showToast(error?.response?.data?.message || 'Update transaction failed');
    }
  };

  const handleDelete = async () => {
    if (!selectedTransactionId) {
      showToast('Select a transaction first');
      return;
    }
    try {
      await deleteTransaction(selectedTransactionId);
      setSelectedTransactionId('');
      await loadData();
      showToast('Transaction deleted');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Delete failed');
    }
  };

  const preloadTransaction = (item) => {
    setSelectedTransactionId(item._id);
    setForm({
      type: item.type,
      amount: String(item.amount),
      date: new Date(item.date).toISOString().slice(0, 10),
      description: item.description || '',
      status: item.status
    });
  };

  const preloadReminder = (item) => {
    setSelectedReminderId(item._id);
    setForm({
      ...form,
      type: 'expense',
      amount: String(item.amount),
      date: new Date(item.date).toISOString().slice(0, 10),
      description: item.description || '',
      status: 'pending'
    });
  };

  const labels = sanitizeChartLabels(transactions.map((item) => item.description || 'N/A'));
  const legends = sortLegendLabels(['income', 'expense', 'pending', 'completed', 'overdue'], 'logical');

  const incomeTotal = transactions
    .filter((item) => item.type === 'income')
    .reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const expenseTotal = transactions
    .filter((item) => item.type === 'expense')
    .reduce((acc, item) => acc + Number(item.amount || 0), 0);

  const statusTotals = legends.reduce((acc, key) => {
    acc[key] = transactions
      .filter((item) => item.status === key)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    return acc;
  }, {});

  const pieData = legends
    .filter((key) => statusTotals[key] > 0)
    .map((key) => ({
      name: key,
      amount: statusTotals[key],
      color: financeChartColors[key],
      legendFontColor: '#222',
      legendFontSize: 12
    }));

  const barData = {
    labels: ['Income', 'Expense'],
    datasets: [
      {
        data: [incomeTotal, expenseTotal]
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(14, 107, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(34, 34, 34, ${opacity})`,
    propsForBackgroundLines: {
      stroke: '#e6e6e6'
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Finance Tracking & Analytics</Text>
      <Text style={styles.sectionTitle}>Payment Reminders ({paymentReminders.length})</Text>
      <Text style={styles.sectionTitle}>Check Reminders ({checkReminders.length})</Text>

      <View style={styles.formCard}>
        <Text style={styles.cardTitle}>Create / Update Transaction</Text>
        <Text style={styles.helperText}>
          Selected: {selectedTransactionId ? selectedTransactionId : 'None'}
        </Text>
        <Text style={styles.helperText}>Tap a transaction card below to load it for update/delete.</Text>
        <TextInput style={styles.input} placeholder="Type (income|expense)" value={form.type} onChangeText={(v) => updateForm('type', v)} />
        <TextInput
          style={styles.input}
          placeholder="Amount"
          value={form.amount}
          onChangeText={(v) => updateForm('amount', sanitizeDecimal(v))}
          keyboardType="decimal-pad"
        />
        <DatePickerField label="Date" value={form.date} onChange={(v) => updateForm('date', v)} />
        <TextInput style={styles.input} placeholder="Description" value={form.description} onChangeText={(v) => updateForm('description', v)} />
        <TextInput style={styles.input} placeholder="Status (pending|completed|overdue)" value={form.status} onChangeText={(v) => updateForm('status', v)} />
        <Pressable style={styles.secondaryButton} onPress={pickDocument}>
          <Text style={styles.buttonText}>Pick Document (Image/PDF)</Text>
        </Pressable>
        <Text style={styles.smallText}>{documentAsset?.name || 'No document selected'}</Text>
        <View style={styles.row}>
          <Pressable style={styles.button} onPress={handleCreate}>
            <Text style={styles.buttonText}>Create</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={handleUpdate}>
            <Text style={styles.buttonText}>Update</Text>
          </Pressable>
        </View>
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.buttonText}>Delete</Text>
        </Pressable>
        <Pressable style={styles.clearButton} onPress={() => setSelectedTransactionId('')}>
          <Text style={styles.buttonText}>Clear Selection</Text>
        </Pressable>
      </View>

      <View style={styles.reminderCard}>
        <Text style={styles.cardTitle}>Reminders</Text>
        <Text style={styles.helperText}>Payment reminders: {paymentReminders.length} • Check reminders: {checkReminders.length}</Text>
        <TextInput
          style={styles.input}
          placeholder="Amount"
          value={form.amount}
          onChangeText={(v) => updateForm('amount', sanitizeDecimal(v))}
          keyboardType="decimal-pad"
        />
        <DatePickerField label="Reminder Date" value={form.date} onChange={(v) => updateForm('date', v)} />
        <TextInput style={styles.input} placeholder="Description" value={form.description} onChangeText={(v) => updateForm('description', v)} />
        <Text style={styles.helperText}>Selected reminder: {selectedReminderId || 'None'}</Text>
        <View style={styles.row}>
          <Pressable
            style={styles.button}
            onPress={selectedReminderId ? handleUpdateReminder : handleCreateReminder}
          >
            <Text style={styles.buttonText}>{selectedReminderId ? 'Update Reminder' : 'Create Reminder'}</Text>
          </Pressable>
          <Pressable
            style={styles.secondaryButton}
            onPress={() => {
              setSelectedReminderId('');
              setForm((prev) => ({ ...prev, amount: '', date: '', description: '' }));
            }}
          >
            <Text style={styles.buttonText}>Clear</Text>
          </Pressable>
        </View>
        {paymentReminders.length === 0 && checkReminders.length === 0 ? (
          <Text style={styles.smallText}>No reminders yet.</Text>
        ) : (
          <View>
            {paymentReminders.map((r) => (
              <View key={r._id} style={[styles.listCard, styles.reminderListCard, r.status === 'overdue' ? styles.overdueCard : null]}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={styles.cardTitle}>{r.description || 'Payment Reminder'}</Text>
                  <Text style={styles.reminderBadge}>REMINDER</Text>
                </View>
                <Text>{formatCurrency(r.amount || 0, 'LKR')}</Text>
                <Text>{new Date(r.date).toDateString()} • {r.status}</Text>
                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.actionEditButton}
                    onPress={() => preloadReminder(r)}
                  >
                    <Text style={styles.actionButtonText}>✎ Edit</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionEditButton}
                    onPress={async () => {
                      try {
                        await updateTransaction(r._id, { status: 'completed' });
                        await loadData();
                        showToast('Marked paid');
                      } catch (error) {
                        showToast(error?.response?.data?.message || 'Mark paid failed');
                      }
                    }}
                  >
                    <Text style={styles.actionButtonText}>✓ Mark Paid</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionDeleteButton}
                    onPress={async () => {
                      try {
                        await deleteTransaction(r._id);
                        await loadData();
                        showToast('Reminder deleted');
                      } catch (error) {
                        showToast(error?.response?.data?.message || 'Delete failed');
                      }
                    }}
                  >
                    <Text style={styles.actionButtonText}>🗑 Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
            {checkReminders.map((r) => (
              <View key={r._id} style={[styles.listCard, styles.reminderListCard, r.status === 'overdue' ? styles.overdueCard : null]}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={styles.cardTitle}>{r.description || 'Check Reminder'}</Text>
                  <Text style={styles.reminderBadge}>REMINDER</Text>
                </View>
                <Text>{formatCurrency(r.amount || 0, 'LKR')}</Text>
                <Text>{new Date(r.date).toDateString()} • {r.status}</Text>
                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.actionEditButton}
                    onPress={() => preloadReminder(r)}
                  >
                    <Text style={styles.actionButtonText}>✎ Edit</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionEditButton}
                    onPress={async () => {
                      try {
                        await updateTransaction(r._id, { status: 'completed' });
                        await loadData();
                        showToast('Marked paid');
                      } catch (error) {
                        showToast(error?.response?.data?.message || 'Mark paid failed');
                      }
                    }}
                  >
                    <Text style={styles.actionButtonText}>✓ Mark Paid</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionDeleteButton}
                    onPress={async () => {
                      try {
                        await deleteTransaction(r._id);
                        await loadData();
                        showToast('Reminder deleted');
                      } catch (error) {
                        showToast(error?.response?.data?.message || 'Delete failed');
                      }
                    }}
                  >
                    <Text style={styles.actionButtonText}>🗑 Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.chartRuleCard}>
        <Text style={styles.cardTitle}>Income vs Expense</Text>
        <BarChart
          data={barData}
          width={chartWidth}
          height={220}
          fromZero
          chartConfig={chartConfig}
          yAxisLabel="Rs "
          showValuesOnTopOfBars
        />
        <Text style={styles.smallText}>Income: {formatCurrency(incomeTotal, 'LKR')} | Expense: {formatCurrency(expenseTotal, 'LKR')}</Text>
      </View>

      <View style={styles.chartRuleCard}>
        <Text style={styles.cardTitle}>Status Distribution</Text>
        {pieData.length ? (
          <PieChart
            data={pieData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            absolute
          />
        ) : (
          <Text style={styles.smallText}>No transaction data available for chart yet.</Text>
        )}
      </View>

      {transactions.map((item) => (
        <View
          key={item._id}
          style={[
            styles.listCard,
            selectedTransactionId === item._id ? styles.selectedCard : null
          ]}
        >
          <Pressable onPress={() => preloadTransaction(item)}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>{item.description || 'Transaction'}</Text>
              <Text style={styles.transactionBadge}>PAYMENT LOG</Text>
            </View>
            <Text>{item.type} | {formatCurrency(item.amount || 0, 'LKR')}</Text>
            <Text>{item.status}</Text>
            <AttachmentPreview
              url={item.documentUrl}
              imageLabel="Financial Document"
              pdfLabel="Open Financial PDF"
            />
          </Pressable>
          <View style={styles.actionRow}>
            <Pressable
              style={styles.actionEditButton}
              onPress={() => preloadTransaction(item)}
            >
              <Text style={styles.actionButtonText}>✎ Edit</Text>
            </Pressable>
            <Pressable
              style={styles.actionDeleteButton}
              onPress={async () => {
                setSelectedTransactionId(item._id);
                try {
                  await deleteTransaction(item._id);
                  await loadData();
                  showToast('Transaction deleted');
                } catch (error) {
                  showToast(error?.response?.data?.message || 'Delete failed');
                }
              }}
            >
              <Text style={styles.actionButtonText}>🗑 Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  content: { 
    padding: SPACING.lg 
  },
  title: { 
    ...TYPOGRAPHY.h1, 
    color: COLORS.text, 
    marginBottom: SPACING.lg 
  },
  sectionTitle: { 
    ...TYPOGRAPHY.h3, 
    color: COLORS.text, 
    marginTop: SPACING.xl,
    marginBottom: SPACING.md 
  },
  formCard: {
    marginBottom: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    ...SHADOWS.medium,
  },
  input: {
    marginBottom: SPACING.sm,
  },
  row: { 
    flexDirection: 'row', 
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  button: {
    flex: 1,
  },
  secondaryButton: {
    marginBottom: SPACING.sm,
  },
  deleteButton: {
    marginTop: SPACING.sm,
  },
  clearButton: {
    marginTop: SPACING.sm,
  },
  helperText: { 
    ...TYPOGRAPHY.caption, 
    color: COLORS.textLight, 
    marginBottom: SPACING.sm 
  },
  smallText: { 
    ...TYPOGRAPHY.caption, 
    color: COLORS.textLight, 
    marginBottom: SPACING.md 
  },
  reminderCard: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    ...SHADOWS.medium,
  },
  cardTitle: { 
    ...TYPOGRAPHY.h3, 
    fontWeight: '700', 
    marginBottom: SPACING.md 
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm
  },
  listCard: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    ...SHADOWS.light,
  },
  reminderListCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
  },
  reminderBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  reminderBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '800',
  },
  transactionBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  transactionBadgeText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  overdueCard: {
    borderColor: COLORS.error,
    borderWidth: 1.5,
  },
  selectedCard: {
    borderColor: COLORS.primary,
    borderWidth: 2
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionEditButton: {
    flex: 1,
  },
  actionDeleteButton: {
    flex: 1,
  },
  chartRuleCard: {
    marginBottom: SPACING.xl,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.surface,
    ...SHADOWS.light,
    alignItems: 'center',
  }
});


export default FinanceDashboardScreen;
