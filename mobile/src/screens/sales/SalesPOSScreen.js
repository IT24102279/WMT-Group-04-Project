import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { 
  ShoppingCart, 
  Receipt, 
  Package, 
  Banknote, 
  Calendar, 
  Image as ImageIcon,
  Trash2, 
  Edit3, 
  Plus,
  ChevronRight,
  Hash
} from 'lucide-react-native';

import { getSales, createSale, updateSale, deleteSale } from '../../services/salesService';
import DatePickerField from '../../components/DatePickerField';
import { hasRequiredValues, sanitizeDecimal, sanitizeInteger } from '../../utils/validation';
import { generateId } from '../../utils/idGenerator';
import { showToast } from '../../utils/toast';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import Card from '../../components/Card';
import AttachmentPreview from '../../components/AttachmentPreview';

const SalesPOSScreen = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [prescriptionAsset, setPrescriptionAsset] = useState(null);
  const [form, setForm] = useState({
    transactionId: generateId('TX'),
    itemName: '',
    quantity: '1',
    unitPrice: '0',
    total: '0',
    date: new Date().toISOString().split('T')[0]
  });

  const loadSales = async () => {
    setLoading(true);
    try {
      const response = await getSales();
      setSales(response.data || []);
    } catch (error) {
      showToast('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const pickPrescription = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8
      });

      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        setPrescriptionAsset({
          uri: asset.uri,
          name: asset.fileName || `prescription-${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg'
        });
      }
    } catch (err) {
      showToast('Error picking image');
    }
  };

  const toSalePayload = () => ({
    transactionId: form.transactionId,
    items: [
      {
        itemName: form.itemName,
        quantity: Number(form.quantity),
        unitPrice: Number(form.unitPrice)
      }
    ],
    total: Number(form.total),
    date: form.date || undefined
  });

  const handleCreate = async () => {
    if (!hasRequiredValues(form, ['transactionId', 'itemName', 'quantity', 'unitPrice', 'total', 'date'])) {
      showToast('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await createSale(toSalePayload(), prescriptionAsset);
      resetForm();
      await loadSales();
      showToast('Sale record created');
    } catch (error) {
      showToast('Create failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedSaleId) return;
    setSubmitting(true);
    try {
      await updateSale(selectedSaleId, toSalePayload(), prescriptionAsset);
      resetForm();
      await loadSales();
      showToast('Sale record updated');
    } catch (error) {
      showToast('Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSaleId) return;
    setSubmitting(true);
    try {
      await deleteSale(selectedSaleId);
      resetForm();
      await loadSales();
      showToast('Sale record deleted');
    } catch (error) {
      showToast('Delete failed');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedSaleId('');
    setPrescriptionAsset(null);
    setForm({
      transactionId: generateId('TX'),
      itemName: '',
      quantity: '1',
      unitPrice: '0',
      total: '0',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const preloadSale = (sale) => {
    setSelectedSaleId(sale._id);
    const firstItem = sale.items?.[0] || {};
    setForm({
      transactionId: sale.transactionId,
      itemName: firstItem.itemName || '',
      quantity: String(firstItem.quantity || 1),
      unitPrice: String(firstItem.unitPrice || 0),
      total: String(sale.total || 0),
      date: new Date(sale.date).toISOString().split('T')[0]
    });
  };

  const renderSaleItem = ({ item }) => {
    const isSelected = selectedSaleId === item._id;
    return (
      <Card 
        style={[styles.saleCard, isSelected && styles.selectedCard]}
        onPress={() => preloadSale(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.receiptIcon}>
            <Receipt size={20} color={COLORS.primary} />
          </View>
          <View style={styles.saleInfo}>
            <Text style={styles.transactionId}>TX: {item.transactionId}</Text>
            <Text style={styles.saleDate}>{new Date(item.date).toLocaleDateString()}</Text>
          </View>
          <Text style={styles.saleTotal}>LKR {item.total.toLocaleString()}</Text>
        </View>

        <View style={styles.itemSummary}>
          <Package size={14} color={COLORS.textLight} />
          <Text style={styles.itemText}>
            {item.items?.[0]?.itemName || 'Medical Item'} (x{item.items?.[0]?.quantity || 0})
          </Text>
        </View>

        <AttachmentPreview
          url={item.prescriptionImageUrl}
          imageLabel="Prescription"
          pdfLabel="View Document"
        />

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <ChevronRight size={20} color={COLORS.primary} />
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ShoppingCart size={28} color={COLORS.primary} />
        <Text style={styles.title}>Sales & POS</Text>
      </View>

      <FlatList
        data={sales}
        keyExtractor={(item) => item._id}
        renderItem={renderSaleItem}
        onRefresh={loadSales}
        refreshing={loading}
        ListHeaderComponent={
          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <Plus size={18} color={COLORS.primary} />
              <Text style={styles.formTitle}>
                {selectedSaleId ? 'Update Transaction' : 'Record New Sale'}
              </Text>
            </View>

            <View style={styles.inputRow}>
              <View style={{ flex: 1.5 }}>
                <CustomInput
                  label="Transaction ID"
                  placeholder="TX-1001"
                  value={form.transactionId}
                  onChangeText={(v) => updateForm('transactionId', v)}
                  icon={Hash}
                  noMargin
                />
              </View>
              <View style={{ flex: 1 }}>
                <DatePickerField 
                  label="Date" 
                  value={form.date} 
                  onChange={(v) => updateForm('date', v)} 
                />
              </View>
            </View>

            <CustomInput
              label="Product/Item Name"
              placeholder="e.g. Paracetamol"
              value={form.itemName}
              onChangeText={(v) => updateForm('itemName', v)}
              icon={Package}
            />

            <View style={styles.inputRow}>
              <View style={{ flex: 1 }}>
                <CustomInput
                  label="Qty"
                  placeholder="1"
                  value={form.quantity}
                  onChangeText={(v) => updateForm('quantity', sanitizeInteger(v))}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 2 }}>
                <CustomInput
                  label="Unit Price"
                  placeholder="0.00"
                  value={form.unitPrice}
                  onChangeText={(v) => updateForm('unitPrice', sanitizeDecimal(v))}
                  keyboardType="decimal-pad"
                  icon={Banknote}
                />
              </View>
              <View style={{ flex: 2 }}>
                <CustomInput
                  label="Total"
                  placeholder="0.00"
                  value={form.total}
                  onChangeText={(v) => updateForm('total', sanitizeDecimal(v))}
                  keyboardType="decimal-pad"
                  icon={Banknote}
                />
              </View>
            </View>

            <CustomButton
              variant="outline"
              title={prescriptionAsset ? 'Prescription Attached' : 'Attach Prescription'}
              onPress={pickPrescription}
              icon={ImageIcon}
              style={styles.attachBtn}
            />

            <View style={styles.buttonRow}>
              {selectedSaleId ? (
                <>
                  <CustomButton
                    title="Update"
                    onPress={handleUpdate}
                    loading={submitting}
                    icon={Edit3}
                    style={styles.flexButton}
                  />
                  <CustomButton
                    variant="outline"
                    title="Delete"
                    onPress={handleDelete}
                    icon={Trash2}
                    style={[styles.flexButton, styles.deleteBtn]}
                    textStyle={{ color: COLORS.error }}
                  />
                  <CustomButton
                    variant="ghost"
                    title="Cancel"
                    onPress={resetForm}
                    style={styles.cancelBtn}
                  />
                </>
              ) : (
                <CustomButton
                  title="Finalize Sale"
                  onPress={handleCreate}
                  loading={submitting}
                  icon={Receipt}
                  style={styles.fullButton}
                />
              )}
            </View>
          </Card>
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Receipt size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No sales recorded yet</Text>
            </View>
          )
        }
        contentContainerStyle={styles.listPadding}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    gap: SPACING.sm,
    ...SHADOWS.light,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  listPadding: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  formCard: {
    marginBottom: SPACING.xl,
    padding: SPACING.lg,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  formTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    alignItems: 'flex-end',
  },
  attachBtn: {
    marginVertical: SPACING.sm,
    borderColor: COLORS.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  flexButton: {
    flex: 2,
  },
  fullButton: {
    flex: 1,
  },
  deleteBtn: {
    flex: 1.5,
    borderColor: COLORS.error,
  },
  cancelBtn: {
    flex: 1,
  },
  saleCard: {
    marginBottom: SPACING.sm,
    padding: SPACING.md,
  },
  selectedCard: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  receiptIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  saleInfo: {
    flex: 1,
  },
  transactionId: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  saleDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  saleTotal: {
    ...TYPOGRAPHY.body,
    fontWeight: '800',
    color: COLORS.primary,
  },
  itemSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  itemText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    fontWeight: '600',
  },
  selectedIndicator: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -10,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
  },
});

export default SalesPOSScreen;
