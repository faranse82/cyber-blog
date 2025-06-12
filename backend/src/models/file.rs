use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct File {
    pub id: Uuid,
    pub filename: String,
    pub original_name: String,
    pub mime_type: String,
    pub size: i64,
    pub url: String,
    pub uploader_id: Uuid,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct FileUploadResponse {
    pub success: i32,
    pub file: FileData,
}

#[derive(Debug, Serialize)]
pub struct FileData {
    pub url: String,
    pub id: Uuid,
    pub filename: String,
    pub size: i64,
    pub mime_type: String,
}

#[derive(Debug, Deserialize)]
pub struct FileUrlRequest {
    pub url: String,
}
