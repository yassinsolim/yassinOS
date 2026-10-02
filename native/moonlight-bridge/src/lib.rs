use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};

use serde::{Deserialize, Serialize};

pub const STREAM_ACTION: &str = "stream";
pub const CONFIG_VERSION: u32 = 1;
pub const CONFIG_FILE: &str = "stream-target.json";
pub const LAB_UNAVAILABLE: &str = "No native SSH launcher is registered.";

const SECRET_KEYS: &[&str] = &["credential", "passwd", "password", "pin", "secret", "token"];

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Platform {
    Linux,
    Macos,
    Windows,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum LabNative {
    NotImplemented,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct LaunchPlan {
    pub program: PathBuf,
    pub args: Vec<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct StreamTarget {
    pub app: String,
    pub host: String,
    pub host_label: String,
    pub version: u32,
}

pub fn lab_native() -> LabNative {
    LabNative::NotImplemented
}

pub fn host_platform() -> Platform {
    if cfg!(target_os = "macos") {
        Platform::Macos
    } else if cfg!(target_os = "windows") {
        Platform::Windows
    } else {
        Platform::Linux
    }
}

pub fn candidate_paths(home: &Path, platform: Platform) -> Vec<PathBuf> {
    match platform {
        Platform::Macos => vec![
            PathBuf::from("/Applications/Moonlight.app/Contents/MacOS/Moonlight"),
            home.join("Applications/Moonlight.app/Contents/MacOS/Moonlight"),
        ],
        Platform::Linux => vec![
            PathBuf::from("/usr/bin/moonlight"),
            PathBuf::from("/usr/local/bin/moonlight"),
            PathBuf::from("/opt/Moonlight/moonlight"),
            home.join(".local/bin/moonlight"),
        ],
        Platform::Windows => vec![
            PathBuf::from("C:\\Program Files\\Moonlight Game Streaming\\Moonlight.exe"),
            PathBuf::from("C:\\Program Files (x86)\\Moonlight Game Streaming\\Moonlight.exe"),
        ],
    }
}

pub fn is_allowlisted(path: &Path, home: &Path, platform: Platform) -> bool {
    candidate_paths(home, platform)
        .iter()
        .any(|candidate| candidate == path)
}

pub fn discover(
    home: &Path,
    platform: Platform,
    exists: impl Fn(&Path) -> bool,
) -> Option<PathBuf> {
    candidate_paths(home, platform)
        .into_iter()
        .find(|path| exists(path))
}

pub fn executable_file(path: &Path) -> bool {
    let Ok(meta) = fs::symlink_metadata(path) else {
        return false;
    };
    if !meta.file_type().is_file() {
        return false;
    }
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        return meta.permissions().mode() & 0o111 != 0;
    }
    #[cfg(not(unix))]
    {
        true
    }
}

pub fn validate_host(host: &str) -> Result<(), String> {
    if host.is_empty() || host.len() > 253 {
        return Err("Enter a host name or an IPv4 address.".into());
    }
    if host.starts_with('-') || host.starts_with('.') || host.contains("..") {
        return Err("That host is not allowed.".into());
    }
    let ok = host
        .bytes()
        .all(|byte| byte.is_ascii_alphanumeric() || byte == b'.' || byte == b'-');
    if !ok {
        return Err("That host is not allowed.".into());
    }
    Ok(())
}

pub fn validate_app(app: &str) -> Result<(), String> {
    if app.is_empty() || app.len() > 64 {
        return Err("Enter an app name.".into());
    }
    if app.starts_with('-') || app.split_whitespace().any(|part| part.starts_with('-')) {
        return Err("App names cannot include flags.".into());
    }
    let ok = app
        .chars()
        .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, ' ' | '.' | '_' | '+' | '-'));
    if !ok || app.chars().any(char::is_control) {
        return Err("That app name is not allowed.".into());
    }
    Ok(())
}

pub fn validate_label(label: &str) -> Result<(), String> {
    if label.is_empty() {
        return Ok(());
    }
    if label.len() > 64 || label.starts_with('-') {
        return Err("That label is not allowed.".into());
    }
    let ok = label
        .chars()
        .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, ' ' | '.' | '_' | '+' | '-'));
    if !ok || label.chars().any(char::is_control) {
        return Err("That label is not allowed.".into());
    }
    Ok(())
}

