import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';

interface SubCommunity {
  id: string;
  name: string;
  location?: string;
}

interface SessionTemplate {
  id: string;
  community_id: string;
  sub_community_id?: string;
  title: string;
  description?: string;
  day_of_week: number;
  time_of_day: string;
  duration_minutes: number;
  price: number;
  max_players: number;
  free_cancellation_hours: number;
  allow_conditional_cancellation: boolean;
  is_active: boolean;
  sub_communities?: SubCommunity;
}

interface SessionTemplatesManagerScreenProps {
  communityId: string;
  communityName: string;
  onBack: () => void;
  onBulkPublish: () => void;
}

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SessionTemplatesManagerScreen({
  communityId,
  communityName,
  onBack,
  onBulkPublish,
}: SessionTemplatesManagerScreenProps) {
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [subCommunities, setSubCommunities] = useState<SubCommunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SessionTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSubCommunityId, setFormSubCommunityId] = useState<string>('');
  const [formDayOfWeek, setFormDayOfWeek] = useState(1); // Monday
  const [formTime, setFormTime] = useState('19:00'); // 7 PM
  const [formDuration, setFormDuration] = useState('90');
  const [formPrice, setFormPrice] = useState('');
  const [formMaxPlayers, setFormMaxPlayers] = useState('8');
  const [formFreeCancellation, setFormFreeCancellation] = useState('24');
  const [formAllowConditional, setFormAllowConditional] = useState(true);
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    loadData();
  }, [communityId]);

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [templatesData, subCommsData] = await Promise.all([
        api.getSessionTemplates(communityId, true), // Include inactive
        api.getSubCommunities(communityId),
      ]);

      setTemplates(templatesData);
      setSubCommunities(subCommsData);
    } catch (error: any) {
      console.error('Error loading templates:', error);
      Alert.alert('Error', 'Failed to load match templates');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormSubCommunityId('');
    setFormDayOfWeek(1);
    setFormTime('19:00');
    setFormDuration('90');
    setFormPrice('');
    setFormMaxPlayers('8');
    setFormFreeCancellation('24');
    setFormAllowConditional(true);
    setFormIsActive(true);
  };

  const populateForm = (template: SessionTemplate) => {
    setFormTitle(template.title);
    setFormDescription(template.description || '');
    setFormSubCommunityId(template.sub_community_id || '');
    setFormDayOfWeek(template.day_of_week);
    setFormTime(template.time_of_day.substring(0, 5)); // HH:MM from HH:MM:SS
    setFormDuration(template.duration_minutes.toString());
    setFormPrice(template.price.toString());
    setFormMaxPlayers(template.max_players.toString());
    setFormFreeCancellation(template.free_cancellation_hours.toString());
    setFormAllowConditional(template.allow_conditional_cancellation);
    setFormIsActive(template.is_active);
  };

  const handleAddTemplate = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditTemplate = (template: SessionTemplate) => {
    setEditingTemplate(template);
    populateForm(template);
    setShowEditModal(true);
  };

  const validateForm = (): boolean => {
    if (!formTitle.trim()) {
      Alert.alert('Required', 'Please enter a title');
      return false;
    }
    if (!formSubCommunityId) {
      Alert.alert('Required', 'Please select a location (sub-community)');
      return false;
    }
    if (!formPrice || isNaN(Number(formPrice)) || Number(formPrice) < 0) {
      Alert.alert('Invalid', 'Please enter a valid price');
      return false;
    }
    if (!formMaxPlayers || isNaN(Number(formMaxPlayers)) || Number(formMaxPlayers) < 1) {
      Alert.alert('Invalid', 'Please enter a valid number of players');
      return false;
    }
    return true;
  };

  const handleCreateTemplate = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      await api.createSessionTemplate({
        community_id: communityId,
        sub_community_id: formSubCommunityId || undefined,
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        day_of_week: formDayOfWeek,
        time_of_day: `${formTime}:00`,
        duration_minutes: Number(formDuration),
        price: Number(formPrice),
        max_players: Number(formMaxPlayers),
        free_cancellation_hours: Number(formFreeCancellation),
        allow_conditional_cancellation: formAllowConditional,
        is_active: formIsActive,
      });

      setShowAddModal(false);
      resetForm();
      Alert.alert('Success', 'Match template created successfully');
      loadData();
    } catch (error: any) {
      console.error('Error creating template:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to create template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate || !validateForm()) return;

    try {
      setIsSaving(true);
      await api.updateSessionTemplate(editingTemplate.id, {
        title: formTitle.trim(),
        description: formDescription.trim() || undefined,
        sub_community_id: formSubCommunityId || undefined,
        day_of_week: formDayOfWeek,
        time_of_day: `${formTime}:00`,
        duration_minutes: Number(formDuration),
        price: Number(formPrice),
        max_players: Number(formMaxPlayers),
        free_cancellation_hours: Number(formFreeCancellation),
        allow_conditional_cancellation: formAllowConditional,
        is_active: formIsActive,
      });

      setShowEditModal(false);
      setEditingTemplate(null);
      resetForm();
      Alert.alert('Success', 'Template updated successfully');
      loadData();
    } catch (error: any) {
      console.error('Error updating template:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string, templateTitle: string) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${templateTitle}"? This will not delete existing matches created from this template.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteSessionTemplate(templateId);
              Alert.alert('Success', 'Template deleted successfully');
              loadData();
            } catch (error: any) {
              console.error('Error deleting template:', error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to delete template');
            }
          },
        },
      ]
    );
  };

  const handleToggleActive = async (template: SessionTemplate) => {
    try {
      await api.updateSessionTemplate(template.id, {
        is_active: !template.is_active,
      });
      loadData();
    } catch (error: any) {
      console.error('Error toggling template:', error);
      Alert.alert('Error', 'Failed to update template status');
    }
  };

  const renderTemplateForm = () => (
    <ScrollView style={styles.modalContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Monday Night Match"
          value={formTitle}
          onChangeText={setFormTitle}
          editable={!isSaving}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Location (Sub-Community) *</Text>
        <View style={styles.pickerContainer}>
          {subCommunities.map((subComm) => (
            <TouchableOpacity
              key={subComm.id}
              style={[
                styles.pickerOption,
                formSubCommunityId === subComm.id && styles.pickerOptionSelected,
              ]}
              onPress={() => setFormSubCommunityId(subComm.id)}
              disabled={isSaving}
            >
              <Text
                style={[
                  styles.pickerOptionText,
                  formSubCommunityId === subComm.id && styles.pickerOptionTextSelected,
                ]}
              >
                {subComm.name}
              </Text>
              {subComm.location && (
                <Text style={styles.pickerOptionSubtext}>{subComm.location}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Day of Week *</Text>
        <View style={styles.dayPickerContainer}>
          {DAYS_OF_WEEK.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayChip,
                formDayOfWeek === index && styles.dayChipSelected,
              ]}
              onPress={() => setFormDayOfWeek(index)}
              disabled={isSaving}
            >
              <Text
                style={[
                  styles.dayChipText,
                  formDayOfWeek === index && styles.dayChipTextSelected,
                ]}
              >
                {day.substring(0, 3)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.inputLabel}>Time *</Text>
          <TextInput
            style={styles.input}
            placeholder="19:00"
            value={formTime}
            onChangeText={setFormTime}
            editable={!isSaving}
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.inputLabel}>Duration (min)</Text>
          <TextInput
            style={styles.input}
            placeholder="90"
            value={formDuration}
            onChangeText={setFormDuration}
            keyboardType="numeric"
            editable={!isSaving}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.inputLabel}>Price (AED) *</Text>
          <TextInput
            style={styles.input}
            placeholder="50"
            value={formPrice}
            onChangeText={setFormPrice}
            keyboardType="decimal-pad"
            editable={!isSaving}
          />
        </View>

        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.inputLabel}>Max Players *</Text>
          <TextInput
            style={styles.input}
            placeholder="8"
            value={formMaxPlayers}
            onChangeText={setFormMaxPlayers}
            keyboardType="numeric"
            editable={!isSaving}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Additional details about this recurring match..."
          value={formDescription}
          onChangeText={setFormDescription}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          editable={!isSaving}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Free Cancellation (hours)</Text>
        <TextInput
          style={styles.input}
          placeholder="24"
          value={formFreeCancellation}
          onChangeText={setFormFreeCancellation}
          keyboardType="numeric"
          editable={!isSaving}
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Allow Conditional Cancellation</Text>
        <Switch
          value={formAllowConditional}
          onValueChange={setFormAllowConditional}
          disabled={isSaving}
        />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Active (visible for bulk publish)</Text>
        <Switch
          value={formIsActive}
          onValueChange={setFormIsActive}
          disabled={isSaving}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.buttonDisabled]}
        onPress={showEditModal ? handleUpdateTemplate : handleCreateTemplate}
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>
            {showEditModal ? 'Update Template' : 'Create Template'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00D4AA" />
      </View>
    );
  }

  const activeTemplates = templates.filter((t) => t.is_active);
  const inactiveTemplates = templates.filter((t) => !t.is_active);

  return (
    <SafeAreaView style={styles.container}>
      {/* Compact Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <View style={styles.headerLeft}>
          <Text style={styles.headerSubtitle}>{communityName}</Text>
          <Text style={styles.headerTitle}>Match Templates</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadData(true)}
            tintColor="#00D4AA"
          />
        }
      >
        {/* Large Action Buttons */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.largeActionButton}
            onPress={handleAddTemplate}
            activeOpacity={0.7}
          >
            <Text style={styles.largeActionEmoji}>➕</Text>
            <Text style={styles.largeActionTitle}>Create Template</Text>
            <Text style={styles.largeActionDescription}>
              Set up recurring weekly matches
            </Text>
          </TouchableOpacity>

          {activeTemplates.length > 0 && (
            <TouchableOpacity
              style={styles.largeActionButton}
              onPress={onBulkPublish}
              activeOpacity={0.7}
            >
              <Text style={styles.largeActionEmoji}>⚡</Text>
              <Text style={styles.largeActionTitle}>Bulk Publish</Text>
              <Text style={styles.largeActionDescription}>
                Create matches from all active templates
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {templates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyText}>No match templates yet</Text>
            <Text style={styles.emptySubtext}>
              Create templates for your recurring weekly matches
            </Text>
          </View>
        ) : (
          <>
            {/* Active Templates */}
            {activeTemplates.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Active Templates ({activeTemplates.length})
                </Text>

                {activeTemplates.map((template) => (
                  <View key={template.id} style={styles.templateCard}>
                    <View style={styles.templateHeader}>
                      <View style={styles.templateTitleRow}>
                        <View style={styles.templateTitleContainer}>
                          <Text style={styles.templateTitle}>{template.title}</Text>
                          <Text style={styles.templateDay}>
                            {DAYS_OF_WEEK[template.day_of_week]}s at {template.time_of_day.substring(0, 5)}
                          </Text>
                        </View>
                        <View style={styles.templateActions}>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => handleEditTemplate(template)}
                          >
                            <Ionicons name="create-outline" size={22} color="#00D4AA" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => handleToggleActive(template)}
                          >
                            <Ionicons name="eye-off-outline" size={22} color="#999" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => handleDeleteTemplate(template.id, template.title)}
                          >
                            <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View style={styles.templateDetails}>
                        <View style={styles.detailRow}>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailIcon}>📍</Text>
                            <Text style={styles.detailText}>
                              {template.sub_communities?.name || 'No location'}
                            </Text>
                          </View>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailIcon}>⏱️</Text>
                            <Text style={styles.detailText}>{template.duration_minutes} min</Text>
                          </View>
                        </View>
                        <View style={styles.detailRow}>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailIcon}>💰</Text>
                            <Text style={styles.detailText}>AED {template.price}</Text>
                          </View>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailIcon}>👥</Text>
                            <Text style={styles.detailText}>{template.max_players} players</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Inactive Templates */}
            {inactiveTemplates.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Inactive Templates ({inactiveTemplates.length})
                </Text>
                {inactiveTemplates.map((template) => (
                  <View key={template.id} style={[styles.templateCard, styles.inactiveCard]}>
                    <View style={styles.templateHeader}>
                      <View style={styles.templateTitleRow}>
                        <View style={styles.templateTitleContainer}>
                          <Text style={[styles.templateTitle, styles.inactiveText]}>
                            {template.title}
                          </Text>
                          <Text style={[styles.templateDay, styles.inactiveText]}>
                            {DAYS_OF_WEEK[template.day_of_week]}s at {template.time_of_day.substring(0, 5)}
                          </Text>
                        </View>
                        <View style={styles.templateActions}>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => handleEditTemplate(template)}
                          >
                            <Ionicons name="create-outline" size={22} color="#00D4AA" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => handleToggleActive(template)}
                          >
                            <Ionicons name="eye-outline" size={22} color="#00D4AA" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => handleDeleteTemplate(template.id, template.title)}
                          >
                            <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal || showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          setEditingTemplate(null);
          resetForm();
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {showEditModal ? 'Edit Template' : 'New Template'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                setEditingTemplate(null);
                resetForm();
              }}
              style={styles.modalCloseButton}
              disabled={isSaving}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          {renderTemplateForm()}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerLeft: {
    flex: 1,
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  largeActionButton: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  largeActionEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  largeActionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  largeActionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  templateCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveCard: {
    opacity: 0.6,
  },
  templateHeader: {
    gap: 12,
  },
  templateTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  templateTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  templateDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D4AA',
  },
  inactiveText: {
    color: '#999',
  },
  templateActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconButton: {
    padding: 4,
  },
  templateDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailIcon: {
    fontSize: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: 'white',
  },
  textArea: {
    minHeight: 80,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  pickerContainer: {
    gap: 8,
  },
  pickerOption: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: 'white',
  },
  pickerOptionSelected: {
    borderColor: '#00D4AA',
    backgroundColor: '#00D4AA20',
    borderWidth: 2,
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  pickerOptionTextSelected: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D4AA',
  },
  pickerOptionSubtext: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  dayPickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  dayChipSelected: {
    borderColor: '#00D4AA',
    backgroundColor: '#00D4AA',
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  dayChipTextSelected: {
    color: 'white',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#00D4AA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 24,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: 'white',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
