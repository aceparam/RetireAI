import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Anthropic from "@anthropic-ai/sdk";
import { AskCoachDto } from "./dto/ask-coach.dto";

const SYSTEM_PERSONA = `You are the RetireAI Coach — a warm, sharp retirement-planning assistant for users in India.

GROUND TRUTH: Use ONLY the figures in <user_plan> as the source of truth. They are precomputed by RetireAI's financial engine — do not recompute or contradict them; reason from them. All amounts are Indian Rupees (₹); use lakh (L) and crore (Cr) naturally (e.g. ₹6.9 Cr, ₹45,000/month).

STYLE: Lead with a direct answer to the question, then 2-4 short sentences or a brief bullet list of specific, quantified next steps. Be encouraging and concrete. Briefly explain Indian instruments (SIP, NPS, EPF, PPF, ELSS) when relevant. Plain text only — no LaTeX, no markdown headings; short "-" bullets are fine. Keep the whole reply under ~180 words.

GUARDRAILS: This is educational guidance, not regulated financial advice. Don't invent specific fund names or products. If asked something unrelated to retirement or personal finance, gently steer back to the user's plan.`;

@Injectable()
export class CoachService {
  private readonly logger = new Logger(CoachService.name);
  private readonly client: Anthropic | null;
  private readonly model: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>("ANTHROPIC_API_KEY");
    this.model = config.get<string>("COACH_MODEL") || "claude-opus-4-8";
    this.client = apiKey ? new Anthropic({ apiKey }) : null;
  }

  /** Whether the generative coach is configured (API key present). */
  get available(): boolean {
    return this.client !== null;
  }

  async ask(dto: AskCoachDto): Promise<{ answer: string }> {
    if (!this.client) {
      throw new ServiceUnavailableException("AI coach is not configured");
    }

    const history = (dto.history ?? []).slice(-10).map((t) => ({
      role: (t.role === "coach" ? "assistant" : "user") as "assistant" | "user",
      content: t.text,
    }));

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        thinking: { type: "adaptive" },
        output_config: { effort: "medium" },
        system: [
          { type: "text", text: SYSTEM_PERSONA },
          { type: "text", text: `<user_plan>\n${JSON.stringify(dto.context, null, 2)}\n</user_plan>` },
        ],
        messages: [...history, { role: "user", content: dto.question }],
      } as Anthropic.MessageCreateParamsNonStreaming);

      const answer = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();

      return { answer: answer || "I couldn't generate a response just now — please try rephrasing." };
    } catch (err) {
      if (err instanceof Anthropic.APIError) {
        this.logger.error(`Anthropic API error ${err.status}: ${err.message}`);
      } else {
        this.logger.error(`Coach error: ${(err as Error).message}`);
      }
      throw new ServiceUnavailableException("The AI coach is temporarily unavailable");
    }
  }
}
