import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.Executors;

/**
 * Ledger Enterprise Java Full-Stack Server
 * Pure Java HTTP & REST API server.
 * 
 * Features:
 * 1. Zero External Dependencies - Uses pure Java standard library (com.sun.net.httpserver).
 * 2. Static Web Asset Serving - Serves HTML, CSS, JavaScript, SVGs, Fonts with MIME types.
 * 3. Proper Java REST Backend:
 *    - /api/status       : Server health, Java runtime, and storage stats
 *    - /api/system/stats : Real-time JVM memory, CPU cores, active threads, and uptime telemetry
 *    - /api/auth/users   : User authentication and registration persistence
 *    - /api/data         : GET/POST persistence for financial ledger data per user
 *    - /api/backup/export: Direct HTTP file streaming download of data
 *    - /api/backup/import: Direct server-side data restore
 * 4. Persistent JSON Storage - Safely stores state in data/ directory.
 * 5. High-Concurrency Virtual Threading - Powered by modern Java SE.
 */
public class Server {
    private static final int DEFAULT_PORT = 8080;
    private static final long SERVER_START_TIME = System.currentTimeMillis();
    private static final Path DATA_DIR = Paths.get("data");
    private static final Path USERS_FILE = DATA_DIR.resolve("users.json");
    private static final Map<String, String> MIME_TYPES = new HashMap<>();
    private static final Object FILE_LOCK = new Object();

    static {
        MIME_TYPES.put("html", "text/html; charset=UTF-8");
        MIME_TYPES.put("htm", "text/html; charset=UTF-8");
        MIME_TYPES.put("css", "text/css; charset=UTF-8");
        MIME_TYPES.put("js", "application/javascript; charset=UTF-8");
        MIME_TYPES.put("json", "application/json; charset=UTF-8");
        MIME_TYPES.put("svg", "image/svg+xml");
        MIME_TYPES.put("png", "image/png");
        MIME_TYPES.put("jpg", "image/jpeg");
        MIME_TYPES.put("jpeg", "image/jpeg");
        MIME_TYPES.put("gif", "image/gif");
        MIME_TYPES.put("ico", "image/x-icon");
        MIME_TYPES.put("webp", "image/webp");
        MIME_TYPES.put("woff", "font/woff");
        MIME_TYPES.put("woff2", "font/woff2");
        MIME_TYPES.put("ttf", "font/ttf");
    }

