use actix_cors::Cors;
use actix_web::{App, HttpServer};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("Starting server at http://0.0.0.0:8080");

    HttpServer::new(|| {
        let cors = Cors::permissive();

        App::new().wrap(cors)
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
