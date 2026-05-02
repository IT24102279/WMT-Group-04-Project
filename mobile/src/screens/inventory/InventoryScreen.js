import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Package, AlertCircle, FilePlus, Save, Trash2, XCircle, Search, Calendar, Landmark } from 'lucide-react-native';

import {
  getInventoryItems,
  getNearExpiryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem
} from '../../services/inventoryService';
import { hasRequiredValues, sanitizeInteger } from '../../utils/validation';
import { generateId } from '../../utils/idGenerator';
import { showToast } from '../../utils/toast';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import DatePickerField from '../../components/DatePickerField';
import AttachmentPreview from '../../components/AttachmentPreview';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import Card from '../../components/Card';

const InventoryScreen = () => {
  const [items, setItems] = useState([]);
  const [nearExpiry, setNearExpiry] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [invoiceAsset, setInvoiceAsset] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [form, setForm] = useState({
    itemName: '',
    quantity: '',
    batchNumber: generateId('BT'),
    expiryDate: '',
    supplier: ''
  });

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const inventoryHeader = (
    <View>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Inventory Management</Text>
        <Package size={28} color={COLORS.primary} />
      </View>

      {nearExpiry.length > 0 && (
        <Card style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <AlertCircle size={20} color={COLORS.error} />
            <Text style={styles.alertTitle}>Expiry Alerts</Text>
          </View>
          <Text style={styles.alertText}>
            You have {nearExpiry.length} items expiring within 30 days.
          </Text>
        </Card>
      )}

      <Card style={styles.formCard}>
        <Text style={styles.cardTitle}>
          {selectedItemId ? 'Update Item' : 'Add New Item'}
        </Text>
        <CustomInput 
          label="Item Name" 
          placeholder="Aspirin 500mg" 
          value={form.itemName} 
          onChangeText={(v) => updateForm('itemName', v)}
          icon={Package}
        />
        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <CustomInput
              label="Quantity"
              placeholder="0"
              value={form.quantity}
              onChangeText={(v) => updateForm('quantity', sanitizeInteger(v))}
              keyboardType="number-pad"
              icon={Search}
            />
          </View>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <CustomInput 
              label="Batch No" 
              placeholder="B123" 
              value={form.batchNumber} 
              onChangeText={(v) => updateForm('batchNumber', v)}
              icon={Landmark}
            />
          </View>
        </View>
        
        <DatePickerField 
          label="Expiry Date" 
          value={form.expiryDate} 
          onChange={(v) => updateForm('expiryDate', v)} 
        />
        
        <CustomInput 
          label="Supplier" 
          placeholder="PharmaDist Corp" 
          value={form.supplier} 
          onChangeText={(v) => updateForm('supplier', v)}
          icon={Landmark}
        />

        <CustomButton
          variant="outline"
          title={invoiceAsset ? invoiceAsset.name : "Attach Medicine Image (Image/PDF)"}
          onPress={pickInvoice}
          icon={FilePlus}
          style={styles.attachButton}
          textStyle={styles.attachButtonText}
        />

        <View style={styles.actionGrid}>
          {!selectedItemId ? (
            <CustomButton 
              title="Add to Inventory" 
              onPress={handleCreate} 
              loading={isLoading}
              style={{ flex: 1 }}
            />
          ) : (
            <>
              <CustomButton 
                title="Update" 
                onPress={handleUpdate} 
                loading={isLoading}
                style={{ flex: 1 }}
              />
              <CustomButton 
                variant="outline"
                title="Delete" 
                onPress={handleDelete} 
                loading={isLoading}
                style={[styles.deleteButton, { flex: 1 }]}
                textStyle={{ color: COLORS.error }}
                icon={Trash2}
              />
            </>
          )}
        </View>
        
        {selectedItemId && (
          <CustomButton 
            variant="ghost" 
            title="Cancel Editing" 
            onPress={resetForm} 
            icon={XCircle}
          />
        )}
      </Card>

      <Text style={styles.sectionTitle}>Stock List</Text>
    </View>
  );

  const loadInventory = async () => {
    try {
      setIsLoading(true);
      const [allItems, nearExpiryItems] = await Promise.all([
        getInventoryItems(),
        getNearExpiryItems(30)
      ]);
      setItems(allItems.data || []);
      setNearExpiry(nearExpiryItems.data || []);
    } catch (error) {
      console.log('Load inventory failed', error?.response?.data || error.message);
    } finally {
      setIsLoading(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const pickInvoice = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false
      });
      if (!result.canceled && result.assets?.length) {
        setInvoiceAsset(result.assets[0]);
      }
    } catch (error) {
      showToast('Could not pick document');
    }
  };

  const handleCreate = async () => {
    if (!hasRequiredValues(form, ['itemName', 'quantity', 'batchNumber', 'expiryDate', 'supplier'])) {
      showToast('All item fields are required');
      return;
    }
    try {
      setIsLoading(true);
      await createInventoryItem(form, invoiceAsset);
      setInvoiceAsset(null);
      resetForm();
      await loadInventory();
      showToast('Inventory item created');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Create item failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItemId) {
      showToast('Select an item first');
      return;
    }
    if (!hasRequiredValues(form, ['itemName', 'quantity', 'batchNumber', 'expiryDate', 'supplier'])) {
      showToast('All item fields are required');
      return;
    }
    try {
      setIsLoading(true);
      await updateInventoryItem(selectedItemId, form, invoiceAsset);
      setInvoiceAsset(null);
      resetForm();
      await loadInventory();
      showToast('Inventory item updated');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Update item failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItemId) {
      showToast('Select an item first');
      return;
    }
    try {
      setIsLoading(true);
      await deleteInventoryItem(selectedItemId);
      resetForm();
      await loadInventory();
      showToast('Inventory item deleted');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Delete item failed');
    } finally {
      setIsLoading(false);
    }
  };

  const preloadItem = (item) => {
    setSelectedItemId(item._id);
    setForm({
      itemName: item.itemName,
      quantity: String(item.quantity),
      batchNumber: item.batchNumber,
      expiryDate: new Date(item.expiryDate).toISOString().slice(0, 10),
      supplier: item.supplier
    });
  };

  const resetForm = () => {
    setSelectedItemId('');
    setForm({
      itemName: '',
      quantity: '',
      batchNumber: generateId('BT'),
      expiryDate: '',
      supplier: ''
    });
    setInvoiceAsset(null);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={inventoryHeader}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.itemCard, 
              selectedItemId === item._id && styles.selectedItemCard
            ]}
            onPress={() => preloadItem(item)}
          >
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.itemName}</Text>
              <View style={[
                styles.quantityBadge, 
                item.quantity < 20 && styles.lowStockBadge
              ]}>
                <Text style={[
                  styles.quantityText,
                  item.quantity < 20 && styles.lowStockText
                ]}>
                  Qty: {item.quantity}
                </Text>
              </View>
            </View>
            
            <View style={styles.itemDetails}>
              <View style={styles.detailRow}>
                <Landmark size={14} color={COLORS.textLight} />
                <Text style={styles.detailText}>Batch: {item.batchNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Calendar size={14} color={COLORS.textLight} />
                <Text style={styles.detailText}>
                  Exp: {new Date(item.expiryDate).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <AttachmentPreview
              url={item.invoiceUrl}
              imageLabel="View Invoice"
              pdfLabel="Open PDF Invoice"
            />
          </Pressable>
        )}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : (
            <Text style={styles.emptyText}>No inventory items found.</Text>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
  },
  alertCard: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    marginBottom: SPACING.lg,
    padding: SPACING.md,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 4,
  },
  alertTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.error,
    textTransform: 'uppercase',
  },
  alertText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    color: COLORS.error,
  },
  formCard: {
    marginBottom: SPACING.xl,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  inputRow: {
    flexDirection: 'row',
  },
  attachButton: {
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    borderStyle: 'dashed',
  },
  attachButtonText: {
    color: COLORS.textLight,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  deleteButton: {
    borderColor: COLORS.error,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.md,
  },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  selectedItemCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  itemName: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  quantityBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  lowStockBadge: {
    backgroundColor: '#FEE2E2',
  },
  lowStockText: {
    color: COLORS.error,
  },
  itemDetails: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default InventoryScreen;

