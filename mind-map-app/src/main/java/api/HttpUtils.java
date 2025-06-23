package api;

import javax.servlet.http.*;
import java.io.*;
import org.json.JSONObject;
import org.json.JSONException;

public class HttpUtils {
    
    private static final String CONTENT_TYPE_JSON = "application/json";
    private static final String ENCODING_UTF8 = "UTF-8";
    
    /**
     * Parsea el cuerpo de una solicitud HTTP a un objeto JSON
     * @param request Objeto HttpServletRequest
     * @return JSONObject con los datos parseados
     * @throws IOException Si hay error al leer el cuerpo de la solicitud
     * @throws JSONException Si el cuerpo no es un JSON válido
     */
    public static JSONObject parseJsonRequest(HttpServletRequest request) throws IOException, JSONException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = request.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        
        if (sb.length() == 0) {
            throw new JSONException("Empty request body");
        }
        
        return new JSONObject(sb.toString());
    }
    
    /**
     * Envía una respuesta JSON con un código de estado HTTP
     * @param response Objeto HttpServletResponse
     * @param data Datos a enviar (puede ser JSONObject o JSONArray)
     * @param status Código de estado HTTP
     * @throws IOException Si hay error al escribir la respuesta
     */
    public static void sendJsonResponse(HttpServletResponse response, Object data, int status) throws IOException {
        setBaseHeaders(response);
        response.setStatus(status);
        
        try (PrintWriter out = response.getWriter()) {
            out.print(data.toString());
        }
    }
    
    /**
     * Envía una respuesta de error en formato JSON
     * @param response Objeto HttpServletResponse
     * @param message Mensaje de error
     * @param status Código de estado HTTP
     * @throws IOException Si hay error al escribir la respuesta
     */
    public static void sendErrorResponse(HttpServletResponse response, String message, int status) throws IOException {
        JSONObject error = new JSONObject();
        error.put("error", message);
        error.put("status", status);
        
        sendJsonResponse(response, error, status);
    }
    
    /**
     * Envía una respuesta de éxito estándar
     * @param response Objeto HttpServletResponse
     * @param message Mensaje de éxito
     * @throws IOException Si hay error al escribir la respuesta
     */
    public static void sendSuccessResponse(HttpServletResponse response, String message) throws IOException {
        JSONObject success = new JSONObject();
        success.put("message", message);
        success.put("success", true);
        
        sendJsonResponse(response, success, HttpServletResponse.SC_OK);
    }
    
    /**
     * Configura los headers base para respuestas JSON
     * @param response Objeto HttpServletResponse
     */
    private static void setBaseHeaders(HttpServletResponse response) {
        response.setContentType(CONTENT_TYPE_JSON);
        response.setCharacterEncoding(ENCODING_UTF8);
        response.setHeader("X-Content-Type-Options", "nosniff");
    }
    
    /**
     * Configura headers CORS para respuestas
     * @param request Objeto HttpServletRequest
     * @param response Objeto HttpServletResponse
     */
    public static void setCorsHeaders(HttpServletRequest request, HttpServletResponse response) {
        String origin = request.getHeader("Origin");
        if (origin != null && origin.matches("https?://localhost(:\\d+)?") || origin.contains("yourdomain.com")) {
            response.setHeader("Access-Control-Allow-Origin", origin);
        }
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        response.setHeader("Access-Control-Max-Age", "3600");
    }
}