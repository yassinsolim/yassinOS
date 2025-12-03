import { memo, useCallback, useState, type FC } from "react";
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
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});
  const [openExperience, setOpenExperience] = useState<Record<string, boolean>>(
    {}
  );

  return (
    <AppContainer
      StyledComponent={StyledPortfolio}
      id={id}
      useHook={usePortfolio}
    >
      <div className="content">
        <header>
          <div className="card hero-card">
            <div className="eyebrow">Portfolio</div>
            <h1>{contact.name}</h1>
            <h2>{contact.tagline}</h2>
            <p>{contact.summary}</p>
            <div className="pill-row contact-actions">
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
          <div className="card snapshot-card">
            <div className="section-title">Snapshot</div>
            <p className="muted">{contact.location}</p>
            <p>
              Full-stack and embedded builder combining computer vision, control
              systems, and product UX to ship usable projects end-to-end.
            </p>
          </div>
        </header>

        <section className="section">
          <div className="section-header">
            <div className="section-title">Projects</div>
          </div>
          <div className="stack grid-stack">
            {projects.map(({ name, timeline, highlights, tech }) => (
              <div key={name} className="card">
                <h3>{name}</h3>
                <div className="muted">{timeline}</div>
                <button
                  className="pill"
                  onClick={() =>
                    setOpenProjects((current) => ({
                      ...current,
                      [name]: !current[name],
                    }))
                  }
                  type="button"
                >
                  {openProjects[name] ? "Hide details" : "Show details"}
                </button>
                {openProjects[name] && (
                  <>
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
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <div className="section-title">Experience</div>
          </div>
          <div className="stack grid-stack">
            {experience.map(({ role, company, timeline, highlights, tech }) => (
              <div key={`${company}-${role}`} className="card">
                <h3>
                  {role} at {company}
                </h3>
                <div className="muted">{timeline}</div>
                <button
                  className="pill"
                  onClick={() =>
                    setOpenExperience((current) => ({
                      ...current,
                      [`${company}-${role}`]: !current[`${company}-${role}`],
                    }))
                  }
                  type="button"
                >
                  {openExperience[`${company}-${role}`]
                    ? "Hide details"
                    : "Show details"}
                </button>
                {openExperience[`${company}-${role}`] && (
                  <>
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
                  </>
                )}
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
      </div>
    </AppContainer>
  );
};

export default memo(Portfolio);
