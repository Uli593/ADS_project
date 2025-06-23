package api;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.annotation.WebListener;
import java.sql.SQLException;
import java.util.logging.Level;
import java.util.logging.Logger;

@WebListener
public class DBInitializer implements ServletContextListener {
    private static final Logger LOGGER = Logger.getLogger(DBInitializer.class.getName());

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        LOGGER.info("[DBInit] Iniciando configuración de base de datos");
        
        DB db = null;
        try {
            // 1. Crear nueva instancia de DB
            db = createDatabaseInstance();
            
            // 2. Verificar conexión válida
            validateDatabaseConnection(db);
            
            // 3. Almacenar en contexto
            storeDatabaseInContext(sce, db);
            
            LOGGER.info("[DBInit] Configuración completada exitosamente");
            
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "[DBInit] Error crítico en inicialización", ex);
            cleanupDatabase(db);
            throw new IllegalStateException("Fallo en inicialización de BD", ex);
        }
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        LOGGER.info("[DBInit] Liberando recursos de base de datos");
        try {
            DB db = getDatabaseFromContext(sce);
            if (db != null) {
                cleanupDatabase(db);
            }
        } catch (Exception ex) {
            LOGGER.log(Level.WARNING, "[DBInit] Error al liberar recursos", ex);
        }
    }

    // ==================== MÉTODOS PRIVADOS ====================
    
    private DB createDatabaseInstance() {
        try {
            DB db = new DB();
            LOGGER.info("[DBInit] Instancia DB creada");
            return db;
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "[DBInit] Error al crear instancia DB", ex);
            throw new IllegalStateException("No se pudo crear instancia de DB", ex);
        }
    }
    
    private void validateDatabaseConnection(DB db) throws SQLException {
        if (db == null || db.getConnection() == null || db.getConnection().isClosed()) {
            LOGGER.severe("[DBInit] Conexión no válida");
            throw new SQLException("Conexión a BD no disponible");
        }
        LOGGER.info("[DBInit] Conexión validada exitosamente");
    }
    
    private void storeDatabaseInContext(ServletContextEvent sce, DB db) {
        ServletContext context = sce.getServletContext();
        context.setAttribute("db", db);
        LOGGER.info("[DBInit] DB almacenada en contexto de aplicación");
    }
    
    private DB getDatabaseFromContext(ServletContextEvent sce) {
        try {
            return (DB) sce.getServletContext().getAttribute("db");
        } catch (Exception ex) {
            LOGGER.log(Level.WARNING, "[DBInit] Error al obtener DB del contexto", ex);
            return null;
        }
    }
    
    private void cleanupDatabase(DB db) {
        if (db != null) {
            try {
                db.closeConnection();
                LOGGER.info("[DBInit] Conexión cerrada correctamente");
            } catch (Exception ex) {
                LOGGER.log(Level.WARNING, "[DBInit] Error al cerrar conexión", ex);
            }
        }
    }
}