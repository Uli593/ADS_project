package api;

import javax.servlet.*;
import javax.servlet.http.*;
import javax.servlet.annotation.*;
import java.io.IOException;
import org.json.JSONObject;

@WebServlet("/api/logout")
public class LogoutServlet extends HttpServlet {
    
    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response) {
        HttpUtils.setCorsHeaders(request, response);
        response.setStatus(HttpServletResponse.SC_OK);
    }
    
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        HttpUtils.setCorsHeaders(request, response);
        
        try {
            // 1. Invalidar la sesión (si estás usando sesiones)
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            
            // 2. Eliminar la cookie JWT
            Cookie jwtCookie = new Cookie("jwt", null);
            jwtCookie.setHttpOnly(true);
            jwtCookie.setSecure(request.isSecure());
            jwtCookie.setPath("/");
            jwtCookie.setMaxAge(0); // Eliminar la cookie
            response.addCookie(jwtCookie);
            
            // 3. Opcional: Invalidar el token JWT en una blacklist si es necesario
            
            // 4. Enviar respuesta
            JSONObject responseJson = new JSONObject()
                .put("message", "Logged out successfully");
            HttpUtils.sendJsonResponse(response, responseJson, HttpServletResponse.SC_OK);
            
        } catch (Exception e) {
            HttpUtils.sendErrorResponse(response, "Logout failed", HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}