import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { 
  Store, 
  Truck, 
  Package, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  User, 
  Image as ImageIcon,
  ChevronRight,
  Info,
  DollarSign,
  Layers
} from 'lucide-react-native';

import {
  getShopProducts,
  createShopProduct,
  updateShopProduct,
  deleteShopProduct,
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  assignOrderDriver,
  uploadProofOfDelivery
} from '../../services/shopService';
import { hasRequiredValues, sanitizeDecimal, sanitizeInteger } from '../../utils/validation';
import { showToast } from '../../utils/toast';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import Card from '../../components/Card';
import AttachmentPreview from '../../components/AttachmentPreview';

const ShopDeliveryScreen = () => {
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'orders'
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [productImageAsset, setProductImageAsset] = useState(null);
  const [proofAsset, setProofAsset] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '0',
    stock: '0',
    isActive: 'true'
  });

  const [orderForm, setOrderForm] = useState({
    customerId: '',
    itemName: '',
    quantity: '1',
    unitPrice: '0',
    total: '0',
    status: 'pending',
    driverId: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [productRes, orderRes] = await Promise.all([getShopProducts(), getOrders()]);
      setProducts(productRes.data || []);
      setOrders(orderRes.data || []);
    } catch (error) {
      showToast('Failed to load shop data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateProductForm = (key, value) => setProductForm(prev => ({ ...prev, [key]: value }));
  const updateOrderForm = (key, value) => setOrderForm(prev => ({ ...prev, [key]: value }));

  const pickImage = async (setter) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8
      });
      if (!result.canceled && result.assets?.length) {
        const asset = result.assets[0];
        setter({
          uri: asset.uri,
          name: asset.fileName || `upload-${Date.now()}.jpg`,
          mimeType: asset.mimeType || 'image/jpeg'
        });
      }
    } catch (err) {
      showToast('Error picking image');
    }
  };

  const handleProductSubmit = async () => {
    if (!productForm.name || !productForm.price) {
      showToast('Product name and price are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
        isActive: productForm.isActive === 'true'
      };
      if (selectedProductId) {
        await updateShopProduct(selectedProductId, payload, productImageAsset);
        showToast('Product updated');
      } else {
        await createShopProduct(payload, productImageAsset);
        showToast('Product created');
      }
      resetProductForm();
      await loadData();
    } catch (error) {
      showToast('Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOrderSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        customerId: orderForm.customerId,
        items: [{ itemName: orderForm.itemName, quantity: Number(orderForm.quantity), unitPrice: Number(orderForm.unitPrice) }],
        total: Number(orderForm.total),
        status: orderForm.status
      };
      if (selectedOrderId) {
        await updateOrder(selectedOrderId, payload);
        showToast('Order updated');
      } else {
        await createOrder(payload);
        showToast('Order created');
      }
      resetOrderForm();
      await loadData();
    } catch (error) {
      showToast('Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const resetProductForm = () => {
    setSelectedProductId('');
    setProductImageAsset(null);
    setProductForm({ name: '', description: '', price: '0', stock: '0', isActive: 'true' });
  };

  const resetOrderForm = () => {
    setSelectedOrderId('');
    setProofAsset(null);
    setOrderForm({ customerId: '', itemName: '', quantity: '1', unitPrice: '0', total: '0', status: 'pending', driverId: '' });
  };

  const preloadProduct = (p) => {
    setSelectedProductId(p._id);
    setProductForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price || 0),
      stock: String(p.stock || 0),
      isActive: String(p.isActive !== false)
    });
  };

  const preloadOrder = (o) => {
    setSelectedOrderId(o._id);
    const item = o.items?.[0] || {};
    setOrderForm({
      customerId: o.customerId,
      itemName: item.itemName || '',
      quantity: String(item.quantity || 1),
      unitPrice: String(item.unitPrice || 0),
      total: String(o.total || 0),
      status: o.status,
      driverId: o.driverId || ''
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Store size={28} color={COLORS.primary} />
        <Text style={styles.title}>Shop & Logistics</Text>
      </View>

      <View style={styles.tabBar}>
        <Pressable 
          style={[styles.tab, activeTab === 'products' && styles.activeTab]} 
          onPress={() => setActiveTab('products')}
        >
          <Package size={18} color={activeTab === 'products' ? COLORS.primary : COLORS.textLight} />
          <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>Products</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]} 
          onPress={() => setActiveTab('orders')}
        >
          <Truck size={18} color={activeTab === 'orders' ? COLORS.primary : COLORS.textLight} />
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>Orders</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'products' ? (
          <>
            <Card style={styles.formCard}>
              <View style={styles.formHeader}>
                <Layers size={18} color={COLORS.primary} />
                <Text style={styles.formTitle}>{selectedProductId ? 'Edit Product' : 'Add New Product'}</Text>
              </View>
              <CustomInput label="Product Name" value={productForm.name} onChangeText={v => updateProductForm('name', v)} icon={Package} />
              <CustomInput label="Description" value={productForm.description} onChangeText={v => updateProductForm('description', v)} icon={Info} multiline />
              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <CustomInput label="Price" value={productForm.price} onChangeText={v => updateProductForm('price', sanitizeDecimal(v))} icon={DollarSign} keyboardType="decimal-pad" />
                </View>
                <View style={{ flex: 1 }}>
                  <CustomInput label="Stock" value={productForm.stock} onChangeText={v => updateProductForm('stock', sanitizeInteger(v))} keyboardType="number-pad" />
                </View>
              </View>
              <CustomButton variant="outline" title={productImageAsset ? 'Image Attached' : 'Pick Product Image'} onPress={() => pickImage(setProductImageAsset)} icon={ImageIcon} />
              <View style={styles.buttonRow}>
                <CustomButton title={selectedProductId ? 'Update' : 'Create'} onPress={handleProductSubmit} loading={submitting} style={{ flex: 1 }} />
                {selectedProductId && <CustomButton variant="ghost" title="Cancel" onPress={resetProductForm} />}
              </View>
            </Card>

            <Text style={styles.sectionTitle}>Product Inventory</Text>
            {products.map(item => (
              <Card key={item._id} style={styles.itemCard} onPress={() => preloadProduct(item)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={[styles.badge, item.isActive ? styles.activeBadge : styles.hiddenBadge]}>
                    <Text style={styles.badgeText}>{item.isActive ? 'ACTIVE' : 'HIDDEN'}</Text>
                  </View>
                </View>
                <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.itemPrice}>LKR {item.price}</Text>
                  <Text style={styles.itemStock}>Stock: {item.stock}</Text>
                </View>
                <AttachmentPreview url={item.imageUrl} />
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card style={styles.formCard}>
              <View style={styles.formHeader}>
                <Truck size={18} color={COLORS.primary} />
                <Text style={styles.formTitle}>{selectedOrderId ? 'Manage Order' : 'Create Manual Order'}</Text>
              </View>
              <CustomInput label="Customer ID" value={orderForm.customerId} onChangeText={v => updateOrderForm('customerId', v)} icon={User} />
              <CustomInput label="Product Name" value={orderForm.itemName} onChangeText={v => updateOrderForm('itemName', v)} icon={Package} />
              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <CustomInput label="Qty" value={orderForm.quantity} onChangeText={v => updateOrderForm('quantity', sanitizeInteger(v))} keyboardType="number-pad" />
                </View>
                <View style={{ flex: 2 }}>
                  <CustomInput label="Total" value={orderForm.total} onChangeText={v => updateOrderForm('total', sanitizeDecimal(v))} icon={DollarSign} keyboardType="decimal-pad" />
                </View>
              </View>
              <CustomInput label="Status" value={orderForm.status} onChangeText={v => updateOrderForm('status', v)} />
              <View style={styles.buttonRow}>
                <CustomButton title={selectedOrderId ? 'Update Order' : 'Place Order'} onPress={handleOrderSubmit} loading={submitting} style={{ flex: 1 }} />
                {selectedOrderId && <CustomButton variant="ghost" title="Cancel" onPress={resetOrderForm} />}
              </View>
            </Card>

            <Text style={styles.sectionTitle}>Order List</Text>
            {orders.map(item => (
              <Card key={item._id} style={styles.itemCard} onPress={() => preloadOrder(item)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.itemName}>Order #{item._id.slice(-6)}</Text>
                  <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
                    <Text style={styles.statusText}>{item.status?.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.itemDesc}>{item.items?.[0]?.itemName} x {item.items?.[0]?.quantity}</Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.itemPrice}>LKR {item.total}</Text>
                  <View style={styles.driverRow}>
                    <Truck size={12} color={COLORS.textLight} />
                    <Text style={styles.driverText}>{item.driverId || 'No Driver'}</Text>
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, backgroundColor: COLORS.surface, gap: SPACING.sm, ...SHADOWS.light },
  title: { ...TYPOGRAPHY.h2, color: COLORS.text },
  tabBar: { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.md, gap: 8 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { ...TYPOGRAPHY.body, color: COLORS.textLight, fontWeight: '600' },
  activeTabText: { color: COLORS.primary },
  scrollContent: { padding: SPACING.md, paddingBottom: 40 },
  formCard: { padding: SPACING.lg, marginBottom: SPACING.xl },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.lg },
  formTitle: { ...TYPOGRAPHY.h3, color: COLORS.primary },
  inputRow: { flexDirection: 'row', gap: SPACING.sm },
  buttonRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  sectionTitle: { ...TYPOGRAPHY.h3, marginBottom: SPACING.md, marginLeft: 4 },
  itemCard: { padding: SPACING.md, marginBottom: SPACING.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemName: { ...TYPOGRAPHY.body, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.sm },
  activeBadge: { backgroundColor: COLORS.primaryLight },
  hiddenBadge: { backgroundColor: COLORS.border },
  badgeText: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
  itemDesc: { ...TYPOGRAPHY.caption, color: COLORS.textLight, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemPrice: { ...TYPOGRAPHY.body, fontWeight: '800', color: COLORS.primary },
  itemStock: { ...TYPOGRAPHY.caption, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.md },
  status_pending: { backgroundColor: '#FFFBEB' },
  status_delivered: { backgroundColor: '#ECFDF5' },
  statusText: { fontSize: 10, fontWeight: '800', color: COLORS.text },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  driverText: { fontSize: 11, color: COLORS.textLight },
});

export default ShopDeliveryScreen;
