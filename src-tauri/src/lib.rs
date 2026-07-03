pub mod models;
pub mod providers;
pub mod security;
pub mod commands;
pub mod state;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:gokchat.db", vec![
                    tauri_plugin_sql::Migration {
                        version: 1,
                        description: "create tables",
                        sql: include_str!("../migrations/1.sql"),
                        kind: tauri_plugin_sql::MigrationKind::Up,
                    }
                ])
                .build()
        )
        .manage(AppState::new())
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri::menu::{Menu, MenuItem};
                use tauri::tray::TrayIconBuilder;
                use tauri::Manager;

                let toggle = MenuItem::with_id(app, "toggle", "Show/Hide Window", true, None::<&str>)?;
                let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
                let menu = Menu::with_items(app, &[&toggle, &quit])?;

                let _tray = TrayIconBuilder::new()
                    .icon(app.default_window_icon().unwrap().clone())
                    .menu(&menu)
                    .on_menu_event(|app, event| {
                        match event.id.as_ref() {
                            "toggle" => {
                                if let Some(window) = app.get_webview_window("main") {
                                    let new_visible = !window.is_visible().unwrap_or(true);
                                    if new_visible {
                                        window.show().unwrap();
                                        window.set_focus().unwrap();
                                    } else {
                                        window.hide().unwrap();
                                    }
                                }
                            }
                            "quit" => {
                                app.exit(0);
                            }
                            _ => {}
                        }
                    })
                    .build(app)?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::chat::send_message,
            commands::chat::stop_generation,
            commands::chat::export_backup,
            commands::chat::import_backup,
            commands::keys::store_api_key,
            commands::keys::get_api_key,
            commands::keys::delete_api_key,
            commands::keys::validate_api_key,
            commands::models::list_models,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
