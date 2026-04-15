import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, SectionList, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as DocumentPicker from 'expo-document-picker';
import { Calendar, Clock, MessageSquare, Plus, Save, Trash2, XCircle, FileText, User, ChevronRight } from 'lucide-react-native';

import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getSupportTickets,
  createSupportTicket,
  updateSupportTicket,
  deleteSupportTicket
} from '../../services/supportService';
import DatePickerField from '../../components/DatePickerField';
import TimePickerField from '../../components/TimePickerField';
import { hasRequiredValues } from '../../utils/validation';
import { showToast } from '../../utils/toast';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../utils/theme';
import AttachmentPreview from '../../components/AttachmentPreview';
import { useAuth } from '../../context/AuthContext';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import Card from '../../components/Card';

const APPOINTMENT_STATUS_OPTIONS = ['scheduled', 'completed', 'cancelled'];

const SupportScreen = () => {
  const { user } = useAuth();
  const isCustomer = user?.role === 'customer';
  const [appointments, setAppointments] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [reportAsset, setReportAsset] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: '',
    date: '',
    time: '',
    status: 'scheduled',
    notes: ''
  });
  const [ticketForm, setTicketForm] = useState({
    userId: '',
    message: '',
    status: 'open'
  });

  const loadSupportData = async () => {
    try {
      setIsLoading(true);
      const appointmentPromise = getAppointments();
      const ticketPromise = isCustomer ? Promise.resolve({ data: [] }) : getSupportTickets();
      const [appointmentRes, ticketRes] = await Promise.all([appointmentPromise, ticketPromise]);
      setAppointments(appointmentRes.data || []);
      setTickets(ticketRes.data || []);
    } catch (error) {
      console.log('Load support data failed', error?.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSupportData();
  }, []);

  const updateAppointmentForm = (key, value) =>
    setAppointmentForm((prev) => ({ ...prev, [key]: value }));
  const updateTicketForm = (key, value) => setTicketForm((prev) => ({ ...prev, [key]: value }));

  const pickReport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false
      });
      if (!result.canceled && result.assets?.length) {
        setReportAsset(result.assets[0]);
      }
    } catch (error) {
      showToast('Could not pick report');
    }
  };

  const handleCreateAppointment = async () => {
    const requiredFields = isCustomer ? ['date', 'time', 'status'] : ['patientId', 'date', 'time', 'status'];
    if (!hasRequiredValues(appointmentForm, requiredFields)) {
      showToast('Please fill all required fields');
      return;
    }
    try {
      setIsLoading(true);
      const payload = isCustomer
        ? {
            date: appointmentForm.date,
            time: appointmentForm.time,
            status: appointmentForm.status,
            notes: appointmentForm.notes
          }
        : appointmentForm;
      await createAppointment(payload);
      resetAppointmentForm();
      await loadSupportData();
      showToast('Appointment scheduled');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Create appointment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAppointment = async () => {
    if (!selectedAppointmentId) return;
    if (!hasRequiredValues(appointmentForm, ['patientId', 'date', 'time', 'status'])) {
      showToast('Please fill all required fields');
      return;
    }
    try {
      setIsLoading(true);
      await updateAppointment(selectedAppointmentId, appointmentForm);
      resetAppointmentForm();
      await loadSupportData();
      showToast('Appointment updated');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Update appointment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointmentId) return;
    try {
      setIsLoading(true);
      await deleteAppointment(selectedAppointmentId);
      resetAppointmentForm();
      await loadSupportData();
      showToast('Appointment deleted');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Delete appointment failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!hasRequiredValues(ticketForm, ['userId', 'message', 'status'])) {
      showToast('Please fill all required fields');
      return;
    }
    try {
      setIsLoading(true);
      await createSupportTicket(ticketForm, reportAsset);
      setReportAsset(null);
      resetTicketForm();
      await loadSupportData();
      showToast('Support ticket created');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Create ticket failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicketId) return;
    if (!hasRequiredValues(ticketForm, ['userId', 'message', 'status'])) {
      showToast('Please fill all required fields');
      return;
    }
    try {
      setIsLoading(true);
      await updateSupportTicket(selectedTicketId, ticketForm, reportAsset);
      setReportAsset(null);
      resetTicketForm();
      await loadSupportData();
      showToast('Ticket updated');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Update ticket failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicketId) return;
    try {
      setIsLoading(true);
      await deleteSupportTicket(selectedTicketId);
      resetTicketForm();
      await loadSupportData();
      showToast('Ticket deleted');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Delete ticket failed');
    } finally {
      setIsLoading(false);
    }
  };

  const preloadAppointment = (item) => {
    setSelectedAppointmentId(item._id);
    setAppointmentForm({
      patientId: item.patientId,
      date: new Date(item.date).toISOString().slice(0, 10),
      time: item.time,
      status: item.status,
      notes: item.notes || ''
    });
  };

  const preloadTicket = (item) => {
    setSelectedTicketId(item._id);
    setTicketForm({
      userId: item.userId,
      message: item.message,
      status: item.status
    });
  };

  const resetAppointmentForm = () => {
    setSelectedAppointmentId('');
    setAppointmentForm({
      patientId: '',
      date: '',
      time: '',
      status: 'scheduled',
      notes: ''
    });
  };

  const resetTicketForm = () => {
    setSelectedTicketId('');
    setTicketForm({
      userId: '',
      message: '',
      status: 'open'
    });
    setReportAsset(null);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{isCustomer ? 'My Support' : 'Support Center'}</Text>
        <MessageSquare size={28} color={COLORS.primary} />
      </View>

      <Card style={styles.formCard}>
        <View style={styles.cardHeader}>
          <Calendar size={20} color={COLORS.primary} />
          <Text style={styles.cardTitle}>
            {selectedAppointmentId ? 'Edit Appointment' : 'Book Appointment'}
          </Text>
        </View>
        
        {!isCustomer && (
          <CustomInput
            label="Patient ID"
            placeholder="PAT-001"
            value={appointmentForm.patientId}
            onChangeText={(v) => updateAppointmentForm('patientId', v)}
            icon={User}
          />
        )}
        
        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <DatePickerField 
              label="Date" 
              value={appointmentForm.date} 
              onChange={(v) => updateAppointmentForm('date', v)} 
            />
          </View>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <TimePickerField 
              label="Time" 
              value={appointmentForm.time} 
              onChange={(v) => updateAppointmentForm('time', v)} 
            />
          </View>
        </View>

        <Text style={styles.label}>Status</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={appointmentForm.status}
            onValueChange={(v) => updateAppointmentForm('status', v)}
            style={styles.picker}
          >
            {APPOINTMENT_STATUS_OPTIONS.map((status) => (
              <Picker.Item
                key={status}
                label={status.charAt(0).toUpperCase() + status.slice(1)}
                value={status}
              />
            ))}
          </Picker>
        </View>

        <CustomInput 
          label="Notes" 
          placeholder="Reason for appointment..." 
          value={appointmentForm.notes} 
          onChangeText={(v) => updateAppointmentForm('notes', v)} 
          multiline
        />

        <View style={styles.buttonGrid}>
          {!selectedAppointmentId ? (
            <CustomButton 
              title="Schedule" 
              onPress={handleCreateAppointment} 
              loading={isLoading}
              style={{ flex: 1 }}
              icon={Plus}
            />
          ) : (
            <>
              <CustomButton 
                title="Save Changes" 
                onPress={handleUpdateAppointment} 
                loading={isLoading}
                style={{ flex: 1 }}
                icon={Save}
              />
              {!isCustomer && (
                <CustomButton 
                  variant="outline"
                  title="Delete" 
                  onPress={handleDeleteAppointment} 
                  loading={isLoading}
                  style={[styles.deleteButton, { flex: 1 }]}
                  textStyle={{ color: COLORS.error }}
                  icon={Trash2}
                />
              )}
            </>
          )}
        </View>
        
        {selectedAppointmentId && (
          <CustomButton 
            variant="ghost" 
            title="Cancel Editing" 
            onPress={resetAppointmentForm} 
            icon={XCircle}
          />
        )}
      </Card>

      {!isCustomer && (
        <Card style={styles.formCard}>
          <View style={styles.cardHeader}>
            <FileText size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>
              {selectedTicketId ? 'Update Ticket' : 'Create Ticket'}
            </Text>
          </View>
          
          <CustomInput 
            label="User ID" 
            placeholder="USR-123" 
            value={ticketForm.userId} 
            onChangeText={(v) => updateTicketForm('userId', v)} 
            icon={User}
          />
          <CustomInput 
            label="Message" 
            placeholder="Support request details..." 
            value={ticketForm.message} 
            onChangeText={(v) => updateTicketForm('message', v)} 
            multiline
          />
          <CustomInput 
            label="Status" 
            placeholder="open/closed" 
            value={ticketForm.status} 
            onChangeText={(v) => updateTicketForm('status', v)} 
          />

          <CustomButton
            variant="outline"
            title={reportAsset ? reportAsset.name : "Attach Medical Report"}
            onPress={pickReport}
            icon={FileText}
            style={styles.attachButton}
            textStyle={styles.attachText}
          />

          <View style={styles.buttonGrid}>
            {!selectedTicketId ? (
              <CustomButton 
                title="Create Ticket" 
                onPress={handleCreateTicket} 
                loading={isLoading}
                style={{ flex: 1 }}
              />
            ) : (
              <>
                <CustomButton 
                  title="Update" 
                  onPress={handleUpdateTicket} 
                  loading={isLoading}
                  style={{ flex: 1 }}
                />
                <CustomButton 
                  variant="outline"
                  title="Delete" 
                  onPress={handleDeleteTicket} 
                  loading={isLoading}
                  style={[styles.deleteButton, { flex: 1 }]}
                  textStyle={{ color: COLORS.error }}
                  icon={Trash2}
                />
              </>
            )}
          </View>
          
          {selectedTicketId && (
            <CustomButton 
              variant="ghost" 
              title="Cancel Editing" 
              onPress={resetTicketForm} 
              icon={XCircle}
            />
          )}
        </Card>
      )}

      <Text style={styles.sectionTitle}>Recent Records</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SectionList
        sections={isCustomer ? [{ title: 'Appointments', data: appointments }] : [
          { title: 'Appointments', data: appointments },
          { title: 'Support Tickets', data: tickets }
        ]}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section }) => (
          <View style={styles.listSectionHeader}>
            <Text style={styles.listSectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item, section }) => {
          if (section.title === 'Appointments') {
            return (
              <Pressable
                style={[
                  styles.recordCard,
                  selectedAppointmentId === item._id && styles.selectedRecordCard
                ]}
                onPress={() => preloadAppointment(item)}
              >
                <View style={styles.recordHeader}>
                  <View style={styles.recordTimeContainer}>
                    <Calendar size={14} color={COLORS.primary} />
                    <Text style={styles.recordDate}>
                      {new Date(item.date).toLocaleDateString()}
                    </Text>
                    <Clock size={14} color={COLORS.primary} style={{ marginLeft: 8 }} />
                    <Text style={styles.recordTime}>{item.time}</Text>
                  </View>
                  <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
                    <Text style={[styles.statusText, styles[`statusText_${item.status}`]]}>
                      {item.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>
                {item.notes && <Text style={styles.recordNotes} numberOfLines={1}>{item.notes}</Text>}
              </Pressable>
            );
          }

          return (
            <Pressable
              style={[
                styles.recordCard,
                selectedTicketId === item._id && styles.selectedRecordCard
              ]}
              onPress={() => preloadTicket(item)}
            >
              <View style={styles.recordHeader}>
                <Text style={styles.recordTitle} numberOfLines={1}>Ticket #{item._id.slice(-6)}</Text>
                <View style={[styles.statusBadge, styles.status_open]}>
                  <Text style={[styles.statusText, styles.statusText_open]}>
                    {item.status?.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.recordMessage} numberOfLines={2}>{item.message}</Text>
              <AttachmentPreview
                url={item.reportUrl}
                imageLabel="View Report"
                pdfLabel="Open PDF Report"
              />
            </Pressable>
          );
        }}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : (
            <Text style={styles.emptyText}>No records found.</Text>
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
  headerContainer: {
    marginBottom: SPACING.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text,
  },
  formCard: {
    marginBottom: SPACING.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text,
  },
  label: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  pickerWrapper: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  attachButton: {
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  attachText: {
    color: COLORS.textLight,
  },
  buttonGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  deleteButton: {
    borderColor: COLORS.error,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  listSectionHeader: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  listSectionTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.textLight,
    textTransform: 'uppercase',
  },
  recordCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.light,
  },
  selectedRecordCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  recordTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordDate: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  recordTime: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  status_scheduled: { backgroundColor: '#E0F2FE' },
  statusText_scheduled: { color: '#0284C7' },
  status_completed: { backgroundColor: COLORS.primaryLight },
  statusText_completed: { color: COLORS.primary },
  status_cancelled: { backgroundColor: '#FEE2E2' },
  statusText_cancelled: { color: COLORS.error },
  status_open: { backgroundColor: '#FEF3C7' },
  statusText_open: { color: '#D97706' },
  recordNotes: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  recordTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    flex: 1,
  },
  recordMessage: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default SupportScreen;

