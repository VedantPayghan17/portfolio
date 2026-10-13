import { useEffect, useRef, useState } from "react";
import { profile, projects as localProjects, skills, education, beyond } from "./data";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- mouse: custom cursor + click ripple ---------- */
function Cursor() {
  const dot = useRef(), ring = useRef(), label = useRef();
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const root = document.documentElement;
    root.classList.add("has-cursor");
    let x = 0, y = 0, rx = 0, ry = 0, raf;
    const move = (e) => {
      x = e.clientX; y = e.clientY;
      root.classList.add("moved");
      dot.current.style.transform = `translate(${x}px,${y}px)`;
      const t = e.target.closest("a,button,input,textarea,[data-cursor]");
      ring.current.classList.toggle("is-hover", !!t);
      label.current.textContent = t?.dataset.cursor || "";
    };
    const click = (e) => {
      const r = document.createElement("span");
      r.className = "ripple";
      r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px";
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 600);
    };
    const loop = () => {
      rx += (x - rx) * 0.16; ry += (y - ry) * 0.16;
      ring.current.style.transform = `translate(${rx}px,${ry}px)`;
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("click", click);
    loop();
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("click", click);
      cancelAnimationFrame(raf);
      root.classList.remove("has-cursor", "moved");
    };
  }, []);
  return (<><div ref={dot} className="dot" /><div ref={ring} className="ring"><span ref={label} /></div></>);
}

/* ---------- mouse: dot grid that reacts to the pointer ---------- */
function DotField() {
  const ref = useRef();
  useEffect(() => {
    const cv = ref.current, ctx = cv.getContext("2d");
    const S = 30, R = 170, m = { x: -999, y: -999 };
    let w, h, raf, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => {
      w = window.innerWidth; h = window.innerHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      cv.style.width = w + "px"; cv.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (let x = S / 2; x < w; x += S) for (let y = S / 2; y < h; y += S) {
        const dx = x - m.x, dy = y - m.y, d = Math.hypot(dx, dy) || 1;
        const k = Math.max(0, 1 - d / R);
        const px = x + (dx / d) * k * 10, py = y + (dy / d) * k * 10;
        ctx.fillStyle = k > 0 ? `rgba(47,76,255,${0.2 + k * 0.8})` : "rgba(19,23,34,.13)";
        ctx.beginPath(); ctx.arc(px, py, 1.2 + k * 3.4, 0, 6.283); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    const move = (e) => { m.x = e.clientX; m.y = e.clientY; };
    const leave = () => { m.x = m.y = -999; };
    size(); draw();
    window.addEventListener("resize", size);
    window.addEventListener("mousemove", move);
    document.addEventListener("mouseleave", leave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
    };
  }, []);
  return <canvas ref={ref} className="field" aria-hidden="true" />;
}

/* ---------- small interactive helpers ---------- */
function Tilt({ children, className = "" }) {
  const r = useRef();
  const move = (e) => {
    const b = r.current.getBoundingClientRect();
    const px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height;
    const s = r.current.style;
    s.setProperty("--rx", `${(0.5 - py) * 7}deg`); s.setProperty("--ry", `${(px - 0.5) * 9}deg`);
    s.setProperty("--gx", px * 100 + "%"); s.setProperty("--gy", py * 100 + "%");
  };
  const leave = () => { r.current.style.setProperty("--rx", "0deg"); r.current.style.setProperty("--ry", "0deg"); };
  return <div ref={r} className={"tilt " + className} onMouseMove={move} onMouseLeave={leave}>{children}</div>;
}

function Magnetic({ as: T = "a", children, ...p }) {
  const r = useRef();
  const move = (e) => {
    const b = r.current.getBoundingClientRect();
    r.current.style.transform = `translate(${(e.clientX - b.left - b.width / 2) * 0.25}px,${(e.clientY - b.top - b.height / 2) * 0.35}px)`;
  };
  return <T ref={r} onMouseMove={move} onMouseLeave={() => (r.current.style.transform = "")} {...p}>{children}</T>;
}

function Typing({ words }) {
  const [t, setT] = useState(reduced() ? words[0] : "");
  useEffect(() => {
    if (reduced()) return;
    let w = 0, i = 0, del = false, id;
    const tick = () => {
      const word = words[w];
      i += del ? -1 : 1; setT(word.slice(0, i));
      let d = del ? 30 : 65;
      if (!del && i === word.length) { del = true; d = 1500; }
      else if (del && i === 0) { del = false; w = (w + 1) % words.length; d = 300; }
      id = setTimeout(tick, d);
    };
    id = setTimeout(tick, 900);
    return () => clearTimeout(id);
  }, [words]);
  return <span className="typed">{t}<i className="caret" /></span>;
}

const Letters = ({ text, start = 0 }) =>
  text.split("").map((c, i) => <span key={i} className="ltr" style={{ "--i": start + i }}>{c}</span>);

/* ---------- sections ---------- */
function Nav() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => setP(window.scrollY / (document.body.scrollHeight - window.innerHeight || 1));
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <nav className="nav">
      <div className="bar" style={{ transform: `scaleX(${p})` }} />
      <a href="#top" className="logo" data-cursor="Top">VP</a>
      <div className="links">
        <a href="#projects">Projects</a><a href="#skills">Skills</a><a href="#education">Education</a>
        <Magnetic href="/Vedant_Payghan_Resume.pdf" download className="btn small" data-cursor="PDF">Resume</Magnetic>
        <Magnetic href="#contact" className="btn small" data-cursor="Say hi">Contact</Magnetic>
      </div>
    </nav>
  );
}

