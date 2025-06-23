package api;

import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;
import java.io.IOException;
import java.util.Map;
import org.json.JSONObject;

@WebServlet("/api/users/*")
public class UserServlet extends HttpServlet {
    
    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response) {
        HttpUtils.setCorsHeaders(request, response);
        response.setStatus(HttpServletResponse.SC_OK);
    }
    
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        HttpUtils.setCorsHeaders(request, response);
        try {
            HttpSession session = request.getSession(false);
            if (session == null || session.getAttribute("usuario") == null) {
                HttpUtils.sendErrorResponse(response, "Unauthorized", HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
            
            @SuppressWarnings("unchecked")
            Map<String, Object> usuario = (Map<String, Object>) session.getAttribute("usuario");
            
            JSONObject userData = new JSONObject()
                .put("id", usuario.get("id"))
                .put("nombre", usuario.get("nombre"))
                .put("email", usuario.get("email"));
            
            HttpUtils.sendJsonResponse(response, userData, HttpServletResponse.SC_OK);
        } catch (Exception e) {
            HttpUtils.sendErrorResponse(response, "Error getting user data", HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
    
    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        HttpUtils.setCorsHeaders(request, response);
        try {
            HttpSession session = request.getSession(false);
            if (session == null || session.getAttribute("usuario") == null) {
                HttpUtils.sendErrorResponse(response, "Unauthorized", HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
            
            @SuppressWarnings("unchecked")
            Map<String, Object> usuario = (Map<String, Object>) session.getAttribute("usuario");
            
            JSONObject json = HttpUtils.parseJsonRequest(request);
            String newName = json.optString("nombre", null);
            String newPassword = json.optString("password", null);
            
            // Here you would typically update the user in the database
            // For now we'll just return success
            
            JSONObject responseJson = new JSONObject()
                .put("message", "User updated successfully");
            HttpUtils.sendJsonResponse(response, responseJson, HttpServletResponse.SC_OK);
        } catch (Exception e) {
            HttpUtils.sendErrorResponse(response, "Error updating user", HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}