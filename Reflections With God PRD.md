# **Mood Responsive Scripture App Product Requirements Document**

## *Developer specification for a private daily Scripture journey shaped by the user’s emotional state*

## *Version 1.1  \|  Implementation hardened  \|  Nigeria alpha and beta*

This document defines a mobile Christian application that helps legal adults meet their emotions with Scripture throughout the day. It translates the approved product principles into implementation requirements, decision rules, safety boundaries, editorial controls, data responsibilities, and testable acceptance criteria. It is intended to let product, design, engineering, content, pastoral review, and quality assurance teams ship and update the product without having to reinterpret its purpose.

The governing decision is simple: the experience is a mood-responsive Scripture journey, not a conventional reading plan, therapy product, notification engine, or gamified habit app. The system should respect the stages of human emotion, deepen biblical understanding with concise context, and move each person gently toward the healthiest fitting state and, ultimately, joy and maturity in Christ.

# **Document control**

| Field | Value |
| :---- | :---- |
| Product status | Implementation-ready MVP baseline; naming intentionally deferred. |
| Initial market | Nigeria alpha and beta; public launch follows validation. |
| Platforms | iOS and Android. |
| Audience | Legal adults seeking a consistent daily Bible reading habit, including Christians still growing in their faith. |
| Business model | Free for MVP. |
| Editorial posture | Explicitly Christian, denominationally neutral within a historic Christian core, pastor- and scholar-reviewed. |
| Primary owner | Product owner to be assigned. |
| Change rule | Any update that alters theological posture, safety behavior, privacy, passage cadence, or anti-gamification principles requires explicit product and editorial approval. |

# **1 Product vision**

## **1.1 Product promise**

After 30 days, the product should help a user build a more consistent Scripture habit, improve their understanding of selected passages, and recognize the movement of their emotions across a day. It helps users meet emotions with Scripture; it does not promise that painful emotions will disappear, that every day will end happily, or that the app can replace God, church, pastors, trusted relationships, or professional care.

## **1.2 Core experience statement**

At 8 a.m., the user selects up to three emotions and assigns an intensity of mild, moderate, or strong. The user may optionally identify what contributed to the emotion or select “I do not know how I feel.” The system recommends an emotional direction, the user may amend it, and the app begins a reviewed Scripture journey. From 8 a.m. through 10 p.m., a new complete unit becomes available every 30 minutes. Each unit contains a different selected passage, only the context needed to understand it, a reflection, and an editable prayer generated from approved theological building blocks. Optional two-hour check-ins allow the journey to adjust. A final mood check produces a neutral recap of the emotional path and Scripture engagement.

## **1.3 Product principles**

* Scripture leads; mood guides selection and application but does not rewrite meaning.  
* Emotional movement is gradual and human. Lament may precede comfort; grounding may precede gratitude.  
* A difficult mood moves toward the healthiest fitting state, not forced cheerfulness.  
* A positive mood is sustained and matured through gratitude, wisdom, humility, love, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control where the text supports them.  
* The app never treats happiness as suspicious. It introduces caution only when the user’s input supports it.  
* Every recommendation is explainable through reviewed editorial metadata.  
* Private practice is the product surface; healthy church and pastoral connection are encouraged contextually and periodically.  
* No streaks, points, badges, leagues, leaderboards, scores, artificial scarcity, shame, or competitive progress.  
* User correction outranks inferred behavior.  
* Sensitive data is minimized, encrypted, controllable, and deletable.

# **2 Goals and non goals**

## **2.1 MVP goals**

| Goal | Evidence of success |
| :---- | :---- |
| Build a daily Scripture habit | Users begin days, engage with multiple units, return over 7 and 30 days, and do not broadly disable notifications. |
| Deepen understanding | Users can restate or apply passage meaning in optional reflection prompts without quiz mechanics. |
| Support emotional awareness | Users can identify up to three emotions, track intensity, and review neutral daily movement. |
| Provide responsible personalization | Recommendations fit confirmed moods and improve after explicit feedback without treating behavior as moral evidence. |
| Protect trust | No unreviewed theology, no routine staff access to raw reflections, clear consent, reliable deletion, and manually verified Nigeria support resources. |
| Support rapid iteration | Rules, content metadata, analytics, flags, and acceptance tests are explicit enough for small updates without re-litigating the product. |

## **2.2 Non goals for MVP**

* Replacing a Bible, church, pastor, counselor, clinician, emergency service, or trusted person.  
* Diagnosing mental-health conditions or claiming therapeutic outcomes.  
* Open-ended AI interpretation of Scripture.  
* Community feeds, messaging, public sharing, groups, or church dashboards.  
* Multiple Bible translations, audio, video, journaling export, paid subscriptions, or denominational teaching tracks.  
* A comprehensive book-by-book study plan.  
* A reward loop based on completion, attendance, streak preservation, or guilt.

# **3 Audience and scope**

## **3.1 Primary user**

A legal adult who wants a consistent daily Bible reading habit and values emotional relevance. The user may be mature in faith or still learning basic Christian practice. The interface must use plain language, avoid insider shorthand where possible, and never patronize newer believers.

## **3.2 Eligibility and launch boundaries**

**AUD-001**  Registration and onboarding must require confirmation that the user is 18 years or older for the Nigeria alpha and beta. Any later market must receive its own age and consent review.

**AUD-002**  MVP availability and support resources must be configured for Nigeria.

**AUD-003**  The product must not be marketed as therapy, diagnosis, crisis care, prophecy, or a replacement for church community.

# **4 Daily experience**

## **4.1 Default daily schedule**

| Time | System behavior | Interruptive alert |
| :---- | :---- | :---- |
| 8:00 a.m. | Morning check-in opens the day and generates the initial arc. | Yes. Discreet invitation; no Scripture text. |
| Every 30 minutes through 10:00 p.m. | A new complete Scripture unit is added automatically to the private timeline. | No. |
| 10:00 a.m. and every two hours thereafter | Optional check-in opportunity can adapt the remaining arc. | No mandatory alert. Surface in app; user may opt into additional reminders. |
| 2:00 p.m. | Midday re-centering invitation. | Yes. Discreet invitation; no Scripture text. |
| 8:00 p.m. | Evening reflection invitation. | Yes. Discreet invitation; no Scripture text. |
| 10:00 p.m. | Final mood check and recap become available; the day closes. | Passive availability by default. |

