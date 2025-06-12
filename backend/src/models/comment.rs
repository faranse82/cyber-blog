use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Comment {
    pub id: Uuid,
    pub content: String,
    pub post_id: Uuid,
    pub user_id: Uuid,
    pub created_at: DateTime<Utc>,
}
#[derive(Debug, Serialize)]
pub struct CommentResponse {
    pub id: Uuid,
    pub content: String,
    pub post_id: Uuid,
    pub user_id: Uuid,
    pub username: String,
    pub profile_pic_url: Option<String>,
    pub created_at: DateTime<Utc>,
}

/*
#[derive(Debug, Deserialize)]
pub struct CreateCommentRequest {
    pub content: String,
    pub post_id: Uuid,
}
*/
