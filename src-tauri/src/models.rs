use serde::{Deserialize, Serialize};
use chrono::Utc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attachment {
    pub id: String,
    pub name: String,
    pub size: u64,
    #[serde(rename = "type")]
    pub file_type: String,
    pub data: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Priority {
    High,
    Medium,
    Low,
}

#[allow(dead_code)]
impl Priority {
    pub fn to_string(&self) -> String {
        match self {
            Priority::High => "high".to_string(),
            Priority::Medium => "medium".to_string(),
            Priority::Low => "low".to_string(),
        }
    }

    pub fn from_string(s: &str) -> Self {
        match s {
            "high" => Priority::High,
            "medium" => Priority::Medium,
            "low" => Priority::Low,
            _ => Priority::Medium,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Theme {
    Light,
    Pink,
}

#[allow(dead_code)]
impl Theme {
    pub fn to_string(&self) -> String {
        match self {
            Theme::Light => "light".to_string(),
            Theme::Pink => "pink".to_string(),
        }
    }

    pub fn from_string(s: &str) -> Self {
        match s {
            "light" => Theme::Light,
            "pink" => Theme::Pink,
            _ => Theme::Light,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub completed: bool,
    pub priority: Priority,
    pub due_date: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub attachments: Option<Vec<Attachment>>,
}

impl Task {
    pub fn new(title: String, description: Option<String>, priority: Option<Priority>, due_date: Option<String>, attachments: Option<Vec<Attachment>>) -> Self {
        let now = Utc::now().to_rfc3339();
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            title,
            description,
            completed: false,
            priority: priority.unwrap_or(Priority::Medium),
            due_date,
            created_at: now.clone(),
            updated_at: now,
            attachments,
        }
    }

    pub fn update(&mut self) {
        self.updated_at = Utc::now().to_rfc3339();
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub theme: String,
    pub notifications: bool,
    #[serde(rename = "autoSave")]
    pub auto_save: bool,
    #[serde(rename = "isPinned")]
    pub is_pinned: bool,
    #[serde(rename = "isCollapsed")]
    pub is_collapsed: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar: Option<String>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            theme: "light".to_string(),
            notifications: true,
            auto_save: true,
            is_pinned: false,
            is_collapsed: false,
            username: None,
            avatar: None,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTaskRequest {
    pub title: String,
    pub description: Option<String>,
    pub priority: Option<String>,
    pub due_date: Option<String>,
    pub attachments: Option<Vec<Attachment>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTaskRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub completed: Option<bool>,
    pub priority: Option<String>,
    pub due_date: Option<String>,
    pub attachments: Option<Vec<Attachment>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TaskStats {
    pub total: usize,
    pub completed: usize,
    pub pending: usize,
    pub high_priority: usize,
    pub medium_priority: usize,
    pub low_priority: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
        }
    }
}