Counting both endpoints, the schedule supports up to 29 passage units from 8 a.m. to 10 p.m. The system must not create 29 push interruptions. Notification settings must offer Gentle, Rhythm, Companion, and Silent modes, with Rhythm as the default and only three daily pushes.

### **Late start and schedule recovery**

**SCH-001**  The daily window remains 8 a.m. to 10 p.m. in the user’s selected timezone, but the journey begins when the user completes that day’s opening check-in.

**SCH-002**  If the first check-in occurs after 8 a.m., deliver one complete opening unit immediately, replace all elapsed slots with one shortened catch-up, and join the next local half-hour boundary. Do not generate or display the missed units individually.

**SCH-003**  If the device is offline, use the most recent valid cached content package. Queue check-ins and feedback locally, then synchronize without duplicating units when connectivity returns.

**SCH-004**  A timezone change must preserve one journey per user-local calendar date, prevent duplicate passages, and ask the user to confirm the new schedule before rescheduling remaining moments.

## **4.2 Morning check-in**

**CHK-001**  The user must either select one to three emotions or choose the distinct state “I do not know how I feel.” An empty, unexplained mood state is not valid.

**CHK-002**  Each selected emotion uses one intensity label: mild, moderate, or strong. Numeric scoring must not appear in the user interface.

**CHK-003**  No emotion is permanently primary. The app may optionally ask which feels strongest right now.

**CHK-004**  The app may ask what contributed to the emotion, but the response is optional and skippable.

**CHK-005**  Free writing is excluded from the default V1 check-in. A later opt-in deeper-analysis path may accept a specific reflection under explicit consent.

**CHK-006**  The app proposes an emotional direction in plain language. The user may accept, edit, or replace it.

## **4.3 Emotional direction**

| Starting state | Illustrative healthy direction | Examples of prohibited shortcuts |
| :---- | :---- | :---- |
| Grief | Lament, companionship, comfort, hope | Forced celebration; implying grief reflects weak faith |
| Anxiety | Grounding, honesty, trust, wise next steps | Guaranteed safety; “just have faith” |
| Anger | Truthful naming, restraint, justice, peace | Suppressing legitimate harm; moral condemnation |
| Shame | Grace, confession where appropriate, dignity, restoration | Assuming guilt; using shame as motivation |
| Loneliness | Presence, belonging, connection, community | Claiming the app is sufficient companionship |
| Numbness | Permission, stillness, gentle awareness | Demanding enthusiasm |
| Joy | Gratitude, worship, generosity, sustained joy | Treating happiness as suspicious |
| Confidence | Gratitude, humility, courage, stewardship | Automatically warning about pride |
| Excitement | Thanksgiving, discernment, patience, self-control | Dampening joy without contextual reason |

**EMO-001**  The system must support emotions being held before they are redirected. Holding means acknowledging and accompanying an emotion without demanding immediate change.

**EMO-002**  The system must not claim that happiness is guaranteed by 10 p.m. Joy in Christ is a theological horizon, not a measurable same-day promise.

**EMO-003**  If the user reports feeling worse, the remaining arc must slow and prioritize acknowledgment, grounding, and support.

**EMO-004**  If the user reports feeling better, the remaining arc must consolidate the improvement rather than continue treating the user as a problem to fix.

**EMO-005**  The intended arc remains invisible. The user experiences a natural sequence, not an optimization dashboard.

## **4.4 Scripture unit**

**SCR-001**  Every 30-minute unit must contain four parts: selected Scripture, brief context, reflection, and prayer.

**SCR-002**  Each unit must use a different passage from every other unit that day. Passages may come from the same biblical book.

**SCR-003**  Passage length is determined by what preserves meaning, not a fixed verse count.

**SCR-004**  The interface shows selected verses and provides only the surrounding context necessary to understand them.

**SCR-005**  The day may use familiar and lesser-known passages in balance. Old and New Testament balance is not a quota; relevance and faithful use take priority.

**SCR-006**  If no reviewed passage safely fits, use a broadly appropriate reviewed grounding passage. Never invent a quotation or improvise an uncertain theological match.

**SCR-007**  Violence, judgment, sexuality, slavery, and other difficult texts are excluded from mood-responsive delivery in MVP and may appear only in structured study with reviewed explanation.

**SCR-008**  Each unit becomes available automatically on schedule. If the app is closed, the timeline updates without generating an extra alert.

## **4.5 Unit interaction**

**INT-001**  The user can read the full available unit without a timer, countdown, or artificial delay.

**INT-002**  The unit may invite a meaningful action: acknowledge reading, request a clearer explanation, answer or skip reflection, and read or edit the prayer.

**INT-003**  Completion must never be represented as points, a score, a streak, a badge, a level, or moral success.

**INT-004**  Every recommendation provides “This fits” and “Not for me.” Negative feedback may specify wrong emotion, wrong tone, confusing context, theological concern, repetition, or another reason.

**INT-005**  The system must never describe a skipped unit as failure, falling behind, breaking a streak, or rejecting Scripture.

**INT-006**  “This fits” and “Not for me” must be available on every unit but visually secondary. The interface must not demand feedback before the user continues.

## **4.6 Missed moments and catch-up**

**CAT-001**  Unopened units must not create an intimidating backlog.

**CAT-002**  When several units are missed, present a shortened catch-up consisting of one reviewed representative passage, essential context, one reflection, and one prayer.

**CAT-003**  The catch-up must preserve the current emotional direction and record that intermediate units were missed without presenting them as debt.

**CAT-004**  After catch-up, resume from the current scheduled moment.

### **Unit state model**

| State | Meaning | Allowed next states |
| :---- | :---- | :---- |
| scheduled | A future slot exists; content may be reserved but is not user-visible. | available, superseded |
| available | The unit is visible and has not been opened. | opened, skipped, superseded |
| opened | The user viewed the unit. | completed, skipped |
| completed | The user performed at least one meaningful unit action. | Terminal |
| skipped | The user explicitly chose to move on. | Terminal |
| superseded | An unopened unit was replaced by catch-up or schedule recovery. | Terminal; retain content ID and reason for audit only |

