import { Fragment, memo, useCallback, useState, type FC } from "react";
import StyledPortfolio from "components/apps/Portfolio/StyledPortfolio";
import usePortfolio from "components/apps/Portfolio/usePortfolio";
import {
  contact,
  education,
  experience,
  projects,
  skills,
  snapshot,
} from "components/apps/Portfolio/data";
import AppContainer from "components/system/Apps/AppContainer";
import { type ComponentProcessProps } from "components/system/Apps/RenderComponent";
import { useProcesses } from "contexts/process";

const RESUME_PATH = "/Users/Public/Desktop/Resume.pdf";

const Portfolio: FC<ComponentProcessProps> = ({ id }) => {
  const { open } = useProcesses();
  const openExternal = useCallback((href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
  }, []);
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});
  const toggleProject = useCallback(
    (name: string) =>
      setOpenProjects((current) => ({ ...current, [name]: !current[name] })),
    []
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
                onClick={() => openExternal(contact.github)}
                type="button"
              >
                GitHub
              </button>
              <button
                className="pill"
                onClick={() => openExternal(contact.linkedin)}
                type="button"
              >
                LinkedIn
              </button>
              <button
                className="pill"
                onClick={() => openExternal(contact.site)}
                type="button"
              >
                yassin.app
              </button>
              <button
                className="pill"
                onClick={() => {
                  window.location.href = `mailto:${contact.email}`;
                }}
                type="button"
              >
                {contact.email}
              </button>
              <button
                className="pill"
                onClick={() => open("PDF", { url: RESUME_PATH })}
                type="button"
              >
                View Resume
              </button>
            </div>
          </div>
          <div className="card snapshot-card">
            <div className="section-title">Snapshot</div>
            <p className="summary">{snapshot.text}</p>
            <dl className="facts">
              {snapshot.facts.map(({ label, value }) => (
                <Fragment key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </Fragment>
              ))}
            </dl>
          </div>
        </header>

        <section className="section">
          <div className="section-title">
            Projects <span className="count">{projects.length}</span>
          </div>
          <div className="grid">
            {projects.map(
              ({ name, timeline, summary, highlights, repo, site, tech }) => (
                <div key={name} className="card">
                  <div className="card-head">
                    <h3>{name}</h3>
                    <span className="muted">{timeline}</span>
                  </div>
                  <p className="summary">{summary}</p>
                  <div className="tech">
                    {tech.map((item) => (
                      <span key={item} className="badge">
                        {item}
                      </span>
                    ))}
                  </div>
                  {openProjects[name] && (
                    <ul className="list">
                      {highlights.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  <div className="pill-row">
                    <button
                      className="pill ghost"
                      onClick={() => toggleProject(name)}
                      type="button"
                    >
                      {openProjects[name] ? "Less" : "Details"}
                    </button>
                    {repo && (
                      <button
                        className="pill ghost"
                        onClick={() => openExternal(repo)}
                        type="button"
                      >
                        Repo
                      </button>
                    )}
                    {site && (
                      <button
                        className="pill ghost"
                        onClick={() => openExternal(site)}
                        type="button"
                      >
                        Site
                      </button>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        <section className="section">
          <div className="section-title">Experience</div>
          <div className="grid grid-wide">
            {experience.map(
              ({ role, company, location, timeline, highlights, tech }) => (
                <div key={`${company}-${role}`} className="card">
                  <div className="card-head">
                    <h3>{role}</h3>
                    <span className="muted">{timeline}</span>
                  </div>
                  <div className="muted">
                    {company} - {location}
                  </div>
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
              )
            )}
          </div>
        </section>

        <section className="split">
          <div className="card">
            <div className="section-title">Education</div>
            <div className="card-head">
              <h3>{education.school}</h3>
              <span className="muted">{education.timeline}</span>
            </div>
            <div className="muted">
              {education.degree} - {education.location}
            </div>
            <div className="skill-group">
              <h4>Relevant coursework</h4>
              <div className="tech">
                {education.coursework.map((item) => (
                  <span key={item} className="badge">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="section-title">Technical Skills</div>
            <div className="skill-group">
              <h4>Languages</h4>
              <div className="tech">
                {skills.languages.map((item) => (
                  <span key={item} className="badge">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="skill-group">
              <h4>Frameworks & libraries</h4>
              <div className="tech">
                {skills.frameworks.map((item) => (
                  <span key={item} className="badge">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="skill-group">
              <h4>Developer tools & environments</h4>
              <div className="tech">
                {skills.tools.map((item) => (
                  <span key={item} className="badge">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppContainer>
  );
};

export default memo(Portfolio);
