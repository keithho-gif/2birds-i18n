// OR (Organisation Registration) Dashboard.
// Tabs across the three stages; each stage is a vertical accordion of
// requirement cards, each card revealing SSG's requirement + "How we assist".

const { useState } = React;

function OrDashboard() {
  const stages = (typeof window !== "undefined" && window.TB_OR_STAGES) || [];
  const note   = (typeof window !== "undefined" && window.TB_OR_NOTE) || "";

  const [stageId, setStageId] = useState(stages[0] && stages[0].id);
  const [openItem, setOpenItem] = useState(null);

  const stage = stages.find(s => s.id === stageId) || stages[0];
  if (!stage) return null;

  const onPickStage = (id) => {
    setStageId(id);
    setOpenItem(null);
  };

  const toggle = (id) => setOpenItem(prev => (prev === id ? null : id));

  // Pre-built mailto for the section CTA + per-item CTAs.
  const mailto = (subject, body) =>
    "mailto:hello@2birds.asia" +
    "?subject=" + encodeURIComponent(subject) +
    "&body=" + encodeURIComponent(body);

  return (
    <div className="ord">

      {/* Note: OR + CA submission ride together */}
      <aside className="ord__note">
        <span className="ord__note-mark">§</span>
        <p className="ord__note-body">{note}</p>
      </aside>

      {/* Stage tabs */}
      <div className="ord__tabs" role="tablist">
        {stages.map(s => (
          <button
            key={s.id}
            role="tab"
            type="button"
            aria-selected={stageId === s.id}
            aria-controls={"ord-panel-" + s.id}
            className={"ord__tab" + (stageId === s.id ? " is-active" : "")}
            onClick={() => onPickStage(s.id)}
          >
            <span className="ord__tab-label">{s.label}</span>
            <span className="ord__tab-title">{s.title}</span>
          </button>
        ))}
      </div>

      {/* Stage panel */}
      <div
        role="tabpanel"
        id={"ord-panel-" + stage.id}
        className="ord__panel"
      >
        <header className="ord__panel-head">
          <span className="ord__panel-eyebrow">{stage.label}</span>
          <h3 className="ord__panel-title">{stage.title}</h3>
          <p className="ord__panel-blurb">{stage.blurb}</p>
        </header>

        <ul className="ord__list">
          {stage.items.map(item => {
            const open = openItem === item.id;
            return (
              <li key={item.id} className={"ord__item" + (open ? " is-open" : "")}>
                <button
                  type="button"
                  className="ord__item-head"
                  aria-expanded={open}
                  aria-controls={"ord-body-" + item.id}
                  onClick={() => toggle(item.id)}
                >
                  <span className="ord__item-ref">{item.ref}</span>
                  <span className="ord__item-name">{item.name}</span>
                  <span className="ord__item-summary">{item.summary}</span>
                  <span className="ord__item-sign" aria-hidden="true">{open ? "−" : "+"}</span>
                </button>
                <div
                  id={"ord-body-" + item.id}
                  className="ord__item-body"
                  hidden={!open}
                >
                  <div className="ord__item-split">
                    <div className="ord__item-col">
                      <span className="ord__col-label">The SSG requirement</span>
                      <p className="ord__item-text">{item.body}</p>
                    </div>
                    <div className="ord__item-col ord__item-col--assist">
                      <span className="ord__col-label ord__col-label--assist">
                        How 2birds assists
                      </span>
                      <p className="ord__item-text">{item.assist}</p>
                      <a
                        className="ord__item-cta"
                        href={mailto(
                          "OR application enquiry · " + item.name,
                          "Dear 2birds,\n\nWe should like to discuss the following Organisation Registration requirement with the practice.\n\n" +
                          "Requirement: " + item.name + " (" + item.ref + ")\nStage: " + stage.title + "\n\nA note on the engagement:\n\n\nKind regards,\n"
                        )}
                      >
                        Discuss this with 2birds
                        <span aria-hidden="true">→</span>
                      </a>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bottom CTA */}
      <div className="ord__foot">
        <h4 className="ord__foot-title">
          Engage <em>2birds</em> on the full OR application.
        </h4>
        <p className="ord__foot-body">
          Where the requirement list above is daunting, that is by design. Organisation
          Registration is the work of months, not days. We carry the OR application end
          to end on a single fixed-fee engagement, alongside the paired Course
          Application that SSG requires to be submitted with it.
        </p>
        <div className="ord__foot-actions">
          <a
            className="btn"
            href={mailto(
              "Organisation Registration · full engagement enquiry",
              "Dear 2birds,\n\nWe should like to discuss engaging the practice on a full Organisation Registration application.\n\n" +
              "About us:\n\nIntended target training group (Public / In-House / Both):\n\nTimeline:\n\nA note on the engagement:\n\n\nKind regards,\n"
            )}
          >
            Engage 2birds on our OR application
          </a>
          <a className="btn ord__btn-ghost" href="contact.html">
            Begin a conversation first
          </a>
        </div>
      </div>

      {/* Disclaimer */}
      <aside className="ord__disclaimer" aria-label="Legal notice and disclaimer">
        <span className="ord__disclaimer-kicker">Legal notice and disclaimer</span>
        <h4 className="ord__disclaimer-title">A note on this register</h4>
        <div className="ord__disclaimer-cols">
          <p className="ord__disclaimer-body">
            The Organisation Registration requirements summarised in this dashboard are
            paraphrased from the TPGateway documentation published by SkillsFuture Singapore
            (<em>“SSG”</em>), current as at the date of publication. The dashboard is provided
            for the convenience of prospective Approved Training Organisations and their
            advisers. It is a working reference only and does not constitute advice on any
            particular application.
          </p>
          <p className="ord__disclaimer-body">
            The inclusion of a requirement does not warrant that satisfying it will result in
            registration or approval, and the omission of a requirement does not imply that
            SSG will refrain from imposing further conditions. Registration, and its
            continuance, reside at all times in the sole and absolute discretion of SSG.
          </p>
          <p className="ord__disclaimer-body">
            The “How 2birds assists” notes describe the typical role of the practice and are
            in every case subject to a separate engagement letter. Where this dashboard and
            the official SSG framework differ, the official framework, in its current form,
            shall prevail.
          </p>
        </div>
        <span className="ord__disclaimer-meta">
          Maintained by 2birds · Paraphrased from SSG TPGateway documentation · The official SSG framework prevails.
        </span>
      </aside>
    </div>
  );
}

window.OrDashboard = OrDashboard;