**CAT-005**  A catch-up supersedes all unopened earlier units since the last meaningful interaction. Superseded content must not appear in user history, count as encountered, or influence the deepest-engagement selection.

**CAT-006**  For audit, retain only the superseded content IDs, timestamps, and reason code. Do not retain generated prayer text or user-private content for unopened superseded units.

## **4.7 Optional check-ins**

**CHK-010**  At each two-hour opportunity, the user may confirm, add, remove, or change up to three emotions and their intensities.

**CHK-011**  The system may infer an additional emotion but must ask for confirmation before using it.

**CHK-012**  A rejected inference must not affect the arc and should reduce the likelihood of repeating that inference in similar contexts.

**CHK-013**  Accepted updates recalculate only future units. Previously delivered content remains unchanged in history.

## **4.8 Final check-in and recap**

**REC-001**  At 10 p.m., request a final emotion and intensity check before generating the recap.

**REC-002**  Compare the final state with the initial 8 a.m. state using neutral language.

**REC-003**  Do not claim that Scripture caused the emotional change or that lack of change indicates spiritual failure.

**REC-004**  Include emotions selected and confirmed, passages encountered, saved reflections, prayer themes, and the passage with the deepest engagement.

**REC-005**  Invite the user to revisit the most deeply engaged passage without assigning a reward.

**REC-005A**  Determine deepest engagement by asking the user “Which passage stayed with you?” If they do not answer, omit the highlight rather than infer it from time-on-screen.

**REC-006**  End the day without automatically planning tomorrow.

**REC-007**  Store each recap as private history under the user’s retention setting.

# **5 Sunday experience**

**SUN-001**  Sunday mode must not assume church attendance.

**SUN-002**  Offer Prepare, Reflect, or Rest as optional postures while preserving the same mood-responsive engine.

**SUN-003**  Encourage healthy church participation contextually and periodically, without recommending a particular church.

**SUN-004**  Provide reviewed criteria for identifying a healthy Christian community, including faithful teaching, accountable leadership, care, service, safety, and freedom from coercion.

**SUN-005**  On Sunday, the morning check-in offers Prepare, Reflect, Rest, or Continue Normally. The choice changes tone and reflection prompts, not the 30-minute availability schedule, privacy rules, or safety behavior.

**SUN-006**  Prepare focuses on attentiveness and worship; Reflect supports response to what the user has heard or read without requiring church attendance; Rest uses a quieter reviewed arc with no performance language.

# **6 Scripture and editorial system**

## **6.1 Translation**

**EDT-001**  Use one editorial default Bible translation whose text and distribution rights are verified for the intended use before implementation.

**EDT-002**  “Open source” must not be treated as a sufficient legal conclusion. Product counsel or an authorized owner must verify license terms, attribution, modification, offline storage, API use, and redistribution.

**EDT-003**  Translation selection and written license approval are pre-development dependencies for content ingestion, offline caching, quotation display, attribution, and distribution. Production content engineering must not begin without them.

## **6.2 Editorial governance**

MVP theology should remain within a historic Christian core. Contentious doctrinal topics are excluded from personalized interpretation rather than flattened into a false universal consensus. The app must not state that a contested view is what all Christians believe.

| Role | Responsibility |
| :---- | :---- |
| Ordained pastor | Pastoral tone, spiritual care, prayer suitability, risk of shame or coercion. |
| Biblical scholar | Textual fidelity, context, genre, cross-reference integrity, and interpretive bounds. |
| Content editor | Clarity, consistency, accessibility for developing Christians, and version control. |
| Safety reviewer | Distress language, escalation copy, prohibited claims, and resource verification. |
| Product owner | Final scope, rollout, metrics, and conflict resolution without overruling mandatory safety or licensing constraints. |

### **Editorial constitution**

**EDG-001**  Before content production, pastors and scholars must approve a versioned editorial constitution defining the affirmed historic Christian core, interpretation rules, prohibited claims, and excluded disputed subjects.

**EDG-002**  At minimum, the exclusion register must address baptismal disputes, communion, predestination, spiritual gifts, gender roles, sexuality, healing claims, prosperity teaching, deliverance claims, and end-times systems. The register may be expanded without implying that every mention of these subjects is prohibited in Scripture itself.

**EDG-003**  A unit requires approval from at least one ordained pastor and one biblical scholar. Neither approval substitutes for the other.

**EDG-004**  If reviewers disagree on textual meaning, pastoral suitability, or denominational neutrality, the unit remains unpublished. The editorial lead records the disagreement, commissions a revision or third review, and publishes only after both required roles approve the revised version.

**EDG-005**  Every approval, rejection, retirement, and emergency rollback must record reviewer identity, role, content version, date, and reason.

## **6.3 Required content metadata**

The following metadata is necessary even though it remains invisible to users. It prevents keyword matching from becoming theology and makes recommendations auditable.

| Field | Purpose |
| :---- | :---- |
| Passage identifier | Canonical book, chapter, and verse range. |
| Licensed text reference | Version and source rights record. |
| Mood tags | Reviewed emotional states for which the passage may be appropriate. |
| Intensity bounds | Mild, moderate, strong; prohibited levels where relevant. |
| Theological purpose | What the passage can responsibly teach or support. |
| Emotional movement | Acknowledge, hold, ground, comfort, reframe, encourage, consolidate, or close. |
| Context note | Only what is needed to understand the selected verses. |
| Contraindications | Situations where the passage or tone should not be used. |
| Prayer blocks | Approved address, confession, gratitude, petition, surrender, intercession, and closing language. |
| Review status | Draft, pastor reviewed, scholar reviewed, safety reviewed, approved, retired. |
| Version and audit trail | Who changed what, when, and why. |

### **Alpha content coverage gate**

The alpha may support a deliberately limited emotion set, but every supported state must be complete enough to sustain the promised day. “Adequate coverage” means passing the matrix below before the state is enabled for participants.

