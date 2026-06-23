'use strict';
// Realistic sample content for every (design, slide) pair — drives the component
// library previews and the try-on catalog. Kept out of server.js so tests can
// assert the catalog stays in lockstep with the schema.

const SAMPLE_PHOTO = 'https://brand-cdn.figandbloom.workers.dev/figandbloom/asset-manifest/2026/06/floral-arrangement-product-shot-indoor-studio-setting-tabletop-d-1BooMH.jpg';
const SAMPLE_PHOTO_ALT = 'https://brand-cdn.figandbloom.workers.dev/figandbloom/asset-manifest/2026/06/floral-arrangement-indoors-likely-a-home-or-studio-setting-pink-1oJNWF.jpg';
// Dark plates for the Good Weekend editorial slides — white type needs a dark region to sit on.
const SAMPLE_PHOTO_DARK = 'https://brand-cdn.figandbloom.workers.dev/figandbloom/asset-manifest/2026/06/behind-the-scenes-floral-craft-floral-studio-or-workshop-in-sydn-1ZnUa2.jpg';
const SAMPLE_PHOTO_MOODY = 'https://brand-cdn.figandbloom.workers.dev/figandbloom/asset-manifest/2026/06/still-life-abstract-indoor-on-a-wooden-floor-roses-roses-flowers-1opGMU.jpg';

// Realistic sample data for every component. One block per (design, slide).
const SAMPLE_TOKENS = {
  'carousel-journal/cover': {
    kicker: 'The Journal', index: '01', voice: 'on choosing well',
    headline: 'The flowers are the easy part.',
    cta: 'Read the guide →', photo: SAMPLE_PHOTO, theme: 'light'
  },
  'carousel-journal/intro': {
    kicker: 'The Journal', index: '02', voice: 'a small guide to borrowing words',
    lede: 'The bouquet brings the colour. The card explains why it is there.',
    body: 'Staring at the blank message box — wondering whether to be funny, formal, brief or heartfelt? Take the pressure off. A card does not need to sound like a poem.',
    lead_in: 'A few to borrow, by moment —', cta: 'Next →', photo: SAMPLE_PHOTO
  },
  'carousel-journal/interior': {
    kicker: 'The Journal', index: '03',
    label_1: 'Just because', quote_1: 'Saw these and thought of you.',
    label_2: 'For a birthday', quote_2: 'A little birthday colour for your home.',
    label_3: 'To say thank you', quote_3: 'Thank you for the way you made a hard week feel lighter.',
    cta: 'Next →'
  },
  'carousel-journal/statement': {
    kicker: 'What I notice first',
    headline: 'Watch the florists I admire, and the first thing you see _isn’t_ the flowers.',
    body: 'It’s the greenery. A lot of it, deliberately mismatched — apple greens against dark greens, broad leaves beside something fine. Texture stacked on texture.',
    theme: 'clay'
  },
  'carousel-journal/quote': {
    quote: 'It isn’t about the flowers.<br>It’s about _culture_.',
    attribution: '— Kellie, Fig & Bloom', theme: 'dark'
  },
  'carousel-journal/photo-statement': {
    kicker: 'The English country garden',
    headline: 'Layered, generous,<br>a little _wild_.',
    standfirst: 'Here the foliage is the feature — the flowers come second.',
    photo: SAMPLE_PHOTO_MOODY
  },
  'carousel-journal/closing': {
    voice: 'For the moment they feel what you meant.',
    cta: 'Read the guide →', url: 'figandbloom.com/journal', photo: SAMPLE_PHOTO
  },
  'story-studio/cover': {
    kicker: 'In the studio', voice: 'a few minutes from the workshop',
    headline: 'Hands at work, the morning quiet.',
    body: 'A few minutes from the workshop — stem by stem, ribbon by ribbon. The kind of morning that ends with a delivery van, and a thank-you we never see.',
    cta: 'See the journal →', photo: SAMPLE_PHOTO, theme: 'light'
  },
  'story-promo/cover': {
    kicker: 'New in', voice: 'soft, contemporary white',
    headline: 'Lucerne', subhead: 'Hand-tied the morning it is sent.',
    from_price: 'from $105', cta: 'See the range →', photo: SAMPLE_PHOTO, theme: 'light'
  },
  'story-gift/intro': {
    kicker: 'For the moment', voice: 'ribbon, paper, a hand-written card',
    headline: 'A small thank-you, wrapped with care.',
    body: 'Ribbon, paper, a hand-written card tucked in beside the stems. The wrapping is half the gift.',
    cta: 'Next →', photo: SAMPLE_PHOTO, theme: 'light'
  },
  'story-gift/closing': {
    kicker: 'Delivered with care', voice: 'for the moment they feel what you meant',
    end_line: 'For the moment they feel what you meant.',
    cta: 'Choose a moment →', url: 'figandbloom.com/gifting', photo: SAMPLE_PHOTO, theme: 'light'
  },
  'story-editorial/cover': {
    kicker: 'From the journal', voice: 'on the morning run',
    quote: 'We tie the stems before the morning is half done. We photograph them before the van goes.',
    attribution: 'Fig & Bloom — on the morning run', photo: SAMPLE_PHOTO, theme: 'dark'
  },
  'story-editorial/feature': {
    kicker: 'The journal',
    headline: 'The morning run: how a bunch leaves the studio',
    dek: 'From first cut to the courier’s tray — the hours you don’t see.',
    link_hint: 'Slide for the story', photo: SAMPLE_PHOTO_DARK, theme: 'dark'
  },
  'story-editorial/pullquote': {
    quote: 'We tie the stems before the morning is half done.',
    name: 'Kellie', role: 'Head florist, Melbourne studio',
    photo: SAMPLE_PHOTO_DARK, theme: 'dark'
  },
  'story-editorial/column': {
    text: 'The buckets are filled before sunrise.<br><br>By eight the bench is a field of cut stems, and the first orders are already wrapped, named and waiting by the door.',
    attribution: 'From the journal', align: 'right', panel: 'none', photo: SAMPLE_PHOTO_MOODY
  },
  'story-editorial/press': {
    kicker: 'The morning run',
    text: 'By the time the vans leave the studio, every bunch has been cut, conditioned and photographed — a small record of the morning it was made.',
    link_hint: 'More at the link in bio', surface: 'white', photo: SAMPLE_PHOTO
  },
  'story-editorial/linkout': {
    line: 'Head to the link in bio for the full story.',
    note: 'New journal entries every week.', surface: 'white'
  },
  'story-quote-soft/cover': {
    kicker: 'The studio', voice: 'a small, quiet room',
    headline: 'A knot of ribbon, a hand on the stems.',
    body: 'We work where the morning is. The rest of the day is mostly that.',
    url: 'figandbloom.com/journal', cta: 'Visit the link in bio →', photo: SAMPLE_PHOTO_ALT
  },
  'story-tagline/cover': {
    kicker: 'Gift edit', voice: 'for the people who keep a vase on the windowsill',
    headline: 'For the quiet ones',
    subhead: 'A small edit, hand-picked for the people who do not need a reason.',
    cta: 'See the edit →', photo: SAMPLE_PHOTO
  },
  'story-overlay/cover': {
    kicker: 'This week', word: 'HELD', cta: 'Read on →', photo: SAMPLE_PHOTO
  },
  'card-caption/cover': {
    photo: SAMPLE_PHOTO, caption: 'the saturday slow bunch'
  },
  'card-statement-bars/cover': {
    photo: SAMPLE_PHOTO_ALT, headline: 'flowers\nfirst.\neverything else\ncan wait'
  },
  'card-statement-split/cover': {
    photo: SAMPLE_PHOTO, kicker: 'From the journal',
    headline: 'Human\nconnections\nare deeply\nnurtured', attribution: 'Jean Houston'
  },
  'card-testimonial/cover': {
    kicker: 'Kind words',
    quote: 'Highly recommended! Excellent service, speed, product and communication.',
    attribution: 'Darren L', motif: 'body-flower'
  },
  'card-quote-lineart/cover': {
    quote: 'human connections are deeply nurtured in the field of a shared story.',
    attribution: 'Jean Houston', theme: 'light', motif: 'body-flower'
  },
  'card-script-moment/cover': {
    line: 'celebrate love', surface: 'clay', photo: ''
  },
  'card-note/cover': {
    line: "we're hiring", sub: 'florists & drivers — melbourne studio', motif: 'hand-plant'
  }
};

