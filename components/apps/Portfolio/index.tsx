import { memo, useCallback } from "react";
import StyledPortfolio from "components/apps/Portfolio/StyledPortfolio";
import usePortfolio from "components/apps/Portfolio/usePortfolio";
import {
  contact,
  education,
  experience,
  projects,
  skills,
} from "components/apps/Portfolio/data";
import AppContainer from "components/system/Apps/AppContainer";
import { type ComponentProcessProps } from "components/system/Apps/RenderComponent";

const Portfolio: FC<ComponentProcessProps> = ({ id }) => {
  const openExternal = useCallback((href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <AppContainer
      StyledComponent={StyledPortfolio}
      id={id}
      useHook={usePortfolio}
    >
      <header>
        <div>
          <h1>{contact.name}</h1>
          <h2>{contact.tagline}</h2>
          <p>{contact.summary}</p>
          <div className="pill-row" style={{ marginTop: 10 }}>
            <button
              className="pill"
              onClick={() => openExternal(`mailto:${contact.email}`)}
              type="button"
            >
              Email: {contact.email}
            </button>
            <button className="pill" type="button">
              Location: {contact.location}
            </button>
            <button
              className="pill"
              onClick={() => openExternal(contact.github)}
              type="button"
            >
              GitHub Profile
            </button>
            <button
              className="pill"
              onClick={() => openExternal(contact.linkedin)}
              type="button"
            >
              LinkedIn Profile
            </button>
            <button
              className="pill"
              onClick={() => openExternal("/Users/Public/Desktop/Resume.pdf")}
              type="button"
            >
              View Resume
            </button>
          </div>
        </div>
        <div className="card">
          <h3>Snapshot</h3>
          <p className="muted">{contact.location}</p>
          <p>
            Full-stack and embedded builder combining computer vision, control
            systems, and product UX to ship usable projects end-to-end.
          </p>
        </div>
      </header>

      <section className="card">
        <div className="section-title">Projects</div>
        <div className="grid">
          {projects.map(({ name, timeline, highlights, tech }) => (
            <div key={name} className="card">
              <h3>{name}</h3>
              <div className="muted">{timeline}</div>
              <ul className="list">
                {highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="tech">
                {tech.map((item) => (
                  <span key={item} className="badge">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="section-title">Experience</div>
        <div className="grid">
          {experience.map(({ role, company, timeline, highlights, tech }) => (
            <div key={`${company}-${role}`} className="card">
              <h3>
                {role} · {company}
              </h3>
              <div className="muted">{timeline}</div>
              <ul className="list">
                {highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="tech">
                {tech.map((item) => (
                  <span key={item} className="badge">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="sections">
        <div className="card">
          <div className="section-title">Education</div>
          <h3>{education.school}</h3>
          <div className="muted">{education.timeline}</div>
          <p style={{ marginTop: 8 }}>Key coursework:</p>
          <div className="tech" style={{ marginTop: 6 }}>
            {education.coursework.map((item) => (
              <span key={item} className="badge">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="section-title">Skills</div>
          <h3>Languages</h3>
          <div className="tech">
            {skills.languages.map((item) => (
              <span key={item} className="badge">
                {item}
              </span>
            ))}
          </div>
          <h3 style={{ marginTop: 12 }}>Frameworks & Libraries</h3>
          <div className="tech">
            {skills.frameworks.map((item) => (
              <span key={item} className="badge">
                {item}
              </span>
            ))}
          </div>
          <h3 style={{ marginTop: 12 }}>Tools</h3>
          <div className="tech">
            {skills.tools.map((item) => (
              <span key={item} className="badge">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </AppContainer>
  );
};

export default memo(Portfolio);