| Coverage dimension | Required alpha minimum |
| :---- | :---- |
| Single-emotion day | At least 29 distinct approved passages remain eligible after intensity, contraindication, and difficult-text filters. |
| Emotion by intensity | Each supported emotion at mild, moderate, and strong has at least three approved candidates for every applicable movement stage. |
| Movement stages | Acknowledge or hold, ground, comfort or reframe, encourage, consolidate, and close each have reviewed coverage where appropriate. |
| Mixed emotions | The 20 mixed-emotion combinations most likely in pilot research must each pass a simulated 29-slot day without unsafe or duplicate content. |
| Grounding fallback | At least 20 broadly appropriate reviewed fallback units, with no same-day repetition. |
| Prayer coverage | Every approved Scripture unit has compatible approved prayer blocks for address, petition or gratitude, and closing. |
| Adversarial replay | Every supported state passes 100 simulated days with no same-day duplicate, contraindicated selection, unapproved content, or exhausted pool. |

**COV-001**  If a mood or combination fails the coverage gate, the product must route it to the reviewed general grounding arc and must not claim specific personalization.

**COV-002**  Passages may repeat across different calendar days. Ranking should reduce recent repetition, but only same-day repetition is prohibited in MVP.

## **6.4 Prayer generation**

**PRY-001**  AI may compose a prayer only from approved theological building blocks and the structured, confirmed state supplied for the current unit.

**PRY-002**  Prayer language may address God using broader biblical names appropriate to the passage, including Father, Lord, Shepherd, Refuge, and Creator.

**PRY-003**  Every prayer must end explicitly with “in Jesus’ name.”

**PRY-004**  The user may edit a prayer before saving it as their own.

**PRY-005**  The system must not present generated prayer wording as prophecy, revelation, or God speaking directly to the user.

## **6.5 Content assembly boundary**

| Element | MVP authoring rule |
| :---- | :---- |
| Bible text | Verbatim licensed text; never generated or paraphrased as Scripture. |
| Context note | Fully written and approved by pastor and scholar before release. |
| Theological purpose and contraindications | Fully structured and approved before release. |
| Reflection prompt | Prewritten and reviewed; AI may select but not create a new theological claim. |
| Prayer | Grammar-level composition from approved blocks using confirmed structured inputs; editable by the user. |
| Connective interface copy | May be template-composed from approved neutral phrases; must not add interpretation. |
| Recap | Template-generated from structured events and user-confirmed language; no causal, prophetic, diagnostic, or moral inference. |

**ASM-001**  No model may create or modify Bible text, context, doctrinal explanation, theological purpose, contraindication, or disputed-doctrine guidance at runtime.

**ASM-002**  Every model output must pass deterministic policy checks. If assembly fails or includes an unapproved component, use a fully prewritten fallback unit.

# **7 Recommendation engine**

## **7.1 Inputs and priority**

| Priority | Input | Rule |
| :---- | :---- | :---- |
| 1 | Explicit safety state | Safety overrides all ordinary recommendations. |
| 2 | Confirmed emotions and intensities | Primary personalization signal. |
| 3 | User-selected or edited direction | Overrides the system-proposed direction. |
| 4 | Explicit “fits” or “not for me” feedback | Strong learning signal. |
| 5 | Current point in the daily arc | Controls movement and tone. |
| 6 | Passage history for the day | Prevents same-day repetition. |
| 7 | Behavioral signals | Weak secondary signal only; never a moral judgment. |
| 8 | Longitudinal patterns | May influence suggestions only when consistent with current confirmed input. |

## **7.2 Selection constraints**

**ENG-001**  Select only from content with all required approvals.

**ENG-002**  Filter out passages already delivered that day.

**ENG-003**  Respect contraindications and distress state before ranking relevance.

**ENG-004**  Prefer faithful contextual fit over novelty, testament balance, popularity, or predicted engagement.

**ENG-005**  Do not optimize for notification opens at the expense of reflection quality, notification trust, or emotional safety.

**ENG-006**  Log the content identifiers, input state, rule path, and model version needed for audit without logging raw encrypted reflection text.

**ENG-007**  Select content progressively: finalize the current unit and reserve no more than the next three scheduled candidates. A confirmed check-in invalidates only still-scheduled candidates, preserving opened or available history.

## **7.3 Reference decision flow**

1. Receive confirmed mood set, intensity, optional cause, accepted direction, current arc stage, and safety state.  
2. If explicit high-risk language is present, enter the safety flow and pause ordinary delivery.  
3. Filter the reviewed library by mood suitability, intensity, theological purpose, contraindications, and same-day history.  
4. Rank for contextual fit and the next healthy emotional movement.  
5. If no safe specific match exists, select a reviewed general grounding unit.  
6. Assemble context, reflection, and prayer from approved components.  
7. Record an auditable recommendation event and add the unit to the timeline.  
8. Use explicit feedback to adapt future ranking; use behavior only as a weak secondary signal.

# **8 Notification system**

**NOT-001**  Default to Rhythm mode with three daily pushes at 8 a.m., 2 p.m., and 8 p.m.

**NOT-002**  Push copy must be a short discreet invitation and contain no Scripture text, mood label, journal content, or sensitive inference.

**NOT-003**  Ordinary notifications must use passive or low-importance behavior and must not bypass Focus, Do Not Disturb, or equivalent system controls.

**NOT-004**  Gentle mode sends one user-selected daily push. Companion mode may remind at two-hour check-ins only after explicit opt-in. Silent mode sends none.

**NOT-005**  Ask for notification permission only after the user experiences a meaningful Scripture unit or explicitly enables a reminder schedule.

**NOT-006**  If prompts are repeatedly ignored, suggest changing the schedule or reduce prompting. Never escalate frequency.

**NOT-007**  No badge may represent spiritual debt or accumulated unread Scripture.

**NOT-008**  Offer an optional user-configurable 10 p.m. closing reminder. It is off by default and does not change the three-push Rhythm default.

# **9 Safety and pastoral boundaries**

## **9.1 Product boundary**

The app offers spiritual reflection. It is not therapy, diagnosis, medical advice, crisis intervention, prophecy, or a direct channel from God. It may encourage contact with a trusted person, pastor, clinician, or emergency service when appropriate.

