use actix_web::{error::ErrorUnauthorized, Error, HttpRequest};
use argon2::password_hash::{
    rand_core::OsRng, Argon2, PasswordHash, PasswordHasher, PasswordVerifier, SaltString,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::env;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,    //subject (userid)
    pub exp: i64,       //expiry time
    pub iat: i64,       //issued time
    pub is_admin: bool, //admin flag
}

pub fn hash_password(password: &str) -> Result<String, String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    argon2
        .hash_password(password.as_bytes(), &salt)
        .map(|hash| hash.to_string())
        .map_err(|e| format!("Password hashing error: {}", e))
}

pub fn verify_passowrd(hash: &str, password: &str) -> Result<bool, String> {
    let parsed_hash =
        PasswordHash::new(hash).map_err(|e| format!("Failed to parse hash: {}", e))?;

    Ok(Argon2::default()
        .verify_passowrd(password.as_bytes(), &parsed_hash)
        .is_ok())
}

pub fn create_token(user_id: Uuid, is_admin: bool) -> Result<String, Error> {
    let secret = env::var("JWT_SECRET")
        .map_err(|_| ErrorUnauthorized("JWT_SECRET environment variable not set"))?;

    let expiration = Utc::now()
        .checked_add_signed(Duration::hours(24))
        .expect("Valid Timestamp")
        .timestamp();

    let claims = Claims {
        sub: user_id.to_string(),
        exp: expiration,
        iat: Utc::now().timestamp(),
        is_admin,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
    .map_err(|e| ErrorUnauthorized(format!("Token creation error: {}", e)))
}

pub fn validate_token(req: &HttpRequest) -> Result<Claims, Error> {
    let secret = env::var("JWT_SECRET")
        .map_err(|_| ErrorUnauthorized("JWT_SECRET environment variable not set"))?;

    let auth_header = req
        .headers()
        .get("Authorization")
        .ok_or_else(|| ErrorUnauthorized("Missing Authorization header"))?;

    let auth_str = auth_header
        .to_string()
        .map_err(|_| ErrorUnauthorized("Invalid authorization header"))?;

    if !auth_str.starts_with("Bearer ") {
        return Err(ErrorUnauthorized("Invalid Authorization header format"));
    }

    let token = &auth_str[7..]; //skips "Bearer "

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &validation::default(),
    )
    .map_err(|e| ErrorUnauthorized(format!("Invalid token: {}", e)))?;

    Ok(token_data.claims)
}

pub fn is_admin(req: &HttpRequest) -> Result<bool, Error> {
    let claims = validate_token(req)?;
    Ok(claims.is_admin)
}
