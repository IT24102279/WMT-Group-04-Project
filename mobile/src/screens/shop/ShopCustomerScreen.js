import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, SectionList, Image, Pressable, RefreshControl } from 'react-native';
import { 
  ShoppingBag, 
  Package, 
  Info, 
  CheckCircle, 
  ChevronRight, 
  ShoppingCart,
  Receipt,
  CreditCard,
  Clock,
  History
} from 'lucide-react-native';

import {
  createOrder,
  getOrders,
  getShopProducts
} from '../../services/shopService';
import { sanitizeInteger } from '../../utils/validation';
import { showToast } from '../../utils/toast';
import { formatCurrency } from '../../utils/financeChartRules';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import Card from '../../components/Card';

const ShopCustomerScreen = () => {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadShopData = async () => {
    try {
      if (!refreshing) setIsLoadingData(true);
      const [productRes, orderRes] = await Promise.all([getShopProducts(), getOrders()]);
      setProducts(productRes.data || []);
      setOrders(orderRes.data || []);
    } catch (error) {
      console.log('Load shop data failed', error?.response?.data || error.message);
    } finally {
      setIsLoadingData(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadShopData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadShopData();
  };

  const orderTotal = useMemo(() => {
    if (!selectedProduct) return 0;
    return Number(quantity || 0) * Number(selectedProduct.price || 0);
  }, [quantity, selectedProduct]);

  const selectProduct = (product) => {
    setSelectedProductId(product._id);
    setSelectedProduct(product);
    setQuantity('1');
  };

  const handlePlaceOrder = async () => {
    if (!selectedProduct) {
      showToast('Select a product first');
      return;
    }
    const parsedQuantity = Number(quantity || 0);
    if (!parsedQuantity || parsedQuantity < 1) {
      showToast('Quantity must be at least 1');
      return;
    }
    if (parsedQuantity > Number(selectedProduct.stock || 0)) {
      showToast('Quantity exceeds available stock');
      return;
    }

    try {
      setIsPlacingOrder(true);
      await createOrder({
        items: [
          {
            productId: selectedProduct._id,
            itemName: selectedProduct.name,
            quantity: parsedQuantity,
            unitPrice: Number(selectedProduct.price || 0)
          }
        ],
        total: parsedQuantity * Number(selectedProduct.price || 0),
        status: 'pending'
      });
      await loadShopData();
      setSelectedProduct(null);
      setSelectedProductId('');
      setQuantity('1');
      showToast('Order placed successfully');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Place order failed');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.titleRow}>
        <View style={styles.titleInfo}>
          <Text style={styles.title}>Medical Store</Text>
          <Text style={styles.subtitle}>Quality pharmaceutical supplies</Text>
        </View>
        <View style={styles.headerIcon}>
          <ShoppingBag size={24} color={COLORS.primary} />
        </View>
      </View>
      
      {selectedProduct && (
        <Card style={styles.checkoutCard}>
          <View style={styles.checkoutHeader}>
            <View style={styles.checkoutBadge}>
              <ShoppingCart size={14} color={COLORS.white} />
              <Text style={styles.checkoutBadgeText}>Checkout</Text>
            </View>
          </View>
          
          <View style={styles.checkoutInfo}>
            <Text style={styles.checkoutProductName}>{selectedProduct.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.unitPriceLabel}>Unit Price:</Text>
              <Text style={styles.unitPriceValue}>{formatCurrency(selectedProduct.price, 'LKR')}</Text>
            </View>
          </View>

          <View style={styles.checkoutRow}>
            <View style={styles.inputWrapper}>
              <CustomInput
                label="Quantity"
                value={quantity}
                onChangeText={(v) => setQuantity(sanitizeInteger(v))}
                keyboardType="number-pad"
                noMargin
              />
            </View>
            <View style={styles.totalWrapper}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(orderTotal, 'LKR')}</Text>
            </View>
          </View>

          <View style={styles.checkoutActions}>
            <CustomButton 
              title="Cancel" 
              variant="outline" 
              onPress={() => setSelectedProduct(null)} 
              style={styles.cancelButton}
              textStyle={{ color: COLORS.textLight }}
            />
            <CustomButton 
              title="Confirm Order" 
              onPress={handlePlaceOrder} 
              loading={isPlacingOrder}
              icon={CreditCard}
              style={styles.placeOrderButton}
            />
          </View>
        </Card>
      )}
    </View>
  );

  const renderProductItem = ({ item }) => {
    const isSelected = selectedProductId === item._id;
    return (
      <Pressable
        style={[styles.productCard, isSelected && styles.productCardSelected]}
        onPress={() => selectProduct(item)}
      >
        <View style={styles.productImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
          ) : (
            <Package size={32} color={COLORS.border} />
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productDescription} numberOfLines={2}>{item.description || 'Verified medical product'}</Text>
          <View style={styles.productFooter}>
            <Text style={styles.productPrice}>{formatCurrency(item.price || 0, 'LKR')}</Text>
            <View style={[styles.stockBadge, item.stock < 10 && styles.lowStockBadge]}>
              <Text style={[styles.stockText, item.stock < 10 && styles.lowStockText]}>
                {item.stock} in stock
              </Text>
            </View>
          </View>
        </View>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <CheckCircle size={20} color={COLORS.primary} fill={COLORS.white} />
          </View>
        )}
      </Pressable>
    );
  };

  const renderOrderItem = ({ item }) => (
    <Card style={styles.orderCard} variant="outline">
      <View style={styles.orderHeader}>
        <View style={styles.orderTitleContainer}>
          <Receipt size={16} color={COLORS.primary} />
          <Text style={styles.orderItemName}>{item.items?.[0]?.itemName || 'Medical Order'}</Text>
        </View>
        <View style={[styles.statusBadge, styles[`status${item.status}`]]}>
          <Text style={[styles.statusText, styles[`statusText${item.status}`]]}>
            {item.status?.toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.orderDetailRow}>
        <View style={styles.orderDetailItem}>
          <Package size={12} color={COLORS.textLight} />
          <Text style={styles.orderDetailText}>Qty: {item.items?.[0]?.quantity || 0}</Text>
        </View>
        <View style={styles.orderDetailItem}>
          <Clock size={12} color={COLORS.textLight} />
          <Text style={styles.orderDetailText}>{new Date(item.createdAt || Date.now()).toLocaleDateString()}</Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <Text style={styles.orderTotalLabel}>Amount Paid</Text>
        <Text style={styles.orderTotalValue}>{formatCurrency(item.total || 0, 'LKR')}</Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <SectionList
        sections={[
          { title: 'Available Supplies', data: products },
          { title: 'My Order History', data: orders }
        ]}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              {section.title === 'Available Supplies' ? <Package size={18} color={COLORS.primary} /> : <History size={18} color={COLORS.primary} />}
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionCount}>{section.data.length} items</Text>
          </View>
        )}
        renderItem={({ item, section }) => 
          section.title === 'Available Supplies' ? renderProductItem({ item }) : renderOrderItem({ item })
        }
        ListEmptyComponent={
          isLoadingData ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>Syncing store inventory...</Text>
            </View>
          ) : (
            <View style={styles.centerContainer}>
              <Package size={64} color={COLORS.border} />
              <Text style={styles.emptyText}>The pharmacy is being restocked.</Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
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
    paddingBottom: SPACING.xxl,
  },
  headerContainer: {
    marginBottom: SPACING.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingTop: SPACING.md,
  },
  titleInfo: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.light,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  sectionCount: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  checkoutCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  checkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: SPACING.md,
  },
  checkoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  checkoutBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
    textTransform: 'uppercase',
  },
  checkoutInfo: {
    marginBottom: SPACING.lg,
  },
  checkoutProductName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  unitPriceLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  unitPriceValue: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.primary,
  },
  checkoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.md,
    backgroundColor: COLORS.background,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  inputWrapper: {
    width: 90,
  },
  totalWrapper: {
    flex: 1,
    alignItems: 'flex-end',
  },
  totalLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontWeight: '700',
  },
  totalValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
  },
  checkoutActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  cancelButton: {
    flex: 1,
    borderColor: COLORS.border,
  },
  placeOrderButton: {
    flex: 2,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  productCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    ...SHADOWS.medium,
  },
  productImageContainer: {
    width: 70,
    height: 70,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  productDescription: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  productPrice: {
    ...TYPOGRAPHY.body,
    fontWeight: '800',
    color: COLORS.primary,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
  },
  stockText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  lowStockBadge: {
    backgroundColor: '#FEE2E2',
  },
  lowStockText: {
    color: COLORS.error,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  orderCard: {
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  orderTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderItemName: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.border,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
  },
  statuspending: { backgroundColor: '#FEF3C7' },
  statusTextpending: { color: '#D97706' },
  statusdelivered: { backgroundColor: COLORS.primaryLight },
  statusTextdelivered: { color: COLORS.primary },
  orderDetailRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  orderDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  orderDetailText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  orderTotalLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  orderTotalValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '800',
    color: COLORS.primary,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    gap: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
  },
});

export default ShopCustomerScreen;