## **9.2 Distress behavior**

**SAF-001**  A strong sadness selection without explicit high-risk language should produce a gentle nudge inviting the user to share more or contact someone trusted. It must not trigger the emergency interruption by itself.

**SAF-002**  The safety interruption is triggered by explicit high-risk language under the approved policy. The alpha and beta should prioritize precision and review false-negative risk continuously; this policy must be revisited with qualified safety advisors before public scale.

**SAF-002A**  All text-capable private input surfaces, including reflection responses and prayer edits, must run the approved risk classifier on device before encryption and synchronization. The server receives only a minimal risk-state code and intervention status unless the user deliberately shares text.

**SAF-003**  When triggered, pause the ordinary Scripture journey, show a calm safety message, provide manually verified Nigeria-specific support routes, and encourage contact with a trusted person, pastor, clinician, or emergency service as appropriate.

**SAF-004**  Resume only after the user confirms they are safe enough to continue.

**SAF-005**  The first resumed unit must use a specially reviewed comfort or grounding passage.

**SAF-006**  Crisis and pastoral resources must be manually verified before alpha, beta, and every public release, with owners and review dates recorded.

**SAF-007**  Before public launch, qualified safety advisors must review indirect-risk misses, adversarial paraphrases, Nigerian language usage, and observed beta incidents, then approve or revise the explicit-only interruption threshold.

**SAF-008**  Public launch is blocked if the safety review is incomplete, verified resources are unavailable, or any critical test scenario lacks a safe response.

## **9.3 Prohibited language**

* “God told me to tell you” or equivalent claims of direct revelation.  
* Claims that sadness, anxiety, grief, or distress proves weak faith.  
* Claims that a specific event happened because of the user’s sin, faith, or spiritual status.  
* Guaranteed healing, safety, prosperity, answered prayer, or emotional improvement.  
* Clinical diagnoses, treatment instructions, or discouragement from professional care.  
* Claims that distress is demonic or requires a particular spiritual intervention.  
* Shame, fear, guilt, threats, or loss framing used to force engagement.  
* Language implying the app is sufficient companionship or should replace human community.  
* Universal doctrinal claims on excluded contentious subjects.  
* Causal claims in recaps that Scripture produced an emotional change.

# **10 Privacy and security**

## **10.1 Governing architecture**

Raw reflections and private histories use genuine user-controlled end-to-end encryption. The operator cannot routinely read them and cannot restore them without a trusted device or user-held recovery key. Account access may be restored separately, but losing every trusted device and recovery key makes encrypted reflection content permanently unrecoverable. The onboarding and recovery flow must explain this consequence plainly.

**PRI-001**  Encrypt raw reflections, prayer edits, and private recap content on device before cloud synchronization.

**PRI-002**  Mood labels, intensities, longitudinal patterns, private recaps, reflections, and prayer edits are encrypted end to end. Servers may receive only the minimum current-session structured signals needed to select content, using short-lived identifiers and without building a readable longitudinal mood history.

**PRI-003**  Do not send raw reflection text to an external AI provider by default.

**PRI-004**  A user may opt into deeper analysis for one selected reflection. Consent must be specific, informed, revocable before submission, and separate from general terms.

**PRI-005**  Opted-in text must use a provider contractually committed to zero training and zero persistent retention. The payload may exist only in volatile processing memory, must be absent from application and provider logs, and must be cleared when the response completes or fails. If a zero-retention provider cannot be verified, deeper analysis remains disabled.

**PRI-006**  No employee receives routine access to raw reflections. Operational support uses non-content metadata. Exceptional access is unavailable for genuinely end-to-end encrypted content unless the user deliberately shares a decrypted item.

**PRI-007**  Default encrypted private-history retention is 30 days. Users may choose 24 hours, 30 days, one year, or until deleted. Shortening retention applies prospectively and queues older eligible content for deletion.

**PRI-008**  Account deletion must remove cloud content, derived personalization memory, identifiers, and recoverable backups according to a published deletion schedule, then provide confirmation.

**PRI-009**  Security logs must avoid mood text, Scripture reflections, prayer edits, and decrypted content.

**PRI-010**  The implementation must complete privacy, threat-model, and applicable Nigerian legal review before external testing.

## **10.2 Key recovery and device trust**

**KEY-001**  Generate encryption keys on a trusted device using a reviewed cryptographic design. The operator must never receive the private decryption key in recoverable form.

**KEY-002**  During onboarding, require the user to create or export a human-usable recovery secret and confirm possession before enabling cloud history sync.

**KEY-003**  Store device keys in platform secure storage. Adding a new trusted device requires approval from an existing trusted device or the recovery secret.

**KEY-004**  Allow users to list and revoke trusted devices. Revocation prevents future synchronization and triggers key rotation where required by the chosen protocol.

**KEY-005**  Provide calm, non-coercive recovery reminders after setup and before destructive device changes. Never use fear or streak-style pressure.

**KEY-006**  If all trusted devices and the recovery secret are lost, restore account access but not encrypted private history. Explain the permanent loss before recovery is finalized.

# **11 Functional requirements by surface**

| Surface | Must support |
| :---- | :---- |
| Onboarding | Christian purpose, adult eligibility, product boundaries, privacy model, recovery-key explanation, notification value, translation attribution. |
| Home and timeline | Current unit, next availability, optional check-in, shortened catch-up, no debt indicators, discreet end-of-day entry. |
| Mood check-in | Up to three emotions, mild/moderate/strong, “I do not know,” optional strongest emotion, optional cause, direction confirmation. |
| Scripture unit | Passage, essential context, reflection, editable prayer, fit feedback, report action. |
| Recap | Initial/final comparison, passages, engagement, selected or confirmed emotions, prayer themes, revisit invitation, private history. |
| History | Encrypted daily recaps, filters by date, user-controlled deletion, no public sharing in MVP. |
| Settings | Notification mode and times, retention, encryption recovery, consent history, privacy controls, account deletion. |
| Support | Pastoral/church guidance criteria, verified Nigeria safety resources, app support without access to private content. |
| Editorial console | Content lifecycle, dual review, metadata, contraindications, versioning, retirement, audit trail, emergency rollback. |
| Operations console | Aggregate service health and privacy-safe metrics only; no raw journal browser. |

