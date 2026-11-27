import { Fragment, memo, useCallback, type FC } from "react";
import StyledGamePorts from "components/apps/GamePorts/StyledGamePorts";
import useGamePorts from "components/apps/GamePorts/useGamePorts";
import {
  credits,
  devices,
  disclaimer,
  features,
  intro,
  links,
  pipeline,
  ports,
  setup,
  upcoming,
} from "components/apps/GamePorts/data";
import AppContainer from "components/system/Apps/AppContainer";
import { type ComponentProcessProps } from "components/system/Apps/RenderComponent";
import { useProcesses } from "contexts/process";

type DeviceId = (typeof devices)[number]["id"];

// outlines of the two handhelds the ports are measured on, open: the Thor has
// a second screen in its lower half, the Flip 2 its sticks and buttons
const Handheld: FC<{ device: DeviceId }> = ({ device }) => (
  <svg aria-hidden="true" className="handheld" viewBox="0 0 96 96">
    <rect height="38" rx="6" width="76" x="10" y="6" />
    <rect className="screen" height="28" rx="2" width="60" x="18" y="11" />
    <path d="M22 44v4M74 44v4" />
    <rect height="42" rx="7" width="84" x="6" y="48" />
    {device === "thor" ? (
      <>
        <rect className="screen" height="24" rx="2" width="34" x="31" y="57" />
        <path d="M14 69h10M19 64v10" />
        <circle cx="77" cy="63" r="2.2" />
        <circle cx="71" cy="69" r="2.2" />
        <circle cx="83" cy="69" r="2.2" />
        <circle cx="77" cy="75" r="2.2" />
      </>
    ) : (
      <>
        <path d="M17 63h10M22 58v10" />
        <circle cx="33" cy="77" r="5" />
        <circle cx="63" cy="77" r="5" />
        <circle cx="75" cy="57" r="2.2" />
        <circle cx="69" cy="63" r="2.2" />
        <circle cx="81" cy="63" r="2.2" />
        <circle cx="75" cy="69" r="2.2" />
        <path d="M43 60h10" />
      </>
    )}
  </svg>
);

const GamePorts: FC<ComponentProcessProps> = ({ id }) => {
  const { open } = useProcesses();
  const openExternal = useCallback((href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <AppContainer
      StyledComponent={StyledGamePorts}
      id={id}
      useHook={useGamePorts}
    >
      <div className="scroll">
        <div className="page">
          <header className="hero">
            <p className="eyebrow">Static recompilation · Android · Vulkan</p>
            <h1>Game Ports</h1>
            <p className="lede">{intro.lede}</p>
            <p className="body">{intro.text}</p>
            <div className="actions">
              <button
                className="button primary"
                onClick={() => openExternal(links.discord)}
                type="button"
              >
                Join the Discord
              </button>
              <button
                className="button"
                onClick={() => openExternal(links.github)}
                type="button"
              >
                GitHub
              </button>
            </div>
          </header>

          <section className="section">
            <h2 className="label">How it works</h2>
            <ol
              aria-label="From the console's code to Android"
              className="flow"
            >
              {pipeline.map(({ detail, name }, index) => (
                <Fragment key={name}>
                  {index > 0 && (
                    <li aria-hidden="true" className="arrow">
                      <svg viewBox="0 0 24 24">
                        <path d="M4 12h15M13 6l6 6-6 6" />
                      </svg>
                    </li>
                  )}
                  <li className="stage">
                    <span className="stage-name">{name}</span>
                    <span className="stage-detail">{detail}</span>
                  </li>
                </Fragment>
              ))}
            </ol>
          </section>

          <section className="section">
            <h2 className="label">Measured</h2>
            <div className="devices">
              {devices.map(({ chip, fps, id: device, name }) => (
                <article key={device} className="device">
                  <Handheld device={device} />
                  <div>
                    <p className="fps">
                      {fps} <span>FPS</span>
                    </p>
                    <h3>{name}</h3>
                    <p className="chip">{chip}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Frames per second</th>
                    <th scope="col">AYN Thor</th>
                    <th scope="col">Retroid Pocket Flip 2</th>
                  </tr>
                </thead>
                <tbody>
                  {ports.map(({ flip, name, thor }) => (
                    <tr key={name}>
                      <th scope="row">{name}</th>
                      <td>{thor}</td>
                      <td>{flip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="note">
              Measured by the project on both devices, with the app&apos;s
              defaults. Other hardware is untested.
            </p>
          </section>

          <section className="section">
            <h2 className="label">
              Ports <span className="count">{ports.length}</span>
            </h2>
            <div className="cards">
              {ports.map(({ modes, name, note, repo, year }) => (
                <article key={name} className="card">
                  <header className="card-head">
                    <h3>{name}</h3>
                    <span className="date">{year}</span>
                  </header>
                  <p className="body">{modes}</p>
                  {note && <p className="note">{note}</p>}
                  <div className="links">
                    <button
                      className="text-button"
                      onClick={() => openExternal(`${repo}/releases`)}
                      type="button"
                    >
                      Releases ↗
                    </button>
                    <button
                      className="text-button"
                      onClick={() => openExternal(repo)}
                      type="button"
                    >
                      Code ↗
                    </button>
                  </div>
                </article>
              ))}
              <article className="card upcoming">
                <header className="card-head">
                  <h3>{upcoming.name}</h3>
                  <span className="status">{upcoming.status}</span>
                </header>
              </article>
            </div>
          </section>

          <section className="section">
            <h2 className="label">Setup</h2>
            <p className="body">{setup.text}</p>
            <ol className="shots">
              {setup.steps.map(({ alt, caption, src }, index) => (
                <li key={src}>
                  <button
                    aria-label={`${caption}: open the screenshot in Photos`}
                    className="shot"
                    onClick={() => open("Photos", { url: src })}
                    type="button"
                  >
                    <img
                      alt={alt}
                      decoding="async"
                      height={400}
                      loading="lazy"
                      src={src}
                      width={960}
                    />
                  </button>
                  <span className="caption">
                    <span className="step">{index + 1}</span>
                    {caption}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section className="section">
            <h2 className="label">In the app</h2>
            <ul className="points">
              {features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </section>

          <footer className="foot">
            <p>{credits}</p>
            <p>{disclaimer}</p>
          </footer>
        </div>
      </div>
    </AppContainer>
  );
};

export default memo(GamePorts);