pub fn plan_stream(
    program: &Path,
    home: &Path,
    platform: Platform,
    host: &str,
    app: &str,
) -> Result<LaunchPlan, String> {
    if !is_allowlisted(program, home, platform) {
        return Err("That program is not the Moonlight app.".into());
    }
    validate_host(host)?;
    validate_app(app)?;
    Ok(LaunchPlan {
        program: program.to_path_buf(),
        args: vec![STREAM_ACTION.into(), host.into(), app.into()],
    })
}

pub fn spawn_plan(plan: &LaunchPlan) -> io::Result<Child> {
    if plan
        .args
        .iter()
        .any(|arg| arg.starts_with('-') || arg.chars().any(char::is_control))
    {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "rejected argument",
        ));
    }
    let mut command = Command::new(&plan.program);
    command.args(&plan.args);
    command.stdin(Stdio::null());
    command.spawn()
}

fn reject_secret_keys(value: &serde_json::Value) -> Result<(), String> {
    let Some(object) = value.as_object() else {
        return Err("malformed".into());
    };
    for key in object.keys() {
        if SECRET_KEYS
            .iter()
            .any(|secret| key.eq_ignore_ascii_case(secret))
        {
            return Err("secrets are not stored".into());
        }
    }
    Ok(())
}

pub fn target_from_json(bytes: &str) -> Result<StreamTarget, String> {
    let value: serde_json::Value =
        serde_json::from_str(bytes).map_err(|_| "malformed".to_string())?;
    reject_secret_keys(&value)?;
    let target: StreamTarget =
        serde_json::from_value(value).map_err(|_| "malformed".to_string())?;
    if target.version != CONFIG_VERSION {
        return Err("unsupported config version".into());
    }
    validate_label(&target.host_label)?;
    validate_host(&target.host)?;
    validate_app(&target.app)?;
    Ok(target)
}

pub fn target_to_json(target: &StreamTarget) -> Result<String, String> {
    if target.version != CONFIG_VERSION {
        return Err("unsupported config version".into());
    }
    validate_label(&target.host_label)?;
    validate_host(&target.host)?;
    validate_app(&target.app)?;
    serde_json::to_string(target).map_err(|_| "malformed".to_string())
}

pub fn save_target(dir: &Path, target: &StreamTarget) -> Result<(), String> {
    fs::create_dir_all(dir).map_err(|_| "could not save the target".to_string())?;
    let json = target_to_json(target)?;
    fs::write(dir.join(CONFIG_FILE), json).map_err(|_| "could not save the target".to_string())
}

pub fn load_target(dir: &Path) -> Result<Option<StreamTarget>, String> {
    let path = dir.join(CONFIG_FILE);
    if !path.is_file() {
        return Ok(None);
    }
    let bytes = fs::read_to_string(path).map_err(|_| "could not read the target".to_string())?;
    target_from_json(&bytes).map(Some)
}

