import React, { useEffect, useState } from "react";
import { fetchComments, postComment } from "../api";

export default function Comments({ fixId }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const json = await fetchComments(fixId);
        if (!cancelled) setComments(json.comments ?? json);
      } catch (e) {
        console.error(e);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [fixId]);

  async function submit() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const resp = await postComment(fixId, { text });
      setComments((s) => [resp.comment ?? resp, ...s]);
      setText("");
    } catch (e) {
      alert("Failed to post comment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ marginTop: 18 }}>
      <h3>Comments</h3>
      <div>
        <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a comment" />
        <div className="actions">
          <button onClick={submit} disabled={loading}>Post</button>
        </div>
      </div>
      <ul style={{ marginTop: 12 }}>
        {comments.map((c) => (
          <li key={c.id} style={{ borderTop: "1px solid #eef3fb", paddingTop: 8 }}>
            <div style={{ fontSize: 13, color: "#6b7280" }}>{c.author_name ?? "anon"} • {c.created_at ? new Date(c.created_at).toLocaleString() : ""}</div>
            <div style={{ marginTop: 6 }}>{c.text}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
