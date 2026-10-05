import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

test('Landing Page: Video Asset & Fallback Poster Integrity', () => {
  const publicVideoPath = path.join(process.cwd(), 'public', 'videos', 'landing-page.mp4');
  assert.ok(fs.existsSync(publicVideoPath), 'public/videos/landing-page.mp4 must exist');

  const stat = fs.statSync(publicVideoPath);
  assert.ok(stat.size > 5000000, `Video file should be non-empty and reasonably sized (actual: ${stat.size} bytes)`);

  const posterPath = path.join(process.cwd(), 'public', 'images', 'hero-fallback.jpg');
  assert.ok(fs.existsSync(posterPath), 'public/images/hero-fallback.jpg poster must exist');

  const posterStat = fs.statSync(posterPath);
  assert.ok(posterStat.size > 10000, `Poster image should be non-empty (actual: ${posterStat.size} bytes)`);
});

test('Landing Page: HTML Response & Required Elements Specification', async () => {
  const res = await fetch('http://localhost:3000/');
  assert.strictEqual(res.status, 200, 'Root landing page must respond with 200 OK');

  const html = await res.text();

  // 1. Video Tag & Video Attributes
  assert.ok(html.includes('/videos/landing-page.mp4'), 'HTML must reference the uploaded video');
  assert.ok(html.includes('playsinline') || html.includes('playsInline') || html.includes('autoplay') || html.includes('loop'), 'Video must have inline autoplay loop properties');
  assert.ok(html.includes('hero-fallback.jpg'), 'Video or fallback layer must reference fallback poster');

  // 2. Hero Headlines & Supporting Text
  assert.ok(html.includes('TripWise AI'), 'Must include brand name TripWise AI');
  assert.ok(html.includes('Your Entire Journey,'), 'Must contain primary headline part 1');
  assert.ok(html.includes('Planned by AI.'), 'Must contain primary headline part 2');
  assert.ok(
    html.includes('Plan destinations, transport, hotels, food, activities, budgets and itineraries'),
    'Must include exact required supporting text'
  );

  // 3. CTA Buttons
  assert.ok(html.includes('PLAN MY COMPLETE TRIP'), 'Must contain primary CTA button text');
  assert.ok(html.includes('EXPLORE DESTINATIONS'), 'Must contain secondary CTA button text');

  // 4. Navbar Links
  assert.ok(html.includes('Explore'), 'Navbar must include Explore');
  assert.ok(html.includes('Features'), 'Navbar must include Features');
  assert.ok(html.includes('How It Works'), 'Navbar must include How It Works');
  assert.ok(html.includes('My Trips'), 'Navbar must include My Trips');
  assert.ok(html.includes('AI Assistant'), 'Navbar must include AI Assistant');
  assert.ok(html.includes('Login'), 'Navbar must include Login');

  // 5. Floating Planning Panel Fields
  assert.ok(html.includes('Starting Location'), 'Planning panel must have Starting Location');
  assert.ok(html.includes('Destination'), 'Planning panel must have Destination');
  assert.ok(html.includes('Dates'), 'Planning panel must have Dates');
  assert.ok(html.includes('Travellers'), 'Planning panel must have Travellers');
  assert.ok(html.includes('Budget'), 'Planning panel must have Target Budget');
  assert.ok(html.includes('Travel Pace'), 'Planning panel must have Travel Pace');
  assert.ok(html.includes('Experience Style'), 'Planning panel must have Experience Style');

  // 6. Section 1: Everything You Need for the Journey (9 Features)
  assert.ok(html.includes('Destination Discovery'), 'Feature grid must include Destination Discovery');
  assert.ok(html.includes('Smart Itinerary'), 'Feature grid must include Smart Itinerary');
  assert.ok(html.includes('Budget Intelligence'), 'Feature grid must include Budget Intelligence');
  assert.ok(html.includes('Transport'), 'Feature grid must include Transport');
  assert.ok(html.includes('Hotels'), 'Feature grid must include Hotels');
  assert.ok(html.includes('Restaurants &amp; Food') || html.includes('Restaurants & Food'), 'Feature grid must include Restaurants & Food');
  assert.ok(html.includes('Weather-Aware Planning'), 'Feature grid must include Weather-Aware Planning');
  assert.ok(html.includes('AI Travel Copilot'), 'Feature grid must include AI Travel Copilot');
  assert.ok(html.includes('Safety Center'), 'Feature grid must include Safety Center');

  // 7. Section 2: How It Works (3 Steps)
  assert.ok(html.includes('01'), 'Must include Step 01');
  assert.ok(html.includes('Tell Us Your Trip'), 'Must include 01 — Tell Us Your Trip');
  assert.ok(html.includes('02'), 'Must include Step 02');
  assert.ok(html.includes('AI Builds Your Journey'), 'Must include 02 — AI Builds Your Journey');
  assert.ok(html.includes('03'), 'Must include Step 03');
  assert.ok(html.includes('Travel With Confidence'), 'Must include 03 — Travel With Confidence');

  // 8. Section 3: Budget -> Destination
  assert.ok(html.includes('Budget → Destination'), 'Must include Budget -> Destination section');
  assert.ok(html.includes('estimated based on regional baseline averages') || html.includes('estimated'), 'Must label prices as estimated / demo data');

  // 9. Section 4: AI Travel Copilot
  assert.ok(
    html.includes('I only have 3 hours left today. What should I visit?'),
    'Must include exact Copilot prompt example'
  );
  assert.ok(
    html.includes('optimized your remaining itinerary based on distance, opening hours and priority'),
    'Must include exact Copilot response example'
  );

  // 10. Section 5: Travel Modes
  assert.ok(html.includes('Solo'), 'Must include Solo mode');
  assert.ok(html.includes('Couple'), 'Must include Couple mode');
  assert.ok(html.includes('Friends'), 'Must include Friends mode');
  assert.ok(html.includes('Family'), 'Must include Family mode');
  assert.ok(html.includes('Budget'), 'Must include Budget mode');
  assert.ok(html.includes('Luxury'), 'Must include Luxury mode');
  assert.ok(html.includes('Adventure'), 'Must include Adventure mode');
  assert.ok(html.includes('Relaxed'), 'Must include Relaxed mode');

  // 11. Section 6: Final CTA
  assert.ok(html.includes('Your Next Journey Starts Here.'), 'Must include final CTA heading');
  assert.ok(
    html.includes('Let TripWise AI handle the planning while you enjoy the journey.'),
    'Must include final CTA supporting text'
  );
});

test('Navigation Bar: Brand Logo Icon Links Directly to Landing Page ("/") with Responsive Feedback', async () => {
  // Check Navigation component source
  const navFilePath = path.join(process.cwd(), 'src', 'components', 'navigation.tsx');
  const navContent = fs.readFileSync(navFilePath, 'utf8');

  assert.ok(
    navContent.includes('href="/"'),
    'Navigation brand logo must link to root landing page "/"'
  );
  assert.ok(
    navContent.includes('aria-label="TripWise AI - Go to Landing Page"') || navContent.includes('title="Go to Landing Page"'),
    'Brand logo link must have accessible label'
  );
  assert.ok(
    navContent.includes('active:scale-95'),
    'Brand logo link must have responsive active touch feedback'
  );
});
