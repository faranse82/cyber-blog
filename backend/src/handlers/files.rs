use actix_multipart::Multipart;
use actix_web::{web, Error, HttpRequest, HttpResponse};
use futures_util::TryStreamExt;
use reqwest;
use sqlx::PgPool;
use std::io::Write;
use uuid::Uuid;

use crate::auth;
use crate::models::file::{File, FileData, FileUploadResponse, FileUrlRequest};

const MAX_FILE_SIZE: usize = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "gif", "webp", "svg"];

pub async fn upload_file(
    req: HttpRequest,
    mut payload: Multipart,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse, Error> {
    log::info!("File upload request received");

    // Log headers for debugging
    for (name, value) in req.headers() {
        log::debug!("Header {}: {:?}", name, value);
    }

    // Validate admin access
    let claims = auth::validate_token(&req)?;
    if !claims.is_admin {
        log::warn!("Non-admin user attempted file upload");
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Only administrators can upload files"
        })));
    }

    let uploader_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| actix_web::error::ErrorInternalServerError("Invalid user ID"))?;

    // Process multipart stream
    while let Some(mut field) = payload.try_next().await? {
        // Log field name for debugging
        if let Some(name) = field.name() {
            log::info!("Processing field: {}", name);
        }

        // Get filename from content disposition
        let filename = field
            .content_disposition()
            .and_then(|cd| cd.get_filename())
            .map(|f| f.to_string());

        if let Some(filename) = filename {
            log::info!("Processing file: {}", filename);
            // Validate file extension
            let extension = filename.split('.').last().unwrap_or("").to_lowercase();

            if !ALLOWED_EXTENSIONS.contains(&extension.as_str()) {
                return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                    "error": "Invalid file type. Allowed types: jpg, jpeg, png, gif, webp, svg"
                })));
            }

            // Get content type
            let content_type = field
                .content_type()
                .map(|m| m.to_string())
                .unwrap_or_else(|| "application/octet-stream".to_string());

            // Validate content type
            if !content_type.starts_with("image/") {
                return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                    "error": "Only image files are allowed"
                })));
            }

            // Generate unique filename
            let file_id = Uuid::new_v4();
            let unique_filename = format!("{}_{}", file_id, sanitize_filename(&filename));
            let file_path = format!("./uploads/{}", unique_filename);

            // Create uploads directory if it doesn't exist
            std::fs::create_dir_all("./uploads").map_err(|_| {
                actix_web::error::ErrorInternalServerError("Failed to create upload directory")
            })?;

            // Save file
            let mut f = web::block(move || std::fs::File::create(file_path))
                .await?
                .map_err(|_| actix_web::error::ErrorInternalServerError("Failed to create file"))?;

            let mut size = 0;
            while let Some(chunk) = field.try_next().await? {
                size += chunk.len();

                // Check file size
                if size > MAX_FILE_SIZE {
                    // Delete partial file
                    let _ = std::fs::remove_file(format!("./uploads/{}", unique_filename));
                    return Ok(HttpResponse::BadRequest().json(serde_json::json!({
                        "error": "File size exceeds maximum allowed size (10MB)"
                    })));
                }

                f = web::block(move || f.write_all(&chunk).map(|_| f))
                    .await?
                    .map_err(|_| {
                        actix_web::error::ErrorInternalServerError("Failed to write file")
                    })?;
            }

            // Save file metadata to database
            let file_url = format!("/api/files/{}", unique_filename);

            let file_record = sqlx::query_as!(
                File,
                r#"
                INSERT INTO files (filename, original_name, mime_type, size, url, uploader_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, filename, original_name, mime_type, size, url, uploader_id, created_at
                "#,
                unique_filename,
                filename.clone(),
                content_type,
                size as i64,
                file_url,
                uploader_id
            )
            .fetch_one(pool.get_ref())
            .await
            .map_err(|e| {
                eprintln!("Database error: {}", e);
                // Clean up uploaded file on database error
                let _ = std::fs::remove_file(format!("./uploads/{}", unique_filename));
                actix_web::error::ErrorInternalServerError("Failed to save file metadata")
            })?;

            // Return EditorJS format response
            let response = FileUploadResponse {
                success: 1,
                file: FileData {
                    url: file_record.url,
                    id: file_record.id,
                    filename: file_record.filename,
                    size: file_record.size,
                    mime_type: file_record.mime_type,
                },
            };

            return Ok(HttpResponse::Ok().json(response));
        }
    }

    Ok(HttpResponse::BadRequest().json(serde_json::json!({
        "error": "No file provided"
    })))
}

