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

#[tauri::command]
fn save_target(app: tauri::AppHandle, args: SaveArgs) -> Result<(), String> {
    if !args.confirmed {
        return Err("Confirmation is required.".into());
    }
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
    if !args.confirmed {
        return Err("Confirmation is required.".into());
    }
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

#[tauri::command]
fn cancel_launch(state: tauri::State<LaunchState>) -> Result<(), String> {
    let mut guard = state
        .0
        .lock()
        .map_err(|_| "launch state is locked".to_string())?;
    let Some(child) = guard.as_mut() else {
        return Ok(());
    };
    child
        .kill()
        .map_err(|_| "could not cancel the launch".to_string())?;
    let _ = child.wait();
    *guard = None;
    Ok(())
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
