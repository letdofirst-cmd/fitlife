/* FitLife: static content + small utilities.
   Loaded first. Everything hangs off window.FitLife. */
(function () {
  'use strict';

  const FL = (window.FitLife = window.FitLife || {});

  /* ---------- utilities ---------- */
  const pad = (n) => String(n).padStart(2, '0');

  // Local calendar day (YYYY-MM-DD). Never use toISOString() for this:
  // it is UTC, so in India sessions logged after midnight IST would land on the wrong day.
  const dayKey = (d) => {
    d = d || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  };
  // Parse a day key at noon so DST shifts can never move it to another date.
  const parseKey = (k) => {
    const p = k.split('-').map(Number);
    return new Date(p[0], p[1] - 1, p[2], 12);
  };
  const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());
  // "shashank soam" -> "Shashank Soam", but leave "McDonald" alone.
  const displayName = (s) => {
    s = String(s || '').trim();
    return s === s.toLowerCase() ? titleCase(s) : s;
  };

  // Whole number that changes at local midnight (not UTC midnight), used to rotate daily suggestions.
  const dayNumber = () => Math.floor(parseKey(dayKey()).getTime() / 86400000);
  // "Vishnu Kumar Singhania" -> "Vishnu S." for places other people can see, like the leaderboard.
  const shortName = (s) => {
    const parts = displayName(s).split(' ').filter(Boolean);
    return parts.length > 1 ? parts[0] + ' ' + parts[parts.length - 1].charAt(0).toUpperCase() + '.' : parts[0] || '';
  };

  FL.util = { pad, dayKey, parseKey, addDays, uid, esc, displayName, dayNumber, shortName };

  /* ---------- lookup lists ---------- */
  const CATEGORIES = [
    { id: 'strength', label: 'Strength' },
    { id: 'cardio', label: 'Cardio' },
    { id: 'desk', label: 'Desk' },
    { id: 'yoga', label: 'Yoga' },
    { id: 'stretch', label: 'Mobility' },
  ];
  const LEVELS = [
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' },
  ];
  const OCCUPATIONS = [
    { id: 'desk', label: 'Office or desk job' },
    { id: 'remote', label: 'Remote or freelance' },
    { id: 'student', label: 'Student' },
    { id: 'onfeet', label: 'On my feet most of the day' },
    { id: 'shift', label: 'Shift or night work' },
    { id: 'home', label: 'Homemaker or caregiver' },
    { id: 'retired', label: 'Retired' },
    { id: 'other', label: 'Something else' },
  ];
  const SEATED = ['desk', 'remote', 'student'];
  const GOALS = [
    { id: 'stay-active', label: 'Stay active' },
    { id: 'lose-weight', label: 'Lose weight' },
    { id: 'build-strength', label: 'Build strength' },
    { id: 'more-energy', label: 'Have more energy' },
    { id: 'less-stress', label: 'Feel less stressed' },
    { id: 'flexibility', label: 'Move more freely' },
  ];
  const ACTIVITY = [
    { id: 'sedentary', label: 'Mostly sitting', f: 1.2 },
    { id: 'light', label: 'Light: walking a few days a week', f: 1.375 },
    { id: 'moderate', label: 'Moderate: exercise 3 to 5 days a week', f: 1.55 },
    { id: 'active', label: 'Very active: daily training or a physical job', f: 1.725 },
  ];
  const DIETS = [
    { id: 'any', label: 'I eat everything', max: 3 },
    { id: 'egg', label: 'Vegetarian + eggs', max: 2 },
    { id: 'veg', label: 'Vegetarian', max: 1 },
    { id: 'vegan', label: 'Vegan', max: 0 },
  ];
  const SEX = [
    { id: '', label: 'Prefer not to say' },
    { id: 'female', label: 'Female' },
    { id: 'male', label: 'Male' },
    { id: 'other', label: 'Other' },
  ];
  const WEIGHT_DIRS = [
    { id: 'lose', label: 'Lose weight gradually' },
    { id: 'maintain', label: 'Maintain weight' },
    { id: 'gain', label: 'Gain weight or muscle' },
  ];

  /* ---------- exercises ---------- */
  const E = (id, name, cat, level, min, pts, icon, focus, steps) => ({
    id, name, cat, level, min, pts, icon, focus, steps: steps.split('|'),
  });

  const EXERCISES = [
    // strength
    E('squats', 'Bodyweight squats', 'strength', 'beginner', 5, 20, '🦵', 'Legs and glutes',
      'Stand with your feet shoulder-width apart|Push your hips back and bend your knees|Keep your chest up and your heels flat|Stand tall by pushing through your heels|Aim for 3 sets of 12'),
    E('wall-pushups', 'Wall push-ups', 'strength', 'beginner', 4, 15, '🧱', 'Chest, shoulders and arms',
      'Stand an arm’s length from a wall|Place your hands on the wall at shoulder height|Bend your elbows to bring your chest toward the wall|Press back to the start|Aim for 3 sets of 10'),
    E('glute-bridge', 'Glute bridges', 'strength', 'beginner', 5, 20, '🌉', 'Glutes, hamstrings and lower back',
      'Lie on your back with knees bent and feet flat|Press through your heels and lift your hips|Squeeze your glutes at the top for 2 seconds|Lower slowly|Aim for 3 sets of 12'),
    E('back-extension', 'Back extensions', 'strength', 'beginner', 4, 15, '🦸', 'Lower back and glutes',
      'Lie face down with your arms extended|Lift your arms, chest and legs slightly off the floor|Hold for 2 seconds|Lower slowly|Aim for 3 sets of 10'),
    E('lunges', 'Alternating lunges', 'strength', 'beginner', 6, 25, '🚶', 'Legs and balance',
      'Step forward and lower until both knees are near 90 degrees|Keep your front knee over your ankle|Push back to standing|Switch legs|Aim for 3 sets of 10 per leg'),
    E('pushups', 'Push-ups', 'strength', 'intermediate', 5, 25, '💪', 'Chest, shoulders, triceps and core',
      'Start in a high plank with your hands under your shoulders|Keep your body in a straight line|Lower your chest to just above the floor|Press back up|Drop to your knees if you need to. Aim for 3 sets of 8 to 12'),
    E('plank', 'Plank holds', 'strength', 'intermediate', 4, 20, '🪵', 'Core and shoulders',
      'Rest on your forearms with your elbows under your shoulders|Lift your hips so your body forms a straight line|Brace your core and keep breathing|Hold for 30 seconds, rest for 30, and repeat'),

    // cardio
    E('brisk-walk', 'Brisk walk', 'cardio', 'beginner', 15, 30, '👟', 'Heart and legs',
      'Walk at a pace where you can talk but not sing|Swing your arms and keep your shoulders relaxed|Look ahead, not down|Keep the pace steady for the full time'),
    E('jumping-jacks', 'Jumping jacks', 'cardio', 'beginner', 5, 25, '⭐', 'Full-body warm-up',
      'Stand with your feet together and arms at your sides|Jump your feet wide while raising your arms overhead|Jump back to the start|Keep a steady rhythm, or step instead of jumping for low impact'),
    E('shadow-boxing', 'Shadow boxing', 'cardio', 'beginner', 6, 30, '🥊', 'Shoulders, core and heart',
      'Stand with your feet shoulder-width apart and knees soft|Throw jabs and crosses at a steady tempo|Add a slip or a step side to side|Keep your hands up and breathe out with each punch'),
    E('high-knees', 'High knees', 'cardio', 'intermediate', 4, 25, '🏃', 'Heart, hip flexors and core',
      'Stand tall with your feet hip-width apart|Drive one knee up to hip height|Switch quickly, pumping your arms|Land softly on the balls of your feet|Go 30 seconds on, 30 seconds off'),
    E('stair-climb', 'Stair climb', 'cardio', 'intermediate', 8, 35, '🪜', 'Legs and heart',
      'Find a flight of stairs|Climb at a steady pace, placing your whole foot on each step|Walk down slowly|Hold the rail if you need it|Repeat for the full time'),
    E('skipping', 'Skipping rope', 'cardio', 'intermediate', 8, 40, '🪢', 'Calves, shoulders and heart',
      'Hold the handles at hip height|Turn the rope with your wrists, not your arms|Jump just high enough to clear the rope|Land softly and rest when your form slips'),

    // desk
    E('neck-rolls', 'Neck rolls', 'desk', 'beginner', 2, 10, '🙆', 'Neck and upper shoulders',
      'Sit tall with your shoulders relaxed|Drop your right ear toward your right shoulder for 15 seconds|Switch sides|Slowly roll your chin toward your chest and side to side. Never force the movement'),
    E('shoulder-rolls', 'Shoulder rolls', 'desk', 'beginner', 2, 10, '🔄', 'Shoulders and upper back',
      'Sit or stand tall|Lift your shoulders toward your ears|Roll them back and down in a slow circle|Do 10 backward, then 10 forward'),
    E('wrist-stretch', 'Wrist and finger stretch', 'desk', 'beginner', 2, 10, '🤲', 'Wrists, forearms and fingers',
      'Extend one arm with the palm up|Gently pull your fingers back with your other hand for 15 seconds|Flip your palm down and press the hand toward you|Switch arms'),
    E('seated-twist', 'Seated spinal twist', 'desk', 'beginner', 3, 10, '🌀', 'Spine and sides of the waist',
      'Sit tall with both feet on the floor|Place your right hand on your left knee|Rotate your torso to the left and look over your shoulder|Hold for 20 seconds, breathe, then switch sides'),
    E('chair-squats', 'Chair squats', 'desk', 'beginner', 3, 15, '🪑', 'Legs and glutes',
      'Stand in front of your chair with your feet hip-width apart|Lower your hips until you lightly touch the seat|Stand back up without using your hands|Do 2 sets of 10'),
    E('desk-pushups', 'Desk push-ups', 'desk', 'beginner', 3, 15, '🖥️', 'Chest, arms and core',
      'Place your hands on the edge of a sturdy desk|Step back until your body is in a straight line|Lower your chest toward the desk, then press away|Do 2 sets of 10'),
    E('eye-reset', '20-20-20 eye reset', 'desk', 'beginner', 2, 10, '👀', 'Eyes',
      'Look at something about 20 feet (6 m) away|Hold your gaze for 20 seconds|Blink slowly 10 times|Close your eyes and take three deep breaths'),
    E('calf-raises', 'Standing calf raises', 'desk', 'beginner', 2, 10, '🦶', 'Calves and ankles',
      'Stand behind your chair with your hands on the back for balance|Rise onto your toes|Pause for a second at the top|Lower slowly and do 3 sets of 15'),

    // yoga
    E('sun-salutation', 'Sun salutation', 'yoga', 'beginner', 8, 30, '🌅', 'Whole body',
      'Stand tall with your palms together at your chest|Inhale and reach your arms overhead|Exhale and fold forward|Step back to plank, lower down, then lift into cobra|Push back to downward dog, walk your feet forward, and rise|Repeat for 5 rounds at your own pace'),
    E('child-pose', 'Child’s pose', 'yoga', 'beginner', 4, 15, '🧎', 'Back, hips and shoulders',
      'Kneel with your big toes touching and knees apart|Sit your hips back toward your heels|Stretch your arms forward and rest your forehead down|Breathe slowly for 1 to 2 minutes'),
    E('cat-cow', 'Cat-cow flow', 'yoga', 'beginner', 4, 15, '🐈', 'Spine and core',
      'Start on your hands and knees|Inhale, drop your belly and lift your chest (cow)|Exhale and round your spine toward the ceiling (cat)|Move slowly with your breath for 10 rounds'),
    E('down-dog', 'Downward dog flow', 'yoga', 'beginner', 5, 20, '🐕', 'Hamstrings, shoulders and spine',
      'Start on your hands and knees|Tuck your toes and lift your hips up and back|Press the floor away and lengthen your spine|Bend your knees if your hamstrings feel tight|Hold for 5 breaths, rest, and repeat'),
    E('warrior', 'Warrior sequence', 'yoga', 'intermediate', 8, 30, '🏹', 'Legs, hips and balance',
      'Step one foot back into a long stance with the back foot turned out|Bend your front knee and raise your arms (Warrior I)|Open your hips and arms to the side (Warrior II)|Hold each for 5 breaths, then switch sides'),
    E('box-breathing', 'Box breathing', 'yoga', 'beginner', 4, 15, '🌬️', 'Calm and focus',
      'Sit comfortably with a tall spine|Inhale through your nose for 4 counts|Hold for 4 counts|Exhale slowly for 4 counts|Hold empty for 4 counts and repeat'),

    // mobility
    E('hip-opener', 'Hip opener stretch', 'stretch', 'beginner', 5, 15, '🦋', 'Hips and inner thighs',
      'Sit with the soles of your feet together|Hold your ankles and sit tall|Gently press your knees toward the floor|Hold for 30 seconds, breathing slowly'),
    E('hamstring', 'Hamstring stretch', 'stretch', 'beginner', 4, 15, '🦿', 'Back of the legs',
      'Sit with one leg extended and the other foot against your thigh|Hinge forward from your hips with a flat back|Hold for 30 seconds at a mild stretch|Switch legs'),
    E('full-body-stretch', 'Full-body stretch', 'stretch', 'beginner', 8, 20, '🤸', 'Whole body',
      'Reach your arms overhead and lengthen your body|Fold forward and let your head hang|Roll up slowly, one vertebra at a time|Clasp your hands behind you and open your chest|Finish with a side bend each way'),
    E('thoracic', 'Upper-back opener', 'stretch', 'beginner', 4, 15, '🔓', 'Upper back and chest',
      'Sit or kneel and place your hands behind your head|Gently arch upward, opening your chest|Rotate your elbows from side to side|Do 10 slow reps'),
  ];

  /* ---------- weekly plans (Monday first) ---------- */
  const REST = { t: 'Rest day', ex: [] };
  const PLANS = [
    {
      id: 'kickstart', name: '7-Day Kickstart', level: 'beginner',
      blurb: 'Gentle, varied days to build the habit.',
      days: [
        { t: 'Walk and stretch', ex: ['brisk-walk', 'full-body-stretch'] },
        { t: 'Lower body basics', ex: ['squats', 'glute-bridge'] },
        { t: 'Breathe and reset', ex: ['box-breathing', 'cat-cow'] },
        { t: 'Cardio burst', ex: ['jumping-jacks', 'shadow-boxing'] },
        { t: 'Upper body basics', ex: ['wall-pushups', 'plank'] },
        { t: 'Easy flow', ex: ['sun-salutation'] },
        REST,
      ],
    },
    {
      id: 'desk-reset', name: 'Desk Reset', level: 'beginner',
      blurb: 'Short breaks for people who sit most of the day.',
      days: [
        { t: 'Neck and shoulders', ex: ['neck-rolls', 'shoulder-rolls', 'eye-reset'] },
        { t: 'Wake up your legs', ex: ['chair-squats', 'calf-raises'] },
        { t: 'Wrists and back', ex: ['wrist-stretch', 'seated-twist', 'thoracic'] },
        { t: 'Desk strength', ex: ['desk-pushups', 'chair-squats'] },
        { t: 'Hips and hamstrings', ex: ['hip-opener', 'hamstring'] },
        { t: 'Walk it out', ex: ['brisk-walk'] },
        REST,
      ],
    },
    {
      id: 'home-strength', name: 'Home Strength', level: 'intermediate',
      blurb: 'Strength work with no equipment needed.',
      days: [
        { t: 'Push and core', ex: ['pushups', 'plank'] },
        { t: 'Legs', ex: ['squats', 'lunges', 'glute-bridge'] },
        { t: 'Active recovery', ex: ['brisk-walk', 'full-body-stretch'] },
        { t: 'Full body', ex: ['pushups', 'lunges', 'back-extension'] },
        { t: 'Cardio finisher', ex: ['high-knees', 'skipping'] },
        { t: 'Mobility', ex: ['down-dog', 'hip-opener'] },
        REST,
      ],
    },
    {
      id: 'calm-flexible', name: 'Calm and Flexible', level: 'beginner',
      blurb: 'Yoga and breathing for stress and stiffness.',
      days: [
        { t: 'Gentle flow', ex: ['cat-cow', 'child-pose'] },
        { t: 'Breath and focus', ex: ['box-breathing', 'thoracic'] },
        { t: 'Sun salutations', ex: ['sun-salutation'] },
        { t: 'Hips open', ex: ['hip-opener', 'down-dog'] },
        { t: 'Balance', ex: ['warrior', 'box-breathing'] },
        { t: 'Full-body release', ex: ['full-body-stretch', 'child-pose'] },
        REST,
      ],
    },
  ];

  /* ---------- meal ideas ----------
     t: 0 vegan, 1 vegetarian, 2 contains egg, 3 contains meat or fish. k: approx kcal. */
  const M = (n, k, t) => ({ n, k, t });
  const MEALS = {
    breakfast: [
      M('Vegetable poha with peanuts', 320, 0),
      M('Besan chilla with mint chutney', 300, 0),
      M('Moong dal cheela with tomato', 280, 0),
      M('Peanut butter banana toast', 340, 0),
      M('Oats with banana and nuts', 350, 1),
      M('Greek yogurt bowl with berries and seeds', 300, 1),
      M('Masala omelette with 2 multigrain toasts', 380, 2),
      M('Scrambled eggs with spinach and toast', 360, 2),
      M('Chicken and veggie wrap', 420, 3),
    ],
    lunch: [
      M('Dal, brown rice and sabzi with salad', 520, 0),
      M('Chickpea and quinoa salad bowl', 480, 0),
      M('Tofu stir-fry with noodles', 480, 0),
      M('Rajma with rice and cucumber raita', 540, 1),
      M('Paneer tikka wrap with salad', 500, 1),
      M('Egg curry with 2 rotis and salad', 520, 2),
      M('Grilled chicken, rice and vegetables', 550, 3),
      M('Fish curry with rice and greens', 540, 3),
    ],
    snack: [
      M('Roasted chana and a piece of fruit', 180, 0),
      M('Handful of almonds and walnuts', 170, 0),
      M('Sprouts chaat', 160, 0),
      M('Roasted makhana', 130, 0),
      M('Apple slices with peanut butter', 220, 0),
      M('Curd with cucumber', 120, 1),
      M('2 boiled eggs', 150, 2),
    ],
    dinner: [
      M('Mixed vegetable soup, roti and dal', 420, 0),
      M('Lentil soup with grilled tofu salad', 400, 0),
      M('Vegetable stir-fry with brown rice', 430, 0),
      M('Vegetable khichdi with curd', 430, 1),
      M('Palak paneer with 2 rotis', 480, 1),
      M('Egg bhurji with roti and salad', 430, 2),
      M('Grilled fish with sautéed vegetables', 450, 3),
      M('Chicken curry with 2 rotis', 520, 3),
    ],
  };
  const SLOTS = [
    { id: 'breakfast', label: 'Breakfast' },
    { id: 'lunch', label: 'Lunch' },
    { id: 'snack', label: 'Snack' },
    { id: 'dinner', label: 'Dinner' },
  ];

  /* ---------- badges: unlocked when metrics[metric] >= target ---------- */
  const BADGES = [
    { id: 'first-step', icon: '🌱', name: 'First Step', desc: 'Complete your first session', metric: 'sessions', target: 1 },
    { id: 'desk-hero', icon: '🪑', name: 'Desk Break Hero', desc: 'Complete 10 desk sessions', metric: 'deskSessions', target: 10 },
    { id: 'yoga-beginner', icon: '🧘', name: 'Yoga Beginner', desc: 'Complete 5 yoga sessions', metric: 'yogaSessions', target: 5 },
    { id: 'streak-7', icon: '🔥', name: '7-Day Streak', desc: 'Move on 7 days in a row', metric: 'longestStreak', target: 7 },
    { id: 'consistency', icon: '⚡', name: 'Consistency King', desc: 'Complete 30 sessions', metric: 'sessions', target: 30 },
    { id: 'athlete', icon: '🏅', name: 'Active Athlete', desc: 'Earn 500 points', metric: 'points', target: 500 },
    { id: 'champion', icon: '🏆', name: 'Champion', desc: 'Earn 1,000 points', metric: 'points', target: 1000 },
    { id: 'nutrition', icon: '🥗', name: 'Nutrition Starter', desc: 'Save your first meal plan', metric: 'mealPlans', target: 1 },
    { id: 'hydration', icon: '💧', name: 'Hydration Habit', desc: 'Log water on 7 different days', metric: 'hydrationDays', target: 7 },
  ];

  /* ---------- guided routines: exercises played back to back ---------- */
  const ROUTINES = [
    { id: 'quick-desk', name: 'Quick desk reset', cat: 'desk', blurb: 'Neck, wrists and eyes without leaving your chair.', ex: ['neck-rolls', 'wrist-stretch', 'eye-reset'] },
    { id: 'posture-fix', name: 'Posture fix', cat: 'desk', blurb: 'Undo hours of hunching.', ex: ['shoulder-rolls', 'seated-twist', 'thoracic'] },
    { id: 'sitting-legs', name: 'Long-sitting legs', cat: 'desk', blurb: 'Wake your legs up after a long sit.', ex: ['chair-squats', 'calf-raises', 'hip-opener'] },
    { id: 'morning-flow', name: 'Morning flow', cat: 'yoga', blurb: 'A gentle start to the day.', ex: ['cat-cow', 'child-pose', 'sun-salutation'] },
    { id: 'evening-unwind', name: 'Evening unwind', cat: 'yoga', blurb: 'Slow down before bed.', ex: ['box-breathing', 'child-pose', 'hip-opener'] },
    { id: 'cardio-burst', name: 'Cardio burst', cat: 'cardio', blurb: 'Get your heart rate up fast.', ex: ['jumping-jacks', 'high-knees', 'shadow-boxing'] },
    { id: 'no-gear-strength', name: 'No-gear strength', cat: 'strength', blurb: 'Legs, glutes and arms with no equipment.', ex: ['squats', 'glute-bridge', 'wall-pushups'] },
  ];

  /* ---------- copy ---------- */
  const TIPS = [
    'Breaking up long sitting with a couple of minutes of movement every hour is kind to your back and your energy.',
    'Pair a new habit with an old one: stretch while the kettle boils or the laptop starts up.',
    'A 10-minute walk after a meal is one of the easiest habits to keep.',
    'If you have 5 minutes, you have a workout. Short sessions still count toward your streak.',
    'Sleep is training too. Aim for a consistent bedtime before adding more exercise.',
    'Drink a glass of water when you wake up. It is a simple cue for the rest of the day.',
    'Soreness is normal; sharp pain is not. Stop and rest if something hurts.',
    'Track minutes, not perfection. A missed day is only a problem if it becomes two.',
    'Protein at each meal helps recovery and keeps you full for longer.',
    'A minute of slow breathing can help you feel calmer.',
  ];
  const NUDGES = [
    '🪑 Been sitting a while? Stand up and stretch for two minutes.',
    '💧 A glass of water now beats a coffee later.',
    '🚶 A 10-minute walk counts. Start there.',
    '🌬️ Three slow breaths can reset a stressful moment.',
    '👀 Look away from your screen for 20 seconds.',
    '🔥 Small sessions add up. Show up today.',
  ];

  FL.data = {
    APP_NAME: 'FitLife',
    WEEKLY_GOAL_MIN: 150, // WHO guideline for adults: 150 minutes of moderate activity per week
    CATEGORIES, LEVELS, OCCUPATIONS, SEATED, GOALS, ACTIVITY, DIETS, SEX, WEIGHT_DIRS,
    EXERCISES, PLANS, ROUTINES, MEALS, SLOTS, BADGES, TIPS, NUDGES,
  };
})();
