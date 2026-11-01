/**
 * Priority Scoring Service
 * 
 * Computes a transparent, multi-factor civic priority score based on:
 * 1. Community Vote Count (logarithmic scale to balance high-population areas)
 * 2. Inherent Safety Hazard & Category Risk (Electrical/Sewage/Potholes have high hazard weights)
 * 3. Pending Age (Aging complaints gain urgency to avoid neglect)
 * 4. Citizen urgency indicators
 */

const CATEGORY_WEIGHTS = {
  'Streetlights & Electrical': 30, // Exposed wires, dark streets
  'Drainage & Sewage': 28,         // Contamination, disease vector
  'Roads & Potholes': 25,          // Road accidents, vehicular hazard
  'Water Supply & Leakage': 22,    // Scarcity, pipeline damage
  'Garbage & Sanitation': 20,      // Hygiene, blockages
  'Traffic & Safety': 25,          // Pedestrian safety
  'Public Property & Parks': 15,   // Aesthetics, civic amenities
  'Other': 10
};

const calculatePriority = ({
  voteCount = 0,
  category = 'Other',
  createdAt = new Date(),
  suggestedUrgency = 'Medium'
}) => {
  // 1. Category baseline score (max 30 pts)
  const categoryScore = CATEGORY_WEIGHTS[category] || 15;

  // 2. Community Voting impact (max 40 pts)
  // 1 vote = 3 pts, up to 10 votes = 2 pts each, then log scaling
  let voteScore = 0;
  if (voteCount <= 5) {
    voteScore = voteCount * 4; // up to 20
  } else if (voteCount <= 20) {
    voteScore = 20 + (voteCount - 5) * 1.2; // up to 38
  } else {
    voteScore = Math.min(45, 38 + Math.log10(voteCount) * 4);
  }

  // 3. Age / Aging factor (max 15 pts)
  const now = new Date();
  const created = new Date(createdAt);
  const diffDays = Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
  const ageScore = Math.min(15, diffDays * 2.5);

  // 4. Urgency modifier (max 15 pts)
  let urgencyScore = 5;
  if (suggestedUrgency === 'Critical') urgencyScore = 15;
  else if (suggestedUrgency === 'High') urgencyScore = 10;
  else if (suggestedUrgency === 'Low') urgencyScore = 2;

  // Total calculated score (0 - 100)
  const rawTotal = Math.round(categoryScore + voteScore + ageScore + urgencyScore);
  const totalScore = Math.max(5, Math.min(100, rawTotal));

  // Determine Level
  let priorityLevel = 'Low';
  if (totalScore >= 75) {
    priorityLevel = 'Critical';
  } else if (totalScore >= 50) {
    priorityLevel = 'High';
  } else if (totalScore >= 25) {
    priorityLevel = 'Medium';
  }

  const priorityReason = `Priority Score ${totalScore}/100: Category weight (${categoryScore}pts), ${voteCount} community votes (${Math.round(voteScore)}pts), pending duration ${diffDays}d (${Math.round(ageScore)}pts), and urgency factor (${urgencyScore}pts).`;

  return {
    priorityScore: totalScore,
    priorityLevel,
    priorityReason
  };
};

module.exports = {
  calculatePriority,
  CATEGORY_WEIGHTS
};
