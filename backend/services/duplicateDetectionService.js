/**
 * Duplicate Complaint Detection Service
 * 
 * Performs fuzzy token overlap and geolocation proximity checks
 * to detect existing reports from the same locality and category.
 */

const Complaint = require('../models/Complaint');

// Helper to tokenize and stem-approximate string
const tokenize = (str = '') => {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 3);
};

// Jaccard similarity coefficient
const calculateJaccardSimilarity = (setA, setB) => {
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
};

// Haversine distance in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
};

const findPotentialDuplicates = async ({
  category,
  area,
  originalDescription,
  latitude,
  longitude,
  excludeId = null
}) => {
  const query = {
    status: { $nin: ['Resolved', 'Rejected'] }
  };

  if (category) {
    query.category = category;
  }

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  // Find recent active complaints in similar area or category
  const candidates = await Complaint.find(query)
    .sort({ createdAt: -1 })
    .limit(30)
    .select('complaintId professionalTitle originalDescription area location category voteCount status priorityLevel latitude longitude createdAt imageUrls');

  const inputTokens = new Set(tokenize(originalDescription));
  const areaLower = (area || '').toLowerCase();

  const results = [];

  for (const candidate of candidates) {
    const candidateTokens = new Set(
      tokenize(`${candidate.professionalTitle} ${candidate.originalDescription}`)
    );
    const textSim = calculateJaccardSimilarity(inputTokens, candidateTokens);

    let areaMatch = false;
    if (areaLower && candidate.area) {
      const candArea = candidate.area.toLowerCase();
      areaMatch = candArea.includes(areaLower) || areaLower.includes(candArea);
    }

    let geoDistanceMeters = null;
    let isNear = false;
    if (latitude && longitude && candidate.latitude && candidate.longitude) {
      geoDistanceMeters = Math.round(
        calculateDistance(latitude, longitude, candidate.latitude, candidate.longitude)
      );
      if (geoDistanceMeters < 300) {
        isNear = true;
      }
    }

    // Similarity score weighting
    let similarityScore = textSim * 0.5;
    if (areaMatch) similarityScore += 0.3;
    if (isNear) similarityScore += 0.2;

    if (similarityScore >= 0.25 || isNear) {
      results.push({
        complaint: candidate,
        similarityScore: Math.round(similarityScore * 100),
        geoDistanceMeters,
        reason: isNear
          ? `Within ${geoDistanceMeters}m of this location`
          : areaMatch
          ? 'Same locality and matching issue keywords'
          : 'Similar civic problem description'
      });
    }
  }

  // Sort descending by highest similarity score
  return results.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 5);
};

module.exports = {
  findPotentialDuplicates,
  calculateDistance
};