# **12 Data model**

| Entity | Key fields | Privacy class |
| :---- | :---- | :---- |
| User account | User ID, adult attestation, locale, timezone, consent versions | Confidential |
| Trusted device | Device key ID, public key, revocation state, last sync | Restricted |
| Daily journey | Date, encrypted state, current stage, arc version | Restricted |
| Mood check-in | Confirmed emotion IDs, intensity, optional cause category, encrypted note reference | Sensitive |
| Scripture unit | Content version, scheduled time, delivery state, feedback | Confidential |
| Reflection | Encrypted payload, retention policy, timestamps | Highly sensitive |
| Prayer | Approved block IDs, encrypted user edits | Highly sensitive |
| Recap | Encrypted narrative plus structured private summary | Highly sensitive |
| Editorial content | Passage, context, tags, purpose, contraindications, approvals | Internal |
| Safety event | Minimal trigger category, intervention status, timestamps; avoid raw text | Highly sensitive |
| Analytics event | Pseudonymous ID, event type, content ID, coarse time, no raw text | Confidential |
| Consent record | Consent type, version, decision, timestamp | Restricted |

# **13 Analytics and success measures**

## **13.1 MVP measures**

| Measure | Definition | Guardrail |
| :---- | :---- | :---- |
| Day start rate | Eligible users completing the 8 a.m. check-in | Do not pressure users to preserve a streak. |
| Journey engagement | Distinct units meaningfully opened or acted on per active day | Do not treat maximum volume as inherently better. |
| Reflection quality | Optional completion and self-explanation signals | No grading or correctness score. |
| Comprehension | Periodic optional “in your own words” or application prompts | No quiz, rank, badge, or pass threshold. |
| Mood awareness | Completion of initial/final checks and confirmed corrections | Do not claim clinical improvement. |
| Retention | Return on days 7 and 30 | Interpret alongside notification trust and burden. |
| Notification trust | Permission grant, disable rate, mode changes, prompt response | Opens alone are not success. |
| Content fit | Fits/not-for-me rate and reason distribution | Review by passage and emotional state. |
| Safety quality | Intervention completion, verified-resource availability, reviewed false positives and negatives | Restricted reporting and qualified oversight. |
| Privacy trust | Deletion completion, consent withdrawal, recovery failures, support cases | Never log private content to improve a metric. |

## **13.2 Anti-gamification analytics rule**

Analytics may assess product quality internally, but user-facing progress must remain reflective rather than competitive. Do not expose scores, streak counts, completion percentages, percentile comparisons, ranks, achievements, celebratory confetti tied to volume, or loss aversion. A calm history of days and recaps is permitted when it does not frame gaps as failure.

## **13.3 Provisional alpha and beta gates**

These figures are product hypotheses for the Nigeria closed beta, not claims of universal performance. The product owner may revise them only through a documented decision that preserves safety, privacy, and anti-gamification guardrails.

| Metric | Provisional gate | Interpretation |
| :---- | :---- | :---- |
| Day-one initiation | At least 70% of enrolled testers complete one opening check-in. | Tests onboarding clarity, not spiritual commitment. |
| Seven-day return | At least 35% return and begin a journey on or after day seven. | Review by notification mode and device class. |
| Thirty-day return | At least 15% return and begin a journey on or after day thirty. | Do not use streak mechanics to raise it. |
| Content fit | At least 70% of explicit fit judgments are “This fits.” | Review lower-performing emotion and passage combinations. |
| Theological concern rate | Fewer than 1% of delivered units receive a theological-concern report, with zero unresolved critical reports. | Any critical report triggers immediate review regardless of rate. |
| Notification disable rate | Fewer than 20% of testers who grant permission disable all app notifications during beta. | Interpret with mode changes and qualitative feedback. |
| Catch-up comprehension | At least 80% of surveyed catch-up users understand they are not behind. | Tests humane recovery language. |
| Resource availability | 100% of safety-resource checks succeed during release verification. | Any failure blocks release. |
| Deletion completion | At least 99% complete within the published deletion window; 100% of failures are investigated. | Never claim deletion before completion. |
| Recovery setup | At least 90% of users enabling cloud history confirm a recovery secret. | Cloud history remains disabled until confirmation. |

## **13.4 Non-scored comprehension**

**MET-001**  Sample an optional “in your own words” or “what does this invite you to notice?” prompt no more than twice per day by default.

**MET-002**  Do not grade, rank, correct, or award comprehension responses in MVP. Measure response rate and optional self-reported clarity only.

**MET-003**  Store comprehension text only inside the encrypted private history under the user’s retention setting. Analytics receive only whether a prompt was answered and an optional clarity category.

# **14 Nonfunctional requirements**

**NFR-001**  Accessibility: support screen readers, dynamic text, high contrast, reduced motion, clear focus order, and non-color indicators.

**NFR-002**  Reliability: scheduled units and check-ins must be resilient to intermittent Nigerian mobile connectivity. Cache the reviewed content needed for the active day when feasible.

**NFR-003**  Performance: first meaningful content should render quickly on typical mid-range Android devices; exact budgets must be set during technical discovery.

**NFR-004**  Offline behavior: previously synchronized units and decrypted local history remain accessible on trusted devices; unsynchronized updates queue safely.

**NFR-005**  Timezone: schedule against the user’s selected local timezone and handle travel and daylight changes without duplicate same-day passages.

**NFR-006**  Auditability: editorial and recommendation decisions must be reproducible from approved versions and structured inputs without exposing raw private content.

**NFR-007**  Observability: errors, latency, delivery, and synchronization metrics must be privacy-safe and must not contain reflection or prayer content.

**NFR-008**  Security: conduct threat modeling, secure key storage, dependency review, encryption review, and penetration testing before public launch.

**NFR-009**  Behavioral personalization uses a rolling 30-day window with recency decay. Explicit corrections and “not for me” feedback persist until the user resets personalization or account data, while passive opens and skips lose influence over time.

# **15 Acceptance criteria**

## **15.1 Core journey**

