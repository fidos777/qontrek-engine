// lib/verticals/templates/index.ts
// Central exports for all vertical templates

export { solarTemplate } from './solar';
export { takafulTemplate } from './takaful';
export { ecommerceTemplate } from './ecommerce';
export { trainingTemplate } from './training';
export { constructionTemplate } from './construction';
export { automotiveTemplate } from './automotive';

import { solarTemplate } from './solar';
import { takafulTemplate } from './takaful';
import { ecommerceTemplate } from './ecommerce';
import { trainingTemplate } from './training';
import { constructionTemplate } from './construction';
import { automotiveTemplate } from './automotive';
import type { VerticalTemplate } from '../types';

// All templates as an array
export const allTemplates: VerticalTemplate[] = [
  solarTemplate,
  takafulTemplate,
  ecommerceTemplate,
  trainingTemplate,
  constructionTemplate,
  automotiveTemplate,
];

// Templates by ID
export const templatesById = {
  solar: solarTemplate,
  takaful: takafulTemplate,
  ecommerce: ecommerceTemplate,
  training: trainingTemplate,
  construction: constructionTemplate,
  automotive: automotiveTemplate,
} as const;
