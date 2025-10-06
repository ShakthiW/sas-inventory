import { inngest } from "@/lib/inngest/client";
import {
  DAILY_INVENTORY_SUMMARY_PROMPT,
  PERSONALIZED_WELCOME_EMAIL_PROMPT,
} from "@/lib/inngest/prompts";
import { getDb } from "@/lib/db";
import {
  sendWelcomeEmail,
  sendDailyInventorySummaryEmail as sendDailySummaryMail,
} from "@/lib/nodemailer";

export const sendSignUpEmail = inngest.createFunction(
  { id: "sign-up-email" },
  { event: "app/user.created" },
  async ({ event, step }) => {
    const userProfile = `
            - Name: ${event.data.name}
            - Email: ${event.data.email}
            - Company: ${event.data.companyName ?? ""}
            - Industry: ${event.data.industry ?? ""}
            - Team size: ${event.data.numEmployees ?? ""}
            - Currency: ${event.data.currency ?? ""}
            - Phone: ${event.data.phone ?? ""}
        `;

    const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace(
      "{{userProfile}}",
      userProfile
    );

    const response = await step.ai.infer("generate-welcome-intro", {
      model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    await step.run("send-welcome-email", async () => {
      const part = response.candidates?.[0]?.content?.parts?.[0];
      const introText =
        (part && "text" in part ? part.text : null) ||
        '<p class="mobile-text" style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">Thanks for joining Standord Inventory! You can start by adding <strong>products, units, and suppliers</strong>, then keep shelves full with <strong>low‑stock alerts</strong> and print <strong>QR/barcode labels</strong> as you go.</p>';

      const {
        data: { email, name },
      } = event;

      return await sendWelcomeEmail({ email, name, intro: introText });
    });

    return {
      success: true,
      message: "Welcome email sent successfully",
    };
  }
);

export const sendDailyInventorySummaryEmail = inngest.createFunction(
  { id: "send-daily-inventory-summary-email" },
  [
    { event: "app/inventory.daily-summary" },
    { cron: "0 12 * * *" }, // every day at 12:00 PM
    // { cron: "*/2 * * * *" }, // every 2 minutes (testing)
  ],
  async ({ event, step }) => {
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const lastDayStart = new Date(now.getTime() - dayMs);
    const last7Start = new Date(now.getTime() - 7 * dayMs);

    const {
      data: { email, name },
    } = event as unknown as { data: { email: string; name: string } };

    // Preflight: skip if no activity in the last 24 hours
    const hasActivity = await step.run("check-last-day-activity", async () => {
      const db = await getDb();
      const batches = db.collection("stock_batches");
      const cnt = await batches.countDocuments({
        createdAt: { $gte: lastDayStart, $lt: now },
      });
      return cnt > 0;
    });

    if (!hasActivity) {
      return {
        success: true,
        skipped: true,
        reason: "No inventory activity in the last 24 hours",
      };
    }

    // 1) Gather DB metrics
    const metrics = await step.run(
      "aggregate-daily-inventory-metrics",
      async () => {
        const db = await getDb();
        const products = db.collection("products");
        const batches = db.collection("stock_batches");

        // Batch count last 24h
        const batchCountLastDay = await batches.countDocuments({
          createdAt: { $gte: lastDayStart, $lt: now },
        });

        // Totals in/out quantities last 24h
        const totalsByType = await batches
          .aggregate([
            { $match: { createdAt: { $gte: lastDayStart, $lt: now } } },
            { $unwind: "$items" },
            {
              $group: {
                _id: "$type",
                qty: { $sum: "$items.quantity" },
              },
            },
          ])
          .toArray();

        const totalInQty = totalsByType.find((t) => t._id === "in")?.qty ?? 0;
        const totalOutQty = totalsByType.find((t) => t._id === "out")?.qty ?? 0;

        // Top movers (in/out) last 24h
        const [topIn, topOut] = await Promise.all([
          batches
            .aggregate([
              {
                $match: {
                  type: "in",
                  createdAt: { $gte: lastDayStart, $lt: now },
                },
              },
              { $unwind: "$items" },
              {
                $group: {
                  _id: { productId: "$items.productId", name: "$items.name" },
                  qty: { $sum: "$items.quantity" },
                },
              },
              { $sort: { qty: -1 } },
              { $limit: 3 },
            ])
            .toArray(),
          batches
            .aggregate([
              {
                $match: {
                  type: "out",
                  createdAt: { $gte: lastDayStart, $lt: now },
                },
              },
              { $unwind: "$items" },
              {
                $group: {
                  _id: { productId: "$items.productId", name: "$items.name" },
                  qty: { $sum: "$items.quantity" },
                },
              },
              { $sort: { qty: -1 } },
              { $limit: 3 },
            ])
            .toArray(),
        ]);

        // Low stock list (top 3)
        const lowStockDocs = await products
          .find({
            "pricing.qtyAlert": { $gt: 0 },
            "pricing.quantity": { $ne: null },
            $expr: { $lte: ["$pricing.quantity", "$pricing.qtyAlert"] },
          })
          .project({ name: 1, sku: 1, pricing: 1 })
          .sort({ "pricing.quantity": 1 })
          .limit(3)
          .toArray();

        // Last 7 days daily sums
        const last7ByDay = await batches
          .aggregate([
            { $match: { createdAt: { $gte: last7Start, $lt: now } } },
            { $unwind: "$items" },
            {
              $group: {
                _id: {
                  day: { $dateTrunc: { date: "$createdAt", unit: "day" } },
                  type: "$type",
                },
                qty: { $sum: "$items.quantity" },
              },
            },
            {
              $group: {
                _id: "$_id.day",
                inQty: {
                  $sum: { $cond: [{ $eq: ["$_id.type", "in"] }, "$qty", 0] },
                },
                outQty: {
                  $sum: { $cond: [{ $eq: ["$_id.type", "out"] }, "$qty", 0] },
                },
              },
            },
            {
              $project: {
                _id: 0,
                day: "$_id",
                inQty: 1,
                outQty: 1,
                net: { $subtract: ["$inQty", "$outQty"] },
              },
            },
            { $sort: { day: 1 } },
          ])
          .toArray();

        type ProductDoc = {
          name?: string;
          sku?: string;
          pricing?: { quantity?: number | null; qtyAlert?: number | null };
        };

        return {
          timeframe: {
            from: lastDayStart.toISOString(),
            to: now.toISOString(),
          },
          totals: {
            inQty: totalInQty,
            outQty: totalOutQty,
            net: totalInQty - totalOutQty,
            batchCount: batchCountLastDay,
          },
          movers: {
            topIn: topIn.map((d) => ({
              productId: d._id?.productId ?? null,
              name: d._id?.name ?? "",
              quantity: d.qty ?? 0,
            })),
            topOut: topOut.map((d) => ({
              productId: d._id?.productId ?? null,
              name: d._id?.name ?? "",
              quantity: d.qty ?? 0,
            })),
          },
          lowStock: lowStockDocs.map((p: ProductDoc) => ({
            name: p.name ?? "",
            sku: p.sku ?? "",
            quantity: p.pricing?.quantity ?? null,
            qtyAlert: p.pricing?.qtyAlert ?? null,
          })),
          last7Days: last7ByDay.map((d) => ({
            date: d.day instanceof Date ? d.day.toISOString() : d.day,
            inQty: d.inQty ?? 0,
            outQty: d.outQty ?? 0,
            net: d.net ?? 0,
          })),
        };
      }
    );

    // 2) Generate AI summary
    const prompt = DAILY_INVENTORY_SUMMARY_PROMPT.replace(
      "{{name}}",
      name
    ).replace("{{metrics}}", JSON.stringify(metrics));

    const response = await step.ai.infer("generate-daily-inventory-summary", {
      model: step.ai.models.gemini({ model: "gemini-2.5-flash-lite" }),
      body: {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    const summaryHtml =
      (part && "text" in part ? (part.text as string) : null) ||
      `<p style="margin: 0 0 14px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;">Hi ${name}, here's your daily overview: total in <strong>${metrics.totals.inQty}</strong>, total out <strong>${metrics.totals.outQty}</strong>, net change <strong>${metrics.totals.net}</strong> across <strong>${metrics.totals.batchCount}</strong> batches.</p>` +
        `<p style=\"margin: 0 0 14px 0; font-size: 16px; line-height: 1.6; color: #CCDADC;\">Low stock items: <strong>${
          metrics.lowStock
            .map((i) => `${i.name} (${i.quantity}/${i.qtyAlert})`)
            .join(", ") || "None"
        }</strong>. Top movers in: <strong>${
          metrics.movers.topIn
            .map((m) => `${m.name} (${m.quantity})`)
            .join(", ") || "None"
        }</strong>. Top movers out: <strong>${
          metrics.movers.topOut
            .map((m) => `${m.name} (${m.quantity})`)
            .join(", ") || "None"
        }</strong>.</p>`;

    // 3) Send email
    await step.run("send-daily-inventory-summary-email", async () => {
      await sendDailySummaryMail({ email, name, summary: summaryHtml });
    });

    return { success: true };
  }
);
