import { Response } from 'express';
import { AuthRequest } from '../types';
import {
  createSessionTemplate,
  getSessionTemplatesByCommunity,
  getSessionTemplateById,
  updateSessionTemplate,
  deleteSessionTemplate,
  bulkCreateSessionsFromTemplates,
} from '../services/sessionTemplateService';

export const createSessionTemplateHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const template = await createSessionTemplate(req.body, req.user!.id);
    res.status(201).json(template);
  } catch (error: any) {
    console.error('[createSessionTemplateHandler] Error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getSessionTemplatesHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { community_id } = req.params;
    const includeInactive = req.query.include_inactive === 'true';

    const templates = await getSessionTemplatesByCommunity(
      community_id,
      req.user!.id,
      includeInactive
    );

    res.json(templates);
  } catch (error: any) {
    console.error('[getSessionTemplatesHandler] Error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getSessionTemplateHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const template = await getSessionTemplateById(id, req.user!.id);

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    res.json(template);
  } catch (error: any) {
    console.error('[getSessionTemplateHandler] Error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const updateSessionTemplateHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const template = await updateSessionTemplate(id, req.body, req.user!.id);
    res.json(template);
  } catch (error: any) {
    console.error('[updateSessionTemplateHandler] Error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteSessionTemplateHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await deleteSessionTemplate(id, req.user!.id);
    res.json({ message: 'Template deleted successfully' });
  } catch (error: any) {
    console.error('[deleteSessionTemplateHandler] Error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const bulkCreateSessionsHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await bulkCreateSessionsFromTemplates(req.body, req.user!.id);

    res.status(201).json({
      message: `Successfully created ${result.created} sessions`,
      ...result,
    });
  } catch (error: any) {
    console.error('[bulkCreateSessionsHandler] Error:', error);
    res.status(400).json({ error: error.message });
  }
};
