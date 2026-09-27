/**
 * DR TASTES - KOLHAPURI KANDA LASUN MASALA
 * Cinematic Image Sequence Scroll Animation & Interactive Web Experience
 */

(function () {
  'use strict';

  // --- CONFIGURATION ---
  const TOTAL_FRAMES = 225;
  const FRAME_PREFIX = 'frames/ezgif-frame-';
  const FRAME_EXT = '.jpg';
  const ASPECT_RATIO = 1920 / 1080;

  // --- DOM ELEMENTS ---
  const canvas = document.getElementById('animationCanvas');
  const ctx = canvas.getContext('2d');
  const scrollHero = document.getElementById('scroll-hero');
  const preloader = document.getElementById('preloader');
  const preloaderBar = document.getElementById('preloaderBar');
  const loadPercentText = document.getElementById('loadPercent');
  const loadCountText = document.getElementById('loadCount');
  
  const frameSlider = document.getElementById('frameSlider');
  const currentFrameNum = document.getElementById('currentFrameNum');
  const hudPlayBtn = document.getElementById('hudPlayBtn');
  const playIcon = hudPlayBtn ? hudPlayBtn.querySelector('.play-icon') : null;
  const pauseIcon = hudPlayBtn ? hudPlayBtn.querySelector('.pause-icon') : null;
  const chapterDots = document.querySelectorAll('.chap-dot');

  const storySteps = [
    { el: document.getElementById('storyStep1'), min: 0.0, max: 0.22 },
    { el: document.getElementById('storyStep2'), min: 0.24, max: 0.50 },
    { el: document.getElementById('storyStep3'), min: 0.52, max: 0.78 },
    { el: document.getElementById('storyStep4'), min: 0.80, max: 1.05 }
  ];

  // --- STATE ---
  const images = [];
  let loadedCount = 0;
  let currentRenderIndex = 1;
  let targetRenderIndex = 1;
  let isAutoPlaying = false;
  let autoPlayRafId = null;
  let isScrubbing = false;

  // Helper to format frame number e.g. 1 -> "001"
  function getFrameFilename(index) {
    const pad = String(index).padStart(3, '0');
    return `${FRAME_PREFIX}${pad}${FRAME_EXT}`;
  }

  // --- PRELOAD IMAGES ---
  function preloadImages() {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = getFrameFilename(i);
      img.onload = () => {
        loadedCount++;
        images[i] = img;

        const pct = Math.floor((loadedCount / TOTAL_FRAMES) * 100);
        preloaderBar.style.width = `${pct}%`;
        loadPercentText.textContent = `${pct}%`;
        loadCountText.textContent = `${loadedCount} / ${TOTAL_FRAMES} Frames`;

        // Render first frame immediately once loaded
        if (i === 1 && loadedCount === 1) {
          renderFrame(1);
        }

        if (loadedCount === TOTAL_FRAMES) {
          setTimeout(finishPreloader, 300);
        }
      };

      img.onerror = () => {
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          setTimeout(finishPreloader, 300);
        }
      };
    }
  }

  function finishPreloader() {
    preloader.classList.add('hidden');
    renderFrame(1);
    initParticleEmitter();
  }

  // --- CANVAS RESIZING & HIGH-DPI RETINA SCALING ---
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    renderFrame(Math.round(currentRenderIndex));
  }

  window.addEventListener('resize', resizeCanvas, { passive: true });

  // --- FRAME DRAWING (CONTAIN / COVER WITH ZERO DISTORTION) ---
  function renderFrame(frameIndex) {
    const idx = Math.max(1, Math.min(TOTAL_FRAMES, Math.round(frameIndex)));
    const img = images[idx];
    if (!img || !img.complete) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const windowRatio = width / height;

    let drawW, drawH, drawX, drawY;

    // Cover logic for cinematic full bleed
    if (windowRatio > ASPECT_RATIO) {
      drawW = width;
      drawH = width / ASPECT_RATIO;
      drawX = 0;
      drawY = (height - drawH) / 2;
    } else {
      drawH = height;
      drawW = height * ASPECT_RATIO;
      drawX = (width - drawW) / 2;
      drawY = 0;
    }

    ctx.clearRect(0, 0, width, height);

    // Warm deep red base color fallback matching the video border
    ctx.fillStyle = '#1c0303';
    ctx.fillRect(0, 0, width, height);

    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    // Update readout
    if (currentFrameNum) {
      const padded = String(idx).padStart(3, '0');
      if (currentFrameNum.textContent !== padded) {
        currentFrameNum.textContent = padded;
      }
    }
    if (frameSlider && !isScrubbing) {
      frameSlider.value = idx;
    }
  }

  // --- SMOOTH LERP RENDER LOOP ---
  function renderLoop() {
    if (Math.abs(targetRenderIndex - currentRenderIndex) > 0.05) {
      // Lerp for cinematic fluid frame transitions
      currentRenderIndex += (targetRenderIndex - currentRenderIndex) * 0.22;
      renderFrame(currentRenderIndex);
    }
    requestAnimationFrame(renderLoop);
  }

  // --- SCROLL PROGRESS SYNCHRONIZATION ---
  function onScroll() {
    if (isAutoPlaying || isScrubbing) return;

    const rect = scrollHero.getBoundingClientRect();
    const heroHeight = scrollHero.offsetHeight;
    const windowHeight = window.innerHeight;

    // Progress from 0 to 1 as hero is scrolled through
    const scrollDistance = -rect.top;
    const maxScroll = heroHeight - windowHeight;
    let progress = scrollDistance / maxScroll;
    progress = Math.max(0, Math.min(1, progress));

    // Target frame based on progress
    targetRenderIndex = 1 + progress * (TOTAL_FRAMES - 1);

    // Update story step overlays
    updateStoryCards(progress);

    // Update navbar background
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Update active chapter indicator
    updateChapterDots(progress);
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // Update text cards based on progress
  function updateStoryCards(progress) {
    storySteps.forEach(step => {
      if (progress >= step.min && progress <= step.max) {
        step.el.classList.add('active');
      } else {
        step.el.classList.remove('active');
      }
    });
  }

  function updateChapterDots(progress) {
    let activeIdx = 0;
    if (progress >= 0.78) activeIdx = 3;
    else if (progress >= 0.50) activeIdx = 2;
    else if (progress >= 0.22) activeIdx = 1;

    chapterDots.forEach((dot, idx) => {
      if (idx === activeIdx) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  // Chapter Click to Scroll
  chapterDots.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetProg = parseFloat(dot.getAttribute('data-progress'));
      const heroHeight = scrollHero.offsetHeight;
      const windowHeight = window.innerHeight;
      const targetScroll = scrollHero.offsetTop + targetProg * (heroHeight - windowHeight);

      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    });
  });

  // --- FRAME SCRUBBER SLIDER (IF PRESENT) ---
  if (frameSlider) {
    frameSlider.addEventListener('input', (e) => {
      isScrubbing = true;
      const frame = parseInt(e.target.value, 10);
      targetRenderIndex = frame;
      currentRenderIndex = frame;
      renderFrame(frame);

      const prog = (frame - 1) / (TOTAL_FRAMES - 1);
      updateStoryCards(prog);
      updateChapterDots(prog);
    });

    frameSlider.addEventListener('change', () => {
      isScrubbing = false;
    });
  }

  // --- AUTO-PLAY / PAUSE MODE (IF PRESENT) ---
  if (hudPlayBtn) {
    hudPlayBtn.addEventListener('click', toggleAutoPlay);
  }

  function toggleAutoPlay() {
    isAutoPlaying = !isAutoPlaying;

    if (isAutoPlaying) {
      if (playIcon) playIcon.style.display = 'none';
      if (pauseIcon) pauseIcon.style.display = 'block';
      startAutoPlay();
    } else {
      if (playIcon) playIcon.style.display = 'block';
      if (pauseIcon) pauseIcon.style.display = 'none';
      stopAutoPlay();
    }
  }

  function startAutoPlay() {
    let lastTime = performance.now();
    const fps = 24; // Smooth cinematic 24fps
    const interval = 1000 / fps;

    function playStep(now) {
      if (!isAutoPlaying) return;

      const elapsed = now - lastTime;
      if (elapsed > interval) {
        lastTime = now - (elapsed % interval);

        if (targetRenderIndex >= TOTAL_FRAMES) {
          targetRenderIndex = 1;
        } else {
          targetRenderIndex += 1;
        }
        currentRenderIndex = targetRenderIndex;
        renderFrame(currentRenderIndex);

        const prog = (currentRenderIndex - 1) / (TOTAL_FRAMES - 1);
        updateStoryCards(prog);
        updateChapterDots(prog);
      }

      autoPlayRafId = requestAnimationFrame(playStep);
    }

    autoPlayRafId = requestAnimationFrame(playStep);
  }

  function stopAutoPlay() {
    if (autoPlayRafId) {
      cancelAnimationFrame(autoPlayRafId);
      autoPlayRafId = null;
    }
  }

  // --- FLOATING SPICE EMBER PARTICLES ---
  function initParticleEmitter() {
    const container = document.getElementById('particlesContainer');
    const PARTICLE_COUNT = 24;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ember = document.createElement('div');
      ember.className = 'ember-particle';

      const size = Math.random() * 4 + 2;
      ember.style.width = `${size}px`;
      ember.style.height = `${size}px`;
      ember.style.left = `${Math.random() * 100}vw`;
      ember.style.animationDuration = `${Math.random() * 8 + 6}s`;
      ember.style.animationDelay = `${Math.random() * 6}s`;

      container.appendChild(ember);
    }
  }

  // ==========================================================================
  // INTERACTIVE ZANZANIT HEAT GAUGE
  // ==========================================================================
  const heatSlider = document.getElementById('heatSlider');
  const heatMeterFill = document.getElementById('heatMeterFill');
  const heatEmojis = document.getElementById('heatEmojis');
  const heatLevelTitle = document.getElementById('heatLevelTitle');
  const heatLevelDesc = document.getElementById('heatLevelDesc');
  const heatBestFor = document.getElementById('heatBestFor');
  const heatDosage = document.getElementById('heatDosage');
  const dishGlow = document.getElementById('dishGlow');
  const heatLabelOpts = document.querySelectorAll('.label-opt');

  const heatData = {
    1: {
      title: 'Gentle Savor (सौम्य चव)',
      emojis: '🌶️',
      desc: 'Mild, aromatic, and comforting. The natural sweetness of roasted onions shines through with a gentle, fragrant warmth. Perfect for kids and guests.',
      bestFor: 'Dal Tadka, Matki Usal, Everyday Dry Veggies, Veg Pulao',
      dosage: '1 level teaspoon per 500g dish',
      glow: 'rgba(244, 162, 97, 0.25)',
      fill: '25%'
    },
    2: {
      title: 'Medium Punch (चटपटीत)',
      emojis: '🌶️🌶️',
      desc: 'A spirited Maharashtrian kick. Pronounced garlic notes with crisp Sankeshwari chili warmth. Vibrant red gravy that awakens the senses.',
      bestFor: 'Kolhapuri Egg Curry, Paneer Kolhapuri, Chana Masala',
      dosage: '1 to 1.5 tablespoons per 500g dish',
      glow: 'rgba(231, 111, 81, 0.35)',
      fill: '50%'
    },
    3: {
      title: 'Authentic Zanzanit (झणझणीत)',
      emojis: '🌶️🌶️🌶️',
      desc: 'The golden benchmark of Kolhapur! Fiery crimson "Tarri" floating on a rich, aromatic broth. Gives you a warm forehead sweat and makes your tastebuds sing with deep savory joy.',
      bestFor: 'Tambada Rassa, Misal Pav, Spicy Chicken Sukka',
      dosage: '2 full tablespoons per 500g meat/veggies',
      glow: 'rgba(217, 4, 41, 0.5)',
      fill: '75%'
    },
    4: {
      title: 'Shahu Royal Agni (अस्सल आग)',
      emojis: '🌶️🌶️🌶️🌶️🔥',
      desc: 'Reserved for true spice champions! Intense, sweat-inducing, unapologetic heat from pure sun-dried Lavangi and Sankeshwari chilies tempered in sizzling peanut oil.',
      bestFor: 'Extreme Kolhapuri Mutton, Fire Misal, Zanzanit Shev Bhaji',
      dosage: '3 heaped tablespoons (keep yoghurt nearby!)',
      glow: 'rgba(255, 0, 0, 0.75)',
      fill: '100%'
    }
  };

  heatSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    const data = heatData[val];

    heatEmojis.textContent = data.emojis;
    heatLevelTitle.textContent = data.title;
    heatLevelDesc.textContent = data.desc;
    heatBestFor.textContent = data.bestFor;
    heatDosage.textContent = data.dosage;
    heatMeterFill.style.width = data.fill;
    dishGlow.style.background = `radial-gradient(circle, ${data.glow}, transparent 70%)`;

    heatLabelOpts.forEach(lbl => {
      if (parseInt(lbl.getAttribute('data-level'), 10) === val) {
        lbl.classList.add('active');
      } else {
        lbl.classList.remove('active');
      }
    });
  });

  heatLabelOpts.forEach(lbl => {
    lbl.addEventListener('click', () => {
      const level = parseInt(lbl.getAttribute('data-level'), 10);
      heatSlider.value = level;
      heatSlider.dispatchEvent(new Event('input'));
    });
  });

  // ==========================================================================
  // RECIPE TABS INTERACTION
  // ==========================================================================
  const recipeData = {
    tambada: {
      badge: 'Signature Kolhapur Stew',
      title: 'Kolhapuri Tambada Rassa (तांबडा रस्सा)',
      summary: 'The crown jewel of Kolhapuri mutton and chicken banquets. A thin, searingly aromatic crimson soup topped with a shimmering layer of spiced red oil.',
      stats: { time: '35 mins', yield: '4 Servings', heat: 'Spicy ★★★' },
      tip: 'Never add extra garam masala or turmeric. DR Tastes Masala has the exact ratio of stone flower and roasted spices pre-balanced!',
      steps: [
        '<strong>Boil Broth:</strong> Boil 500g mutton/chicken with turmeric, salt, and ginger-garlic paste until tender to create a rich aromatic stock.',
        '<strong>Temper Aromatics:</strong> In a clay pot or heavy kadai, heat 3 tbsp oil. Add crushed onion paste and sauté until golden oil separates.',
        '<strong>The Magic Masala:</strong> Add 2 generous tablespoons of <em>DR Tastes Kolhapuri Kanda Lasun Masala</em>. Sauté on low flame for 60 seconds until the crimson fragrance fills your kitchen.',
        '<strong>Simmer & Serve:</strong> Pour in the strained boiling mutton stock. Let it roll to a furious boil for 5 minutes until the majestic red "Tarri" surfaces. Garnish with fresh coriander and serve boiling hot with Bhakri!'
      ]
    },
    misal: {
      badge: 'Iconic Maharashtra Breakfast',
      title: 'Kolhapuri Fadtare Misal (झणझणीत मिसळ)',
      summary: 'The street food legend. Sprouted moth beans cooked in a fiery, thin red gravy, crowned with crunchy farsan, fresh onions, coriander, and served with buttered ladi pav.',
      stats: { time: '25 mins', yield: '3 Servings', heat: 'Very Spicy ★★★★' },
      tip: 'To get that authentic restaurant-style red oil (कट), sauté DR Tastes Masala in slightly warm oil before adding the bean water.',
      steps: [
        '<strong>Sprout Preparation:</strong> Parboil sprouted matki (moth beans) with a pinch of salt until soft but retaining their shape.',
        '<strong>Tadka Base:</strong> Heat 4 tbsp oil in a deep pan. Splutter mustard seeds, curry leaves, and finely chopped onions until caramelized.',
        '<strong>Aroma Release:</strong> Stir in 2.5 tbsp of DR Tastes Masala. Cook for 45 seconds until you see deep red oils shimmering.',
        '<strong>Assemble the Feast:</strong> Add the sprouted beans along with warm water. Simmer for 10 minutes. Plate with farsan, boiled potato chunks, chopped onions, and a lemon wedge!'
      ]
    },
    sukka: {
      badge: 'Rustic Dry Roast',
      title: 'Kolhapuri Sukka Chicken (सुक्का चिकन)',
      summary: 'Semi-dry, intensely spiced chicken coated in a thick, dark, roasted coconut and caramelized garlic paste that clings to every succulent piece of meat.',
      stats: { time: '30 mins', yield: '4 Servings', heat: 'Medium-Spicy ★★★' },
      tip: 'Finish with a sprinkle of roasted dry coconut (khobara) and chopped coriander for authentic rustic texture.',
      steps: [
        '<strong>Marinate:</strong> Coat chicken pieces in ginger-garlic paste, fresh lime juice, and a pinch of salt for 20 minutes.',
        '<strong>Roast Coconut:</strong> Dry roast freshly grated dry coconut in a pan until golden brown and grind coarsely.',
        '<strong>Sear & Coat:</strong> Heat 2 tbsp oil, add onions, marinated chicken, and 2 tablespoons of DR Tastes Kolhapuri Masala. Sear on high heat for 5 minutes.',
        '<strong>Slow Simmer:</strong> Cover and cook in its own juices on low heat for 15 minutes. Stir in the roasted coconut until sauce clings thickly to the chicken.'
      ]
    },
    shevbhaji: {
      badge: 'Vegetarian Legend of Khandesh & Kolhapur',
      title: 'Zanzanit Shev Bhaji (झणझणीत शेव भाजी)',
      summary: 'Thick, crunchy spicy gathiya shev steeped in a thin, searing red onion-garlic rassa. Maharashtra’s ultimate vegetarian dinner staple.',
      stats: { time: '20 mins', yield: '3 Servings', heat: 'Spicy ★★★' },
      tip: 'Always add the shev directly to your bowl before pouring boiling rassa over it so it remains delightfully crisp!',
      steps: [
        '<strong>The Rassa Gravy:</strong> Heat oil, sauté grated onion and tomato paste until oil glitters around the edges.',
        '<strong>Spice Burst:</strong> Add 2 tbsp of DR Tastes Kanda Lasun Masala. The natural garlic in the blend eliminates the need for separate ginger-garlic paste.',
        '<strong>Simmer:</strong> Add 2.5 cups of boiling water and simmer for 7 minutes until a deep red layer of oil forms on top.',
        '<strong>Serve:</strong> Pour the boiling red rassa over a bowl filled with thick Bhavnagri shev, top with diced raw onions and hot chapati!'
      ]
    }
  };

  const recipeTabs = document.querySelectorAll('.recipe-tab-btn');
  const recBadge = document.getElementById('recBadge');
  const recTitle = document.getElementById('recTitle');
  const recSummary = document.getElementById('recSummary');
  const recTip = document.getElementById('recTip');
  const recSteps = document.getElementById('recSteps');
  const recipeDisplayCard = document.getElementById('recipeDisplayCard');

  recipeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      recipeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const recKey = tab.getAttribute('data-recipe');
      const rec = recipeData[recKey];

      // Smooth subtle fade effect
      recipeDisplayCard.style.opacity = '0.3';
      setTimeout(() => {
        recBadge.textContent = rec.badge;
        recTitle.textContent = rec.title;
        recSummary.textContent = rec.summary;
        recTip.textContent = rec.tip;

        recSteps.innerHTML = rec.steps.map(step => `<li>${step}</li>`).join('');

        const statEls = recipeDisplayCard.querySelectorAll('.stat');
        statEls[0].querySelector('.val').textContent = rec.stats.time;
        statEls[1].querySelector('.val').textContent = rec.stats.yield;
        statEls[2].querySelector('.val').textContent = rec.stats.heat;

        recipeDisplayCard.style.opacity = '1';
      }, 150);
    });
  });

  // ==========================================================================
  // SHOPPING CART DRAWER & NOTIFICATIONS
  // ==========================================================================
  let cart = [];
  const cartOverlay = document.getElementById('cartOverlay');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOpenBtn = document.getElementById('cartOpenBtn');
  const cartCloseBtn = document.getElementById('cartCloseBtn');
  const cartBadge = document.getElementById('cartBadge');
  const cartItemsList = document.getElementById('cartItemsList');
  const emptyCartMsg = document.getElementById('emptyCartMsg');
  const cartFooter = document.getElementById('cartFooter');
  const cartSubtotal = document.getElementById('cartSubtotal');
  const cartShipping = document.getElementById('cartShipping');
  const cartTotal = document.getElementById('cartTotal');
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');

  function openCart() {
    cartOverlay.classList.add('active');
    cartDrawer.classList.add('active');
  }

  function closeCart() {
    cartOverlay.classList.remove('active');
    cartDrawer.classList.remove('active');
  }

  cartOpenBtn.addEventListener('click', openCart);
  cartCloseBtn.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  const browsePacksBtn = document.getElementById('browsePacksBtn');
  if (browsePacksBtn) {
    browsePacksBtn.addEventListener('click', () => {
      closeCart();
      const shopSec = document.getElementById('shop-section');
      shopSec.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Add to cart buttons
  document.querySelectorAll('.add-to-cart-btn, .add-to-cart-quick').forEach(btn => {
    btn.addEventListener('click', () => {
      const size = btn.getAttribute('data-size');
      const price = parseInt(btn.getAttribute('data-price'), 10);
      addToCart(size, price);
    });
  });

  function addToCart(size, price) {
    const existing = cart.find(item => item.size === size);
    if (existing) {
      existing.qty++;
    } else {
      cart.push({
        title: 'DR Tastes Kolhapuri Masala',
        size: size,
        price: price,
        qty: 1
      });
    }

    updateCartUI();
    showToast(`Added ${size} DR Tastes Masala to your basket!`);
  }

  function updateCartUI() {
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    cartBadge.textContent = totalQty;

    if (cart.length === 0) {
      emptyCartMsg.style.display = 'block';
      cartFooter.style.display = 'none';
      cartItemsList.innerHTML = '';
      cartItemsList.appendChild(emptyCartMsg);
      return;
    }

    emptyCartMsg.style.display = 'none';
    cartFooter.style.display = 'block';

    let subtotal = 0;
    cartItemsList.innerHTML = '';

    cart.forEach((item, index) => {
      subtotal += item.price * item.qty;

      const row = document.createElement('div');
      row.className = 'cart-item-row';
      row.innerHTML = `
        <div class="cart-item-info">
          <h4>${item.title} (${item.size})</h4>
          <span>₹${item.price} × ${item.qty} = ₹${item.price * item.qty}</span>
        </div>
        <div class="cart-qty-ctrl">
          <button class="cart-qty-btn dec-btn" data-index="${index}">-</button>
          <span>${item.qty}</span>
          <button class="cart-qty-btn inc-btn" data-index="${index}">+</button>
        </div>
      `;
      cartItemsList.appendChild(row);
    });

    const isFreeDelivery = subtotal >= 499;
    const shippingCost = isFreeDelivery || subtotal === 0 ? 0 : 49;
    const grandTotal = subtotal + shippingCost;

    cartSubtotal.textContent = `₹${subtotal}`;
    cartShipping.textContent = isFreeDelivery ? 'FREE (Orders above ₹499)' : '₹49';
    cartTotal.textContent = `₹${grandTotal}`;

    // Attach listeners to + and - buttons
    cartItemsList.querySelectorAll('.dec-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (cart[idx].qty > 1) {
          cart[idx].qty--;
        } else {
          cart.splice(idx, 1);
        }
        updateCartUI();
      });
    });

    cartItemsList.querySelectorAll('.inc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        cart[idx].qty++;
        updateCartUI();
      });
    });
  }

  const checkoutBtn = document.getElementById('checkoutBtn');
  checkoutBtn.addEventListener('click', () => {
    alert('🔥 धन्यवाद! (Thank you!)\nYour authentic batch of DR Tastes Kolhapuri Kanda Lasun Masala is being prepared with fresh Kolhapuri chilies! Tracking details will be dispatched via SMS.');
    cart = [];
    updateCartUI();
    closeCart();
  });

  function showToast(msg) {
    toastMessage.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }



  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  resizeCanvas();
  preloadImages();
  renderLoop();
  onScroll();

})();
