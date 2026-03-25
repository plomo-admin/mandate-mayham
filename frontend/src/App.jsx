import { useState, useRef, useLayoutEffect } from 'react';
import * as htmlToImage from 'html-to-image';

// ─── Data ──────────────────────────────────────────────────────────────────────
const TITLES = [
  'Analyst',
  'Associate',
  'Senior Associate',
  'VP',
  'Director',
  'Executive Director',
  'Managing Director',
  'Principal',
  'Partner',
  'Summer Analyst',
  'Chief of Staff',
  'Coverage Associate',
  'Operating Partner',
];

const SPECIALIZATIONS = [
  'of Font Consistency',
  'of Passive Aggression',
  'of Needless Follow-Ups',
  'of Broken Data Rooms',
  'of Eternal Revisions',
  'of Spreadsheet Warfare',
  'of Artificial Urgency',
  'of Last-Minute Comments',
  'of Margin Anxiety',
  'of CIM Embellishment',
  'of Unnecessary Slides',
  'of Misaligned Columns',
  'of Version Control Despair',
  'of Premature Closing Announcements',
  'of Unreturned Calls',
  'of Slide Deck Archaeology',
  'of Optimistic Timelines',
  'of Strategic Vagueness',
  'of Unread Attachments',
  'of Circular References',
  'of Phantom Deadlines',
  'of Aggressive Formatting',
  'of Insufficient Context',
  'of Executive Summary Rewrites',
  'of Premature Celebrations',
  'of Stakeholder Herding',
  'of Process Letter Ambiguity',
  'of Misplaced Confidence',
  'of Footnote Proliferation',
  'of Pointless Escalation',
  'of Inbox Management Failure',
  'of Narrative Pivots',
  'of Unscheduled Urgency',
  'of Redline Accumulation',
  'of Deferred Decisions',
  'of Overpromised Timelines',
  'of Selective Availability',
  'of Perpetual Alignment',
  'of Strategic Deferral',
  'of Colour-Coded Panic',
  'of Misread Tone',
  'of Retroactive Scope Creep',
  'of Defensive Formatting',
  'of Calendar Tetris',
  'of Unexplained Urgency',
  'of Soft Commitments',
  'of Slide 47',
  'of Ambiguous Sign-Off',
  'of the Cover Page',
  'of Forward-Looking Statements',
  'of the Preliminary Draft',
  'of Unmarked Redlines',
  'of the Bridge Slide',
  'of Implied Deadlines',
  'of Off-Cycle Requests',
];

