package api;

import io.jsonwebtoken.Claims;
import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;
import java.io.IOException;
import java.sql.SQLException;
import java.util.Map;
import java.util.HashMap;
import org.json.JSONObject;
import java.util.logging.*;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;

@WebServlet("/api/auth/*")
public class AuthServlet extends HttpServlet {
    private static final Logger LOGGER = Logger.getLogger(AuthServlet.class.getName());
    private static final Key SECRET_KEY = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    private static final long EXPIRATION_TIME = 86400000; // 24 horas
    
    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setStatus(HttpServletResponse.SC_OK);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        HttpUtils.setCorsHeaders(request, response);
        try {
            JSONObject json = HttpUtils.parseJsonRequest(request);
            String pathInfo = request.getPathInfo();
            
            if (pathInfo == null || pathInfo.equals("/")) {
                HttpUtils.sendErrorResponse(response, "Endpoint not specified", HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            DB db = (DB) request.getServletContext().getAttribute("db");
            if (db == null) {
                HttpUtils.sendErrorResponse(response, "Database error", HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                return;
            }

            switch (pathInfo) {
                case "/login":
                    handleLogin(request, response, db, json);
                    break;
                case "/register":
                    handleRegister(request, response, db, json);
                    break;
                case "/verify":
                    verifyToken(request, response);
                    break;
                default:
                    HttpUtils.sendErrorResponse(response, "Endpoint not found", HttpServletResponse.SC_NOT_FOUND);
            }
        } catch (Exception e) {
            LOGGER.log(Level.SEVERE, "Error in AuthServlet", e);
            HttpUtils.sendErrorResponse(response, "Internal server error", HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }

    private void handleLogin(HttpServletRequest request, HttpServletResponse response, 
                           DB db, JSONObject json) throws IOException, SQLException {
        if (!json.has("email") || !json.has("password")) {
            HttpUtils.sendErrorResponse(response, "Email and password required", HttpServletResponse.SC_BAD_REQUEST);
            return;
        }
        
        String email = json.getString("email");
        String password = json.getString("password");
        
        Map<String, Object> usuario = db.autenticarUsuario(email, password);
        if (usuario == null) {
            HttpUtils.sendErrorResponse(response, "Invalid credentials", HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
        
        String jwt = generateJWT(usuario);
        
        // Configurar cookie segura
        Cookie jwtCookie = new Cookie("jwt", jwt);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setSecure(request.isSecure());
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge((int) (EXPIRATION_TIME / 1000));
        response.addCookie(jwtCookie);
        
        JSONObject responseJson = new JSONObject()
            .put("user", new JSONObject(usuario))
            .put("token", jwt);
        
        HttpUtils.sendJsonResponse(response, responseJson, HttpServletResponse.SC_OK);
    }

    private void handleRegister(HttpServletRequest request, HttpServletResponse response, DB db, JSONObject json) 
            throws IOException, SQLException {
        if (!json.has("nombre") || !json.has("email") || !json.has("password")) {
            HttpUtils.sendErrorResponse(response, "Name, email and password required", HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        String nombre = json.getString("nombre");
        String email = json.getString("email");
        String password = json.getString("password");
        
        boolean registrado = db.registrarUsuario(nombre, email, password);
        if (!registrado) {
            HttpUtils.sendErrorResponse(response, "Email already registered", HttpServletResponse.SC_CONFLICT);
            return;
        }

        Map<String, Object> usuario = db.autenticarUsuario(email, password);
        String jwt = generateJWT(usuario);
        
        Cookie jwtCookie = new Cookie("jwt", jwt);
        jwtCookie.setHttpOnly(true);
        jwtCookie.setSecure(request.isSecure());
        jwtCookie.setPath("/");
        jwtCookie.setMaxAge((int) (EXPIRATION_TIME / 1000));
        response.addCookie(jwtCookie);

        JSONObject responseJson = new JSONObject()
            .put("user", new JSONObject(usuario))
            .put("token", jwt)
            .put("message", "User registered successfully");
        
        HttpUtils.sendJsonResponse(response, responseJson, HttpServletResponse.SC_CREATED);
    }

    private void verifyToken(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String token = extractToken(request);
        
        if (token == null) {
            HttpUtils.sendErrorResponse(response, "No token provided", HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
        
        try {
            Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token);
            
            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().write(new JSONObject().put("valid", true).toString());
        } catch (Exception e) {
            HttpUtils.sendErrorResponse(response, "Invalid token", HttpServletResponse.SC_UNAUTHORIZED);
        }
    }

    private String extractToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (cookie.getName().equals("jwt")) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private String generateJWT(Map<String, Object> usuario) {
        return Jwts.builder()
            .setSubject(usuario.get("email").toString())
            .claim("id", usuario.get("id"))
            .claim("nombre", usuario.get("nombre"))
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
            .signWith(SECRET_KEY)
            .compact();
    }
    
    public static boolean verifyRequest(HttpServletRequest request) {
        try {
            String token = new AuthServlet().extractToken(request);
            if (token == null) return false;
            
            Claims claims = Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();
                
            request.setAttribute("userId", claims.get("id", Integer.class));
            request.setAttribute("userEmail", claims.getSubject());
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}