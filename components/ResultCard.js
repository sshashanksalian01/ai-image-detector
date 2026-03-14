/**
 * ResultCard.js
 * Displays the AI detection result with animated confidence meter.
 */

import { useEffect, useRef } from 'react';
import { Bot, Camera, ShieldAlert, ShieldCheck, Info } from 'lucide-react';
import styles from './ResultCard.module.css';

export default function ResultCard({ result }) {
  const { prediction, confidence, details } = result;

  const isAI = prediction === 'AI Generated';
  const confidencePct = Math.round(confidence * 100);

  // Determine the confidence tier label
  const getTier = (pct) => {
    if (pct >= 90) return { label: 'Very High', color: 'var(--tier-hi)' };
    if (pct >= 70) return { label: 'High', color: 'var(--tier-hi)' };
    if (pct >= 50) return { label: 'Moderate', color: 'var(--tier-mid)' };
    return { label: 'Low', color: 'var(--tier-lo)' };
  };

  const tier = getTier(confidencePct);

  // Animate the confidence bar on mount
  const barRef = useRef(null);
  useEffect(() => {
    if (!barRef.current) return;
    // Trigger CSS animation via a small delay
    setTimeout(() => {
      if (barRef.current) {
        barRef.current.style.setProperty('--bar-pct', `${confidencePct}%`);
        barRef.current.classList.add(styles.barAnimated);
      }
    }, 100);
  }, [confidencePct]);

  return (
    <div className={`${styles.card} ${isAI ? styles.cardAI : styles.cardReal}`}>
      {/* ── Ambient glow bg ── */}
      <div className={`${styles.glowBg} ${isAI ? styles.glowAI : styles.glowReal}`} />

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={`${styles.iconBadge} ${isAI ? styles.badgeAI : styles.badgeReal}`}>
          {isAI ? <Bot size={22} strokeWidth={1.5} /> : <Camera size={22} strokeWidth={1.5} />}
        </div>

        <div className={styles.headerText}>
          <span className={styles.label}>Detection Result</span>
          <h2 className={`${styles.verdict} ${isAI ? styles.verdictAI : styles.verdictReal}`}>
            {isAI ? 'AI Generated' : 'Real Photograph'}
          </h2>
        </div>

        <div className={`${styles.shield} ${isAI ? styles.shieldAI : styles.shieldReal}`}>
          {isAI ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className={`${styles.divider} ${isAI ? styles.dividerAI : styles.dividerReal}`} />

      {/* ── Confidence Section ── */}
      <div className={styles.confidenceSection}>
        <div className={styles.confidenceHeader}>
          <span className={styles.confidenceLabel}>Confidence Score</span>
          <span className={`${styles.confidencePct} ${isAI ? styles.pctAI : styles.pctReal}`}>
            {confidencePct}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className={styles.barTrack}>
          <div
            ref={barRef}
            className={`${styles.barFill} ${isAI ? styles.fillAI : styles.fillReal}`}
          />
          {/* Tick marks */}
          {[25, 50, 75].map((tick) => (
            <div
              key={tick}
              className={styles.tick}
              style={{ left: `${tick}%` }}
            />
          ))}
        </div>

        <div className={styles.barLabels}>
          <span>Uncertain</span>
          <span>Confident</span>
        </div>
      </div>

      {/* ── Tier Badge ── */}
      <div className={styles.tierRow}>
        <div className={styles.tierBadge} style={{ '--tier-color': tier.color }}>
          <span className={styles.tierDot} />
          <span>{tier.label} Confidence</span>
        </div>
      </div>

      {/* ── Verdict Message ── */}
      <div className={`${styles.message} ${isAI ? styles.messageAI : styles.messageReal}`}>
        <Info size={13} strokeWidth={2} className={styles.infoIcon} />
        <p>
          {isAI
            ? `This image shows strong indicators of synthetic generation. Our model is ${confidencePct}% certain it was created by an AI system.`
            : `This image exhibits characteristics consistent with real camera photography. Our model is ${confidencePct}% confident it is authentic.`}
        </p>
      </div>

      {/* ── Raw Scores (if provided) ── */}
      {details && details.length > 0 && (
        <div className={styles.rawScores}>
          <p className={styles.rawTitle}>Model Scores</p>
          <div className={styles.scoreList}>
            {details.map((item, i) => (
              <div key={i} className={styles.scoreItem}>
                <span className={styles.scoreLabel}>{item.label}</span>
                <span className={styles.scoreValue}>
                  {(item.score * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
