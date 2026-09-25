import {SKILL_LABELING_CATALOG as mechanismCatalog} from './skill-labeling-catalog.mjs?v=20260926-classification-scope';
import {CLASSIFICATION_REVIEW_POLICY} from './classification-review-policy.mjs?v=20260926-classification-scope';
import {applyClassificationReviewPolicy} from './classification-review.mjs?v=20260926-classification-scope';

// Public classification status; the original review metadata keeps every
// unresolved numeric detail without turning it into a calculator effect.
export const SKILL_LABELING_CATALOG = applyClassificationReviewPolicy(mechanismCatalog, CLASSIFICATION_REVIEW_POLICY);