| ID | Given | When | Then |
| :---- | :---- | :---- | :---- |
| AC-001 | A new eligible day | The user completes the 8 a.m. check-in | The app creates a reviewed arc and displays the first complete unit. |
| AC-002 | The app is closed | A 30-minute boundary passes | A new unit is added silently without an extra push. |
| AC-003 | A passage was already used today | The engine selects the next unit | That exact passage is excluded. |
| AC-004 | Several units were missed | The user returns | A shortened catch-up appears instead of an unread backlog. |
| AC-005 | The user reports feeling worse | The check-in is confirmed | Future units slow the movement and prioritize grounding. |
| AC-006 | The user reports feeling better | The check-in is confirmed | Future units consolidate improvement and stop treating the user as needing repair. |
| AC-007 | No safe specific match exists | The next unit is due | A reviewed general grounding unit is selected. |
| AC-008 | The user rejects an inferred emotion | The correction is saved | The emotion is not used and the correction becomes a stronger future signal. |
| AC-009 | The final mood is submitted | The recap is generated | It neutrally compares 8 a.m. and final states without causal or moral claims. |
| AC-010 | The first check-in occurs after 8 a.m. | The journey starts | An opening unit appears, elapsed slots collapse into one catch-up, and delivery joins the next half-hour boundary. |
| AC-011 | A unit is superseded by catch-up | History and analytics are reviewed | It is absent from user history and encounter metrics; only its ID, timestamp, and reason remain for audit. |
| AC-012 | No emotion is selected | The user tries to continue | The app requires one to three emotions or the explicit “I do not know how I feel” state. |

## **15.2 Privacy and safety**

| ID | Given | When | Then |
| :---- | :---- | :---- | :---- |
| AC-020 | Raw reflections are synced | Cloud storage is inspected | Only ciphertext and required metadata are present. |
| AC-021 | All trusted devices and the recovery key are lost | The account is recovered | The account returns, but encrypted reflections remain unrecoverable and this is explained. |
| AC-022 | The user opts into deeper analysis | Text is processed | The provider does not train on it and the transient payload is deleted after response. |
| AC-023 | Explicit high-risk language is detected | The policy triggers | The ordinary journey pauses and verified Nigeria support appears. |
| AC-024 | The user confirms safety | The journey resumes | A specially reviewed comfort or grounding unit appears first. |
| AC-025 | The user deletes the account | The deletion window completes | Cloud content, derived memory, and recoverable backups are removed and confirmed. |
| AC-026 | Private text is entered on any supported surface | Risk screening runs | Screening occurs on device before encryption; the server receives no raw text. |
| AC-027 | No zero-retention provider contract is active | The user requests deeper analysis | The feature remains unavailable and the private text is not transmitted. |
| AC-028 | A user enables cloud private history | Recovery setup is incomplete | Synchronization remains disabled until the recovery secret is confirmed. |

## **15.3 Anti-gamification**

| ID | Test | Pass condition |
| :---- | :---- | :---- |
| AC-030 | Inspect every user-facing surface | No points, streaks, scores, ranks, badges, leaderboards, levels, debt counters, or loss warnings. |
| AC-031 | Miss multiple units | Copy offers a calm catch-up and never says the user is behind. |
| AC-032 | Skip a reflection or prayer | The experience continues without penalty or moral interpretation. |
| AC-033 | Review history after inactive days | Gaps remain neutral and are not marked as failures. |
| AC-034 | Receive a comprehension prompt | No pass/fail grade or reward is shown. |

# **16 MVP release plan**

## **16.1 Phase zero content and risk preparation**

* Select and legally verify the default Bible translation.  
* Define the emotion taxonomy, healthy directions, contraindications, and safety policy.  
* Pass the complete alpha content coverage gate for every enabled emotion and intensity.  
* Approve context notes, reflections, prayer blocks, and grounding fallback units.  
* Verify Nigeria crisis, pastoral, clinical, and emergency support routes.  
* Complete privacy architecture, threat model, consent language, and deletion design.

## **16.2 Internal alpha**

* Test scheduling, duplicate prevention, catch-up, changing arcs, offline behavior, and device timezone changes.  
* Run pastor and scholar review against complete sample days, including difficult and positive emotions.  
* Conduct safety simulations without using real crisis disclosures.  
* Validate that telemetry contains no raw sensitive text.  
* Test encryption recovery and unrecoverable-loss explanations with real participants.

## **16.3 Nigeria closed beta**

* Recruit legal adults with varied levels of Christian maturity and typical Android devices and networks.  
* Measure content fit, burden, retention, comprehension, notification trust, and emotional-language quality.  
* Review “not for me” reasons weekly and retire harmful or misleading combinations quickly.  
* Keep support and safety resources current through named owners and dated verification.  
* Do not claim efficacy from beta engagement data.

## **16.4 Public readiness gate**

| Gate | Required evidence |
| :---- | :---- |
| Content | Translation license approved; editorial constitution active; dual review complete; every enabled state passes the coverage matrix and adversarial replay; zero unresolved critical reports. |
| Safety | Qualified advisors approve the threshold after indirect-risk and Nigerian-language testing; Nigeria resources current; all critical scenarios pass. |
| Privacy | Encryption and deletion independently reviewed; consents verified; provider contracts checked. |
| Reliability | Scheduling, sync, offline, and notification behavior meet agreed service thresholds. |
| Accessibility | Critical flows pass manual and automated accessibility review. |
| Product fit | Users understand the promise, notification burden is acceptable, and the experience does not feel gamified. |
| Legal | Translation, privacy, terms, claims, and launch-market obligations approved by appropriate counsel or accountable owner. |

# **17 Rapid update playbook**

## **17.1 Change classes**

| Class | Examples | Approval and test |
| :---- | :---- | :---- |
| Low risk | Copy clarity, spacing, non-sensitive analytics labels | Product review, regression test, accessibility check. |
| Content change | Passage tag, context, reflection, prayer block | Pastor and scholar approval; content-fit and contraindication tests. |
| Personalization change | Ranking, mood inference, arc transitions | Product, editorial, privacy, bias, and offline replay tests. |
| Safety change | Trigger policy, interruption copy, support resource | Qualified safety review, resource verification, scenario testing; staged rollout. |
| Privacy or encryption change | Data fields, provider, retention, keys, deletion | Security and privacy review, threat-model update, migration and rollback plan. |
| Foundational change | Cadence, Christian posture, gamification, audience | Explicit product decision and PRD revision before implementation. |

