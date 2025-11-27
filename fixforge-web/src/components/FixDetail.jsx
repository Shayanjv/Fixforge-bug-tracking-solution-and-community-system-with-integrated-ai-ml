import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchFix, voteFix, acceptFix } from "../api";
import Comments from "./Comments.jsx";

export default function FixDetail() {
  const { id } = useParams();
  const [fix, setFix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const json = await fetchFix(id);
        if (mounted) setFix(json.fix ?? json);
      } catch (e) {
        setErr(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  async function handleVote(delta) {
    setVoting(true);
    try {
      await voteFix(fix.id, delta);
      setFix({ ...fix, votes_count: (fix.votes_count || 0) + delta });
    } catch (e) {
      alert("Vote failed");
    } finally {
      setVoting(false);
    }
  }

  async function handleAccept() {
    try {
      await acceptFix(fix.id);
      setFix({ ...fix, is_canonical: true });
    } catch {
      alert("Accept failed");
    }
  }

  if (loading) return <div className="panel">Loading fix…</div>;
  if (err) return <div className="panel error">Error: {err}</div>;
  if (!fix) return <div className="panel">Fix not found</div>;

  return (
    <div className="panel">
      <div className="bug-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link to="/dashboard">← Back</Link>
        <h2>{fix.title ?? `Fix #${fix.id}`}</h2>
        <div className="meta">votes: {fix.votes_count ?? 0} {fix.is_canonical && <strong> • Canonical</strong>}</div>
      </div>

      {fix.text && (
        <>
          <h3>Solution</h3>
          <pre className="s-code">{fix.text}</pre>
        </>
      )}

      {fix.patch && (
        <>
          <h3>Patch</h3>
          <pre className="s-code">{fix.patch}</pre>
        </>
      )}

      {fix.explanation && (
        <>
          <h3>Explanation</h3>
          <p>{fix.explanation}</p>
        </>
      )}

      <div className="actions" style={{ marginTop: 12 }}>
        <button disabled={voting} onClick={() => handleVote(1)}>Upvote</button>
        <button disabled={voting} onClick={() => handleVote(-1)}>Downvote</button>
        {!fix.is_canonical && <button onClick={handleAccept}>Mark as canonical</button>}
      </div>

      <Comments fixId={fix.id} />
    </div>
  );
}
