use actix_cors::Cors;
use actix_governor::{Governor, GovernorConfigBuilder};
use actix_web::{middleware, web, App, HttpServer};
use dotenv::dotenv;
use rustls::{Certificate, PrivateKey, ServerConfig};
use rustls_pemfile::{certs, pkcs8_private_keys, rsa_private_keys};
use std::fs::File;
use std::io::BufReader;

mod auth;
mod db;
mod handlers;
mod models;
mod sanitize;

fn load_rustls_config() -> rustls::ServerConfig {
    println!("Loading TLS certificates...");

    // Load certificate chain
    let cert_file = &mut BufReader::new(File::open("cert.pem").expect("cert.pem not found"));
    let cert_chain = certs(cert_file)
        .unwrap()
        .into_iter()
        .map(Certificate)
        .collect::<Vec<_>>();

    println!("Loaded {} certificates", cert_chain.len());

    // Load private key - try different formats
    let key_file = &mut BufReader::new(File::open("key.pem").expect("key.pem not found"));

    // First try PKCS#8 format
    let mut keys = pkcs8_private_keys(key_file).unwrap_or_else(|_| {
        println!("Failed to load PKCS#8 private key, trying RSA format...");

        // Reset file reader
        let key_file = &mut BufReader::new(File::open("key.pem").expect("key.pem not found"));
        rsa_private_keys(key_file).unwrap_or_else(|e| {
            panic!(
                "Failed to load private key in both PKCS#8 and RSA formats: {}",
                e
            );
        })
    });

    if keys.is_empty() {
        panic!(
            "No private key found in key.pem - the file might be empty or in an unsupported format"
        );
    }

    println!("Loaded private key successfully");

    ServerConfig::builder()
        .with_safe_defaults()
        .with_no_client_auth()
        .with_single_cert(cert_chain, PrivateKey(keys.remove(0)))
        .expect("Failed to build TLS config")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();
    env_logger::init_from_env(env_logger::Env::default().filter_or("RUST_LOG", "info"));

    let governor_conf = GovernorConfigBuilder::default()
        .per_second(5)
        .burst_size(10)
        .finish()
        .unwrap();

    let pool = db::create_pool()
        .await
        .expect("Failed to create database pool");

    std::fs::create_dir_all("./uploads").expect("Failed to create uploads directory");

    println!("🔒 Starting HTTPS server at https://0.0.0.0:8443");

    HttpServer::new(move || {
        let cors = Cors::permissive();

        App::new()
            .app_data(web::Data::new(pool.clone()))
            .app_data(
                actix_web::web::PayloadConfig::new(10 * 1024 * 1024), // 10MB limit
            )
            .wrap(cors)
            .wrap(middleware::Logger::default())
            .service(
                web::scope("/api/auth")
                    .route("/register", web::post().to(handlers::users::register))
                    .route("/login", web::post().to(handlers::users::login)),
            )
            .service(
                web::scope("/api/users")
                    .route("/profile", web::put().to(handlers::users::update_profile))
                    .route("/me", web::get().to(handlers::users::user_info)),
            )
            .service(
                web::scope("/api/posts")
                    .route("", web::get().to(handlers::posts::get_all_posts))
                    .route("/{slug}", web::get().to(handlers::posts::get_post_by_slug))
                    .route("", web::post().to(handlers::posts::create_post)),
            )
            .service(
                web::scope("/api/files")
                    .route("/upload", web::post().to(handlers::files::upload_file))
                    .route("/fetchUrl", web::post().to(handlers::files::upload_by_url))
                    .route("/{filename}", web::get().to(handlers::files::get_file)),
            )
    })
    .bind("0.0.0.0:8443")?
    .run()
    .await
}
