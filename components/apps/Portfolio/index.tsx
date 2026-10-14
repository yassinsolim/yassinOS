import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
} from "react";
import StyledPortfolio from "components/apps/Portfolio/StyledPortfolio";
import usePortfolio from "components/apps/Portfolio/usePortfolio";
import {
  contact,
  education,
  experience,
  openSource,
  projects,
  skills,
  snapshot,
} from "components/apps/Portfolio/data";
import AppContainer from "components/system/Apps/AppContainer";
import { type ComponentProcessProps } from "components/system/Apps/RenderComponent";
import { useProcesses } from "contexts/process";

const RESUME_PATH = "/Users/Public/Desktop/Resume.pdf";

const SECTIONS = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "open-source", label: "Open source" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const SKILL_GROUPS = [
  { items: skills.languages, label: "Languages" },
  { items: skills.aiGpu, label: "AI & GPU" },
  { items: skills.frameworks, label: "Frameworks & libraries" },
  { items: skills.tools, label: "Tools" },
];

const Tags: FC<{ items: string[] }> = ({ items }) => (
  <ul className="tags">
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

const Points: FC<{ items: string[] }> = ({ items }) => (
  <ul className="points">
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

const Portfolio: FC<ComponentProcessProps> = ({ id }) => {
  const { open } = useProcesses();
  const scrollRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const jumping = useRef(false);
  const settle = useRef(0);
  const sections = useRef<Partial<Record<SectionId, HTMLElement | null>>>({});
  const [active, setActive] = useState<SectionId>("about");
  const [openProjects, setOpenProjects] = useState<
    Partial<Record<string, boolean>>
  >({});
  const allOpen = projects.every(({ name }) => openProjects[name]);
  const sectionRef = useMemo(
    () =>
      Object.fromEntries(
        SECTIONS.map(({ id: section }) => [
          section,
          (element: HTMLElement | null) => {
            sections.current[section] = element;
          },
        ])
      ) as Record<SectionId, (element: HTMLElement | null) => void>,
    []
  );
  const openExternal = useCallback((href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
  }, []);
  const toggleProject = useCallback(
    (name: string) =>
      setOpenProjects((current) => ({ ...current, [name]: !current[name] })),
    []
  );
  const toggleAllProjects = useCallback(
    () =>
      setOpenProjects(
        allOpen
          ? {}
          : Object.fromEntries(projects.map(({ name }) => [name, true]))
      ),
    [allOpen]
  );
  const goTo = useCallback((section: SectionId) => {
    const scroller = scrollRef.current;
    const target = sections.current[section];
    const nav = navRef.current;

    if (!scroller || !target) return;

    // on a narrow window the section links stick to the top, over the page
    const covered =
      nav && getComputedStyle(nav).position === "sticky"
        ? nav.getBoundingClientRect().height
        : 0;

    jumping.current = true;
    window.clearTimeout(settle.current);
    settle.current = window.setTimeout(() => {
      jumping.current = false;
    }, 1000);
    setActive(section);
    scroller.scrollTo({
      behavior: "smooth",
      top:
        target.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop -
        covered -
        24,
    });
  }, []);
  // the section being read is the last one whose top is above a third of the
  // way down, or the last one once the bottom is reached. a clicked section
  // stays picked until its jump has stopped scrolling
  const onScroll = useCallback(() => {
    const scroller = scrollRef.current;

    if (!scroller) return;

    if (jumping.current) {
      window.clearTimeout(settle.current);
      settle.current = window.setTimeout(() => {
        jumping.current = false;
      }, 150);
      return;
    }

    const line =
      scroller.getBoundingClientRect().top + scroller.clientHeight / 3;
    const atEnd =
      scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
    const passed = SECTIONS.filter(
      ({ id: section }) =>
        (sections.current[section]?.getBoundingClientRect().top ??
          Number.POSITIVE_INFINITY) <= line
    );

    setActive(
      atEnd
        ? SECTIONS[SECTIONS.length - 1].id
        : (passed[passed.length - 1]?.id ?? SECTIONS[0].id)
    );
  }, []);

  // on a narrow window the section links are a row that scrolls sideways:
  // keep the picked one in view as the reading moves or the window resizes
  const revealActive = useCallback(() => {
    const nav = navRef.current;
    const button = nav?.querySelector<HTMLElement>("[aria-current]");

    if (!nav || !button || nav.scrollWidth <= nav.clientWidth) return;

    const { left, right } = button.getBoundingClientRect();
    const view = nav.getBoundingClientRect();

    if (left < view.left || right > view.right) {
      nav.scrollTo({
        behavior: "smooth",
        left: nav.scrollLeft + left - view.left - 20,
      });
    }
  }, []);

  useEffect(revealActive, [/* effect dep */ active, revealActive]);

  useEffect(() => {
    const nav = navRef.current;
    const observer = new ResizeObserver(revealActive);

    if (nav) observer.observe(nav);

    return () => observer.disconnect();
  }, [revealActive]);

  return (
    <AppContainer
      StyledComponent={StyledPortfolio}
      id={id}
      useHook={usePortfolio}
    >
      <div ref={scrollRef} className="scroll" onScroll={onScroll}>
        <div className="layout">
          <aside className="sidebar">
            <div className="identity">
              <h1>{contact.name}</h1>
              {contact.headline.map((line) => (
                <p key={line} className="headline">
                  {line}
                </p>
              ))}
            </div>
            <div className="actions">
              <button
                className="button primary"
                onClick={() => open("PDF", { url: RESUME_PATH })}
                type="button"
              >
                Resume
              </button>
              <button
                className="button"
                onClick={() => openExternal(contact.github)}
                type="button"
              >
                GitHub
              </button>
              <button
                className="button"
                onClick={() => openExternal(contact.linkedin)}
                type="button"
              >
                LinkedIn
              </button>
              <button
                className="button"
                onClick={() => {
                  window.location.href = `mailto:${contact.email}`;
                }}
                type="button"
              >
                Email
              </button>
            </div>
            <p className="meta">
              {contact.location}
              <br />
              {contact.email}
            </p>
            <nav ref={navRef} aria-label="Sections" className="nav">
              {SECTIONS.map(({ id: section, label }) => (
                <button
                  key={section}
                  aria-current={active === section ? "true" : undefined}
                  className={active === section ? "active" : undefined}
                  onClick={() => goTo(section)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          <main className="main">
            <section ref={sectionRef.about} className="section">
              <h2 className="label">About</h2>
              <p className="lede">{contact.summary}</p>
              <p className="body">{snapshot.text}</p>
              <dl className="facts">
                {snapshot.facts.map(({ label, value }) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section ref={sectionRef.experience} className="section">
              <h2 className="label">Experience</h2>
              <div className="entries">
                {experience.map(
                  ({ role, company, location, timeline, highlights, tech }) => (
                    <article key={`${company}-${role}`} className="entry">
                      <header className="entry-head">
                        <div>
                          <h3>{role}</h3>
                          <p className="org">
                            {company} · {location}
                          </p>
                        </div>
                        <span className="date">{timeline}</span>
                      </header>
                      <Points items={highlights} />
                      <Tags items={tech} />
                    </article>
                  )
                )}
              </div>
            </section>

            <section ref={sectionRef.projects} className="section">
              <div className="label-row">
                <h2 className="label">
                  Projects <span className="count">{projects.length}</span>
                </h2>
                <button
                  className="text-button"
                  onClick={toggleAllProjects}
                  type="button"
                >
                  {allOpen ? "Hide details" : "Show all details"}
                </button>
              </div>
              <div className="cards">
                {projects.map(
                  ({
                    name,
                    timeline,
                    summary,
                    highlights,
                    repo,
                    site,
                    tech,
                  }) => {
                    const expanded = Boolean(openProjects[name]);

                    return (
                      <article key={name} className="card">
                        <header className="card-head">
                          <h3>{name}</h3>
                          <span className="date">{timeline}</span>
                        </header>
                        <p className="body">{summary}</p>
                        {expanded && <Points items={highlights} />}
                        <Tags items={tech} />
                        <div className="links">
                          <button
                            aria-expanded={expanded}
                            className="text-button"
                            onClick={() => toggleProject(name)}
                            type="button"
                          >
                            {expanded ? "Less" : "Details"}
                          </button>
                          {repo && (
                            <button
                              className="text-button"
                              onClick={() => openExternal(repo)}
                              type="button"
                            >
                              Code ↗
                            </button>
                          )}
                          {site && (
                            <button
                              className="text-button"
                              onClick={() => openExternal(site)}
                              type="button"
                            >
                              Live ↗
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            </section>

            <section ref={sectionRef["open-source"]} className="section">
              <h2 className="label">Open source</h2>
              <div className="entries">
                {openSource.map(
                  ({ name, role, timeline, highlights, links, tech }) => (
                    <article key={name} className="entry">
                      <header className="entry-head">
                        <div>
                          <h3>{name}</h3>
                          <p className="org">{role}</p>
                        </div>
                        <span className="date">{timeline}</span>
                      </header>
                      <Points items={highlights} />
                      <Tags items={tech} />
                      <div className="links">
                        {links.map(({ label, url }) => (
                          <button
                            key={label}
                            className="text-button"
                            onClick={() => openExternal(url)}
                            type="button"
                          >
                            {label} ↗
                          </button>
                        ))}
                      </div>
                    </article>
                  )
                )}
              </div>
            </section>

            <section ref={sectionRef.skills} className="section">
              <h2 className="label">Skills</h2>
              <dl className="skills">
                {SKILL_GROUPS.map(({ items, label }) => (
                  <div key={label} className="skill-row">
                    <dt>{label}</dt>
                    <dd>
                      <Tags items={items} />
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section ref={sectionRef.education} className="section">
              <h2 className="label">Education</h2>
              <div className="entries">
                <article className="entry">
                  <header className="entry-head">
                    <div>
                      <h3>{education.school}</h3>
                      <p className="org">
                        {education.degree} · {education.location}
                      </p>
                    </div>
                    <span className="date">{education.timeline}</span>
                  </header>
                  <p className="sub">Relevant coursework</p>
                  <Tags items={education.coursework} />
                </article>
              </div>
            </section>
          </main>
        </div>
      </div>
    </AppContainer>
  );
};

export default memo(Portfolio);