const MEMES = [
  {
    id: 1,
    top: 'The client emails at 11:48 PM',
    bottom: '"just a few small tweaks"',
    bg: '#111111',
    color: '#ffffff',
  },
  {
    id: 2,
    top: 'Model breaks the night before the management presentation',
    bottom: '"It was probably always like this"',
    bg: '#111111',
    color: '#ffffff',
  },
  {
    id: 3,
    top: 'Buyer requests 47 additional diligence items',
    bottom: '"Quick question on the data room"',
    bg: '#0d1f0d',
    color: '#5dbb6d',
  },
  {
    id: 4,
    top: 'VP sends a calendar invite titled',
    bottom: '"Quick catch-up (30 mins)"',
    bg: '#10101f',
    color: '#8888ee',
  },
  {
    id: 5,
    top: 'Partner reviews the deck at 2 AM',
    bottom: '"Can we revisit the narrative on slide 3?"',
    bg: '#111111',
    color: '#ffffff',
  },
  {
    id: 6,
    top: 'The deck is on revision 23',
    bottom: '"This is basically the final version"',
    bg: '#1f0d0d',
    color: '#ee7070',
  },
  {
    id: 7,
    top: 'The model has 47 circular references',
    bottom: '"It was like this when I got here"',
    bg: '#111111',
    color: '#ffffff',
  },
  {
    id: 8,
    top: 'Seller asks if the process is competitive',
    bottom: '"We have significant interest"',
    bg: '#0d1820',
    color: '#60b8d8',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateNickname() {
  const t = TITLES[Math.floor(Math.random() * TITLES.length)];
  const s = SPECIALIZATIONS[Math.floor(Math.random() * SPECIALIZATIONS.length)];
  return `${t} ${s}`;
}

function pickMeme() {
  return MEMES[Math.floor(Math.random() * MEMES.length)];
}

function getLinkedInCaption({ nickname, rank, evaluation, task }) {
  const score = evaluation.overall_score;
  const tone = score >= 90
    ? 'Somewhere, an MD replied "Looks good, send."'
    : score >= 80
      ? 'Crisis contained. Weekend maybe saved.'
      : score >= 65
        ? 'Barely escaped the comment storm.'
        : score >= 45
          ? 'Survived, but the redlines survived more.'
          : 'HR has politely asked me to step away from the draft.';
  const taskSnippet = task?.prompt ? task.prompt.slice(0, 95).trim() : 'an M&A communication stress test';
  return [
    `I played Mandate Mayhem as "${nickname}" and scored ${score}/100 (rank #${rank}).`,
    `Today's fire drill: ${taskSnippet}${taskSnippet.endsWith('.') ? '' : '...'}`,
    tone,
    'Think you can beat it without sounding passive-aggressive?',
  ].join('\n');
}

function getRankingLine(score, rank, outperformed) {
  if (score >= 90)
    return `Rank #${rank}. You outperformed ${outperformed}% of bankers. Promotion remains theoretically possible.`;
  if (score >= 75)
    return `Rank #${rank}. You outperformed ${outperformed}% of bankers. The deck may still come back with comments.`;
  if (score >= 60)
    return `Rank #${rank}. You outperformed ${outperformed}% of bankers. Respectable. The weekend is still technically available.`;
  if (score >= 40)
    return `Rank #${rank}. You outperformed ${outperformed}% of bankers. More alignment may be required.`;
  return `Rank #${rank}. You outperformed ${outperformed}% of bankers. Please step away from the draft.`;
}

// ─── Meme Component ────────────────────────────────────────────────────────────
function MemeBlock({ meme, compact }) {
  return (
    <div
      className={`meme-block${compact ? ' meme-block--compact' : ''}`}
      style={{ background: meme.bg, color: meme.color }}
    >
      <div className="meme-top">{meme.top}</div>
      <div className="meme-bottom">{meme.bottom}</div>
    </div>
  );
}

// ─── Loading Overlay ──────────────────────────────────────────────────────────
function LoadingOverlay({ message }) {
  return (
    <div className="loading-overlay">
      <div className="loading-inner">
        <div className="loading-dots">
          <span /><span /><span />
        </div>
        <p className="loading-msg">{message}</p>
      </div>
    </div>
  );
}

// ─── Screen: Landing (with nickname picker built in) ──────────────────────────
function Landing({ generatedNickname, onRegenerate, onStart }) {
  const [customName, setCustomName] = useState('');

  const handleStart = () => {
    const finalName = customName.trim() || generatedNickname;
    onStart(finalName);
  };

  return (
    <div className="screen screen--landing">
      <img className="plomo-logo" src="/plomo.png" alt="Plomo logo" />
      <div className="landing-title">MANDATE<br />MAYHEM</div>
      <p className="landing-subtitle">Can you survive a deal without Plomo?</p>
      <p className="landing-desc">
        Survive one absurd banking task. See how you rank.
      </p>

      <div className="nickname-section">
        <div className="screen-label">YOUR NICKNAME</div>
        <div className="nickname-generated">{generatedNickname}</div>
        <button className="btn btn--ghost" onClick={onRegenerate} type="button">
          Generate again
        </button>
        <div className="nickname-or">or</div>
        <input
          className="nickname-input"
          type="text"
          placeholder="type your own nickname..."
          value={customName}
          onChange={e => setCustomName(e.target.value)}
          maxLength={60}
        />
        {customName.trim() && (
          <div className="nickname-preview">
            Playing as: <strong>{customName.trim()}</strong>
          </div>
        )}
      </div>

      <button className="btn btn--primary btn--wide" onClick={handleStart}>
        Start the test
      </button>
      <p className="microcopy">
        For analysts, associates, VPs, and other victims of process.
      </p>
    </div>
  );
}

// ─── Screen: Task ─────────────────────────────────────────────────────────────
function TaskScreen({ meme, task, answer, onChange, onSubmit, loading }) {
  const len = answer.length;
  const over = len > 140;

  return (
    <div className="screen screen--task">
      <MemeBlock meme={meme} />
      <div className="screen-label">YOUR TASK</div>
      <div className="task-card">
        <p className="task-prompt">{task.prompt}</p>
        <div className="constraints-row">
          {task.constraints.map((c, i) => (
            <span key={i} className="constraint-tag">⚠ {c}</span>
          ))}
        </div>
        <div className="char-limit-note">140 character limit</div>
      </div>
      <textarea
        className={`answer-input${over ? ' answer-input--over' : ''}`}
        value={answer}
        onChange={e => onChange(e.target.value)}
        placeholder="Type your response here..."
        rows={4}
      />
      <div className={`char-counter${over ? ' char-counter--over' : ''}`}>
        {len}/140
      </div>
      <button
        className="btn btn--primary btn--wide"
        onClick={onSubmit}
        disabled={loading || len === 0 || over}
      >
        Send (hope for the best)
      </button>
    </div>
  );
}

// ─── Screen: Result ───────────────────────────────────────────────────────────
function ResultScreen({
  nickname, task, evaluation,
  leaderboard, rank, meme,
  onPlayAgain, shareCardRef,
}) {
  const currentRowRef = useRef(null);
  const lbScrollRef = useRef(null);

  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistState, setWaitlistState] = useState('idle'); // idle | submitting | done | error

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistState('submitting');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: waitlistEmail, nickname, score: evaluation.overall_score }),
      });
      if (!res.ok) throw new Error('failed');
      setWaitlistState('done');
    } catch {
      setWaitlistState('error');
    }
  };

  const totalEntries = leaderboard.length || 1;
  const outperformed = Math.max(0, Math.round(((totalEntries - rank) / totalEntries) * 100));
  const rankingLine = getRankingLine(evaluation.overall_score, rank, outperformed);

  const handleDownload = async () => {
    if (!shareCardRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(shareCardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const a = document.createElement('a');
      a.download = 'mandate-mayhem-result.png';
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const [linkedInTooltip, setLinkedInTooltip] = useState('');

  const handleShareLinkedIn = () => {
    const caption = getLinkedInCaption({ nickname, rank, evaluation, task });
    navigator.clipboard.writeText(caption).catch(() => {});
    const shareUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' +
      encodeURIComponent('https://plomo.ai');
    window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=600');
    setLinkedInTooltip('Caption copied — paste it into the post box.');
    setTimeout(() => setLinkedInTooltip(''), 5000);
  };

  useLayoutEffect(() => {
    const row = currentRowRef.current;
    const wrap = lbScrollRef.current;
    if (!row || !wrap) return;
    const wrapRect = wrap.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const rowTopInContent = wrap.scrollTop + (rowRect.top - wrapRect.top);
    const target =
      rowTopInContent - wrap.clientHeight / 2 + rowRect.height / 2;
    const maxScroll = Math.max(0, wrap.scrollHeight - wrap.clientHeight);
    wrap.scrollTop = Math.max(0, Math.min(maxScroll, target));
  }, [leaderboard, rank]);

  const quickMetrics = [
    ['Professionalism', evaluation.professionalism],
    ['Clarity', evaluation.clarity],
    ['Constraint fit', evaluation.constraint_adherence],
  ];

  return (
    <div className="screen screen--result">

      {/* ── Share Card (captured for download) ─────────────────── */}
      <div className="share-card" ref={shareCardRef}>
        <MemeBlock meme={meme} compact />
        <div className="share-card-body">
          <div className="sc-title">MANDATE MAYHEM</div>
          <div className="sc-nickname">{nickname}</div>
          <div className="sc-score">
            {evaluation.overall_score}<span className="sc-score-denom">/100</span>
          </div>
          <div className="sc-label">{evaluation.label}</div>
          <div className="sc-roast">"{evaluation.one_line_roast}"</div>
          <div className="sc-rank">
            Rank #{rank} · Outperformed {outperformed}% of bankers.
          </div>
          <div className="sc-cta">Plomo helps you survive the whole deal.</div>
        </div>
      </div>

      {/* ── Full Result Detail ──────────────────────────────────── */}
      <div className="result-section">
        <div className="screen-label">QUICK VERDICT</div>
        <p className="verdict-text">{evaluation.verdict}</p>
        <div className="roast-line">"{evaluation.one_line_roast}"</div>
      </div>

      <div className="result-section">
        <div className="screen-label">AT A GLANCE</div>
        <div className="metric-pills">
          {quickMetrics.map(([label, score]) => (
            <div key={label} className="metric-pill">
              <span className="metric-pill-label">{label}</span>
              <span className="metric-pill-score">{score}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="result-section">
        <div className="screen-label">LEADERBOARD</div>
        <p className="ranking-statement">{rankingLine}</p>
        <p className="lb-scroll-hint">
          Scroll inside the box for the full list — your row is centered there when you reach it.
        </p>
        <div className="lb-table-scroll" ref={lbScrollRef}>
          <table className="lb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Banker</th>
                <th>Score</th>
                <th>Label</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => (
                <tr
                  key={entry.id}
                  ref={i + 1 === rank ? currentRowRef : undefined}
                  className={i + 1 === rank ? 'lb-row--current' : ''}
                >
                  <td className="lb-rank">{i + 1}</td>
                  <td className="lb-name">{entry.nickname}</td>
                  <td className="lb-score">{entry.overall_score}</td>
                  <td className="lb-label">{entry.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="contest-block">
        <div className="contest-badge">FREE PLOMO</div>
        <div className="contest-headline">
          Compete for a free Plomo Pro plan.
        </div>
        <p className="contest-body">
          Drop your business email. One person on the leaderboard will get{' '}
          <strong>3 months of Plomo Pro for free</strong> upon launch, plus
          eternal fame from their MD for making the workspace more efficient.
        </p>

        {waitlistState === 'done' ? (
          <div className="waitlist-success">
            You're on the list. May the leaderboard be with you.
          </div>
        ) : (
          <form className="waitlist-form" onSubmit={handleWaitlistSubmit}>
            <input
              className="waitlist-input"
              type="email"
              placeholder="your@bank.com"
              value={waitlistEmail}
              onChange={e => setWaitlistEmail(e.target.value)}
              disabled={waitlistState === 'submitting'}
              required
            />
            <button
              className="btn btn--cta waitlist-btn"
              type="submit"
              disabled={waitlistState === 'submitting' || !waitlistEmail.trim()}
            >
              {waitlistState === 'submitting' ? 'Submitting...' : 'Join the waitlist →'}
            </button>
            {waitlistState === 'error' && (
              <div className="waitlist-error">Something went wrong. Try again.</div>
            )}
          </form>
        )}

        <div className="contest-fine-print">
          Winner selected from verified business-email entries at launch.
          No analysts were harmed in the making of this promotion.
        </div>
      </div>

      <div className="cta-block">
        <div className="cta-main">
          You survived one task. Plomo helps you survive the whole deal.
        </div>
        <div className="cta-sub">
          Manual competence is admirable. Systems are better.
        </div>
        <a
          className="btn btn--cta"
          href="https://plomo.ai/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Try Plomo →
        </a>
      </div>

      <div className="share-actions">
        <button className="btn btn--primary" onClick={handleDownload}>
          Download result
        </button>
        <div className="linkedin-btn-wrap">
          <button className="btn btn--secondary" onClick={handleShareLinkedIn}>
            Share on LinkedIn
          </button>
          {linkedInTooltip && (
            <div className="linkedin-tooltip">{linkedInTooltip}</div>
          )}
        </div>
        <button className="btn btn--secondary" onClick={onPlayAgain}>
          Try again
        </button>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('landing');
  const [generatedNickname, setGeneratedNickname] = useState(generateNickname);
  const [nickname, setNickname] = useState('');
  const [meme, setMeme] = useState(null);
  const [task, setTask] = useState(null);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [rank, setRank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError] = useState('');
  const shareCardRef = useRef(null);

  const handleStart = async (finalNickname) => {
    setNickname(finalNickname);
    setMeme(pickMeme());
    setLoading(true);
    setLoadingMsg('Generating a fresh crisis...');
    setError('');
    try {
      const res = await fetch('/api/generate-task', { method: 'POST' });
      if (!res.ok) throw new Error('Server error');
      const taskData = await res.json();
      setTask(taskData);
      setAnswer('');
      setScreen('task');
    } catch {
      setError('Failed to generate task. The server may be down. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim() || answer.length > 140) return;
    setLoading(true);
    setLoadingMsg('Evaluating your career prospects...');
    setError('');

    try {
      // 1. Evaluate
      const evalRes = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: task.prompt,
          constraints: task.constraints,
          answer,
        }),
      });
      if (!evalRes.ok) throw new Error('Evaluation failed');
      const evalData = await evalRes.json();
      setEvaluation(evalData);

      // 2. Save to leaderboard
      setLoadingMsg('Inserting you into the hierarchy...');
      const saveRes = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname,
          task_prompt: task.prompt,
          constraints: task.constraints,
          answer,
          short_display_answer: evalData.short_display_answer,
          overall_score: evalData.overall_score,
          professionalism: evalData.professionalism,
          diplomacy: evalData.diplomacy,
          clarity: evalData.clarity,
          constraint_adherence: evalData.constraint_adherence,
          passive_aggression_control: evalData.passive_aggression_control,
          label: evalData.label,
          verdict: evalData.verdict,
          one_line_roast: evalData.one_line_roast,
          improvement_tip: evalData.improvement_tip,
        }),
      });
      if (!saveRes.ok) throw new Error('Save failed');
      const { rank: userRank } = await saveRes.json();
      setRank(userRank);

      // 3. Fetch leaderboard
      const lbRes = await fetch('/api/leaderboard');
      if (!lbRes.ok) throw new Error('Leaderboard fetch failed');
      const lbData = await lbRes.json();
      setLeaderboard(lbData);

      setScreen('result');
    } catch (err) {
      setError('Something went wrong. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayAgain = () => {
    setEvaluation(null);
    setTask(null);
    setAnswer('');
    setRank(null);
    setLeaderboard([]);
    setError('');
    setNickname('');
    setGeneratedNickname(generateNickname());
    setScreen('landing');
  };

  return (
    <div className="app">
      {loading && <LoadingOverlay message={loadingMsg} />}

      {screen === 'landing' && (
        <Landing
          generatedNickname={generatedNickname}
          onRegenerate={() => setGeneratedNickname(generateNickname())}
          onStart={handleStart}
        />
      )}

      {screen === 'task' && task && (
        <TaskScreen
          meme={meme}
          task={task}
          answer={answer}
          onChange={setAnswer}
          onSubmit={handleSubmit}
          loading={loading}
        />
      )}

      {screen === 'result' && evaluation && (
        <ResultScreen
          nickname={nickname}
          task={task}
          evaluation={evaluation}
          leaderboard={leaderboard}
          rank={rank}
          meme={meme}
          onPlayAgain={handlePlayAgain}
          shareCardRef={shareCardRef}
        />
      )}

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}
    </div>
  );
}
