import { supabase } from '../config/database';
import { SessionTemplate, CreateSessionTemplateDTO, BulkCreateSessionsDTO, CreateSessionDTO } from '../types';
import { createSession } from './sessionService';
import { RoleService } from './roleService';

// Create a new session template
export const createSessionTemplate = async (
  templateData: CreateSessionTemplateDTO,
  managerId: string
): Promise<SessionTemplate> => {
  console.log('[createSessionTemplate] Creating template:', { templateData, managerId });

  // Verify user has permission to manage the community
  const canManage = await RoleService.canManageCommunity(managerId, templateData.community_id);
  if (!canManage) {
    throw new Error('You do not have permission to manage this community');
  }

  // Verify the community exists
  const { data: community, error: communityError } = await supabase
    .from('communities')
    .select('*')
    .eq('id', templateData.community_id)
    .single();

  if (communityError || !community) {
    throw new Error('Community not found');
  }

  // If sub_community_id is provided, verify it belongs to the community
  if (templateData.sub_community_id) {
    const { data: subCommunity, error: subError } = await supabase
      .from('communities')
      .select('*')
      .eq('id', templateData.sub_community_id)
      .eq('parent_community_id', templateData.community_id)
      .single();

    if (subError || !subCommunity) {
      throw new Error('Sub-community not found or does not belong to this community');
    }
  }

  // Validate day_of_week
  if (templateData.day_of_week < 0 || templateData.day_of_week > 6) {
    throw new Error('day_of_week must be between 0 (Sunday) and 6 (Saturday)');
  }

  // Insert template
  const { data, error } = await supabase
    .from('session_templates')
    .insert({
      ...templateData,
      created_by: managerId,
      duration_minutes: templateData.duration_minutes || 90,
      free_cancellation_hours: templateData.free_cancellation_hours || 24,
      allow_conditional_cancellation: templateData.allow_conditional_cancellation ?? true,
      is_active: templateData.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error('[createSessionTemplate] Error:', error);
    throw new Error(`Failed to create session template: ${error.message}`);
  }

  console.log('[createSessionTemplate] Template created:', data.id);
  return data as SessionTemplate;
};

// Get all templates for a community
export const getSessionTemplatesByCommunity = async (
  communityId: string,
  managerId: string,
  includeInactive: boolean = false
): Promise<SessionTemplate[]> => {
  console.log('[getSessionTemplatesByCommunity]:', { communityId, managerId, includeInactive });

  // Verify permission
  const canManage = await RoleService.canManageCommunity(managerId, communityId);
  if (!canManage) {
    throw new Error('You do not have permission to manage this community');
  }

  let query = supabase
    .from('session_templates')
    .select(`
      *,
      sub_communities:sub_community_id (
        id,
        name,
        location
      )
    `)
    .eq('community_id', communityId)
    .order('day_of_week', { ascending: true })
    .order('time_of_day', { ascending: true });

  if (!includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[getSessionTemplatesByCommunity] Error:', error);
    throw new Error(`Failed to fetch session templates: ${error.message}`);
  }

  return data as SessionTemplate[];
};

// Get a single template by ID
export const getSessionTemplateById = async (
  templateId: string,
  managerId: string
): Promise<SessionTemplate | null> => {
  const { data, error } = await supabase
    .from('session_templates')
    .select(`
      *,
      sub_communities:sub_community_id (
        id,
        name,
        location
      )
    `)
    .eq('id', templateId)
    .single();

  if (error) {
    return null;
  }

  // Verify permission
  const { data: community } = await supabase
    .from('communities')
    .select('manager_id')
    .eq('id', data.community_id)
    .single();

  if (!community || community.manager_id !== managerId) {
    throw new Error('You do not have permission to view this template');
  }

  return data as SessionTemplate;
};

// Update a session template
export const updateSessionTemplate = async (
  templateId: string,
  updates: Partial<CreateSessionTemplateDTO>,
  managerId: string
): Promise<SessionTemplate> => {
  console.log('[updateSessionTemplate]:', { templateId, updates, managerId });

  // Get the template and verify ownership
  const { data: template } = await supabase
    .from('session_templates')
    .select('community_id')
    .eq('id', templateId)
    .single();

  if (!template) {
    throw new Error('Template not found');
  }

  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('id', template.community_id)
    .eq('manager_id', managerId)
    .single();

  if (!community) {
    throw new Error('You do not have permission to update this template');
  }

  // If updating sub_community_id, verify it belongs to the community
  if (updates.sub_community_id) {
    const { data: subCommunity, error: subError } = await supabase
      .from('communities')
      .select('*')
      .eq('id', updates.sub_community_id)
      .eq('parent_community_id', template.community_id)
      .single();

    if (subError || !subCommunity) {
      throw new Error('Sub-community not found or does not belong to this community');
    }
  }

  const { data, error } = await supabase
    .from('session_templates')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', templateId)
    .select()
    .single();

  if (error) {
    console.error('[updateSessionTemplate] Error:', error);
    throw new Error(`Failed to update template: ${error.message}`);
  }

  return data as SessionTemplate;
};

// Delete a session template
export const deleteSessionTemplate = async (
  templateId: string,
  managerId: string
): Promise<void> => {
  console.log('[deleteSessionTemplate]:', { templateId, managerId });

  // Get the template and verify ownership
  const { data: template } = await supabase
    .from('session_templates')
    .select('community_id')
    .eq('id', templateId)
    .single();

  if (!template) {
    throw new Error('Template not found');
  }

  const { data: community } = await supabase
    .from('communities')
    .select('*')
    .eq('id', template.community_id)
    .eq('manager_id', managerId)
    .single();

  if (!community) {
    throw new Error('You do not have permission to delete this template');
  }

  const { error } = await supabase
    .from('session_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
    console.error('[deleteSessionTemplate] Error:', error);
    throw new Error(`Failed to delete template: ${error.message}`);
  }

  console.log('[deleteSessionTemplate] Template deleted:', templateId);
};

// Helper function to calculate next occurrence of a day of week
const getNextOccurrence = (dayOfWeek: number, timeOfDay: string, startDate?: Date): Date => {
  const date = startDate ? new Date(startDate) : new Date();
  const currentDay = date.getDay();

  // Calculate days until the next occurrence of the target day
  let daysUntilTarget = dayOfWeek - currentDay;
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7; // Move to next week if the day has passed or is today
  }

  date.setDate(date.getDate() + daysUntilTarget);

  // Set the time
  const [hours, minutes, seconds] = timeOfDay.split(':').map(Number);
  date.setHours(hours, minutes, seconds || 0, 0);

  return date;
};

