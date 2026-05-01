import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Pressable, Modal, TextInput } from 'react-native';
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
  Hash,
  Search,
  PlusCircle,
  MinusCircle,
  XCircle
} from 'lucide-react-native';

import { getSales, createSale, updateSale, deleteSale } from '../../services/salesService';
import { getInventoryItems } from '../../services/inventoryService';
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
  const [inventory, setInventory] = useState([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  
  const [form, setForm] = useState({
    transactionId: generateId('TX'),
    items: [{ itemName: '', quantity: '1', unitPrice: '0' }],
    total: '0',
    date: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [salesRes, inventoryRes] = await Promise.all([
        getSales(),
        getInventoryItems()
      ]);
      setSales(salesRes.data || []);
      setInventory(inventoryRes.data || []);
    } catch (error) {
      showToast('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const updateItem = (index, key, value) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [key]: value };
    
    // Auto-calculate total
    const newTotal = newItems.reduce((sum, item) => {
      return sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0));
    }, 0);

    setForm(prev => ({ 
      ...prev, 
      items: newItems,
      total: String(newTotal)
    }));
  };

  const addItemRow = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { itemName: '', quantity: '1', unitPrice: '0' }]
    }));
  };

  const removeItemRow = (index) => {
    if (form.items.length <= 1) return;
    const newItems = form.items.filter((_, i) => i !== index);
    const newTotal = newItems.reduce((sum, item) => {
      return sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0));
    }, 0);

    setForm(prev => ({ 
      ...prev, 
      items: newItems,
      total: String(newTotal)
    }));
  };

  const selectProductForItem = (product) => {
    if (activeItemIndex === null) return;
    updateItem(activeItemIndex, 'itemName', product.itemName);
    updateItem(activeItemIndex, 'unitPrice', String(product.price || 0)); // Assuming price is in inventory
    setShowProductPicker(false);
    setActiveItemIndex(null);
  };

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
    items: form.items.map(item => ({
      itemName: item.itemName,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice)
    })),
    total: Number(form.total),
    date: form.date || undefined
  });

  const handleCreate = async () => {
    const hasItems = form.items.every(item => item.itemName && Number(item.quantity) > 0);
    if (!form.transactionId || !hasItems || !form.date) {
      showToast('Please fill all item details');
      return;
    }
    setSubmitting(true);
    try {
      await createSale(toSalePayload(), prescriptionAsset);
      resetForm();
      await loadData();
      showToast('Sale record created');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Create failed');
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
      await loadData();
      showToast('Sale record updated');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Update failed');
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
      await loadData();
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
      items: [{ itemName: '', quantity: '1', unitPrice: '0' }],
      total: '0',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const preloadSale = (sale) => {
    setSelectedSaleId(sale._id);
    setForm({
      transactionId: sale.transactionId,
      items: sale.items.map(item => ({
        itemName: item.itemName,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice)
      })),
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
        onRefresh={loadData}
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

            <View style={styles.itemsHeader}>
              <Text style={styles.itemsTitle}>Transaction Items</Text>
              <Pressable onPress={addItemRow} style={styles.addItemBtn}>
                <PlusCircle size={20} color={COLORS.primary} />
                <Text style={styles.addItemText}>Add Row</Text>
              </Pressable>
            </View>

            {form.items.map((item, index) => (
              <View key={index} style={styles.itemRowContainer}>
                <View style={styles.itemMainRow}>
                  <View style={{ flex: 1 }}>
                    <CustomInput
                      label={index === 0 ? "Product/Item Name" : ""}
                      placeholder="Select product..."
                      value={item.itemName}
                      onChangeText={(v) => updateItem(index, 'itemName', v)}
                      icon={Package}
                      noMargin={index !== 0}
                    />
                  </View>
                  <Pressable 
                    onPress={() => {
                      setActiveItemIndex(index);
                      setShowProductPicker(true);
                    }} 
                    style={[styles.searchBtn, { marginTop: index === 0 ? 25 : 0 }]}
                  >
                    <Search size={20} color={COLORS.white} />
                  </Pressable>
                  {form.items.length > 1 && (
                    <Pressable 
                      onPress={() => removeItemRow(index)} 
                      style={[styles.removeBtn, { marginTop: index === 0 ? 25 : 0 }]}
                    >
                      <MinusCircle size={20} color={COLORS.error} />
                    </Pressable>
                  )}
                </View>

                <View style={styles.itemSubRow}>
                  <View style={{ flex: 1 }}>
                    <CustomInput
                      label="Qty"
                      placeholder="1"
                      value={item.quantity}
                      onChangeText={(v) => updateItem(index, 'quantity', sanitizeInteger(v))}
                      keyboardType="number-pad"
                      noMargin
                    />
                  </View>
                  <View style={{ flex: 2 }}>
                    <CustomInput
                      label="Unit Price"
                      placeholder="0.00"
                      value={item.unitPrice}
                      onChangeText={(v) => updateItem(index, 'unitPrice', sanitizeDecimal(v))}
                      keyboardType="decimal-pad"
                      icon={Banknote}
                      noMargin
                    />
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.totalSection}>
              <View style={styles.totalBadge}>
                <Text style={styles.totalLabel}>Grand Total</Text>
                <Text style={styles.totalValue}>LKR {Number(form.total).toLocaleString()}</Text>
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
      <Modal
        visible={showProductPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProductPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Product</Text>
              <Pressable onPress={() => setShowProductPicker(false)}>
                <XCircle size={24} color={COLORS.textLight} />
              </Pressable>
            </View>
            
            <FlatList
              data={inventory}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <Pressable 
                  style={styles.productSelectItem}
                  onPress={() => selectProductForItem(item)}
                >
                  <View style={styles.productSelectInfo}>
                    <Text style={styles.productSelectName}>{item.itemName}</Text>
                    <Text style={styles.productSelectStock}>Stock: {item.quantity}</Text>
                  </View>
                  <ChevronRight size={18} color={COLORS.primary} />
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Package size={40} color={COLORS.border} />
                  <Text style={styles.emptyText}>No inventory found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
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
    paddingBottom: SPACING.xxl,
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
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemsTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textLight,
    textTransform: 'uppercase',
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addItemText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
  },
  itemRowContainer: {
    backgroundColor: COLORS.background,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  itemSubRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: 8,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalSection: {
    marginTop: SPACING.lg,
    alignItems: 'flex-end',
  },
  totalBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'flex-end',
  },
  totalLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
  },
  totalValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    height: '70%',
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  productSelectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  productSelectInfo: {
    flex: 1,
  },
  productSelectName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.text,
  },
  productSelectStock: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
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
