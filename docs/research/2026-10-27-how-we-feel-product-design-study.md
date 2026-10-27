# How We Feel — Product and Visual Design Study

**Date:** 27 October 2026

**Purpose:** Translate the strongest product and interface principles of *How We Feel* into an original visual direction for *Reflections with God* without copying its brand assets, proprietary emotion map, illustrations, or screen compositions.

## Research question

Which interaction and visual-system decisions make *How We Feel* effective at helping people identify, record, and revisit emotions, and which of those decisions should inform—rather than be reproduced in—*Reflections with God*?

### Scope and method

This is a product-design evidence synthesis, not a clinical efficacy review. Sources were triangulated across the official product site and practitioner materials, current App Store metadata and previews, Yale descriptions of the product and research context, the original design collaborators’ portfolios, Apple’s award rationale, independent interface critiques, public review summaries, and relevant academic work on emotional granularity and engagement. Current product behavior was treated as changeable; dated screenshots and reviews were not assumed to describe every current build.

## Executive findings

*How We Feel* succeeds because it makes emotional complexity feel explorable rather than clinical. Its signature is not merely “bright bubbles on black.” It is a coherent system in which words, color, shape, spatial position, definitions, motion, and later pattern views all reuse the same emotional vocabulary. The core check-in is immediate, tactile, and visually dominant; secondary explanation arrives only after a person expresses intent.

For *Reflections with God*, the right translation is an **emotion-led, Scripture-centred visual system**:

1. Let emotion selection feel spatial and alive, but keep words primary and always provide non-color meaning.
2. Use a dark, contemplative canvas with luminous emotional color during check-in; transition toward warmer reading surfaces for Scripture.
3. Reuse each selected emotion’s color/shape quietly through the day and recap so the user can recognize continuity without scores.
4. Keep the primary daily action obvious and low-pressure; optional features must not compete with it.
5. Make history a reflective picture, not a performance dashboard.
6. Preserve the Christian product’s own posture: Scripture is not an emotion-regulation “tool,” painful emotions are not failures, and happiness is not forced.

## What the product actually does

