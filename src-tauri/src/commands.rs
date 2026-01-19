use tauri::State;
use std::sync::Mutex;
use crate::models::*;
use crate::storage::Storage;

type StorageState<'a> = State<'a, Mutex<Storage>>;

#[tauri::command]
pub async fn get_tasks(storage: StorageState<'_>) -> Result<ApiResponse<Vec<Task>>, String> {
    let storage = storage.lock().map_err(|e| e.to_string())?;
    
    match storage.load_tasks() {
        Ok(tasks) => Ok(ApiResponse::success(tasks)),
        Err(e) => Ok(ApiResponse::error(format!("加载待办失败: {}", e))),
    }
}

#[tauri::command]
pub async fn create_task(
    request: CreateTaskRequest,
    storage: StorageState<'_>,
) -> Result<ApiResponse<Task>, String> {
    let storage = storage.lock().map_err(|e| e.to_string())?;
    
    let priority = request.priority
        .map(|p| Priority::from_string(&p))
        .unwrap_or(Priority::Medium);
    
    let task = Task::new(
        request.title,
        request.description,
        Some(priority),
        request.due_date,
        request.attachments,
    );
    
    match storage.add_task(task) {
        Ok(task) => Ok(ApiResponse::success(task)),
        Err(e) => Ok(ApiResponse::error(format!("创建待办失败: {}", e))),
    }
}

#[tauri::command]
pub async fn update_task(
    id: String,
    updates: UpdateTaskRequest,
    storage: StorageState<'_>,
) -> Result<ApiResponse<Option<Task>>, String> {
    let storage = storage.lock().map_err(|e| e.to_string())?;
    
    match storage.update_task(&id, &updates) {
        Ok(task) => Ok(ApiResponse::success(task)),
        Err(e) => Ok(ApiResponse::error(format!("更新待办失败: {}", e))),
    }
}

#[tauri::command]
pub async fn delete_task(
    id: String,
    storage: StorageState<'_>,
) -> Result<ApiResponse<bool>, String> {
    let storage = storage.lock().map_err(|e| e.to_string())?;
    
    match storage.delete_task(&id) {
        Ok(deleted) => {
            if deleted {
                Ok(ApiResponse::success(true))
            } else {
                Ok(ApiResponse::error("待办不存在".to_string()))
            }
        }
        Err(e) => Ok(ApiResponse::error(format!("删除待办失败: {}", e))),
    }
}

#[tauri::command]
pub async fn get_task_stats(storage: StorageState<'_>) -> Result<ApiResponse<TaskStats>, String> {
    let storage = storage.lock().map_err(|e| e.to_string())?;
    
    match storage.load_tasks() {
        Ok(tasks) => {
            let stats = storage.get_task_stats(&tasks);
            Ok(ApiResponse::success(stats))
        }
        Err(e) => Ok(ApiResponse::error(format!("获取统计信息失败: {}", e))),
    }
}

#[tauri::command]
pub async fn get_settings(storage: StorageState<'_>) -> Result<ApiResponse<Settings>, String> {
    let storage = storage.lock().map_err(|e| e.to_string())?;
    
    match storage.load_settings() {
        Ok(settings) => Ok(ApiResponse::success(settings)),
        Err(e) => Ok(ApiResponse::error(format!("加载设置失败: {}", e))),
    }
}

#[tauri::command]
pub async fn update_settings(
    settings: Settings,
    storage: StorageState<'_>,
) -> Result<ApiResponse<Settings>, String> {
    let storage = storage.lock().map_err(|e| e.to_string())?;
    
    match storage.save_settings(&settings) {
        Ok(_) => Ok(ApiResponse::success(settings)),
        Err(e) => Ok(ApiResponse::error(format!("保存设置失败: {}", e))),
    }
}

