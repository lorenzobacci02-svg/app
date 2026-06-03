import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Body = {
  messages?: UIMessage[];
  context?: {
    name?: string;
    monthlySalary?: number;
    fixedCosts?: number;
    monthlyExpenses?: number;
    topCategories?: { category: string; amount: number }[];
    savingsGoal?: string;
    riskTolerance?: string;
  };
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as Body;
        const messages = body.messages;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const ctx = body.context ?? {};
        const ctxLines = [
          ctx.name ? `Utente: ${ctx.name}` : null,
          ctx.monthlySalary ? `Stipendio mensile netto: ${ctx.monthlySalary}€` : null,
          ctx.fixedCosts ? `Spese fisse dichiarate: ${ctx.fixedCosts}€/mese` : null,
          ctx.monthlyExpenses
            ? `Spese ricorrenti registrate: ${ctx.monthlyExpenses.toFixed(2)}€/mese`
            : null,
          ctx.topCategories?.length
            ? `Top categorie: ${ctx.topCategories
                .map((c) => `${c.category} ${c.amount.toFixed(0)}€`)
                .join(", ")}`
            : null,
          ctx.savingsGoal ? `Obiettivo: ${ctx.savingsGoal}` : null,
          ctx.riskTolerance ? `Rischio: ${ctx.riskTolerance}` : null,
        ].filter(Boolean);

        const system = [
          "Sei il Coach finanziario di Fluxa, app italiana di gestione patrimoniale personale.",
          "Rispondi sempre in italiano, in modo chiaro, pragmatico e amichevole.",
          "Dai consigli concreti su risparmio, abbonamenti, investimenti (PAC, ETF, BTP), fondo emergenza, regola 50/30/20.",
          "Non fornire consulenza finanziaria personalizzata regolamentata: ricorda che sono indicazioni generali.",
          "Risposte brevi (max 6 righe) salvo richiesta esplicita di approfondire.",
          ctxLines.length ? `Contesto utente:\n${ctxLines.join("\n")}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");
        const result = streamText({
          model,
          system,
          messages: await convertToModelMessages(messages),
        });
        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});
