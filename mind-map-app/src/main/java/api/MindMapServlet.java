package api;

import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;
import java.io.IOException;
import org.json.JSONObject;
import java.util.List;
import java.util.Map;
import java.sql.Timestamp;
import io.jsonwebtoken.Claims;

@WebServlet("/api/mindmaps/*")
public class MindMapServlet extends HttpServlet {
    
    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setStatus(HttpServletResponse.SC_OK);
    }
    
    private boolean handleAuthorization(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (!AuthServlet.verifyRequest(request)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write(new JSONObject()
                .put("error", "Unauthorized")
                .put("message", "Invalid or expired token")
                .toString());
            return false;
        }
        return true;
    }
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        HttpUtils.setCorsHeaders(request, response);
        try {
            if (!handleAuthorization(request, response)) return;
            
            int userId = (int) request.getAttribute("userId");
            DB db = (DB) getServletContext().getAttribute("db");
            String pathInfo = request.getPathInfo();
            
            if (pathInfo == null || pathInfo.equals("/")) {
                List<Map<String, Object>> mapas = db.obtenerMapasPorUsuario(userId);
                
                JSONObject responseJson = new JSONObject();
                for (Map<String, Object> mapa : mapas) {
                    mapa.put("fecha_creacion", ((Timestamp)mapa.get("fecha_creacion")).toString());
                    mapa.put("ultima_modificacion", ((Timestamp)mapa.get("ultima_modificacion")).toString());
                }
                responseJson.put("mapas", mapas);
                
                HttpUtils.sendJsonResponse(response, responseJson, HttpServletResponse.SC_OK);
            } else if (pathInfo.equals("/all")) {
                // Endpoint modificado para incluir userId
                List<Map<String, Object>> todosMapas = db.obtenerMapasPorUsuario(userId);
                
                JSONObject responseJson = new JSONObject();
                for (Map<String, Object> mapa : todosMapas) {
                    mapa.put("fecha_creacion", ((Timestamp)mapa.get("fecha_creacion")).toString());
                    mapa.put("ultima_modificacion", ((Timestamp)mapa.get("ultima_modificacion")).toString());
                }
                responseJson.put("mapas", todosMapas);
                
                HttpUtils.sendJsonResponse(response, responseJson, HttpServletResponse.SC_OK);
            } else {
                int mapaId = Integer.parseInt(pathInfo.substring(1));
                Map<String, Object> mapa = db.obtenerMapa(mapaId, userId);
                
                if (mapa != null) {
                    mapa.put("fecha_creacion", ((Timestamp)mapa.get("fecha_creacion")).toString());
                    mapa.put("ultima_modificacion", ((Timestamp)mapa.get("ultima_modificacion")).toString());
                    
                    HttpUtils.sendJsonResponse(response, new JSONObject(mapa), HttpServletResponse.SC_OK);
                } else {
                    HttpUtils.sendErrorResponse(response, "Map not found", HttpServletResponse.SC_NOT_FOUND);
                }
            }
        } catch (NumberFormatException e) {
            HttpUtils.sendErrorResponse(response, "Invalid map ID", HttpServletResponse.SC_BAD_REQUEST);
        } catch (Exception e) {
            HttpUtils.sendErrorResponse(response, "Error retrieving maps", HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        HttpUtils.setCorsHeaders(request, response);
        try {
            if (!handleAuthorization(request, response)) return;
            
            int userId = (int) request.getAttribute("userId");
            JSONObject json = HttpUtils.parseJsonRequest(request);
            String titulo = json.getString("titulo");
            String datosJson = json.getString("datos_json");
            
            if (titulo == null || titulo.trim().isEmpty() || titulo.length() > 255) {
                HttpUtils.sendErrorResponse(response, "Title must be between 1 and 255 characters", 
                                          HttpServletResponse.SC_BAD_REQUEST);
                return;
            }
            
            try {
                new JSONObject(datosJson);
            } catch (Exception e) {
                HttpUtils.sendErrorResponse(response, "Invalid JSON data", HttpServletResponse.SC_BAD_REQUEST);
                return;
            }
            
            DB db = (DB) getServletContext().getAttribute("db");
            int mapaId = db.guardarMapaMental(userId, titulo, datosJson);
            Map<String, Object> nuevoMapa = db.obtenerMapa(mapaId, userId);
            
            JSONObject responseJson = new JSONObject()
                .put("id", mapaId)
                .put("usuario_id", userId)
                .put("titulo", titulo)
                .put("fecha_creacion", ((Timestamp)nuevoMapa.get("fecha_creacion")).toString())
                .put("ultima_modificacion", ((Timestamp)nuevoMapa.get("ultima_modificacion")).toString())
                .put("message", "Map created successfully");
                
            HttpUtils.sendJsonResponse(response, responseJson, HttpServletResponse.SC_CREATED);
        } catch (Exception e) {
            HttpUtils.sendErrorResponse(response, "Error creating map: " + e.getMessage(), 
                                      HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
    
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        HttpUtils.setCorsHeaders(request, response);
        try {
            if (!handleAuthorization(request, response)) return;

            int userId = (int) request.getAttribute("userId");
            JSONObject json = HttpUtils.parseJsonRequest(request);

            // Validar que el ID esté presente
            if (!json.has("id")) {
                HttpUtils.sendErrorResponse(response, "Map ID is required for update", 
                                          HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            int mapaId = json.getInt("id");
            String titulo = json.getString("titulo");
            String datosJson = json.getString("datos_json");

            // Validaciones adicionales
            if (titulo == null || titulo.trim().isEmpty() || titulo.length() > 255) {
                HttpUtils.sendErrorResponse(response, "Title must be between 1 and 255 characters", 
                                          HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            try {
                // Validar que datos_json sea JSON válido
                new JSONObject(datosJson);
            } catch (Exception e) {
                HttpUtils.sendErrorResponse(response, "Invalid JSON data", HttpServletResponse.SC_BAD_REQUEST);
                return;
            }

            DB db = (DB) getServletContext().getAttribute("db");
            boolean actualizado = db.actualizarMapaMental(mapaId, userId, titulo, datosJson);

            if (actualizado) {
                Map<String, Object> mapaActualizado = db.obtenerMapa(mapaId, userId);

                JSONObject responseJson = new JSONObject()
                    .put("id", mapaId)
                    .put("usuario_id", userId)
                    .put("titulo", titulo)
                    .put("ultima_modificacion", ((Timestamp)mapaActualizado.get("ultima_modificacion")).toString())
                    .put("message", "Map updated successfully");

                HttpUtils.sendJsonResponse(response, responseJson, HttpServletResponse.SC_OK);
            } else {
                HttpUtils.sendErrorResponse(response, "Map not found or not owned by user", 
                                          HttpServletResponse.SC_NOT_FOUND);
            }
        } catch (Exception e) {
            // Mejor logging del error
            HttpUtils.sendErrorResponse(response, "Error updating map: " + e.getMessage(), 
                                      HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
    
    @Override
    protected void doDelete(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        HttpUtils.setCorsHeaders(request, response);
        try {
            if (!handleAuthorization(request, response)) return;
            
            int userId = (int) request.getAttribute("userId");
            String pathInfo = request.getPathInfo();
            
            if (pathInfo == null || pathInfo.equals("/")) {
                HttpUtils.sendErrorResponse(response, "Map ID required", HttpServletResponse.SC_BAD_REQUEST);
                return;
            }
            
            int mapaId = Integer.parseInt(pathInfo.substring(1));
            DB db = (DB) getServletContext().getAttribute("db");
            boolean eliminado = db.eliminarMapaMental(mapaId, userId);
            
            if (eliminado) {
                JSONObject responseJson = new JSONObject()
                    .put("id", mapaId)
                    .put("message", "Map deleted successfully");
                HttpUtils.sendJsonResponse(response, responseJson, HttpServletResponse.SC_OK);
            } else {
                HttpUtils.sendErrorResponse(response, "Map not found or not owned by user", 
                                          HttpServletResponse.SC_NOT_FOUND);
            }
        } catch (NumberFormatException e) {
            HttpUtils.sendErrorResponse(response, "Invalid map ID", HttpServletResponse.SC_BAD_REQUEST);
        } catch (Exception e) {
            HttpUtils.sendErrorResponse(response, "Error deleting map", HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}