## **17.2 Required update record**

* Plain-language problem and intended outcome.  
* Affected requirement IDs and content versions.  
* Data, theology, safety, accessibility, and notification impact.  
* Acceptance criteria and test evidence.  
* Rollout percentage, monitoring window, success and stop conditions.  
* Rollback procedure and accountable owner.  
* Decision log entry with date and approvers.

## **17.3 Emergency content rollback**

**OPS-001**  The editorial system must support immediate retirement of a passage unit or combination without requiring an app-store release.

**OPS-002**  Retired content must stop future delivery while remaining historically identifiable for audit.

**OPS-003**  A safe reviewed fallback must replace retired content when a scheduled slot is already queued.

# **18 Risks and mitigations**

| Risk | Why it matters | Mitigation |
| :---- | :---- | :---- |
| Proof-texting | Mood matching can detach verses from meaning. | Selected passages, essential context, reviewed purpose, contraindications, and scholar approval. |
| Forced positivity | Users may feel spiritually blamed or emotionally rushed. | Holding stages, adjustable direction, worsening-state slowdown, prohibited language. |
| Notification fatigue | High content cadence could become intrusive. | Three default pushes; silent timeline updates; user modes; no backlog badges. |
| Automation mistaken for authority | AI wording may appear divinely authoritative. | Bounded approved components; explicit product boundary; no revelation language. |
| Sensitive-data exposure | Emotions and prayers are deeply private. | User-controlled encryption, minimization, transient opt-in analysis, no routine staff access. |
| Safety false negatives | Explicit-only trigger policy may miss ambiguous risk. | Strong-sadness nudge, qualified review, beta monitoring, clear access to support; revisit policy before scale. |
| Safety false positives | Over-triggering can feel invasive. | Require explicit high-risk evidence for interruption during alpha/beta; test copy and correction path. |
| Content exhaustion | Up to 29 daily units require a large approved library. | Coverage matrix, non-repeating daily logic, reviewed fallback, staged emotion rollout. |
| Denominational bias | Neutrality can hide a specific interpretation. | Historic core, exclusion of contentious topics, mixed review, explicit uncertainty. |
| Gamification creep | Growth tactics could corrupt the spiritual posture. | Hard prohibited patterns, acceptance tests, foundational-change approval. |
| Encryption recovery burden | True privacy can lead to irreversible loss. | Clear onboarding, recovery key, trusted-device transfer, repeated non-coercive recovery reminders. |

# **19 Open implementation decisions**

These are engineering and operational decisions, not unresolved product questions. Teams may decide them during technical discovery so long as they preserve the requirements above.

* Cross-platform framework versus native applications.  
* On-device model and rule-engine implementation for emotion inference and safety screening.  
* End-to-end encryption protocol, key backup mechanism, trusted-device transfer, and migration strategy.  
* Content delivery and caching architecture for intermittent connectivity.  
* Exact analytics stack and privacy-safe event schema.  
* Infrastructure provider and external AI provider, if any, subject to privacy and no-training requirements.  
* Exact performance and availability service-level objectives based on alpha device and network research.  
* Editorial console implementation and approval workflow.  
* Licensed translation ingestion, attribution, caching, and update mechanism after the pre-development license gate.  
* Product name and visual identity after product principles are signed off.

# **20 Definition of done**

The MVP is done only when the full 8 a.m. to 10 p.m. journey works on iOS and Android; reviewed content can be safely delivered without same-day repetition; optional check-ins adapt future units; missed moments produce a humane catch-up; the recap is neutral and private; notification burden remains user-controlled; privacy and deletion work as described; Nigeria resources are verified; editorial and safety controls are operational; accessibility is validated; and every anti-gamification acceptance test passes.

# **Appendix A Glossary**

| Term | Meaning |
| :---- | :---- |
| Arc | The invisible sequence of emotional movements used to select future Scripture units. |
| Complete unit | A selected passage, essential context, reflection, and editable prayer delivered together. |
| Holding | Acknowledging and accompanying an emotion before attempting to redirect it. |
| Healthy direction | A user-confirmed emotional destination appropriate to the starting state. |
| Grounding fallback | A broadly appropriate reviewed unit used when no safe specific match exists. |
| Catch-up | A shortened representative unit replacing multiple missed moments without creating debt. |
| Explicit feedback | A direct user correction, fit judgment, confirmed emotion, or chosen direction. |
| Behavioral signal | Opening, skipping, reading, or editing behavior used only as weak personalization evidence. |
| Contentious doctrine | A subject with substantial disagreement among mainstream Christian traditions and excluded from personalized interpretation in MVP. |
| User-controlled encryption | Encryption whose private decryption keys are unavailable to the operator; loss of all keys may make content unrecoverable. |

# **Appendix B Decision log**

| Decision | Resolution |
| :---- | :---- |
| Product center | Mood-responsive daily Scripture journey. |
| Emotional goal | Healthiest fitting state first; joy in Christ as horizon, not forced same-day result. |
| Cadence | Complete unit every 30 minutes from 8 a.m. through 10 p.m.; three default pushes. |
| Check-ins | Optional every two hours; future arc adapts. |
| Repetition | No exact passage repeats within one day. |
| Context | Only what is needed to understand the selected passage. |
| AI boundary | Bounded selection and composition from human-approved content. |
| Prayer | Generated from approved blocks, editable, ends in Jesus’ name. |
| Theology | Historic Christian core; contentious topics excluded from personalized content. |
| Privacy | User-controlled end-to-end encryption; transient opt-in deeper analysis; no training. |
| Safety | Explicit-risk interruption, pause until safety confirmation, then reviewed comfort unit. |
| Community | Private product with contextual and periodic encouragement toward healthy church and pastoral support. |
| Gamification | Strictly prohibited. |
| Launch | Nigeria alpha and beta; legal adults; free; iOS and Android. |
| Naming | Deferred until principles are settled. |

