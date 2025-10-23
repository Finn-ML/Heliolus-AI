/**
 * Template Routes (DB-backed)
 * Exposes real templates using TemplateService with response shape compatible with frontend types
 */

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { TemplateService } from '../services/template.service';

// Service instance
const templateService = new TemplateService();

// Query validation
const ListTemplatesQuerySchema = z.object({
  category: z
    .enum(['FINANCIAL_CRIME', 'TRADE_COMPLIANCE', 'DATA_PRIVACY', 'CYBERSECURITY', 'ESG'])
    .optional(),
  active: z
    .preprocess((v) => (v === 'true' ? true : v === 'false' ? false : v), z.boolean().optional())
    .optional(),
  search: z.string().min(1).optional(),
});

// Helper: map backend question type to frontend type
function mapQuestionType(type: string):
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'TEXT'
  | 'NUMBER'
  | 'RATING'
  | 'CHECKLIST' {
  switch (type) {
    case 'TEXT':
      return 'TEXT';
    case 'NUMBER':
      return 'NUMBER';
    case 'BOOLEAN':
      return 'TRUE_FALSE';
    case 'SELECT':
      return 'MULTIPLE_CHOICE';
    case 'MULTISELECT':
      return 'CHECKLIST';
    // FILE/DATE or any unknown types -> TEXT as a safe default for UI
    default:
      return 'TEXT';
  }
}

// Helper: build frontend-friendly template object
function toFrontendTemplate(template: any) {
  const totalQuestions = (template.sections || []).reduce(
    (sum: number, section: any) => sum + (section.questions ? section.questions.length : 0),
    0
  );
  const estimatedMinutes = totalQuestions > 0 ? Math.max(15, Math.min(90, totalQuestions * 2)) : 30;

  return {
    id: template.id,
    name: template.name,
    slug: template.slug,
    category: template.category,
    description: template.description,
    version: template.version,
    isActive: template.isActive,
    estimatedMinutes,
    totalQuestions,
    sections: (template.sections || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      description: s.description || undefined,
      order: s.order,
      questions: (s.questions || []).map((q: any, index: number) => ({
        id: q.id,
        text: q.text,
        type: mapQuestionType(q.type),
        required: q.required ?? false,
        options: Array.isArray(q.options)
          ? q.options.map((opt: string, i: number) => ({ id: `${q.id}-opt-${i}`, text: opt, value: opt, order: i }))
          : undefined,
        validation: q.validation || undefined,
        helpText: q.helpText || undefined,
        order: q.order ?? index,
      })),
    })),
    createdAt: template.createdAt?.toISOString?.() || template.createdAt,
    updatedAt: template.updatedAt?.toISOString?.() || template.updatedAt,
  };
}

export default async function templateRoutes(server: FastifyInstance) {
  // GET /templates - list templates with optional filters
  server.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const parsed = ListTemplatesQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        reply.code(400).send({
          success: false,
          message: 'Invalid query parameters',
          error: parsed.error.flatten(),
        });
        return;
      }

      const { category, active, search } = parsed.data;

      const result = await templateService.listTemplates({
        page: 1,
        limit: 100,
        category: category as any,
        includeInactive: active === undefined ? true : !active ? true : false,
        search: search,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (!result.success || !result.data) {
        reply.code(500).send({ success: false, message: result.message || 'Failed to fetch templates' });
        return;
      }

      // Note: TemplateService.listTemplates returns templates with sections (questions truncated to ids).
      // For list view, we only need metadata; supply empty sections to keep payload small and match types.
      const templates = (result.data.data || []).map((t: any) => {
        const totalQuestions = (t.sections || []).reduce(
          (sum: number, s: any) => sum + (Array.isArray(s.questions) ? s.questions.length : 0),
          0
        );
        const estimatedMinutes = totalQuestions > 0 ? Math.max(15, Math.min(90, totalQuestions * 2)) : 30;
        return {
          id: t.id,
          name: t.name,
          slug: t.slug,
          category: t.category,
          description: t.description,
          version: t.version,
          isActive: t.isActive,
          estimatedMinutes,
          totalQuestions,
          sections: [],
          createdAt: t.createdAt?.toISOString?.() || t.createdAt,
          updatedAt: t.updatedAt?.toISOString?.() || t.updatedAt,
        };
      });

      reply.code(200).send({ success: true, data: templates });
    } catch (error: any) {
      request.log.error({ error }, 'Failed to list templates');
      reply.code(500).send({ success: false, message: 'Failed to fetch templates' });
    }
  });

  // GET /templates/:id - get single template with full structure
  server.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      const result = await templateService.getTemplateById(id, true);

      if (!result.success || !result.data) {
        reply.code(404).send({ success: false, message: 'Template not found' });
        return;
      }

      const payload = toFrontendTemplate(result.data);
      reply.code(200).send({ success: true, data: payload });
    } catch (error: any) {
      request.log.error({ error }, 'Failed to get template');
      reply.code(500).send({ success: false, message: 'Failed to fetch template' });
    }
  });
}


