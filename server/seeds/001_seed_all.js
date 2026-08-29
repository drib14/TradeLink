const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Truncate tables in reverse dependency order
  const tables = [
    'review_badges', 'reviews', 'favorites', 'notifications', 'messages',
    'conversation_read_status', 'conversations', 'meetup_transactions',
    'swap_offers', 'wanted_requests', 'listing_tags', 'listing_images',
    'listings', 'verification_requests', 'flagged_listings', 'trade_disputes',
    'announcements', 'admin_audit_logs', 'prohibited_keywords',
    'feature_flags', 'system_config', 'users'
  ];

  await knex.raw('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of tables) {
    await knex(table).truncate();
  }
  await knex.raw('SET FOREIGN_KEY_CHECKS = 1');

  // Password hashes
  const superadminHash = await bcrypt.hash('superadmin123', 12);
  const adminHash = await bcrypt.hash('admin123', 12);
  const studentHash = await bcrypt.hash('password123', 12);

  // 1. Seed Users
  await knex('users').insert([
    {
      id: 'user-superadmin',
      name: 'UC Super Administrator',
      email: 'superadmin@uc.edu.ph',
      student_id: 'UC-SA-2024',
      password_hash: superadminHash,
      role: 'admin',
      campus: 'UC Main',
      college: 'CCS',
      year_level: 'System Administrator',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
      is_verified: true,
      id_photo_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      trust_score: 100,
      rating: 5.0,
      total_reviews: 0,
      completed_trades: 0,
      punctuality_rate: 100,
      bio: 'TradeLink Platform Super Administrator. Full system access across all UC campuses.',
      is_pro_merchant: false,
      is_banned: false
    },
    {
      id: 'user-admin',
      name: 'UC Admin Moderator',
      email: 'admin@uc.edu.ph',
      student_id: 'UC-ADM-2024',
      password_hash: adminHash,
      role: 'admin',
      campus: 'UC Main',
      college: 'CCS',
      year_level: 'Faculty / Staff',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      is_verified: true,
      id_photo_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      trust_score: 100,
      rating: 5.0,
      total_reviews: 88,
      completed_trades: 120,
      punctuality_rate: 100,
      bio: 'Official TradeLink Campus Moderation & Safety Desk. Verified student marketplace.',
      is_pro_merchant: false,
      is_banned: false
    },
    {
      id: 'user-maria',
      name: 'Maria Santos',
      email: 'maria.nursing@uc.edu.ph',
      student_id: '202104982',
      password_hash: studentHash,
      role: 'student',
      campus: 'UC Banilad',
      college: 'Nursing',
      year_level: '4th Year (Senior)',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
      is_verified: true,
      id_photo_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      trust_score: 98,
      rating: 4.9,
      total_reviews: 24,
      completed_trades: 32,
      punctuality_rate: 96,
      bio: 'Senior BSN student at Banilad. Selling gadgets, textbooks, scrubs, and study gear.',
      is_pro_merchant: true,
      is_banned: false
    },
    {
      id: 'user-ken',
      name: 'Kenzo Lim',
      email: 'ken.engg@uc.edu.ph',
      student_id: '202211045',
      password_hash: studentHash,
      role: 'student',
      campus: 'UC LM',
      college: 'Engineering',
      year_level: '3rd Year',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      is_verified: true,
      id_photo_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      trust_score: 94,
      rating: 4.8,
      total_reviews: 18,
      completed_trades: 22,
      punctuality_rate: 95,
      bio: 'Mechanical Engineering student at Lapu-Lapu Mandaue. Drafting tools & calculators.',
      is_pro_merchant: false,
      is_banned: false
    },
    {
      id: 'user-alex',
      name: 'Alex Rivera',
      email: 'alex.stem@uc.edu.ph',
      student_id: '202300189',
      password_hash: studentHash,
      role: 'student',
      campus: 'UC Main',
      college: 'Senior High (STEM)',
      year_level: 'Grade 12',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80',
      is_verified: true,
      id_photo_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      trust_score: 90,
      rating: 4.7,
      total_reviews: 9,
      completed_trades: 14,
      punctuality_rate: 92,
      bio: 'STEM 12 student at UC Main. Textbook recycler & calculator bartering.',
      is_pro_merchant: false,
      is_banned: false
    },
    {
      id: 'user-beatrice',
      name: 'Beatrice Tan',
      email: 'beatrice.maritime@uc.edu.ph',
      student_id: '202209432',
      password_hash: studentHash,
      role: 'student',
      campus: 'UC METC',
      college: 'Maritime',
      year_level: '3rd Year',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
      is_verified: true,
      id_photo_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      trust_score: 96,
      rating: 5.0,
      total_reviews: 15,
      completed_trades: 19,
      punctuality_rate: 100,
      bio: 'BS Marine Transportation student at UC METC. Type-A uniforms and plotting charts.',
      is_pro_merchant: true,
      is_banned: false
    },
    {
      id: 'user-dave',
      name: 'Dave Alcantara',
      email: 'dave.ccs@uc.edu.ph',
      student_id: '202100876',
      password_hash: studentHash,
      role: 'student',
      campus: 'UC Main',
      college: 'CCS',
      year_level: '4th Year (Senior)',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
      is_verified: true,
      id_photo_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      trust_score: 88,
      rating: 4.6,
      total_reviews: 12,
      completed_trades: 16,
      punctuality_rate: 90,
      bio: 'BS Computer Science student at UC Main. Tech gear, peripherals, and code books.',
      is_pro_merchant: false,
      is_banned: false
    },
    {
      id: 'user-chloe',
      name: 'Chloe Mendoza',
      email: 'chloe.cba@uc.edu.ph',
      student_id: '202305521',
      password_hash: studentHash,
      role: 'student',
      campus: 'UC South Campus',
      college: 'CBA',
      year_level: '2nd Year',
      avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
      is_verified: false,
      id_photo_url: null,
      trust_score: 75,
      rating: 4.5,
      total_reviews: 5,
      completed_trades: 6,
      punctuality_rate: 85,
      bio: 'BSBA Accountancy student at UC South. Business calculators & ledgers.',
      is_pro_merchant: false,
      is_banned: false
    }
  ]);

  // 2. Seed Listings
  await knex('listings').insert([
    {
      id: 'list-1',
      title: 'Casio Scientific Calculator FX-991ES Plus-2 (Authentic with Slide Cover)',
      description: 'Lightly used for 2 semesters of Differential Calculus and Stat. 100% working solar + battery cells, clean buttons, crisp LCD screen.',
      price: 750.00,
      original_srp: 1450.00,
      trade_mode: 'buy_sell',
      swap_preference: null,
      category: 'Electronics',
      condition: 'Like New',
      seller_id: 'user-ken',
      preferred_meetup_spots: JSON.stringify(['Gate 1 Guardhouse (Main Entrance)', 'CCS Lobby & Bulletin Desk']),
      is_boosted: true,
      is_sold: false,
      course_code: 'MATH101',
      views: 142,
      favorites_count: 28
    },
    {
      id: 'list-2',
      title: 'UC Nursing Duty Scrubs (Size M, Navy Blue) + Free UC Scrub Cap',
      description: 'Original Banilad clinical duty scrub set. Worn only 3 times during hospital orientation rotations. Crisp fabric with embroidered UC banilad college seal.',
      price: 450.00,
      original_srp: 950.00,
      trade_mode: 'buy_sell',
      swap_preference: null,
      category: 'Uniforms & Gear',
      condition: 'Like New',
      seller_id: 'user-maria',
      preferred_meetup_spots: JSON.stringify(['Hospital Gate 2 (Gov. Cuenco Ave.)', 'Nursing Simulation Lab Entrance']),
      is_boosted: true,
      is_sold: false,
      course_code: 'NURS210',
      views: 89,
      favorites_count: 14
    },
    {
      id: 'list-3',
      title: 'Engineering Graphics & Drawing Technical T-Square 36" (Rotring Acrylic)',
      description: 'Heavy-duty 36-inch transparent acrylic T-square with beveled edge. Free template set included.',
      price: 350.00,
      original_srp: 850.00,
      trade_mode: 'swap',
      swap_preference: 'Casio 991CW or Engineering Mechanics textbook',
      category: 'Instruments & Tools',
      condition: 'Gently Used',
      seller_id: 'user-ken',
      preferred_meetup_spots: JSON.stringify(['Innovation Building Lobby', 'Mandaue Bridge Gate']),
      is_boosted: false,
      is_sold: false,
      course_code: 'ENGG102',
      views: 64,
      favorites_count: 9
    },
    {
      id: 'list-4',
      title: 'Senior High STEM Rex General Physics 1 & 2 Textbook Set (Complete Edition)',
      description: 'Both Grade 12 volumes. High-yield highlighted formulas, no missing pages, plastic covered.',
      price: 480.00,
      original_srp: 1200.00,
      trade_mode: 'buy_sell',
      swap_preference: null,
      category: 'Textbooks & Books',
      condition: 'Gently Used',
      seller_id: 'user-alex',
      preferred_meetup_spots: JSON.stringify(['Gate 1 Guardhouse (Main Entrance)', 'Covered Court & Bleachers']),
      is_boosted: false,
      is_sold: false,
      course_code: 'STEM-PHYS',
      views: 112,
      favorites_count: 19
    },
    {
      id: 'list-5',
      title: 'UC Maritime Deck Cadet Uniform Long Sleeve (Epaulets & Gold Buttons)',
      description: 'Complete METC deck cadet dress uniform size Large. High quality twill, complete epaulets and gold insignia buttons.',
      price: 850.00,
      original_srp: 1800.00,
      trade_mode: 'buy_sell',
      swap_preference: null,
      category: 'Uniforms & Gear',
      condition: 'Like New',
      seller_id: 'user-beatrice',
      preferred_meetup_spots: JSON.stringify(['Canteen & Student Pavilion', 'Registrar Lobby']),
      is_boosted: false,
      is_sold: false,
      course_code: 'MARITIME',
      views: 45,
      favorites_count: 7
    },
    {
      id: 'list-6',
      title: 'Donation: 1st Year CCS Programming Notes & Java Binder (Clean Copy)',
      description: 'Free textbook and reviewer handouts for incoming freshmen in Java Programming / CS111. Happy to pass to the next batch.',
      price: 0.00,
      original_srp: 300.00,
      trade_mode: 'free_donation',
      swap_preference: null,
      category: 'Textbooks & Books',
      condition: 'Gently Used',
      seller_id: 'user-dave',
      preferred_meetup_spots: JSON.stringify(['CCS Lobby & Bulletin Desk', 'Gate 1 Guardhouse (Main Entrance)']),
      is_boosted: false,
      is_sold: false,
      course_code: 'CS111',
      views: 204,
      favorites_count: 34
    }
  ]);

  // 3. Seed Images
  await knex('listing_images').insert([
    { id: 'img-1', listing_id: 'list-1', image_url: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80', sort_order: 0 },
    { id: 'img-2', listing_id: 'list-2', image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80', sort_order: 0 },
    { id: 'img-3', listing_id: 'list-3', image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80', sort_order: 0 },
    { id: 'img-4', listing_id: 'list-4', image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80', sort_order: 0 },
    { id: 'img-5', listing_id: 'list-5', image_url: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80', sort_order: 0 },
    { id: 'img-6', listing_id: 'list-6', image_url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=800&q=80', sort_order: 0 }
  ]);

  // 4. Seed Tags
  await knex('listing_tags').insert([
    { id: 'tag-1', listing_id: 'list-1', tag: 'Casio' },
    { id: 'tag-2', listing_id: 'list-1', tag: 'Calculator' },
    { id: 'tag-3', listing_id: 'list-1', tag: 'Math' },
    { id: 'tag-4', listing_id: 'list-2', tag: 'Scrubs' },
    { id: 'tag-5', listing_id: 'list-2', tag: 'Nursing' },
    { id: 'tag-6', listing_id: 'list-2', tag: 'Uniform' },
    { id: 'tag-7', listing_id: 'list-3', tag: 'Drafting' },
    { id: 'tag-8', listing_id: 'list-3', tag: 'T-Square' },
    { id: 'tag-9', listing_id: 'list-3', tag: 'Engineering' },
    { id: 'tag-10', listing_id: 'list-4', tag: 'STEM' },
    { id: 'tag-11', listing_id: 'list-4', tag: 'Physics' },
    { id: 'tag-12', listing_id: 'list-4', tag: 'Textbook' },
    { id: 'tag-13', listing_id: 'list-5', tag: 'Maritime' },
    { id: 'tag-14', listing_id: 'list-5', tag: 'Uniform' },
    { id: 'tag-15', listing_id: 'list-6', tag: 'Freshman' },
    { id: 'tag-16', listing_id: 'list-6', tag: 'Free' },
    { id: 'tag-17', listing_id: 'list-6', tag: 'Java' }
  ]);

  // 5. Seed Conversations & Messages
  await knex('conversations').insert([
    {
      id: 'conv-1',
      listing_id: 'list-1',
      participant_a: 'user-alex',
      participant_b: 'user-ken',
      last_message: 'Yes Alex, still available! Crisp condition with sliding cover.',
      last_message_at: new Date()
    }
  ]);

  await knex('conversation_read_status').insert([
    { conversation_id: 'conv-1', user_id: 'user-alex', unread_count: 0, last_read_at: new Date() },
    { conversation_id: 'conv-1', user_id: 'user-ken', unread_count: 0, last_read_at: new Date() }
  ]);

  await knex('messages').insert([
    {
      id: 'msg-1',
      conversation_id: 'conv-1',
      sender_id: 'user-alex',
      receiver_id: 'user-ken',
      content: 'Hi Kenzo! Is the Casio 991ES Plus still available for meetup at UC LM?',
      is_system_message: false,
      created_at: new Date(Date.now() - 3600000)
    },
    {
      id: 'msg-2',
      conversation_id: 'conv-1',
      sender_id: 'user-ken',
      receiver_id: 'user-alex',
      content: 'Yes Alex, still available! Crisp condition with sliding cover.',
      is_system_message: false,
      created_at: new Date(Date.now() - 3000000)
    }
  ]);

  // 6. Seed Swap Offers
  await knex('swap_offers').insert([
    {
      id: 'swap-1',
      target_listing_id: 'list-3',
      target_seller_id: 'user-ken',
      offerer_id: 'user-alex',
      offered_listing_id: 'list-4',
      offered_description: 'Offering Senior High STEM Rex General Physics Set in pristine condition',
      cash_top_up: 50.00,
      status: 'pending',
      proposed_meetup_spot: 'Gate 1 Guardhouse (Main Entrance)',
      proposed_datetime: 'Tomorrow at 2:00 PM'
    }
  ]);

  // 7. Seed Meetups
  const codeHash = await bcrypt.hash('8421', 10);
  await knex('meetup_transactions').insert([
    {
      id: 'meet-1',
      listing_id: 'list-1',
      seller_id: 'user-ken',
      buyer_id: 'user-alex',
      trade_mode: 'buy_sell',
      final_price: 750.00,
      campus: 'UC LM',
      landmark_spot: 'Gate 1 Guardhouse (Main Entrance)',
      scheduled_datetime: 'Tomorrow at 10:30 AM',
      verification_code_hash: codeHash,
      plain_verification_code: '8421',
      status: 'scheduled',
      notes: 'Meeting right next to the campus safety booth'
    }
  ]);

  // 8. Seed Wanted Requests
  await knex('wanted_requests').insert([
    {
      id: 'req-1',
      requester_id: 'user-alex',
      item_title: 'Rex Grade 11 STEM Pre-Calculus Textbook (Latest Edition)',
      category: 'Textbooks',
      target_budget: 350.00,
      urgency: 'Immediate / Urgent',
      description: 'Looking for a clean copy of the Grade 11 Pre-Cal book with no missing pages for our upcoming prelim exam.',
      preferred_campus: 'UC Main',
      status: 'open',
      offers_count: 2
    },
    {
      id: 'req-2',
      requester_id: 'user-maria',
      item_title: 'Littmann Classic III Stethoscope (Navy Blue / Black)',
      category: 'Uniforms & Gear',
      target_budget: 2800.00,
      urgency: 'This Week',
      description: 'Looking for a genuine Littmann stethoscope in good working condition for clinical duty at Banilad hospital.',
      preferred_campus: 'UC Banilad',
      status: 'open',
      offers_count: 4
    },
    {
      id: 'req-3',
      requester_id: 'user-ken',
      item_title: 'Rotring Drafting Board A3 / Technical T-Square Set',
      category: 'Instruments',
      target_budget: 900.00,
      urgency: 'This Week',
      description: 'Need complete drafting tools for 2nd year Engineering drawing subject. Can meet at UC LM Innovation lobby.',
      preferred_campus: 'UC LM',
      status: 'open',
      offers_count: 1
    },
    {
      id: 'req-4',
      requester_id: 'user-beatrice',
      item_title: 'Casio fx-991CW ClassWiz Scientific Calculator',
      category: 'Electronics',
      target_budget: 950.00,
      urgency: 'Immediate / Urgent',
      description: 'Looking for Casio 991CW with hard slide cover for maritime navigation calculations.',
      preferred_campus: 'UC METC',
      status: 'open',
      offers_count: 3
    }
  ]);

  // 9. Seed Reviews
  await knex('reviews').insert([
    {
      id: 'rev-1',
      transaction_id: 'meet-1',
      reviewer_id: 'user-alex',
      target_user_id: 'user-ken',
      rating: 5,
      comment: 'Super legit seller! Met right at UC LM guardhouse on time. The calculator looks brand new.',
      item_title: 'Casio Scientific Calculator FX-991ES Plus-2',
      trade_type: 'buy_sell',
      was_punctual: true
    }
  ]);

  await knex('review_badges').insert([
    { id: 'rb-1', review_id: 'rev-1', badge: 'Punctual' },
    { id: 'rb-2', review_id: 'rev-1', badge: 'Accurate Description' },
    { id: 'rb-3', review_id: 'rev-1', badge: 'Safe Meetup' }
  ]);

  // 10. Seed Favorites
  await knex('favorites').insert([
    { user_id: 'user-alex', listing_id: 'list-1' },
    { user_id: 'user-alex', listing_id: 'list-2' },
    { user_id: 'user-maria', listing_id: 'list-1' }
  ]);

  // 11. Seed Notifications
  await knex('notifications').insert([
    {
      id: 'notif-1',
      user_id: 'user-alex',
      title: 'Meetup Scheduled',
      message: 'Your meetup with Kenzo Lim for Casio FX-991ES is set for tomorrow 10:30 AM.',
      type: 'meetup',
      is_read: false,
      link_view: 'meetups',
      link_params: JSON.stringify({ meetupId: 'meet-1' })
    },
    {
      id: 'notif-2',
      user_id: 'user-ken',
      title: 'New Swap Offer',
      message: 'Alex Rivera sent a swap proposal for your T-Square.',
      type: 'swap',
      is_read: true,
      link_view: 'swaps',
      link_params: JSON.stringify({ swapId: 'swap-1' })
    }
  ]);

  // 12. Seed Verification Requests
  await knex('verification_requests').insert([
    {
      id: 'verif-1',
      user_id: 'user-chloe',
      student_id_number: '202305521',
      campus: 'UC South Campus',
      college: 'CBA',
      id_card_image_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
      status: 'pending'
    }
  ]);

  // 13. Seed Flagged Listings
  await knex('flagged_listings').insert([
    {
      id: 'flag-1',
      listing_id: 'list-1',
      reporter_id: 'user-dave',
      reason: 'Price might be slightly high for a generic lamp; requesting review.',
      status: 'pending'
    }
  ]);

  // 14. Seed Announcements
  await knex('announcements').insert([
    {
      id: 'ann-1',
      title: 'Guarded Meetup Reminder',
      message: 'Always meet inside official UC campus security gates during daytime hours. Inspect items before scanning the Handshake QR code.',
      campus: 'All',
      type: 'alert',
      author_id: 'user-superadmin',
      author_name: 'UC Administration',
      is_active: true
    },
    {
      id: 'ann-2',
      title: 'Junior High & Senior High Trading Desk Live',
      message: 'Students from UC PRI and UC South high school departments can now trade textbooks and PE uniforms with zero platform fees.',
      campus: 'UC PRI',
      type: 'info',
      author_id: 'user-admin',
      author_name: 'High School Coordinator',
      is_active: true
    }
  ]);

  // 15. Seed Admin Audit Logs
  await knex('admin_audit_logs').insert([
    {
      id: 'log-1',
      admin_id: 'user-superadmin',
      admin_name: 'UC Super Administrator',
      action: 'Platform Initialized',
      target_type: 'system',
      target_id: 'system',
      details: 'Admin desk initialized for University of Cebu campus network',
      ip_address: '127.0.0.1'
    }
  ]);

  // 16. Seed Trade Disputes
  await knex('trade_disputes').insert([
    {
      id: 'disp-1',
      listing_title: 'UC Nursing Duty Scrubs (Size M, Navy Blue)',
      buyer_id: 'user-chloe',
      buyer_name: 'Chloe Mendoza',
      seller_id: 'user-maria',
      seller_name: 'Maria Santos',
      campus: 'UC Banilad',
      reason: 'Small tear near left pocket not listed in description. Requested partial refund or replacement.',
      status: 'pending'
    },
    {
      id: 'disp-2',
      listing_title: 'Casio Scientific Calculator FX-991ES Plus-2',
      buyer_id: 'user-dave',
      buyer_name: 'Dave Alcantara',
      seller_id: 'user-ken',
      seller_name: 'Kenzo Lim',
      campus: 'UC LM',
      reason: 'Seller was 35 minutes late to the Mandaue bridge gate meetup.',
      status: 'pending'
    }
  ]);

  // 17. Seed Prohibited Keywords
  await knex('prohibited_keywords').insert([
    { id: 'kw-1', keyword: 'exam leak', added_by: 'user-admin' },
    { id: 'kw-2', keyword: 'test bank', added_by: 'user-admin' },
    { id: 'kw-3', keyword: 'test paper', added_by: 'user-admin' },
    { id: 'kw-4', keyword: 'midterm answer', added_by: 'user-admin' },
    { id: 'kw-5', keyword: 'final exam key', added_by: 'user-admin' },
    { id: 'kw-6', keyword: 'vape', added_by: 'user-admin' },
    { id: 'kw-7', keyword: 'pod', added_by: 'user-admin' },
    { id: 'kw-8', keyword: 'cigarette', added_by: 'user-admin' },
    { id: 'kw-9', keyword: 'smoke', added_by: 'user-admin' },
    { id: 'kw-10', keyword: 'counterfeit uniform', added_by: 'user-admin' },
    { id: 'kw-11', keyword: 'fake id', added_by: 'user-admin' },
    { id: 'kw-12', keyword: 'liquor', added_by: 'user-admin' },
    { id: 'kw-13', keyword: 'beer', added_by: 'user-admin' },
    { id: 'kw-14', keyword: 'gambling', added_by: 'user-admin' },
    { id: 'kw-15', keyword: 'weapon', added_by: 'user-admin' },
    { id: 'kw-16', keyword: 'knife', added_by: 'user-admin' },
    { id: 'kw-17', keyword: 'proxy test', added_by: 'user-admin' }
  ]);

  // 18. Seed System Config
  await knex('system_config').insert([
    {
      config_key: 'platform_rules',
      config_value: JSON.stringify({
        maintenanceMode: false,
        maxListingPrice: 50000,
        maxImagesPerListing: 5,
        swapModeEnabled: true,
        wantedBoardEnabled: true,
        freeDonationEnabled: true,
        maxListingsPerUser: 20
      }),
      last_updated_by: 'user-superadmin'
    }
  ]);

  // 19. Seed Feature Flags
  await knex('feature_flags').insert([
    { id: 'ff-1', name: 'Price Advisor AI', description: 'Enable AI-powered pricing suggestions', enabled: true },
    { id: 'ff-2', name: 'Campus Map', description: 'Interactive campus meetup map', enabled: true },
    { id: 'ff-3', name: 'Pro Merchant Badge', description: 'Allow pro merchant status for top sellers', enabled: true },
    { id: 'ff-4', name: 'Dark Mode', description: 'Dark mode toggle for all users', enabled: true }
  ]);
};