pub async fn upload_by_url(
    req: HttpRequest,
    pool: web::Data<PgPool>,
    url_data: web::Json<FileUrlRequest>,
) -> Result<HttpResponse, Error> {
    // Validate admin access
    let claims = auth::validate_token(&req)?;
    if !claims.is_admin {
        return Ok(HttpResponse::Forbidden().json(serde_json::json!({
            "error": "Only administrators can upload files"
        })));
    }

    let uploader_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| actix_web::error::ErrorInternalServerError("Invalid user ID"))?;

    // Validate URL
    let url = url_data.url.trim();
    if !url.starts_with("http://") && !url.starts_with("https://") {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Invalid URL format"
        })));
    }

    // Extract filename from URL
    let filename = url
        .split('/')
        .last()
        .unwrap_or("image")
        .split('?')
        .next()
        .unwrap_or("image");

    let extension = filename.split('.').last().unwrap_or("jpg").to_lowercase();

    if !ALLOWED_EXTENSIONS.contains(&extension.as_str()) {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Invalid file type in URL"
        })));
    }

    // Download image
    let response = reqwest::get(url)
        .await
        .map_err(|_| actix_web::error::ErrorBadRequest("Failed to download image"))?;

    // Check content type
    let content_type = response
        .headers()
        .get("content-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("image/jpeg")
        .to_string();

    if !content_type.starts_with("image/") {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "URL does not point to an image"
        })));
    }

    // Get content
    let bytes = response
        .bytes()
        .await
        .map_err(|_| actix_web::error::ErrorBadRequest("Failed to read image data"))?;

    let size = bytes.len();
    if size > MAX_FILE_SIZE {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Image size exceeds maximum allowed size (10MB)"
        })));
    }

    // Generate unique filename
    let file_id = Uuid::new_v4();
    let unique_filename = format!("{}_{}", file_id, sanitize_filename(filename));
    let file_path = format!("./uploads/{}", unique_filename);

    // Save file
    std::fs::create_dir_all("./uploads").map_err(|_| {
        actix_web::error::ErrorInternalServerError("Failed to create upload directory")
    })?;

    std::fs::write(&file_path, bytes)
        .map_err(|_| actix_web::error::ErrorInternalServerError("Failed to save image"))?;

    // Save to database
    let file_url = format!("/api/files/{}", unique_filename);

    let file_record = sqlx::query_as!(
        File,
        r#"
        INSERT INTO files (filename, original_name, mime_type, size, url, uploader_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, filename, original_name, mime_type, size, url, uploader_id, created_at
        "#,
        unique_filename,
        filename,
        content_type,
        size as i64,
        file_url,
        uploader_id
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error: {}", e);
        let _ = std::fs::remove_file(&file_path);
        actix_web::error::ErrorInternalServerError("Failed to save file metadata")
    })?;

    let response = FileUploadResponse {
        success: 1,
        file: FileData {
            url: file_record.url,
            id: file_record.id,
            filename: file_record.filename,
            size: file_record.size,
            mime_type: file_record.mime_type,
        },
    };

    Ok(HttpResponse::Ok().json(response))
}

pub async fn get_file(
    path: web::Path<String>,
    pool: web::Data<PgPool>,
) -> Result<HttpResponse, Error> {
    let filename = path.into_inner();

    // Validate filename to prevent directory traversal
    if filename.contains("..") || filename.contains("/") || filename.contains("\\") {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({
            "error": "Invalid filename"
        })));
    }

    // Get file metadata from database
    let file_record = sqlx::query!(
        r#"
        SELECT mime_type FROM files WHERE filename = $1
        "#,
        filename
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| {
        eprintln!("Database error: {}", e);
        actix_web::error::ErrorInternalServerError("Database error")
    })?;

    let mime_type = match file_record {
        Some(record) => record.mime_type,
        None => {
            return Ok(HttpResponse::NotFound().json(serde_json::json!({
                "error": "File not found"
            })));
        }
    };

    // Read file
    let file_path = format!("./uploads/{}", filename);
    let file_data =
        std::fs::read(&file_path).map_err(|_| actix_web::error::ErrorNotFound("File not found"))?;

    Ok(HttpResponse::Ok().content_type(mime_type).body(file_data))
}

fn sanitize_filename(filename: &str) -> String {
    filename
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '.' || c == '-' || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect()
}
