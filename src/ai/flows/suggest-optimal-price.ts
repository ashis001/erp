'use server';

/**
 * @fileOverview AI-powered tool to suggest optimal selling prices for items.
 *
 * - suggestOptimalSellingPrice - A function that suggests an optimal selling price for an item based on inventory cost, market trends, and competitor pricing.
 * - SuggestOptimalSellingPriceInput - The input type for the suggestOptimalSellingPrice function.
 * - SuggestOptimalSellingPriceOutput - The return type for the suggestOptimalSellingPrice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestOptimalSellingPriceInputSchema = z.object({
  item_id: z.string().describe('The ID of the item.'),
  itemName: z.string().describe('The name of the item.'),
  categoryName: z.string().describe('The name of the item category.'),
  costPrice: z.number().describe('The cost price of the item in INR.'),
  currentSellingPrice: z.number().describe('The current selling price of the item in INR.'),
  marketTrends: z.string().optional().describe('The current market trends for this item category.'),
  competitorPricing: z.string().optional().describe('Competitor pricing for similar items in INR.'),
});
export type SuggestOptimalSellingPriceInput = z.infer<typeof SuggestOptimalSellingPriceInputSchema>;

const SuggestOptimalSellingPriceOutputSchema = z.object({
  suggestedPrice: z.number().describe('The suggested optimal selling price for the item in INR.'),
  reasoning: z.string().describe('The reasoning behind the suggested price.'),
});
export type SuggestOptimalSellingPriceOutput = z.infer<typeof SuggestOptimalSellingPriceOutputSchema>;

export async function suggestOptimalSellingPrice(input: SuggestOptimalSellingPriceInput): Promise<SuggestOptimalSellingPriceOutput> {
  return suggestOptimalSellingPriceFlow(input);
}

const suggestOptimalSellingPricePrompt = ai.definePrompt({
  name: 'suggestOptimalSellingPricePrompt',
  input: {schema: SuggestOptimalSellingPriceInputSchema},
  output: {schema: SuggestOptimalSellingPriceOutputSchema},
  prompt: `You are an AI pricing assistant that suggests optimal selling prices for items based on cost, market trends, and competitor pricing. All monetary values are in Indian Rupees (INR).

  Item Name: {{{itemName}}}
  Category: {{{categoryName}}}
  Cost Price: ₹{{{costPrice}}}
  Current Selling Price: ₹{{{currentSellingPrice}}}

  {{#if marketTrends}}
  Market Trends: {{{marketTrends}}}
  {{/if}}

  {{#if competitorPricing}}
  Competitor Pricing: {{{competitorPricing}}}
  {{/if}}

  Based on this information, what is the optimal selling price for this item in INR, and why?
  Consider profit margins and market competitiveness. Return a suggestedPrice and reasoning.
`,
});

const suggestOptimalSellingPriceFlow = ai.defineFlow(
  {
    name: 'suggestOptimalSellingPriceFlow',
    inputSchema: SuggestOptimalSellingPriceInputSchema,
    outputSchema: SuggestOptimalSellingPriceOutputSchema,
  },
  async input => {
    const {output} = await suggestOptimalSellingPricePrompt(input);
    return output!;
  }
);