pub fn navigation_allowed(url: &str) -> bool {
    let Some((scheme, rest)) = url.split_once("://") else {
        return false;
    };
    let raw_path = match scheme {
        "tauri" | "asset" => {
            let Some(after) = rest.strip_prefix("localhost") else {
                return false;
            };
            after
        }
        "http" | "https" => {
            let Some((host, path)) = rest.split_once('/') else {
                return rest == "tauri.localhost" || rest == "ipc.localhost";
            };
            if host != "tauri.localhost" && host != "ipc.localhost" {
                return false;
            }
            path
        }
        _ => return false,
    };
    let path = raw_path
        .trim_start_matches('/')
        .split(['?', '#'])
        .next()
        .unwrap_or("");
    matches!(path, "" | "index.html" | "bridge.js" | "bridge.css")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn home() -> PathBuf {
        PathBuf::from("/Users/me")
    }

    #[test]
    fn discovers_only_allowlisted_moonlight_binaries() {
        let official = PathBuf::from("/Applications/Moonlight.app/Contents/MacOS/Moonlight");
        let fork = PathBuf::from("/Applications/Moonlight-Multi.app/Contents/MacOS/Moonlight");
        let found = discover(&home(), Platform::Macos, |path| path == official);
        assert_eq!(found, Some(official.clone()));
        assert!(is_allowlisted(&official, &home(), Platform::Macos));
        assert!(!is_allowlisted(&fork, &home(), Platform::Macos));
        assert!(!is_allowlisted(
            Path::new("/tmp/moonlight"),
            &home(),
            Platform::Macos
        ));
        assert!(candidate_paths(&home(), Platform::Linux)
            .iter()
            .any(|path| path == Path::new("/usr/bin/moonlight")));
        assert!(candidate_paths(&home(), Platform::Windows)
            .iter()
            .any(|path| {
                path == Path::new("C:\\Program Files\\Moonlight Game Streaming\\Moonlight.exe")
            }));
    }

    #[test]
    fn rejects_flags_and_control_characters() {
        assert!(validate_host("desk.local").is_ok());
        assert!(validate_host("192.168.1.20").is_ok());
        assert!(validate_host("-help").is_err());
        assert!(validate_host("desk.local;rm").is_err());
        assert!(validate_host("host\nname").is_err());
        assert!(validate_host("fe80::1").is_err());
        assert!(validate_app("Desktop").is_ok());
        assert!(validate_app("Steam Big Picture").is_ok());
        assert!(validate_app("--quit-after").is_err());
        assert!(validate_app("Game --quit-after").is_err());
        assert!(validate_app("bad\u{0001}name").is_err());
        assert!(validate_app("$(whoami)").is_err());
    }

    #[test]
    fn plans_only_the_stream_action() {
        let program = PathBuf::from("/Applications/Moonlight.app/Contents/MacOS/Moonlight");
        let plan =
            plan_stream(&program, &home(), Platform::Macos, "desk.local", "Desktop").expect("plan");
        assert_eq!(
            plan.args,
            vec![
                "stream".to_string(),
                "desk.local".to_string(),
                "Desktop".to_string()
            ]
        );
        assert!(!plan
            .args
            .iter()
            .any(|arg| arg == "pair" || arg.starts_with('-')));
        assert!(plan_stream(
            Path::new("/tmp/not-moonlight"),
            &home(),
            Platform::Macos,
            "desk.local",
            "Desktop"
        )
        .is_err());
    }

    #[test]
    fn config_drops_secrets_and_unknown_versions() {
        let target = StreamTarget {
            app: "Desktop".into(),
            host: "desk.local".into(),
            host_label: "Desk".into(),
            version: CONFIG_VERSION,
        };
        let json = target_to_json(&target).expect("json");
        assert!(!json.to_ascii_lowercase().contains("password"));
        assert!(!json.to_ascii_lowercase().contains("token"));
        assert_eq!(target_from_json(&json).expect("parsed"), target);
        assert!(target_from_json(
            r#"{"app":"Desktop","host":"desk.local","hostLabel":"Desk","password":"x","version":1}"#
        )
        .is_err());
        assert!(target_from_json(
            r#"{"app":"Desktop","host":"desk.local","hostLabel":"Desk","version":2}"#
        )
        .is_err());

        let dir = std::env::temp_dir().join(format!("yos-bridge-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        save_target(&dir, &target).expect("save");
        assert_eq!(load_target(&dir).expect("load"), Some(target));
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn navigation_stays_on_the_bundled_page() {
        assert!(navigation_allowed("https://tauri.localhost/index.html"));
        assert!(navigation_allowed("http://tauri.localhost/bridge.js"));
        assert!(navigation_allowed("tauri://localhost/bridge.css"));
        assert!(navigation_allowed("https://ipc.localhost/"));
        assert!(!navigation_allowed("https://os.yassin.app/next"));
        assert!(!navigation_allowed("http://127.0.0.1:17373/"));
        assert!(!navigation_allowed("javascript:alert(1)"));
        assert!(!navigation_allowed("https://tauri.localhost/next"));
        assert!(!navigation_allowed("file:///Applications/Moonlight.app"));
    }

    #[test]
    fn lab_launcher_is_not_implemented() {
        assert_eq!(lab_native(), LabNative::NotImplemented);
    }

    #[test]
    fn spawn_rejects_flags_and_can_run_a_fixed_program() {
        let rejected = LaunchPlan {
            program: PathBuf::from("/usr/bin/true"),
            args: vec!["-n".into()],
        };
        assert!(spawn_plan(&rejected).is_err());

        let plan = LaunchPlan {
            program: PathBuf::from("/usr/bin/true"),
            args: Vec::new(),
        };
        let mut child = spawn_plan(&plan).expect("spawn true");
        let status = child.wait().expect("wait");
        assert!(status.success());
    }
}