function Hero() {
  const r = useRef();
  const move = (e) => {
    const b = r.current.getBoundingClientRect();
    r.current.style.setProperty("--mx", ((e.clientX - b.left) / b.width - 0.5) * 2);
    r.current.style.setProperty("--my", ((e.clientY - b.top) / b.height - 0.5) * 2);
  };
  return (
    <header id="top" className="hero" ref={r} onMouseMove={move}>
      <div className="hero-copy">
        <p className="hello">Hi, I'm</p>
        <h1 aria-label={profile.name}><span className="row"><Letters text="Vedant" /></span><span className="row"><Letters text="Payghan" start={6} /></span></h1>
        <p className="role">I build <Typing words={profile.roles} /></p>
        <p className="lede">{profile.summary}</p>
        <div className="cta">
          <Magnetic href="#projects" className="btn primary" data-cursor="Go">See my projects</Magnetic>
          <Magnetic href="/Vedant_Payghan_Resume.pdf" download className="btn" data-cursor="PDF">Download resume</Magnetic>
        </div>
      </div>
      <div className="hero-art">
        <div className="sun" />
        <div className="photo"><img src="/headshot.jpg" alt="Vedant Payghan" /></div>
        <span className="chip" style={{ "--d": 26, top: "6%", left: "-6%" }}>MongoDB</span>
        <span className="chip" style={{ "--d": -20, top: "24%", right: "-8%" }}>Express</span>
        <span className="chip" style={{ "--d": 32, bottom: "26%", left: "-12%" }}>React</span>
        <span className="chip" style={{ "--d": -28, bottom: "8%", right: "-4%" }}>Node.js</span>
      </div>
    </header>
  );
}

const Section = ({ id, title, note, children }) => (
  <section id={id} className="section">
    <div className="head"><h2>{title}</h2>{note && <p>{note}</p>}</div>
    {children}
  </section>
);

function Projects() {
  const [list, setList] = useState(localProjects);
  useEffect(() => {
    fetch(`${API}/api/projects`).then(r => r.ok ? r.json() : Promise.reject())
      .then(d => d.length && setList(d)).catch(() => {});
  }, []);
  return (
    <Section id="projects" title="Things I've built" note="Move your mouse over a card.">
      <div className="grid">
        {list.map((p) => (
          <Tilt key={p._id} className="card project">
            <h3>{p.title}</h3>
            <p className="tag">{p.tagline}</p>
            <ul>{p.points.map((x) => <li key={x}>{x}</li>)}</ul>
            <div className="chips">{p.stack.map((s) => <span key={s}>{s}</span>)}</div>
            <div className="plinks">
              {p.github && <a href={p.github} target="_blank" rel="noreferrer" data-cursor="Code">View code</a>}
              {p.live && <a href={p.live} target="_blank" rel="noreferrer" data-cursor="Open">Live demo</a>}
            </div>
          </Tilt>
        ))}
      </div>
    </Section>
  );
}

function Skills() {
  return (
    <Section id="skills" title="What I work with">
      <div className="skills">
        {skills.map((g) => (
          <div key={g.group} className="sgroup">
            <h3>{g.group}</h3>
            <div className="chips big">{g.items.map((i) => <span key={i} data-cursor="">{i}</span>)}</div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Education() {
  return (
    <Section id="education" title="Education and beyond the code">
      <div className="two">
        <ol className="timeline">
          {education.map((e) => (
            <li key={e.title}>
              <span className="when">{e.when}</span>
              <h3>{e.title}</h3>
              <p>{e.where}</p>
              <strong>{e.score}</strong>
            </li>
          ))}
        </ol>
        <Tilt className="card beyond">
          <h3>Leadership, certifications, internship</h3>
          <ul>{beyond.map((b) => <li key={b}>{b}</li>)}</ul>
        </Tilt>
      </div>
    </Section>
  );
}

function Contact() {
  const [st, setSt] = useState({ s: "idle", m: "" });
  async function send(e) {
    e.preventDefault();
    const form = e.target, body = Object.fromEntries(new FormData(form));
    setSt({ s: "busy", m: "" });
    try {
      const r = await fetch(`${API}/api/contact`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Something went wrong.");
      form.reset(); setSt({ s: "ok", m: "Message sent. I'll reply to your email soon." });
    } catch (err) {
      setSt({ s: "err", m: err.message === "Failed to fetch" ? "Couldn't reach the server. Please email me directly." : err.message });
    }
  }
  return (
    <Section id="contact" title="Let's talk" note="Open to internships and full-time roles in software engineering.">
      <div className="two">
        <div className="reach">
          <Magnetic href={`mailto:${profile.email}`} className="big-link" data-cursor="Email">{profile.email}</Magnetic>
          <p><a href={profile.github} target="_blank" rel="noreferrer">GitHub</a> and <a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn</a></p>
        </div>
        <form className="card form" onSubmit={send} noValidate>
          <label>Your name<input name="name" required autoComplete="name" /></label>
          <label>Your email<input name="email" type="email" required autoComplete="email" /></label>
          <label>Message<textarea name="message" rows="4" required /></label>
          <button className="btn primary" disabled={st.s === "busy"} data-cursor="Send">{st.s === "busy" ? "Sending..." : "Send message"}</button>
          <p className={"status " + st.s} role="status">{st.m}</p>
        </form>
      </div>
    </Section>
  );
}

export default function App() {
  return (
    <>
      <DotField /><Cursor /><Nav />
      <main>
        <Hero /><Projects /><Skills /><Education /><Contact />
      </main>
      <footer className="foot">© {new Date().getFullYear()} Vedant Payghan. Built with MongoDB, Express, React and Node.js.</footer>
    </>
  );
}