// Try-on slots: one representative photo-bearing slide per design. `photo` names the
// image token a user's asset drops into; `main` the slide's lead text token; `apply`
// extra tokens needed for the photo to show (e.g. script-moment's surface lever).
const TRYON_SLOTS = [
  ['card-caption', 'cover',         { photo: 'photo', main: 'caption' }],
  ['card-statement-bars', 'cover',  { photo: 'photo', main: 'headline' }],
  ['card-statement-split', 'cover', { photo: 'photo', main: 'headline' }],
  ['card-script-moment', 'cover',   { photo: 'photo', main: 'line', apply: { surface: 'photo' } }],
  ['story-editorial', 'cover',      { photo: 'photo', main: 'quote' }],
  ['story-editorial', 'feature',    { photo: 'photo', main: 'headline' }],
  ['story-editorial', 'pullquote',  { photo: 'photo', main: 'quote' }],
  ['story-editorial', 'column',     { photo: 'photo', main: 'text' }],
  ['story-editorial', 'press',      { photo: 'photo', main: 'text' }],
  ['story-studio', 'cover',         { photo: 'photo', main: 'headline' }],
  ['story-promo', 'cover',          { photo: 'photo', main: 'headline' }],
  ['story-gift', 'intro',           { photo: 'photo', main: 'headline' }],
  ['story-quote-soft', 'cover',     { photo: 'photo', main: 'headline' }],
  ['story-tagline', 'cover',        { photo: 'photo', main: 'headline' }],
  ['story-overlay', 'cover',        { photo: 'photo', main: 'word', case: 'word' }],
  ['carousel-journal', 'cover',     { photo: 'photo', main: 'headline' }]
];

module.exports = { SAMPLE_TOKENS, TRYON_SLOTS, SAMPLE_PHOTO, SAMPLE_PHOTO_ALT };
