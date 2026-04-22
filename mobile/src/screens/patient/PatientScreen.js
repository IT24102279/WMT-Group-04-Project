import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { 
  Users, 
  UserPlus, 
  Contact, 
  Star, 
  FileText, 
  Trash2, 
  Edit3, 
  XCircle,
  ChevronRight
} from 'lucide-react-native';

import { getPatients, createPatient, updatePatient, deletePatient } from '../../services/patientService';
import { hasRequiredValues, sanitizeInteger } from '../../utils/validation';
import { showToast } from '../../utils/toast';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import Card from '../../components/Card';
import AttachmentPreview from '../../components/AttachmentPreview';

const PatientScreen = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [consentAsset, setConsentAsset] = useState(null);
  const [form, setForm] = useState({ name: '', contact: '', loyaltyPoints: '0' });

  const loadPatients = async () => {
    setLoading(true);
    try {
      const response = await getPatients();
      setPatients(response.data || []);
    } catch (error) {
      showToast('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const updateForm = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const pickConsentForm = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false
      });
      if (!result.canceled && result.assets?.length) {
        setConsentAsset(result.assets[0]);
      }
    } catch (err) {
      showToast('Error picking document');
    }
  };

  const handleCreate = async () => {
    if (!hasRequiredValues(form, ['name', 'contact'])) {
      showToast('Name and contact are required');
      return;
    }
    setSubmitting(true);
    try {
      await createPatient(form, consentAsset);
      resetForm();
      await loadPatients();
      showToast('Patient profile created');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Create failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPatientId) return;
    if (!hasRequiredValues(form, ['name', 'contact'])) {
      showToast('Name and contact are required');
      return;
    }
    setSubmitting(true);
    try {
      await updatePatient(selectedPatientId, form, consentAsset);
      resetForm();
      await loadPatients();
      showToast('Patient profile updated');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPatientId) return;
    setSubmitting(true);
    try {
      await deletePatient(selectedPatientId);
      resetForm();
      await loadPatients();
      showToast('Patient profile deleted');
    } catch (error) {
      showToast('Delete failed');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedPatientId('');
    setConsentAsset(null);
    setForm({ name: '', contact: '', loyaltyPoints: '0' });
  };

  const preloadPatient = (item) => {
    setSelectedPatientId(item._id);
    setForm({
      name: item.name,
      contact: item.contact,
      loyaltyPoints: String(item.loyaltyPoints || 0)
    });
  };

  const renderPatientItem = ({ item }) => {
    const isSelected = selectedPatientId === item._id;
    return (
      <Card 
        style={[styles.patientCard, isSelected && styles.selectedCard]}
        onPress={() => preloadPatient(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name[0]}</Text>
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{item.name}</Text>
            <View style={styles.contactRow}>
              <Contact size={12} color={COLORS.textLight} />
              <Text style={styles.patientContact}>{item.contact}</Text>
            </View>
          </View>
          <View style={styles.loyaltyBadge}>
            <Star size={12} color={COLORS.secondary} fill={COLORS.secondary} />
            <Text style={styles.loyaltyText}>{item.loyaltyPoints}</Text>
          </View>
        </View>

        <AttachmentPreview
          url={item.consentFormUrl}
          imageLabel="Consent Form"
          pdfLabel="View PDF Consent"
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
        <Users size={28} color={COLORS.primary} />
        <Text style={styles.title}>Patient Registry</Text>
      </View>

      <FlatList
        data={patients}
        keyExtractor={(item) => item._id}
        renderItem={renderPatientItem}
        onRefresh={loadPatients}
        refreshing={loading}
        ListHeaderComponent={
          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <UserPlus size={18} color={COLORS.primary} />
              <Text style={styles.formTitle}>
                {selectedPatientId ? 'Edit Patient Profile' : 'New Patient Registration'}
              </Text>
            </View>
            
            <CustomInput
              label="Full Name"
              placeholder="e.g. John Doe"
              value={form.name}
              onChangeText={(v) => updateForm('name', v)}
              icon={Users}
            />
            <CustomInput
              label="Contact Number"
              placeholder="e.g. +94 77 123 4567"
              value={form.contact}
              onChangeText={(v) => updateForm('contact', v)}
              icon={Contact}
              keyboardType="phone-pad"
            />
            <CustomInput
              label="Loyalty Points"
              placeholder="0"
              value={form.loyaltyPoints}
              onChangeText={(v) => updateForm('loyaltyPoints', sanitizeInteger(v))}
              icon={Star}
              keyboardType="number-pad"
            />

            <View style={styles.attachmentSection}>
              <CustomButton
                variant="outline"
                title={consentAsset ? 'Consent Form Attached' : 'Attach Consent Form'}
                onPress={pickConsentForm}
                icon={FileText}
                style={styles.attachBtn}
              />
              {consentAsset && (
                <Text style={styles.fileName} numberOfLines={1}>{consentAsset.name}</Text>
              )}
            </View>

            <View style={styles.buttonRow}>
              {selectedPatientId ? (
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
                    onPress={resetForm}
                    icon={XCircle}
                    style={styles.iconOnlyBtn}
                  />
                </>
              ) : (
                <CustomButton
                  title="Register Patient"
                  onPress={handleCreate}
                  loading={submitting}
                  icon={UserPlus}
                  style={styles.fullButton}
                />
              )}
            </View>
          </Card>
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Users size={48} color={COLORS.border} />
              <Text style={styles.emptyText}>No patients registered yet</Text>
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
  attachmentSection: {
    marginVertical: SPACING.sm,
  },
  attachBtn: {
    height: 40,
  },
  fileName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    marginTop: 4,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  flexButton: {
    flex: 1,
  },
  fullButton: {
    flex: 1,
  },
  deleteBtn: {
    borderColor: COLORS.error,
  },
  iconOnlyBtn: {
    width: 44,
  },
  patientCard: {
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.text,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  patientContact: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
  },
  loyaltyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  loyaltyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
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

export default PatientScreen;
