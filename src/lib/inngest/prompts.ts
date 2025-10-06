export const PERSONALIZED_WELCOME_EMAIL_PROMPT = `Generate highly personalized HTML content that will be inserted into an email template at the {{intro}} placeholder.

User profile data:
{{userProfile}}

PERSONALIZATION REQUIREMENTS (Inventory Management Context):
You MUST create content that is obviously tailored to THIS specific business by:

IMPORTANT: Do NOT start the personalized content with "Welcome" since the email header already says "Welcome aboard {{name}}". Use alternatives like "Thanks for joining", "Great to have you", "You're all set", "Perfect timing", etc.

1. Direct Reference to Business Details: Extract and use specifics from their profile:
   - Business/company name and industry
   - Store type or operation focus (e.g., retail, pharmacy, wholesale, warehouse)
   - Team size / number of employees
   - Preferred currency
   - Any hints about products handled (brands, categories) if available

2. Contextual Messaging: Connect features to their immediate operational needs:
   - New store setup → reference adding products, units, and suppliers
   - Fast-moving retail → reference low-stock alerts and barcode/QR labels
   - Multi-location/warehouse → reference stock transfers and batch tracking
   - Compliance-heavy (e.g., pharmacy) → reference expiry/lot tracking

3. Personal Touch: Make it feel written specifically for them:
   - Mirror their industry/role language
   - Emphasize benefits tied to their size and workflow
   - Map features like products, suppliers, purchases, sales, and reports to their context

CRITICAL FORMATTING REQUIREMENTS:
- Return ONLY clean HTML content with NO markdown, NO code blocks, NO backticks
- Use SINGLE paragraph only: <p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">content</p>
- Write exactly TWO sentences
- Keep total content between 35-50 words for readability
- Use <strong> for key personalized elements (industry, store type, priorities like low‑stock, barcode printing, reporting)
- DO NOT include "Here's what you can do right now:" as this is already in the template
- Make every word count toward personalization
- Second sentence should add helpful context or reinforce the personalization

Example personalized outputs (inventory-focused, TWO sentences):
<p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">Thanks for joining Standord Inventory! Running a <strong>grocery retail</strong> team of <strong>5</strong> in <strong>USD</strong>, you’ll benefit from low‑stock alerts and fast barcode labels to keep shelves full. We’ll streamline <strong>supplier orders</strong> so reordering is timely and effortless.</p>

<p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">Great to have you, especially in <strong>pharmacy</strong> operations where expiry control matters. You’ll set up <strong>batches and units</strong> quickly, and our reports make it simple to track movements and stay compliant.</p>

<p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">You’re all set! For a <strong>wholesale warehouse</strong>, our <strong>stock transfers</strong> and supplier management will keep inventory balanced across locations while reducing manual checks. Clear dashboards help your team act fast every day.</p>`;

export const DAILY_INVENTORY_SUMMARY_PROMPT = `Generate HTML content for a daily inventory summary email to be inserted at the {{summary}} placeholder.

Input (JSON):
{{metrics}}

REQUIREMENTS:
- Address the recipient by name ({{name}}) in the first sentence without starting with "Welcome".
- Summarize yesterday's inventory activity: total items moved in/out, net change, count of batches.
- Highlight top 3 low-stock items with their quantity and alert threshold if available.
- Mention notable movers (top in/out by quantity) if present.
- Add a short recommendation based on 7-day trends (e.g., reorder signals, frequent stock-outs, slow-moving items).

FORMATTING RULES:
- Return ONLY clean HTML, NO markdown/backticks.
- Use 2-3 concise paragraphs total.
- First paragraph: overview and key totals.
- Second paragraph: low-stock and movers.
- Optional third paragraph: recommendation/prediction.
- Use <strong> to emphasize product names, quantities, and key numbers.
- Keep to 80-140 words.
`;
