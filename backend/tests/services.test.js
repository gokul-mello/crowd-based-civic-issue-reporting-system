const test = require('node:test');
const assert = require('node:assert');
const { generateFallbackComplaint } = require('../services/aiComplaintService');
const { calculatePriority } = require('../services/priorityService');

test('AI Heuristic Fallback Engine properly formats citizen complaint', () => {
  const citizenInput = 'Big potholes on Main Street causing traffic accidents';
  const result = generateFallbackComplaint(citizenInput, 'Roads & Potholes', 'Main Street');

  assert.strictEqual(result.isFallback, true);
  assert.strictEqual(result.suggestedCategory, 'Roads & Potholes');
  assert.match(result.professionalTitle, /Road Surface Repair/i);
  assert.match(result.professionalDescription, /Main Street/);
  assert.match(result.professionalDescription, /Big potholes/);
});

test('Priority calculation scales with votes and category hazards', () => {
  const lowPriority = calculatePriority({
    voteCount: 0,
    category: 'Other',
    createdAt: new Date(),
    suggestedUrgency: 'Low'
  });

  const highPriority = calculatePriority({
    voteCount: 45,
    category: 'Streetlights & Electrical',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days old
    suggestedUrgency: 'High'
  });

  assert.ok(highPriority.priorityScore > lowPriority.priorityScore);
  assert.strictEqual(highPriority.priorityLevel, 'Critical');
  assert.ok(highPriority.priorityReason.includes('Priority Score'));
});
