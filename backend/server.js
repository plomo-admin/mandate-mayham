import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── Generate Task ───────────────────────────────────────────────────────────
app.post('/api/generate-task', async (req, res) => {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: `You are a sharp, cynical investment banking insider who invents painfully realistic but funny micro-scenarios. Generate exactly one banking task.

Return ONLY valid JSON in this exact format with no markdown, no code fences, no extra text:
{
  "prompt": "string",
  "constraints": ["string", "string", "string"],
  "character_limit": 140
}

Rules:
- prompt: one specific task related to IB, M&A, deal execution, or analyst life
- Make it realistic enough to feel familiar, absurd enough to be funny
- The task must be answerable in 140 characters
- Make the task moderately easy for a competent banker to answer quickly
- Exactly 3 constraints that add light pressure, not impossible traps
- No emojis in any field
- No generic filler ("synergies", "leverage our core competencies")
- Make it dry and insider — the humour comes from recognition, not randomness
- Do not start the prompt with "You are" or "As a"

Example constraint styles: "cannot use the word 'delay'", "must sound positive throughout", "no direct blaming", "imply urgency without stating it", "no exclamation marks", "must sound board-ready", "no sarcasm on the surface", "avoid the word 'challenging'"

Return only the raw JSON object.`
      }]
    });

    const raw = message.content[0].text.trim();
    const task = JSON.parse(raw);

    if (!task.prompt || !Array.isArray(task.constraints) || task.constraints.length !== 3) {
      throw new Error('Invalid task format from LLM');
    }

    res.json(task);
  } catch (err) {
    console.error('generate-task error:', err);
    res.status(500).json({ error: 'Failed to generate task' });
  }
});

// ─── Evaluate Answer ─────────────────────────────────────────────────────────
app.post('/api/evaluate', async (req, res) => {
  try {
    const { task, constraints, answer } = req.body;

    if (!task || !constraints || !answer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 900,
      messages: [{
        role: 'user',
        content: `You are a sharp investment banking VP with comedic timing. You are witty, playful, and roasty, but still professionally grounded.

Task given to the candidate:
"${task}"

Constraints they had to follow:
1. ${constraints[0]}
2. ${constraints[1]}
3. ${constraints[2]}

Character limit: 140 characters

Their answer (${answer.length} chars):
"${answer}"

Evaluate this answer with a playful tone and a generous scoring baseline.
Reward:
- clarity under pressure
- practical diplomacy
- clever/funny phrasing that still sounds plausibly workplace-safe
Penalise only meaningful issues (broken constraints, incoherent wording, unrealistic tone). Do not harshly penalise minor awkward phrasing.

Return ONLY valid JSON with no markdown, no code fences, no extra text:
{
  "overall_score": <integer 0-100, primary leaderboard sort key>,
  "professionalism": <integer 0-100>,
  "diplomacy": <integer 0-100>,
  "clarity": <integer 0-100>,
  "constraint_adherence": <integer 0-100>,
  "passive_aggression_control": <integer 0-100>,
  "label": <one of: "Partner Material" | "Promotable" | "Technically Fine" | "Needs More Alignment" | "Likely Weekend Work" | "Please Step Away From The Draft">,
  "verdict": "<2-3 punchy, funny-but-credible sentences with light roast energy>",
  "one_line_roast": "<one sharp, witty roast line that is playful and memorable>",
  "improvement_tip": "<concise, genuinely useful>",
  "short_display_answer": "<safe to show on share card, max 100 chars>"
}

Tone examples for verdict:
- "Client-safe, ego-safe, and only mildly panic-scented."
- "You kept it professional, which is impressive given the scene."
- "This reads like someone who has seen version 19 and lived to tell it."

Scoring calibration (important):
- Default solid answer that follows constraints: 68-82
- Funny + clear + constraint-adherent answer: 80-92
- Excellent answer: 90-98
- Below 50 only for clearly poor or constraint-breaking answers
- If answer is funny AND competent, it should usually land above 75
Be consistent.

Return only the raw JSON object.`
      }]
    });

    const raw = message.content[0].text.trim();
    const evaluation = JSON.parse(raw);
    res.json(evaluation);
  } catch (err) {
    console.error('evaluate error:', err);
    res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

// ─── Save Leaderboard Entry ───────────────────────────────────────────────────
app.post('/api/leaderboard', async (req, res) => {
  try {
    const entry = req.body;

    const { data, error } = await supabase
      .from('leaderboard_entries')
      .insert([{
        nickname: entry.nickname,
        task_prompt: entry.task_prompt,
        constraints: entry.constraints,
        answer: entry.answer,
        short_display_answer: entry.short_display_answer || '',
        overall_score: entry.overall_score,
        professionalism: entry.professionalism,
        diplomacy: entry.diplomacy,
        clarity: entry.clarity,
        constraint_adherence: entry.constraint_adherence,
        passive_aggression_control: entry.passive_aggression_control,
        label: entry.label,
        verdict: entry.verdict,
        one_line_roast: entry.one_line_roast,
        improvement_tip: entry.improvement_tip,
      }])
      .select()
      .single();

    if (error) throw error;

    // Compute rank: how many entries have a strictly higher score
    const { count, error: rankError } = await supabase
      .from('leaderboard_entries')
      .select('*', { count: 'exact', head: true })
      .gt('overall_score', entry.overall_score);

    if (rankError) throw rankError;

    res.json({ entry: data, rank: (count ?? 0) + 1 });
  } catch (err) {
    console.error('leaderboard POST error:', err);
    res.status(500).json({ error: 'Failed to save leaderboard entry' });
  }
});

// ─── Fetch Leaderboard ────────────────────────────────────────────────────────
app.get('/api/leaderboard', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select('id, nickname, overall_score, label, one_line_roast, created_at')
      .order('overall_score', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('leaderboard GET error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Mandate Mayhem backend running on port ${PORT}`));
