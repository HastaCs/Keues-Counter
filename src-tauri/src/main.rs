#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod proxy;

use std::fs;
use std::path::Path;
use std::sync::Arc;

use serde_json::{json, Value};
use tauri::Manager;

fn config_dir(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    app.path().app_config_dir().map_err(|e| e.to_string())
}

fn legacy_config() -> Option<Value> {
    let dir = dirs::config_dir()?;
    let file = dir.join("keues-counter").join("config.json");
    if file.exists() {
        let text = fs::read_to_string(file).ok()?;
        let root: Value = serde_json::from_str(&text).ok()?;
        root.get("config").cloned()
    } else {
        None
    }
}

fn write_config(file: &Path, config: &Value) -> Result<(), String> {
    if let Some(parent) = file.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let text = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(file, text).map_err(|e| e.to_string())
}

fn read_existing(file: &Path) -> Result<Value, String> {
    if file.exists() {
        let text = fs::read_to_string(file).map_err(|e| e.to_string())?;
        if text.trim().is_empty() {
            return Ok(Value::Null);
        }
        serde_json::from_str(&text).map_err(|e| e.to_string())
    } else {
        Ok(Value::Null)
    }
}

fn ensure_device_id(mut config: Value) -> (Value, bool) {
    let mut changed = false;
    if !config.is_object() {
        config = json!({});
        changed = true;
    }
    if let Some(obj) = config.as_object_mut() {
        let has_valid = obj
            .get("deviceId")
            .and_then(|v| v.as_str())
            .map(|s| uuid::Uuid::parse_str(s).is_ok())
            .unwrap_or(false);
        if !has_valid {
            obj.insert(
                "deviceId".into(),
                Value::String(uuid::Uuid::new_v4().to_string()),
            );
            changed = true;
        }
    }
    (config, changed)
}

fn merge_json(mut base: Value, incoming: Value) -> Value {
    if let (Some(base_obj), Some(inc_obj)) = (base.as_object_mut(), incoming.as_object()) {
        for (k, v) in inc_obj {
            base_obj.insert(k.clone(), v.clone());
        }
        base
    } else {
        incoming
    }
}

#[tauri::command]
fn load_config(app: tauri::AppHandle) -> Result<Value, String> {
    let dir = config_dir(&app)?;
    let file = dir.join("config.json");

    let mut config = read_existing(&file)?;

    if config.is_null() {
        if let Some(legacy) = legacy_config() {
            config = legacy;
        }
    }

    let (config, changed) = ensure_device_id(config);
    if changed {
        write_config(&file, &config)?;
    }

    Ok(json!({ "success": true, "config": config }))
}

#[tauri::command]
fn save_config(app: tauri::AppHandle, config: Value) -> Result<Value, String> {
    let dir = config_dir(&app)?;
    let file = dir.join("config.json");

    let existing = read_existing(&file)?;
    let (existing, _) = ensure_device_id(existing);
    let device_id = existing.get("deviceId").cloned().unwrap_or(Value::Null);

    let mut saved = merge_json(existing, config);
    if let Some(obj) = saved.as_object_mut() {
        obj.insert("deviceId".into(), device_id);
    }

    write_config(&file, &saved)?;

    Ok(json!({ "success": true, "config": saved }))
}

#[tauri::command]
fn get_proxy_base(state: tauri::State<'_, Arc<proxy::ProxyState>>) -> Result<String, String> {
    state
        .base
        .get()
        .cloned()
        .ok_or_else(|| "proxy not started".to_string())
}

#[tauri::command]
fn set_proxy_target(
    state: tauri::State<'_, Arc<proxy::ProxyState>>,
    url: String,
) -> Result<(), String> {
    let mut trimmed = url.trim().to_string();

    if !trimmed.is_empty()
        && !trimmed.starts_with("http://")
        && !trimmed.starts_with("https://")
        && !trimmed.starts_with("ws://")
        && !trimmed.starts_with("wss://")
    {
        trimmed = format!("http://{trimmed}");
    }

    trimmed = trimmed.trim_end_matches('/').to_string();

    if trimmed.is_empty() {
        *state.target.lock().unwrap() = None;
    } else {
        *state.target.lock().unwrap() = Some(trimmed);
    }
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let proxy_state = Arc::new(proxy::ProxyState::default());
            tauri::async_runtime::block_on(proxy::start(proxy_state.clone()))?;
            app.manage(proxy_state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_config,
            save_config,
            get_proxy_base,
            set_proxy_target
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