// Bulk create sessions from templates
export const bulkCreateSessionsFromTemplates = async (
  bulkData: BulkCreateSessionsDTO,
  managerId: string
): Promise<{ created: number; sessions: any[]; errors: any[] }> => {
  console.log('[bulkCreateSessionsFromTemplates]:', { bulkData, managerId });

  const { template_ids, weeks_ahead, start_date } = bulkData;

  if (weeks_ahead < 1 || weeks_ahead > 12) {
    throw new Error('weeks_ahead must be between 1 and 12');
  }

  // Fetch all templates
  const { data: templates, error: templatesError } = await supabase
    .from('session_templates')
    .select(`
      *,
      communities!session_templates_community_id_fkey(manager_id),
      sub_communities:sub_community_id(name, location)
    `)
    .in('id', template_ids)
    .eq('is_active', true);

  if (templatesError) {
    console.error('[bulkCreateSessionsFromTemplates] Error fetching templates:', templatesError);
    throw new Error(`Failed to fetch templates: ${templatesError.message}`);
  }

  if (!templates || templates.length === 0) {
    throw new Error('No active templates found with the provided IDs');
  }

  // Verify all templates belong to communities managed by this user
  const unauthorizedTemplates = templates.filter(
    (t: any) => t.communities?.manager_id !== managerId
  );

  if (unauthorizedTemplates.length > 0) {
    throw new Error('You do not have permission to use some of the selected templates');
  }

  const createdSessions: any[] = [];
  const errors: any[] = [];

  // For each template, create sessions for the next N weeks
  for (const template of templates) {
    const startingDate = start_date ? new Date(start_date) : undefined;

    for (let week = 0; week < weeks_ahead; week++) {
      try {
        // Calculate the date for this session
        const sessionDate = getNextOccurrence(
          template.day_of_week,
          template.time_of_day,
          startingDate
            ? new Date(startingDate.getTime() + week * 7 * 24 * 60 * 60 * 1000)
            : week === 0
            ? undefined
            : new Date(Date.now() + week * 7 * 24 * 60 * 60 * 1000)
        );

        // Get location info
        const location = template.sub_communities?.location || template.sub_communities?.name || 'TBD';

        // Create session data
        const sessionData: CreateSessionDTO = {
          community_id: template.community_id,
          sub_community_id: template.sub_community_id,
          title: template.title,
          description: template.description,
          datetime: sessionDate.toISOString(),
          location,
          price: Number(template.price),
          max_players: template.max_players,
          visibility: true,
          free_cancellation_hours: template.free_cancellation_hours,
          allow_conditional_cancellation: template.allow_conditional_cancellation,
          created_from_template_id: template.id,
        };

        // Create the session
        const session = await createSession(sessionData, managerId);
        createdSessions.push(session);

        console.log(`[bulkCreateSessionsFromTemplates] Created session from template ${template.id} for ${sessionDate.toISOString()}`);
      } catch (error: any) {
        console.error(`[bulkCreateSessionsFromTemplates] Error creating session from template ${template.id}:`, error);
        errors.push({
          template_id: template.id,
          template_title: template.title,
          week,
          error: error.message,
        });
      }
    }
  }

  console.log(`[bulkCreateSessionsFromTemplates] Created ${createdSessions.length} sessions with ${errors.length} errors`);

  return {
    created: createdSessions.length,
    sessions: createdSessions,
    errors,
  };
};