The official product describes a loop of naming emotions precisely, noticing patterns over time, and learning in-the-moment regulation strategies. It is positioned as a private wellbeing journal and a complement to professional care rather than a replacement. The practitioner site is especially revealing: it recommends a few useful check-ins rather than turning the practice into homework, and emphasizes that practitioners cannot see private entries unless users choose to share them. ([How We Feel](https://howwefeel.org/); [How We Feel for practitioners](https://howwefeel.org/practitioners))

The emotional vocabulary is based on a Mood Meter organized by energy and pleasantness. Marc Brackett’s account says the current product expanded the meter to 144 words and combined it with short emotion education and pattern reports. ([Marc Brackett](https://marcbrackett.com/how-we-feel-app-3/)) Apple’s editorial description likewise focuses on a color-coded matrix that helps people explore nuanced emotions rather than reducing the check-in to “good” or “bad.” ([App Store listing](https://apps.apple.com/us/app/how-we-feel/id1562706384))

Yale describes the product flow as recognize, understand, and regulate: users name a feeling, optionally identify contributing context, and then explore strategies. Crucially, the article states that emotions are not categorized as morally good or bad. ([Yale School of Medicine](https://medicine.yale.edu/news-article/the-how-we-feel-app-helping-emotions-work-for-us-not-against-us/)) That principle aligns strongly with the requirement that *Reflections with God* avoid spiritual blame and forced positivity.

## Visual system anatomy

### 1. Emotion is the interface, not a form field

The primary selector is a field of labeled, colored shapes. Words remain visible; geometry and hue accelerate scanning. The original design lead describes the aim as translating complex scientific principles into an understandable and engaging product, while the design collaborators identify visual direction, UX, content strategy, iOS, and brand as one joined problem. ([Ben Powell case study](https://www.bpowell.co/design/how-we-feel); [Metalab work archive](https://www.metalab.com/work))

Independent screenshot analysis identifies four persistent families—warm red/coral, yellow/amber, mint/green, and blue—and notes that this color logic continues from selection into journal cards and history. ([Floow screenshot teardown](https://www.floow.design/aso-screens/howwefeel)) Apple’s award story adds a useful detail: deeper color corresponds to greater intensity. ([Apple App Store story](https://apps.apple.com/us/story/id1647059928))

**Implication:** *Reflections with God* should give each emotion a stable visual token made of three parts: semantic label, accessible color family, and abstract shape. Intensity can adjust scale, edge energy, or color depth, but must also remain written as mild/moderate/strong. No meaning should depend on color alone.

### 2. High contrast creates focus

Store previews and captured screens consistently use a near-black field with saturated emotion shapes, sparse chrome, and large typography. The result makes a dense vocabulary feel like a discoverable landscape rather than a checklist. ([AppBrain screenshot archive](https://www.appbrain.com/appstore/how-we-feel/ios-1562706384); [Floow screenshot teardown](https://www.floow.design/aso-screens/howwefeel))

**Implication:** Use a deep ink canvas for mood selection and recap visualization, then a warm paper surface for Scripture reading. This transition can express the product journey—from naming the present state to dwelling with Scripture—without implying that darkness equals spiritual failure.

### 3. Definitions appear at the moment of uncertainty

Captured selector screens show a selected word expanding into a short definition panel. This resolves the main risk of emotional granularity: a large vocabulary can become cognitively expensive. A recent independent critique praises the primary check-in’s discoverability, feedback, mapping, constraints, animation, and haptics, while warning that less conventional multi-axis gestures elsewhere can create slips. ([Pratt design critique](https://ixd.prattsi.org/2026/09/design-critique-how-we-feel-app-ios/))

**Implication:** A tap should reveal a one-sentence emotion definition, selected state, and intensity choice in place. Search and “I don’t know how I feel” must remain first-class escape routes. Avoid hidden multidirectional gestures.

### 4. The same vocabulary becomes history

The journal feed, calendar, and reports reuse emotion colors and glyphs. That visual continuity lets the user recognize patterns before reading every label. Public reviews repeatedly praise precise vocabulary and visual pattern recognition, while some recent reviews criticize redesigns that turned emotions into a “sea” of insufficiently organized words. ([How We Feel practitioner reviews](https://howwefeel.org/practitioners); [Google Play review summary](https://chrome-stats.com/d/org.howwefeel.moodmeter/reviews))

**Implication:** The recap should reuse that day’s emotion shapes and colors, but never expose a streak, score, completion ring, trend grade, or success color. Calendar gaps stay empty and neutral. Every visual glyph must reveal its text label to screen readers and on tap.

### 5. Delight comes from feedback, not reward mechanics

The strongest descriptions mention microanimation, haptics, organic shapes, and immediate feedback. Apple’s 2022 Cultural Impact award specifically credited the ease of daily check-ins and immediate strategies—not points, streaks, or competitive mechanics. ([Apple Newsroom](https://www.apple.com/newsroom/2022/11/app-store-awards-celebrate-the-best-apps-and-games-of-2022/))

**Implication:** Motion should acknowledge selection and transitions: a shape settles, expands, or gently breathes. It should never celebrate volume, completion, or “winning” over an emotion. Respect reduced-motion settings and avoid attention-demanding ambient animation.

## Product strengths worth adopting

| Strength | Evidence | Translation for Reflections with God |
|---|---|---|
| Rich but navigable emotion vocabulary | Official/Yale descriptions; Mood Meter lineage | Expand beyond ten emotions only after testing search, definitions, and cognitive load in Nigeria alpha. |
| Visual continuity across entry and history | Store screenshots and design teardown | Stable emotion tokens across check-in, timeline, recap, and history. |
| Low-pressure, repeatable check-in | Practitioner guidance and Apple award rationale | Optional two-hour check-ins remain invitations; Scripture availability never becomes debt. |
| Private by default | Official/practitioner positioning | Keep private practice explicit; no social feed, public sharing, or pastor surveillance. |
| Strategies follow recognition | Yale description | Scripture journey begins after the user confirms mood and direction; it does not overwrite their report. |
| Words plus visuals | Selector screenshots and reviews | Never use emoji as the sole emotional language; pair abstract form with precise text. |

## Weaknesses and cautions

1. **Density can become disorientation.** Recent Android reviews show that a visual vocabulary loses value when words feel insufficiently organized. Progressive disclosure, search, definitions, and a compact initial vocabulary matter more than maximum word count. ([Public review summary](https://chrome-stats.com/d/org.howwefeel.moodmeter/reviews))
2. **Tiny calendar marks can become decoration.** Independent screenshot analysis notes that small glyphs collapse at thumbnail size. *Reflections with God* should prioritize a readable daily recap card over a dense month-first view. ([Floow screenshot teardown](https://www.floow.design/aso-screens/howwefeel))
3. **Platform parity and data reliability are part of design quality.** Public reviews mention Android feature gaps and data-loss concerns. A visually ambitious system is not trustworthy if saved days disappear. Phase 2B’s guarded snapshots and later encrypted history must remain foundational rather than ornamental. ([Public review summary](https://chrome-stats.com/d/org.howwefeel.moodmeter/reviews))
4. **Engagement naturally declines.** A cohort study involving *How We Feel* observed the highest screen time in week one and a decline across four weeks. This does not prove a design defect, but it cautions against assuming novelty produces habit. ([JMIR cohort study](https://pmc.ncbi.nlm.nih.gov/articles/PMC11615540/))
5. **Color associations are not universal or sufficient.** Cultural and accessibility testing in Nigeria is required. The design must survive grayscale, color-vision differences, translation, small screens, and TalkBack/VoiceOver.

## Original design direction for Reflections with God

### Visual thesis: “A living field, then a quiet page”

- **Check-in:** deep ink background; large serif question; freely arranged but accessible emotion tokens; clear word labels; restrained luminous color.
- **Selection:** chosen tokens gently expand and reveal definition plus mild/moderate/strong controls.
- **Direction confirmation:** emotional colors collect into a subdued ribbon or horizon; the app recommends a direction in human language.
- **Scripture unit:** transition to warm paper, generous margins, strong reference, readable Scripture, quiet context, reflection, and prayer. Emotion color becomes a small accent rather than dominating sacred text.
- **Timeline:** moments appear as quiet points or cards, not a progress bar. Available, opened, and missed states use text and shape—not success/failure colors.
- **Recap:** a composition of the day’s emotion tokens, passages, and neutral language. No causal claim that Scripture “fixed” the user.
- **History:** date-led cards and a spacious calendar. Empty days are simply empty.

### Proposed token families

These are conceptual roles, not final hex values:

- **Ink / Night:** contemplative check-in canvas.
- **Paper / Warm light:** Scripture-reading surface.
- **Ember:** high-energy difficult states.
- **Sun:** high-energy pleasant states.
- **River:** low-energy difficult states.
- **Garden:** low-energy pleasant states.
- **Gold thread:** Scripture, prayer, and sacred emphasis; never used as a performance reward.

Every family requires WCAG-tested foreground pairings, a shape counterpart, and explicit labels.

## Recommended implementation sequence

1. Preserve the current semantic emotion model; add a presentation-only emotion-token map.
2. Prototype the check-in as an accessible adaptive field, with a list fallback for screen readers and reduced motion.
3. Establish the “living field → quiet page” transition before adding more visual complexity.
4. Apply stable emotion tokens to recap/history only after the final-check-in model is complete.
5. Test with Nigerian Christian adults across Android performance tiers; measure comprehension, burden, spiritual tone, and accessibility—not visual preference alone.

## Evidence assessment and limitations

Primary sources establish product intent, scientific collaborators, privacy claims, and award rationale. App-store materials and image archives establish visible interface patterns. Designer portfolios establish involvement and design goals. Independent critiques and review aggregations are useful for identifying usability hypotheses, but are not controlled evaluations and may reflect different app versions. Public ratings are susceptible to selection and platform bias. The cited cohort study concerns engagement, not comparative visual effectiveness. No source demonstrates that *How We Feel’s* specific visual treatment will transfer unchanged across cultures or to a Christian Scripture product.

This report therefore supports a design hypothesis, not a claim of proven superiority. The proposed translation must be validated through accessible prototypes and Nigeria-based research.

## AI-assisted research disclosure

AI-assisted tools were used to search, screen, compare, and synthesize sources. Product claims were attributed to their owning or primary sources where available; secondary visual analyses were kept distinct from official claims.