#[tauri::command]
pub async fn export_data(storage: StorageState<'_>) -> Result<ApiResponse<String>, String> {
    let storage = storage.lock().map_err(|e| e.to_string())?;
    
    match storage.load_tasks() {
        Ok(tasks) => {
            match serde_json::to_string_pretty(&tasks) {
                Ok(json_data) => Ok(ApiResponse::success(json_data)),
                Err(e) => Ok(ApiResponse::error(format!("导出数据失败: {}", e))),
            }
        }
        Err(e) => Ok(ApiResponse::error(format!("加载待办失败: {}", e))),
    }
}

#[tauri::command]
pub async fn import_data(
    data: String,
    storage: StorageState<'_>,
) -> Result<ApiResponse<bool>, String> {
    let storage = storage.lock().map_err(|e| e.to_string())?;
    
    match serde_json::from_str::<Vec<Task>>(&data) {
        Ok(tasks) => {
            match storage.save_tasks(&tasks) {
                Ok(_) => Ok(ApiResponse::success(true)),
                Err(e) => Ok(ApiResponse::error(format!("导入数据失败: {}", e))),
            }
        }
        Err(e) => Ok(ApiResponse::error(format!("解析数据失败: {}", e))),
    }
}

#[tauri::command]
pub async fn clear_all_data(storage: StorageState<'_>) -> Result<ApiResponse<bool>, String> {
    let storage = storage.lock().map_err(|e| e.to_string())?;
    
    match storage.save_tasks(&[]) {
        Ok(_) => Ok(ApiResponse::success(true)),
        Err(e) => Ok(ApiResponse::error(format!("清空数据失败: {}", e))),
    }
}

#[tauri::command]
pub fn exit_app(app: tauri::AppHandle) {
    app.exit(0);
}

#[tauri::command]
pub async fn get_data_dir_path(storage: StorageState<'_>) -> Result<ApiResponse<String>, String> {
    let storage = storage.lock().map_err(|e| e.to_string())?;
    let path = storage.get_data_dir_path();
    Ok(ApiResponse::success(path))
}

#[tauri::command]
pub async fn open_file_with_system(file_name: String, file_data: String, _file_type: String) -> Result<ApiResponse<bool>, String> {
    use std::fs;
    use base64::{Engine as _, engine::general_purpose};
    
    // 创建临时文件
    let temp_dir = std::env::temp_dir();
    let file_path = temp_dir.join(&file_name);
    
    // 解码 base64 数据
    match general_purpose::STANDARD.decode(&file_data) {
        Ok(decoded_data) => {
            // 写入临时文件
            match fs::write(&file_path, decoded_data) {
                Ok(_) => {
                    // 使用系统默认应用打开文件
                    #[cfg(target_os = "windows")]
                    {
                        match std::process::Command::new("cmd")
                            .args(&["/C", "start", "", file_path.to_str().unwrap()])
                            .spawn()
                        {
                            Ok(_) => Ok(ApiResponse::success(true)),
                            Err(e) => Ok(ApiResponse::error(format!("打开文件失败: {}", e))),
                        }
                    }
                    
                    #[cfg(target_os = "macos")]
                    {
                        match std::process::Command::new("open")
                            .arg(&file_path)
                            .spawn()
                        {
                            Ok(_) => Ok(ApiResponse::success(true)),
                            Err(e) => Ok(ApiResponse::error(format!("打开文件失败: {}", e))),
                        }
                    }
                    
                    #[cfg(target_os = "linux")]
                    {
                        match std::process::Command::new("xdg-open")
                            .arg(&file_path)
                            .spawn()
                        {
                            Ok(_) => Ok(ApiResponse::success(true)),
                            Err(e) => Ok(ApiResponse::error(format!("打开文件失败: {}", e))),
                        }
                    }
                }
                Err(e) => Ok(ApiResponse::error(format!("写入临时文件失败: {}", e))),
            }
        }
        Err(e) => Ok(ApiResponse::error(format!("解码文件数据失败: {}", e))),
    }
}