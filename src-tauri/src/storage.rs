use std::fs;
use std::path::PathBuf;
use serde_json;
use crate::models::{Task, Settings, TaskStats, Priority};

pub struct Storage {
    data_dir: PathBuf,
}

impl Storage {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let data_dir = Self::get_data_dir()?;
        
        // 确保数据目录存在
        if !data_dir.exists() {
            fs::create_dir_all(&data_dir)?;
        }
        
        Ok(Self { data_dir })
    }

    fn get_data_dir() -> Result<PathBuf, Box<dyn std::error::Error>> {
        let home_dir = dirs::home_dir()
            .ok_or("无法获取用户主目录")?;
        
        Ok(home_dir.join(".todo-app"))
    }

    pub fn get_data_dir_path(&self) -> String {
        self.data_dir.to_string_lossy().to_string()
    }

    fn get_tasks_file(&self) -> PathBuf {
        self.data_dir.join("tasks.json")
    }

    fn get_settings_file(&self) -> PathBuf {
        self.data_dir.join("settings.json")
    }

    pub fn load_tasks(&self) -> Result<Vec<Task>, Box<dyn std::error::Error>> {
        let file_path = self.get_tasks_file();
        
        if !file_path.exists() {
            return Ok(Vec::new());
        }

        let content = fs::read_to_string(file_path)?;
        let tasks: Vec<Task> = serde_json::from_str(&content)
            .unwrap_or_else(|_| Vec::new());
        
        Ok(tasks)
    }

    pub fn save_tasks(&self, tasks: &[Task]) -> Result<(), Box<dyn std::error::Error>> {
        let file_path = self.get_tasks_file();
        let content = serde_json::to_string_pretty(tasks)?;
        fs::write(file_path, content)?;
        Ok(())
    }

    pub fn load_settings(&self) -> Result<Settings, Box<dyn std::error::Error>> {
        let file_path = self.get_settings_file();
        
        if !file_path.exists() {
            let default_settings = Settings::default();
            self.save_settings(&default_settings)?;
            return Ok(default_settings);
        }

        let content = fs::read_to_string(file_path)?;
        let settings: Settings = serde_json::from_str(&content)
            .unwrap_or_else(|_| Settings::default());
        
        Ok(settings)
    }

    pub fn save_settings(&self, settings: &Settings) -> Result<(), Box<dyn std::error::Error>> {
        let file_path = self.get_settings_file();
        let content = serde_json::to_string_pretty(settings)?;
        fs::write(file_path, content)?;
        Ok(())
    }

    pub fn get_task_stats(&self, tasks: &[Task]) -> TaskStats {
        let total = tasks.len();
        let completed = tasks.iter().filter(|t| t.completed).count();
        let pending = total - completed;
        
        let high_priority = tasks.iter()
            .filter(|t| matches!(t.priority, Priority::High))
            .count();
        let medium_priority = tasks.iter()
            .filter(|t| matches!(t.priority, Priority::Medium))
            .count();
        let low_priority = tasks.iter()
            .filter(|t| matches!(t.priority, Priority::Low))
            .count();

        TaskStats {
            total,
            completed,
            pending,
            high_priority,
            medium_priority,
            low_priority,
        }
    }

    pub fn add_task(&self, mut task: Task) -> Result<Task, Box<dyn std::error::Error>> {
        let mut tasks = self.load_tasks()?;
        task.update();
        tasks.push(task.clone());
        self.save_tasks(&tasks)?;
        Ok(task)
    }

    pub fn update_task(&self, id: &str, updates: &crate::models::UpdateTaskRequest) -> Result<Option<Task>, Box<dyn std::error::Error>> {
        let mut tasks = self.load_tasks()?;
        
        if let Some(task) = tasks.iter_mut().find(|t| t.id == id) {
            if let Some(title) = &updates.title {
                task.title = title.clone();
            }
            if let Some(description) = &updates.description {
                task.description = Some(description.clone());
            }
            if let Some(completed) = updates.completed {
                task.completed = completed;
            }
            if let Some(priority_str) = &updates.priority {
                task.priority = Priority::from_string(priority_str);
            }
            if let Some(due_date) = &updates.due_date {
                task.due_date = Some(due_date.clone());
            }
            if let Some(attachments) = &updates.attachments {
                task.attachments = Some(attachments.clone());
            }
            
            task.update();
            let updated_task = task.clone();
            self.save_tasks(&tasks)?;
            Ok(Some(updated_task))
        } else {
            Ok(None)
        }
    }

    pub fn delete_task(&self, id: &str) -> Result<bool, Box<dyn std::error::Error>> {
        let mut tasks = self.load_tasks()?;
        let initial_len = tasks.len();
        tasks.retain(|t| t.id != id);
        
        if tasks.len() < initial_len {
            self.save_tasks(&tasks)?;
            Ok(true)
        } else {
            Ok(false)
        }
    }
}