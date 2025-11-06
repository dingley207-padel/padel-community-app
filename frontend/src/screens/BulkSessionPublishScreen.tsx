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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { Colors, Spacing, Typography } from '../styles/appleDesignSystem';

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

interface BulkSessionPublishScreenProps {
  communityId: string;
  communityName: string;
  onBack: () => void;
  onComplete: () => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BulkSessionPublishScreen({
  communityId,
  communityName,
  onBack,
  onComplete,
}: BulkSessionPublishScreenProps) {
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [weeksAhead, setWeeksAhead] = useState('4');
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [communityId]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const templatesData = await api.getSessionTemplates(communityId, false); // Only active templates
      setTemplates(templatesData);

      // Auto-select all templates by default
      const allIds = new Set(templatesData.map((t: SessionTemplate) => t.id));
      setSelectedTemplateIds(allIds);
    } catch (error: any) {
      console.error('Error loading templates:', error);
      Alert.alert('Error', 'Failed to load session templates');
      onBack();
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTemplate = (templateId: string) => {
    const newSelected = new Set(selectedTemplateIds);
    if (newSelected.has(templateId)) {
      newSelected.delete(templateId);
    } else {
      newSelected.add(templateId);
    }
    setSelectedTemplateIds(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(templates.map((t) => t.id));
    setSelectedTemplateIds(allIds);
  };

  const selectNone = () => {
    setSelectedTemplateIds(new Set());
  };

  const calculateTotalSessions = (): number => {
    const weeks = Number(weeksAhead);
    if (isNaN(weeks) || weeks < 1) return 0;
    return selectedTemplateIds.size * weeks;
  };

  const handlePublish = async () => {
    if (selectedTemplateIds.size === 0) {
      Alert.alert('No Templates Selected', 'Please select at least one template to publish');
      return;
    }

    const weeks = Number(weeksAhead);
    if (isNaN(weeks) || weeks < 1 || weeks > 12) {
      Alert.alert('Invalid Weeks', 'Please enter a number between 1 and 12');
      return;
    }

    const totalSessions = calculateTotalSessions();

    Alert.alert(
      'Confirm Bulk Publish',
      `This will create ${totalSessions} sessions:\n\n` +
      `• ${selectedTemplateIds.size} templates\n` +
      `• ${weeks} weeks ahead\n` +
      `• Total: ${totalSessions} sessions\n\n` +
      `Members will receive notifications for all new sessions. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Publish',
          style: 'default',
          onPress: performBulkPublish,
        },
      ]
    );
  };

  const performBulkPublish = async () => {
    try {
      setIsPublishing(true);
      const templateIdsArray = Array.from(selectedTemplateIds);
      const weeks = Number(weeksAhead);

      const result = await api.bulkCreateSessions(templateIdsArray, weeks);

      const successMessage =
        `Successfully published ${result.created} sessions!` +
        (result.errors && result.errors.length > 0
          ? `\n\nNote: ${result.errors.length} session(s) could not be created.`
          : '');

      Alert.alert(
        'Success',
        successMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              onComplete();
              onBack();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error publishing sessions:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to publish sessions. Please try again.'
      );
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.brand} />
      </View>
    );
  }

  if (templates.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bulk Publish Sessions</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No Active Templates</Text>
          <Text style={styles.emptySubtext}>
            Create session templates first to use bulk publishing
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={onBack}>
            <Text style={styles.emptyButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalSessions = calculateTotalSessions();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} disabled={isPublishing}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Bulk Publish</Text>
          <Text style={styles.headerSubtitle}>{communityName}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.instructionText}>
            Select which session templates to publish, then choose how many weeks ahead to create
            them.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Templates ({selectedTemplateIds.size}/{templates.length} selected)
            </Text>
            <View style={styles.selectButtons}>
              <TouchableOpacity onPress={selectAll} disabled={isPublishing}>
                <Text style={styles.selectButtonText}>Select All</Text>
              </TouchableOpacity>
              <Text style={styles.selectDivider}>|</Text>
              <TouchableOpacity onPress={selectNone} disabled={isPublishing}>
                <Text style={styles.selectButtonText}>None</Text>
              </TouchableOpacity>
            </View>
          </View>

          {templates.map((template) => {
            const isSelected = selectedTemplateIds.has(template.id);
            return (
              <TouchableOpacity
                key={template.id}
                style={[styles.templateCard, isSelected && styles.templateCardSelected]}
                onPress={() => toggleTemplate(template.id)}
                disabled={isPublishing}
              >
                <View style={styles.checkboxContainer}>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                  </View>
                </View>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateTitle}>{template.title}</Text>
                  <View style={styles.templateMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar" size={12} color={Colors.textSecondary} />
                      <Text style={styles.metaText}>
                        {DAYS_OF_WEEK[template.day_of_week]}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="time" size={12} color={Colors.textSecondary} />
                      <Text style={styles.metaText}>
                        {template.time_of_day.substring(0, 5)}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="location" size={12} color={Colors.textSecondary} />
                      <Text style={styles.metaText}>
                        {template.sub_communities?.name || 'No location'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.templateMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="cash" size={12} color={Colors.textSecondary} />
                      <Text style={styles.metaText}>AED {template.price}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="people" size={12} color={Colors.textSecondary} />
                      <Text style={styles.metaText}>{template.max_players} players</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Publish Settings</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Number of Weeks Ahead</Text>
            <TextInput
              style={styles.input}
              placeholder="4"
              value={weeksAhead}
              onChangeText={setWeeksAhead}
              keyboardType="numeric"
              editable={!isPublishing}
            />
            <Text style={styles.inputHint}>
              Enter a number between 1 and 12 weeks
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Ionicons name="calculator" size={24} color={Colors.brand} />
              <Text style={styles.summaryTitle}>Publishing Summary</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Selected Templates:</Text>
              <Text style={styles.summaryValue}>{selectedTemplateIds.size}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Weeks Ahead:</Text>
              <Text style={styles.summaryValue}>{weeksAhead || '0'}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabelBold}>Total Sessions to Create:</Text>
              <Text style={styles.summaryValueBold}>{totalSessions}</Text>
            </View>
            <Text style={styles.summaryNote}>
              Members will receive push notifications for all new sessions
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.publishButton,
            (isPublishing || selectedTemplateIds.size === 0 || totalSessions === 0) &&
              styles.buttonDisabled,
          ]}
          onPress={handlePublish}
          disabled={isPublishing || selectedTemplateIds.size === 0 || totalSessions === 0}
        >
          {isPublishing ? (
            <>
              <ActivityIndicator size="small" color="#000000" style={{ marginRight: 8 }} />
              <Text style={styles.publishButtonText}>Publishing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="flash" size={20} color="#000000" style={{ marginRight: 8 }} />
              <Text style={styles.publishButtonText}>
                Publish {totalSessions} Session{totalSessions !== 1 ? 's' : ''}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.size.title3,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Typography.size.caption1,
    fontWeight: Typography.weight.regular,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: Typography.size.title3,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  emptySubtext: {
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  emptyButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.brand,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: Typography.size.callout,
    fontWeight: Typography.weight.semibold,
    color: '#000000',
  },
  section: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  instructionText: {
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.regular,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.size.headline,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  selectButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  selectButtonText: {
    fontSize: Typography.size.caption1,
    fontWeight: '600' as '600',
    color: Colors.brand,
  },
  selectDivider: {
    fontSize: Typography.size.caption1,
    fontWeight: Typography.weight.regular,
    color: Colors.textSecondary,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  templateCardSelected: {
    borderColor: Colors.brand,
    backgroundColor: Colors.brandLight,
  },
  checkboxContainer: {
    marginRight: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    borderColor: Colors.brand,
    backgroundColor: Colors.brand,
  },
  templateInfo: {
    flex: 1,
  },
  templateTitle: {
    fontSize: Typography.size.body,
    fontWeight: '600' as '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  templateMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Typography.size.caption1,
    fontWeight: Typography.weight.regular,
    color: Colors.textSecondary,
  },
  inputGroup: {
    marginTop: Spacing.sm,
  },
  inputLabel: {
    fontSize: Typography.size.body,
    fontWeight: '600' as '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.regular,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  inputHint: {
    fontSize: Typography.size.caption1,
    fontWeight: Typography.weight.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Spacing.md,
    ...Spacing.shadow,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  summaryTitle: {
    fontSize: Typography.size.headline,
    fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    fontSize: Typography.size.body,
    fontWeight: Typography.weight.regular,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: Typography.size.body,
    fontWeight: '600' as '600',
    color: Colors.textPrimary,
  },
  summaryLabelBold: {
    fontSize: Typography.size.body,
    fontWeight: '700' as '700',
    color: Colors.textPrimary,
  },
  summaryValueBold: {
    fontSize: Typography.size.title3,
    fontWeight: '700' as '700',
    color: Colors.brand,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  summaryNote: {
    fontSize: Typography.size.caption1,
    fontWeight: Typography.weight.regular,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontStyle: 'italic' as 'italic',
  },
  footer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand,
    borderRadius: 12,
    padding: Spacing.md,
  },
  publishButtonText: {
    fontSize: Typography.size.callout,
    fontWeight: Typography.weight.semibold,
    color: '#000000',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
