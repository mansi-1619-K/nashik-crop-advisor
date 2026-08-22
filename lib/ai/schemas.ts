import { z } from "zod";

export const advisoryNarrativeSchema = z.object({
  summary: z.string().min(10).max(1500),
  recommendationExplanation: z.string().min(20).max(2500),
  actions: z.array(z.string().min(3).max(300)).max(8),
  warnings: z.array(z.string().max(300)).max(6),
  followUpQuestions: z.array(z.string().min(5).max(160)).max(4),
});

export type AdvisoryNarrative = z.infer<typeof advisoryNarrativeSchema>;

export const chatAnswerSchema = z.object({
  answer: z.string().min(10).max(4000),
  caveats: z.array(z.string().max(300)).max(4),
  suggestedFollowUps: z.array(z.string().min(5).max(160)).max(3),
});

export type ChatAnswer = z.infer<typeof chatAnswerSchema>;