    public static void main(String[] args) {
        int port = DEFAULT_PORT;
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException ignored) {}
        }

        try {
            // Ensure data directory exists
            if (!Files.exists(DATA_DIR)) {
                Files.createDirectories(DATA_DIR);
            }
            if (!Files.exists(USERS_FILE)) {
                Files.writeString(USERS_FILE, "{}", StandardCharsets.UTF_8);
            }

            HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
            
            // API Endpoints
            server.createContext("/api/status", new StatusHandler());
            server.createContext("/api/system/stats", new SystemStatsHandler());
            server.createContext("/api/auth/users", new UsersHandler());
            server.createContext("/api/data", new LedgerDataHandler());
            server.createContext("/api/backup/export", new BackupExportHandler());
            server.createContext("/api/backup/import", new BackupImportHandler());
            
            // Static Files Handler (Fallback for UI assets)
            server.createContext("/", new StaticFileHandler());
            
            // Concurrent Request Executor
            server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
            server.start();

            System.out.println("=================================================");
            System.out.println("  Ledger Java Full-Stack Server Running!         ");
            System.out.println("=================================================");
            System.out.println("  Web UI    : http://localhost:" + port);
            System.out.println("  Dashboard : http://localhost:" + port + "/app.html");
            System.out.println("  API Status: http://localhost:" + port + "/api/status");
            System.out.println("  JVM Stats : http://localhost:" + port + "/api/system/stats");
            System.out.println("  Storage   : " + DATA_DIR.toAbsolutePath());
            System.out.println("  Runtime   : Java " + System.getProperty("java.version"));
            System.out.println("=================================================");
        } catch (IOException e) {
            System.err.println("Fatal: Server failed to start on port " + port + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    // Apply standard CORS and Cache-Control headers
    private static void applySecurityHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        exchange.getResponseHeaders().set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
        exchange.getResponseHeaders().set("Pragma", "no-cache");
        exchange.getResponseHeaders().set("Expires", "0");
    }

    private static void sendJsonResponse(HttpExchange exchange, int statusCode, String jsonResponse) throws IOException {
        applySecurityHeaders(exchange);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        byte[] bytes = jsonResponse.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String readRequestBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            byte[] buf = new byte[4096];
            int read;
            while ((read = is.read(buf)) != -1) {
                baos.write(buf, 0, read);
            }
            return baos.toString(StandardCharsets.UTF_8);
        }
    }

    private static String sanitizeEmail(String email) {
        if (email == null) return "anonymous";
        return email.toLowerCase().replaceAll("[^a-z0-9_.-]", "_");
    }

    private static String extractEmailFromQuery(String query) {
        String email = "demo@ledger.app";
        if (query != null && query.contains("email=")) {
            for (String param : query.split("&")) {
                if (param.startsWith("email=")) {
                    email = URLDecoder.decode(param.substring(6), StandardCharsets.UTF_8);
                    break;
                }
            }
        }
        return email;
    }

    /**
     * Handles /api/status - Server health check
     */
    static class StatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            applySecurityHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            int userCount = 0;
            synchronized (FILE_LOCK) {
                if (Files.exists(USERS_FILE)) {
                    String content = Files.readString(USERS_FILE, StandardCharsets.UTF_8);
                    if (content.trim().length() > 2) {
                        userCount = content.split("\"name\"").length - 1;
                        if (userCount < 1) userCount = 1;
                    }
                }
            }

            String json = String.format(
                "{\"status\":\"online\",\"backend\":\"Java-SE\",\"version\":\"%s\",\"dataDirectory\":\"%s\",\"usersCount\":%d,\"timestamp\":%d}",
                System.getProperty("java.version"),
                DATA_DIR.toAbsolutePath().toString().replace("\\", "\\\\"),
                userCount,
                System.currentTimeMillis()
            );
            sendJsonResponse(exchange, 200, json);
        }
    }

    /**
     * Handles /api/system/stats - Real-time JVM memory and system telemetry
     */
    static class SystemStatsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            applySecurityHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            Runtime rt = Runtime.getRuntime();
            long totalMem = rt.totalMemory() / (1024 * 1024);
            long freeMem = rt.freeMemory() / (1024 * 1024);
            long usedMem = totalMem - freeMem;
            long maxMem = rt.maxMemory() / (1024 * 1024);
            long uptimeSec = (System.currentTimeMillis() - SERVER_START_TIME) / 1000;

            String json = String.format(
                "{\"status\":\"healthy\",\"javaVersion\":\"%s\",\"javaVendor\":\"%s\",\"osName\":\"%s\",\"cpuCores\":%d,\"usedMemoryMB\":%d,\"totalMemoryMB\":%d,\"maxMemoryMB\":%d,\"uptimeSeconds\":%d,\"threadsCount\":%d,\"timestamp\":%d}",
                System.getProperty("java.version"),
                System.getProperty("java.vendor"),
                System.getProperty("os.name"),
                rt.availableProcessors(),
                usedMem,
                totalMem,
                maxMem,
                uptimeSec,
                Thread.activeCount(),
                System.currentTimeMillis()
            );
            sendJsonResponse(exchange, 200, json);
        }
    }

    /**
     * Handles /api/auth/users - Persistent user store
     */
    static class UsersHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            applySecurityHeaders(exchange);
            String method = exchange.getRequestMethod();

            if ("OPTIONS".equalsIgnoreCase(method)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("GET".equalsIgnoreCase(method)) {
                synchronized (FILE_LOCK) {
                    if (!Files.exists(USERS_FILE)) {
                        sendJsonResponse(exchange, 200, "{}");
                    } else {
                        String content = Files.readString(USERS_FILE, StandardCharsets.UTF_8);
                        sendJsonResponse(exchange, 200, content.isEmpty() ? "{}" : content);
                    }
                }
            } else if ("POST".equalsIgnoreCase(method)) {
                String body = readRequestBody(exchange);
                if (body == null || body.trim().isEmpty()) {
                    sendJsonResponse(exchange, 400, "{\"error\":\"Empty payload\"}");
                    return;
                }

                synchronized (FILE_LOCK) {
                    Files.writeString(USERS_FILE, body, StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                }
                sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Users synchronized successfully\"}");
            } else {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
            }
        }
    }

    /**
     * Handles /api/data - Per-user financial ledger data persistence
     */
    static class LedgerDataHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            applySecurityHeaders(exchange);
            String method = exchange.getRequestMethod();

            if ("OPTIONS".equalsIgnoreCase(method)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String email = extractEmailFromQuery(exchange.getRequestURI().getQuery());
            String safeName = "ledger_" + sanitizeEmail(email) + ".json";
            Path userFilePath = DATA_DIR.resolve(safeName);

            if ("GET".equalsIgnoreCase(method)) {
                synchronized (FILE_LOCK) {
                    if (Files.exists(userFilePath)) {
                        String data = Files.readString(userFilePath, StandardCharsets.UTF_8);
                        sendJsonResponse(exchange, 200, data);
                    } else {
                        sendJsonResponse(exchange, 404, "{\"found\":false,\"message\":\"No server record found\"}");
                    }
                }
            } else if ("POST".equalsIgnoreCase(method)) {
                String body = readRequestBody(exchange);
                if (body == null || body.trim().isEmpty()) {
                    sendJsonResponse(exchange, 400, "{\"error\":\"Empty payload\"}");
                    return;
                }

                synchronized (FILE_LOCK) {
                    Files.writeString(userFilePath, body, StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                }
                sendJsonResponse(exchange, 200, "{\"success\":true,\"savedBytes\":" + body.length() + "}");
            } else {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
            }
        }
    }

    /**
     * Handles /api/backup/export - Direct HTTP file streaming download
     */
    static class BackupExportHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            applySecurityHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String email = extractEmailFromQuery(exchange.getRequestURI().getQuery());
            String safeName = "ledger_" + sanitizeEmail(email) + ".json";
            Path userFilePath = DATA_DIR.resolve(safeName);

            synchronized (FILE_LOCK) {
                if (!Files.exists(userFilePath)) {
                    sendJsonResponse(exchange, 404, "{\"error\":\"No data exists to export for this account.\"}");
                    return;
                }

                String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
                String exportFilename = "ledger_backup_" + sanitizeEmail(email) + "_" + timestamp + ".json";

                byte[] dataBytes = Files.readAllBytes(userFilePath);
                exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
                exchange.getResponseHeaders().set("Content-Disposition", "attachment; filename=\"" + exportFilename + "\"");
                exchange.sendResponseHeaders(200, dataBytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(dataBytes);
                }
            }
        }
    }

    /**
     * Handles /api/backup/import - Restores user ledger from JSON
     */
    static class BackupImportHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            applySecurityHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
                return;
            }

            String email = extractEmailFromQuery(exchange.getRequestURI().getQuery());
            String body = readRequestBody(exchange);

            if (body == null || body.trim().isEmpty() || !body.contains("expenses")) {
                sendJsonResponse(exchange, 400, "{\"error\":\"Invalid backup format. Must contain valid expenses object.\"}");
                return;
            }

            String safeName = "ledger_" + sanitizeEmail(email) + ".json";
            Path userFilePath = DATA_DIR.resolve(safeName);

            synchronized (FILE_LOCK) {
                Files.writeString(userFilePath, body, StandardCharsets.UTF_8, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            }
            sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Backup successfully restored onto Java backend!\"}");
        }
    }

    /**
     * Handles static assets (HTML, CSS, JS, SVGs, Images)
     */
    static class StaticFileHandler implements HttpHandler {
        private final File baseDir = new File(System.getProperty("user.dir"));

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            applySecurityHeaders(exchange);

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String path = exchange.getRequestURI().getPath();
            if (path == null || path.equals("/") || path.isEmpty()) {
                path = "/index.html";
            }

            path = URLDecoder.decode(path, StandardCharsets.UTF_8);

            File targetFile = new File(baseDir, path.replace('/', File.separatorChar)).getCanonicalFile();
            if (!targetFile.getPath().startsWith(baseDir.getCanonicalPath())) {
                sendString(exchange, 403, "403 Forbidden: Access Denied");
                return;
            }

            if (!targetFile.exists() || targetFile.isDirectory()) {
                if (targetFile.isDirectory()) {
                    File indexFile = new File(targetFile, "index.html");
                    if (indexFile.exists() && indexFile.isFile()) {
                        targetFile = indexFile;
                    } else {
                        sendString(exchange, 404, "404 Not Found: Directory listing denied");
                        return;
                    }
                } else {
                    sendString(exchange, 404, "404 Not Found: " + path);
                    return;
                }
            }

            String ext = "";
            int dotIdx = targetFile.getName().lastIndexOf('.');
            if (dotIdx > 0 && dotIdx < targetFile.getName().length() - 1) {
                ext = targetFile.getName().substring(dotIdx + 1).toLowerCase();
            }

            String contentType = MIME_TYPES.getOrDefault(ext, "application/octet-stream");
            exchange.getResponseHeaders().set("Content-Type", contentType);

            long fileLength = targetFile.length();
            exchange.sendResponseHeaders(200, fileLength);

            try (FileInputStream fis = new FileInputStream(targetFile);
                 OutputStream os = exchange.getResponseBody()) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = fis.read(buffer)) != -1) {
                    os.write(buffer, 0, bytesRead);
                }
                os.flush();
            }
        }

        private void sendString(HttpExchange exchange, int statusCode, String responseText) throws IOException {
            byte[] bytes = responseText.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=UTF-8");
            exchange.sendResponseHeaders(statusCode, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }
}
