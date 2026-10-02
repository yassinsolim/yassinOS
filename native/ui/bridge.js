const status = document.querySelector("#status");
const detail = document.querySelector("#detail");
const confirmRow = document.querySelector("#confirm");
const fields = {
  app: document.querySelector("#app"),
  host: document.querySelector("#host"),
  label: document.querySelector("#label"),
};

let pending = "";
let poll = 0;

const invoke = (command, args) => {
  const internals = window.__TAURI_INTERNALS__;
  if (!internals || typeof internals.invoke !== "function") {
    return Promise.reject(
      new Error("This page is not inside the desktop wrapper.")
    );
  }
  return internals.invoke(command, args || {});
};

const show = (text) => {
  detail.textContent = text;
};

const refresh = async () => {
  const bridge = await invoke("bridge_status");
  const lab = await invoke("lab_status");
  status.textContent = bridge.installed
    ? `Moonlight: ${bridge.executable}`
    : "Moonlight is not installed on this computer.";
  const saved = await invoke("load_target");
  if (saved) {
    fields.label.value = saved.hostLabel || "";
    fields.host.value = saved.host || "";
    fields.app.value = saved.app || "";
  }
  show(lab.reason || "");
};

const stopPoll = () => {
  if (poll) window.clearInterval(poll);
  poll = 0;
};

const watch = () => {
  stopPoll();
  poll = window.setInterval(() => {
    invoke("launch_status")
      .then((report) => {
        const code =
          report.code === null || report.code === undefined
            ? ""
            : ` (${report.code})`;
        show(`${report.message}${code}`);
        if (!report.running) stopPoll();
      })
      .catch((error) => {
        show(
          error instanceof Error ? error.message : "Could not read the launch."
        );
        stopPoll();
      });
  }, 1000);
};

document.querySelector("#preview").addEventListener("click", () => {
  invoke("preview_launch", {
    args: { appName: fields.app.value, host: fields.host.value },
  })
    .then((preview) => {
      show(`${preview.program}\n${preview.args.join(" ")}`);
    })
    .catch((error) => {
      show(error instanceof Error ? error.message : "Could not preview.");
    });
});

const arm = (action) => {
  pending = action;
  confirmRow.hidden = false;
};

document.querySelector("#save").addEventListener("click", () => {
  arm("save");
});

document.querySelector("#launch").addEventListener("click", () => {
  arm("launch");
});

document.querySelector("#confirm-no").addEventListener("click", () => {
  pending = "";
  confirmRow.hidden = true;
});

document.querySelector("#confirm-yes").addEventListener("click", () => {
  const action = pending;
  pending = "";
  confirmRow.hidden = true;
  if (action === "save") {
    invoke("save_target", {
      args: {
        appName: fields.app.value,
        confirmed: true,
        host: fields.host.value,
        hostLabel: fields.label.value,
      },
    })
      .then(() => show("Saved the host and app. No password was stored."))
      .catch((error) => {
        show(error instanceof Error ? error.message : "Could not save.");
      });
    return;
  }
  if (action === "launch") {
    invoke("launch_stream", { args: { confirmed: true } })
      .then(() => {
        show("Started Moonlight.");
        watch();
      })
      .catch((error) => {
        show(
          error instanceof Error ? error.message : "Moonlight did not start."
        );
      });
  }
});

document.querySelector("#cancel").addEventListener("click", () => {
  stopPoll();
  invoke("cancel_launch")
    .then(() => show("Cancelled the launch."))
    .catch((error) => {
      show(error instanceof Error ? error.message : "Could not cancel.");
    });
});

try {
  await refresh();
} catch (error) {
  status.textContent =
    error instanceof Error ? error.message : "The bridge did not answer.";
}
