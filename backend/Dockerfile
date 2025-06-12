# Use the same image for building and running
FROM rust:slim

WORKDIR /usr/src/app

# Copy the entire project
COPY . .

# Build the project
RUN cargo build --release

# Expose the port
EXPOSE 8443

# Run the binary
CMD ["./target/release/cyber_blog_backend"]
