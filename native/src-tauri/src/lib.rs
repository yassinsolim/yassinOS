use std::path::PathBuf;
use std::process::Child;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use tauri::Manager;
use yassin_os_moonlight::{
    discover, executable_file, host_platform, lab_native, load_target as read_target,
    navigation_allowed, plan_stream, save_target as write_target, spawn_plan, StreamTarget,
    CONFIG_VERSION, LAB_UNAVAILABLE,
};

struct LaunchState(Mutex<Option<Child>>);

fn home_dir() -> PathBuf {
    #[cfg(windows)]
    {
        std::env::var_os("USERPROFILE")
            .map(PathBuf::from)
            .unwrap_or_default()
    }
    #[cfg(not(windows))]
    {
        std::env::var_os("HOME")
            .map(PathBuf::from)
            .unwrap_or_default()
    }
}

fn config_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_config_dir()
        .map_err(|_| "could not open app config".to_string())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct BridgeStatus {
    executable: String,
    installed: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Preview {
    args: Vec<String>,
    program: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LaunchStarted {
    running: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LaunchReport {
    code: Option<i32>,
    message: String,
    running: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct LabStatus {
    available: bool,
    reason: String,
}

fn moonlight_path() -> Option<PathBuf> {
    let home = home_dir();
    discover(&home, host_platform(), executable_file)
}

#[tauri::command]
fn bridge_status() -> BridgeStatus {
    match moonlight_path() {
        Some(path) => BridgeStatus {
            executable: path.display().to_string(),
            installed: true,
        },
        None => BridgeStatus {
            executable: String::new(),
            installed: false,
        },
    }
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct SaveArgs {
    app_name: String,
    confirmed: bool,
    host: String,
    host_label: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PreviewArgs {
    app_name: String,
    host: String,
}

#[derive(Deserialize)]
struct ConfirmArgs {
    confirmed: bool,
}

#[tauri::command]
fn load_target(app: tauri::AppHandle) -> Result<Option<StreamTarget>, String> {
    read_target(&config_dir(&app)?)
}

fn require_confirmation(confirmed: bool) -> Result<(), String> {
    if confirmed {
        Ok(())
    } else {
        Err("Confirmation is required.".into())
    }
}

#[tauri::command]
fn save_target(app: tauri::AppHandle, args: SaveArgs) -> Result<(), String> {
    require_confirmation(args.confirmed)?;
    let target = StreamTarget {
        app: args.app_name,
        host: args.host,
        host_label: args.host_label,
        version: CONFIG_VERSION,
    };
    write_target(&config_dir(&app)?, &target)
}

#[tauri::command]
fn preview_launch(args: PreviewArgs) -> Result<Preview, String> {
    let program = moonlight_path().ok_or("Moonlight is not installed on this computer.")?;
    let plan = plan_stream(
        &program,
        &home_dir(),
        host_platform(),
        &args.host,
        &args.app_name,
    )?;
    Ok(Preview {
        args: plan.args,
        program: plan.program.display().to_string(),
    })
}

#[tauri::command]
fn launch_stream(
    app: tauri::AppHandle,
    args: ConfirmArgs,
    state: tauri::State<LaunchState>,
) -> Result<LaunchStarted, String> {
    require_confirmation(args.confirmed)?;
    let target =
        read_target(&config_dir(&app)?)?.ok_or("Set a host and an app before launching.")?;
    let program = moonlight_path().ok_or("Moonlight is not installed on this computer.")?;
    let plan = plan_stream(
        &program,
        &home_dir(),
        host_platform(),
        &target.host,
        &target.app,
    )?;
    let mut guard = state
        .0
        .lock()
        .map_err(|_| "launch state is locked".to_string())?;
    if let Some(child) = guard.as_mut() {
        if child.try_wait().ok().flatten().is_none() {
            return Err("A launch is already running.".into());
        }
    }
    let child = spawn_plan(&plan).map_err(|_| "Moonlight did not start.".to_string())?;
    *guard = Some(child);
    Ok(LaunchStarted { running: true })
}

fn stop_child(slot: &mut Option<Child>) -> Result<(), String> {
    let Some(child) = slot.as_mut() else {
        return Ok(());
    };
    child
        .kill()
        .map_err(|_| "could not cancel the launch".to_string())?;
    let _ = child.wait();
    *slot = None;
    Ok(())
}

#[tauri::command]
fn cancel_launch(state: tauri::State<LaunchState>) -> Result<(), String> {
    let mut guard = state
        .0
        .lock()
        .map_err(|_| "launch state is locked".to_string())?;
    stop_child(&mut guard)
}

#[tauri::command]
fn launch_status(state: tauri::State<LaunchState>) -> Result<LaunchReport, String> {
    let mut guard = state
        .0
        .lock()
        .map_err(|_| "launch state is locked".to_string())?;
    let Some(child) = guard.as_mut() else {
        return Ok(LaunchReport {
            code: None,
            message: "No launch has been started.".into(),
            running: false,
        });
    };
    match child.try_wait() {
        Ok(None) => Ok(LaunchReport {
            code: None,
            message: "Moonlight is running.".into(),
            running: true,
        }),
        Ok(Some(status)) => {
            let code = status.code();
            *guard = None;
            Ok(LaunchReport {
                code,
                message: if status.success() {
                    "Moonlight exited.".into()
                } else {
                    "Moonlight exited with an error.".into()
                },
                running: false,
            })
        }
        Err(_) => Ok(LaunchReport {
            code: None,
            message: "Could not read the Moonlight status.".into(),
            running: false,
        }),
    }
}

#[tauri::command]
fn lab_status() -> LabStatus {
    let _ = lab_native();
    LabStatus {
        available: false,
        reason: LAB_UNAVAILABLE.into(),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(LaunchState(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            bridge_status,
            cancel_launch,
            lab_status,
            launch_status,
            launch_stream,
            load_target,
            preview_launch,
            save_target
        ])
        .setup(|app| {
            tauri::webview::WebviewWindowBuilder::new(
                app,
                "main",
                tauri::utils::config::WebviewUrl::App("index.html".into()),
            )
            .title("yassinOS Stream")
            .inner_size(760.0, 680.0)
            .resizable(true)
            .on_navigation(|url| navigation_allowed(url.as_str()))
            .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("yassinOS bridge failed to start");
}

#[cfg(test)]
mod command_tests {
    use super::*;
    use serde_json::Value;
    use std::process::Command;
    use std::time::Duration;
    use yassin_os_moonlight::{
        load_target as read_target, save_target as write_target, CONFIG_FILE,
    };

    fn moonlight_pids() -> Vec<String> {
        let output = Command::new("/bin/ps")
            .args(["-ax", "-o", "pid=,command="])
            .output()
            .unwrap();
        String::from_utf8(output.stdout)
            .unwrap()
            .lines()
            .filter(|line| line.contains("Moonlight.app/Contents/MacOS/Moonlight"))
            .map(str::to_string)
            .collect()
    }

    #[test]
    fn wrapper_commands_preview_and_store_without_launching() {
        let before = moonlight_pids();
        let status = bridge_status();
        assert!(status.installed);
        assert!(status
            .executable
            .ends_with("/Applications/Moonlight.app/Contents/MacOS/Moonlight"));
        assert!(!status.executable.contains("Moonlight-Multi"));

        assert!(preview_launch(PreviewArgs {
            app_name: "--quit-after".into(),
            host: "-help".into(),
        })
        .is_err());
        let preview = preview_launch(PreviewArgs {
            app_name: "NotARealApp".into(),
            host: "192.0.2.1".into(),
        })
        .expect("preview");
        assert_eq!(preview.args, vec!["stream", "192.0.2.1", "NotARealApp"]);
        assert_eq!(preview.program, status.executable);
        assert_eq!(moonlight_pids(), before);
        assert!(require_confirmation(false).is_err());
        assert!(require_confirmation(true).is_ok());

        let dir = std::env::temp_dir().join("yassin-os-bridge-harmless-test");
        let _ = std::fs::remove_dir_all(&dir);
        write_target(
            &dir,
            &StreamTarget {
                app: "NotARealApp".into(),
                host: "192.0.2.1".into(),
                host_label: "harmless".into(),
                version: CONFIG_VERSION,
            },
        )
        .expect("save");
        let saved = std::fs::read_to_string(dir.join(CONFIG_FILE)).unwrap();
        assert!(!saved.to_ascii_lowercase().contains("password"));
        assert!(!saved.contains("BEGIN CERTIFICATE"));
        let parsed: Value = serde_json::from_str(&saved).unwrap();
        let mut keys: Vec<_> = parsed.as_object().unwrap().keys().cloned().collect();
        keys.sort();
        assert_eq!(keys, vec!["app", "host", "hostLabel", "version"]);
        let loaded = read_target(&dir).unwrap().unwrap();
        assert_eq!(loaded.host, "192.0.2.1");
        assert_eq!(loaded.app, "NotARealApp");
        std::fs::write(
            dir.join(CONFIG_FILE),
            r#"{"app":"NotARealApp","host":"192.0.2.1","hostLabel":"harmless","password":"nope","version":1}"#,
        )
        .unwrap();
        assert!(read_target(&dir).is_err());

        let child = Command::new("/bin/sleep").arg("30").spawn().unwrap();
        let pid = child.id();
        let mut slot = Some(child);
        stop_child(&mut slot).unwrap();
        assert!(slot.is_none());
        std::thread::sleep(Duration::from_millis(200));
        let still = Command::new("/bin/ps")
            .args(["-p", &pid.to_string()])
            .status()
            .unwrap();
        assert!(!still.success());
        assert!(!lab_status().available);
        let _ = std::fs::remove_dir_all(&dir);
        assert_eq!(moonlight_pids(), before);
    }
}
