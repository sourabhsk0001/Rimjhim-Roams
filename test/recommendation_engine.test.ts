import { test } from 'node:test';
import assert from 'node:assert';
import { tourismAutocompleteService } from '../src/lib/services/tourism-autocomplete-service';
import { recommendationEngineService } from '../src/lib/services/recommendation-engine-service';
import { createTrip } from '../src/lib/services/trip-service';
import { getTripItineraries } from '../src/lib/services/itinerary-service';
import { NATMOTourismTheme } from '../src/types/recommendations';

test('NATMO and GeoNames Autocomplete Service: States, Districts, Circuits, and POIs', async (t) => {
  await t.test('returns empty or default highlights when query is empty or whitespace', () => {
    // Empty query returns default highlights (states and circuits)
    const emptyResults = tourismAutocompleteService.getSuggestions('');
    assert.ok(Array.isArray(emptyResults), 'Should return an array');
    assert.ok(emptyResults.length > 0, 'Returns top highlighted national circuits and states');
    assert.ok(emptyResults.every((item) => item.type === 'natmo_circuit' || item.type === 'state'));
  });

  await t.test('suggests GeoNames States on prefix search', () => {
    const results = tourismAutocompleteService.getSuggestions('kera');
    assert.ok(results.length > 0, 'Should find results for "kera"');
    const kerala = results.find((r) => r.type === 'state' && r.title === 'Kerala');
    assert.ok(kerala, 'Should find Kerala as a state');
    assert.strictEqual(kerala?.badge, 'GeoNames State');
    assert.ok(kerala?.subtitle.includes('Capital: Thiruvananthapuram'));
  });

  await t.test('suggests GeoNames Districts and Cities', () => {
    const results = tourismAutocompleteService.getSuggestions('udaip');
    assert.ok(results.length > 0, 'Should find results for "udaip"');
    const udaipur = results.find((r) => r.title.toLowerCase().includes('udaipur'));
    assert.ok(udaipur, 'Should find Udaipur');
    assert.strictEqual(udaipur?.state, 'Rajasthan');
  });

  await t.test('suggests NATMO Thematic Circuits', () => {
    const results = tourismAutocompleteService.getSuggestions('golden');
    assert.ok(results.length > 0, 'Should find results for "golden"');
    const circuit = results.find((r) => r.type === 'natmo_circuit');
    assert.ok(circuit, 'Should find Golden Triangle circuit');
    assert.strictEqual(circuit?.title, 'Golden Triangle Circuit');
    assert.strictEqual(circuit?.badge, 'NATMO Thematic Circuit');
  });

  await t.test('suggests MoT and OSM Heritage Sites', () => {
    const results = tourismAutocompleteService.getSuggestions('hampi');
    assert.ok(results.length > 0, 'Should find results for "hampi"');
    const hampi = results.find((r) => r.title.toLowerCase().includes('hampi'));
    assert.ok(hampi, 'Should find Group of Monuments at Hampi');
    assert.strictEqual(hampi?.state, 'Karnataka');
  });

  await t.test('respects the limit argument', () => {
    const results = tourismAutocompleteService.getSuggestions('a', 3);
    assert.ok(results.length <= 3, 'Should not return more than limit');
  });

  await t.test('retrieves NATMO circuits by ID and all circuits', () => {
    const allCircuits = tourismAutocompleteService.getAllCircuits();
    assert.ok(allCircuits.length >= 10, 'Should contain all defined NATMO circuits');

    const desertCircuit = tourismAutocompleteService.getCircuitById('desert-triangle');
    assert.ok(desertCircuit, 'Should locate desert-triangle circuit');
    assert.ok(desertCircuit?.name.includes('Desert Triangle'));
    assert.ok(desertCircuit?.keyDestinations.includes('Jaisalmer'));
  });
});

test('Recommendation Engine: Onboarding Preferences and Profile Persistence', async (t) => {
  const testUserId = 'test-user-rec-' + Date.now();

  await t.test('creates default preference profile for new user', async () => {
    const profile = await recommendationEngineService.getUserPreferences(testUserId);
    assert.strictEqual(profile.user_id, testUserId);
    assert.strictEqual(profile.onboarding_completed, false);
    assert.ok(Array.isArray(profile.primary_themes));
  });

  await t.test('saves onboarding preferences and marks profile as completed', async () => {
    const themes: NATMOTourismTheme[] = [
      'Royal Forts & Palaces',
      'Spiritual & Pilgrimage',
      'Tea Gardens & Hill Stations',
    ];
    const updated = await recommendationEngineService.saveOnboardingPreferences(testUserId, {
      primary_themes: themes,
      preferred_pace: 'relaxed',
      budget_tier: 'moderate',
      companion_type: 'solo',
      preferred_zones: ['North', 'South'],
      preferred_states: ['Rajasthan', 'Kerala'],
    });

    assert.strictEqual(updated.onboarding_completed, true);
    assert.deepStrictEqual(updated.primary_themes, themes);
    assert.strictEqual(updated.preferred_pace, 'relaxed');
    assert.strictEqual(updated.budget_tier, 'moderate');
    assert.strictEqual(updated.companion_type, 'solo');
    assert.ok(updated.preferred_zones.includes('North'));
    assert.ok(updated.preferred_zones.includes('South'));

    // Retrieve again to ensure persistence
    const reloaded = await recommendationEngineService.getUserPreferences(testUserId);
    assert.strictEqual(reloaded.onboarding_completed, true);
    assert.strictEqual(reloaded.primary_themes.length, 3);
  });
});

