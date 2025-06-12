use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::{Validate, ValidationError};

#[derive(Debug, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub profile_pic_url: Option<String>,
    pub is_admin: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub profile_pic_url: Option<String>,
    pub is_admin: bool,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateUserRequest {
    #[validate(length(min = 3, max = 30))]
    pub username: String,
    #[validate(email)]
    pub email: String,
    #[validate(length(min = 8), custom = "validate_password")]
    pub password: String,
    pub profile_pic_url: Option<String>,
}

fn validate_password(password: &str) -> Result<(), ValidationError> {
    let has_uppercase = password.chars().any(|c| c.is_uppercase());
    let has_lowercase = password.chars().any(|c| c.is_lowercase());
    let has_digit = password.chars().any(|c| c.is_digit(10));
    let has_special = password
        .chars()
        .any(|c| "!@#$%^&*()_+-=[]{}|;:,.<>?".contains(c));

    if has_uppercase && has_lowercase && has_digit && has_special {
        Ok(())
    } else {
        Err(ValidationError::new(
            "Password must contain uppercase, lowercase, digit, and special character",
        ))
    }
}

#[derive(Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}
#[derive(Debug, Deserialize)]
pub struct UpdateUserRequest {
    pub username: Option<String>,
    pub email: Option<String>,
    pub password: Option<String>,
    pub profile_pic_url: Option<String>,
}

impl User {
    pub fn to_response(&self) -> UserResponse {
        UserResponse {
            id: self.id,
            username: self.username.clone(),
            email: self.email.clone(),
            profile_pic_url: self.profile_pic_url.clone(),
            is_admin: self.is_admin,
        }
    }
}