test('Recommendation Engine: Implicit Learning from Saved Trips and Itineraries', async (t) => {
  const userId = 'learner-user-' + Date.now();

  // Create a trip with saved itineraries in the DB
  const tripRes = await createTrip(
    {
      origin: 'Mumbai',
      destination: 'Goa',
      start_date: '2026-11-01',
      end_date: '2026-11-05',
      budget: 35000,
      traveller_count: 2,
    },
    userId
  );

  assert.ok(tripRes.success && tripRes.data, 'Trip creation should succeed');

  // Load itineraries which seeds baseline items for Goa
  const itinRes = await getTripItineraries(tripRes.data.id, userId);
  assert.ok(itinRes.success && itinRes.days, 'Itineraries should be seeded');
  assert.ok(itinRes.days.length > 0, 'Should have days populated');

  // Trigger sync of user preferences from saved itineraries
  const syncResult = await recommendationEngineService.syncPreferencesFromSavedItineraries(userId);

  assert.strictEqual(syncResult.success, true);
  assert.ok(syncResult.tripsAnalyzed >= 1, 'Should record at least 1 saved trip');
  assert.ok(syncResult.itinerariesAnalyzed >= 1, 'Should record at least 1 day itinerary');
  assert.ok(
    syncResult.updatedProfile.implicit_states['Goa'] > 0,
    'Goa state visit frequency should be positive'
  );

  // Verify category affinities were learned
  const hasAffinities = Object.keys(syncResult.updatedProfile.implicit_interests).length > 0;
  assert.ok(hasAffinities, 'Learned profile should have positive category affinities');
});

test('Recommendation Engine: Recommendation Scoring, Explainability, and NATMO Circuit Matching', async (t) => {
  const userId = 'scoring-user-' + Date.now();

  // Save onboarding preferences focused on Heritage & Spiritual in Rajasthan
  await recommendationEngineService.saveOnboardingPreferences(userId, {
    primary_themes: ['Royal Forts & Palaces', 'Spiritual & Pilgrimage'],
    preferred_pace: 'moderate',
    budget_tier: 'luxury',
    companion_type: 'couple',
    preferred_zones: ['North', 'West'],
    preferred_states: ['Rajasthan', 'Uttar Pradesh'],
  });

  const recommendationsResult = await recommendationEngineService.generatePersonalizedRecommendations(
    userId,
    {
      limit: 8,
    }
  );

  assert.ok(recommendationsResult.recommendations.length > 0, 'Should return recommendations');
  assert.ok(recommendationsResult.recommendations.length <= 8, 'Should respect limit');

  // Verify ranking: highest scores first
  for (let i = 0; i < recommendationsResult.recommendations.length - 1; i++) {
    const current = recommendationsResult.recommendations[i];
    const next = recommendationsResult.recommendations[i + 1];
    assert.ok(
      current.matchScore >= next.matchScore,
      `Items should be descending by score: ${current.matchScore} >= ${next.matchScore}`
    );
  }

  // Top recommendations should have explainable match reasons
  const topRec = recommendationsResult.recommendations[0];
  assert.ok(topRec.matchScore > 50, 'Top recommendation should have high match score');
  assert.ok(topRec.matchReasons.length > 0, 'Should provide explainable rationale bullets');
  assert.ok(topRec.location.name, 'Recommendation must include destination location');

  // Check circuit recommendations
  assert.ok(
    recommendationsResult.circuitRecommendations.length > 0,
    'Should suggest relevant NATMO circuits'
  );
  const circuitNames = recommendationsResult.circuitRecommendations.map((c) => c.circuitName);
  // User prefers Heritage/North -> Golden Triangle or Desert Triangle should match
  const matchesHeritageNorth = circuitNames.some(
    (name) => name.includes('Golden Triangle') || name.includes('Desert Triangle') || name.includes('Spiritual')
  );
  assert.ok(matchesHeritageNorth, 'Should recommend Northern / Heritage circuits');

  // Verify total recommendations metadata
  assert.ok(
    recommendationsResult.totalRecommendations > 0,
    'Should have positive total recommendations'
  );
});
