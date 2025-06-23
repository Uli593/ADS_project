package api;

import java.io.IOException;
import java.io.Serializable;
import java.sql.*;
import java.util.*;
import java.util.logging.*;

public class DB implements Serializable {
    private static final Logger LOGGER = Logger.getLogger(DB.class.getName());
    
    // Configuración de conexión (hardcodeada)
    private final String url = "jdbc:mysql://localhost:3306/mapas_mentales?useSSL=false&serverTimezone=UTC";
    private final String driver = "com.mysql.cj.jdbc.Driver";
    private final String user = "root";
    private final String passwd = "1234";
    
    private transient Connection con;

    // ============ CONEXIÓN A BD ============
    
    /**
     * Constructor que inicializa la conexión automáticamente.
     * @throws RuntimeException Si falla la conexión.
     */
    public DB() {
        initializeConnection();
    }

    /**
     * Inicializa la conexión a la base de datos.
     * @throws RuntimeException Si el driver no se encuentra o hay error de conexión.
     */
    private void initializeConnection() {
        try {
            Class.forName(driver);
            this.con = DriverManager.getConnection(url, user, passwd);
            this.con.setAutoCommit(true);
            this.con.setTransactionIsolation(Connection.TRANSACTION_READ_COMMITTED);
            LOGGER.log(Level.INFO, "✅ Conexión establecida con éxito a: {0}", url);
        } catch (ClassNotFoundException e) {
            String errorMsg = "❌ Driver JDBC no encontrado: " + e.getMessage();
            LOGGER.log(Level.SEVERE, errorMsg, e);
            throw new RuntimeException(errorMsg, e);
        } catch (SQLException e) {
            String errorMsg = "❌ Error al conectar a la BD: " + e.getMessage();
            LOGGER.log(Level.SEVERE, errorMsg, e);
            throw new RuntimeException(errorMsg, e);
        }
    }

    /**
     * Verifica y reestablece la conexión si es necesario.
     * @throws SQLException Si falla la verificación.
     */
    private void checkConnection() throws SQLException {
        try {
            if (con == null || con.isClosed()) {
                LOGGER.warning("⚠️ La conexión estaba cerrada. Reconectando...");
                initializeConnection();
            }
        } catch (SQLException e) {
            String errorMsg = "❌ Error al verificar conexión: " + e.getMessage();
            LOGGER.log(Level.SEVERE, errorMsg, e);
            throw new SQLException(errorMsg, e);
        }
    }

    /**
     * Obtiene la conexión activa verificando primero su estado.
     * @return Connection activa.
     * @throws SQLException Si falla la conexión.
     */
    public Connection getConnection() throws SQLException {
        checkConnection();
        return con;
    }

    /**
     * Cierra la conexión con la base de datos.
     */
    public void closeConnection() {
        try {
            if (con != null && !con.isClosed()) {
                con.close();
                LOGGER.info("🔌 Conexión cerrada correctamente.");
            }
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "❌ Error al cerrar conexión: {0}", e.getMessage());
        }
    }

    // ============ MÉTODOS DE USUARIO ============

    /**
     * Registra un nuevo usuario en la base de datos.
     * @param nombre Nombre del usuario.
     * @param email Email del usuario.
     * @param passwordHash Contraseña hasheada.
     * @return true si se registró correctamente, false si falló.
     * @throws SQLException Si hay error en la consulta SQL.
     */
    public boolean registrarUsuario(String nombre, String email, String passwordHash) throws SQLException {
        String sql = "INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, nombre);
            stmt.setString(2, email);
            stmt.setString(3, passwordHash);
            
            int result = stmt.executeUpdate();
            if (result > 0) {
                LOGGER.log(Level.INFO, "👤 Usuario registrado: {0}", email);
                return true;
            }
            return false;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "❌ Error al registrar usuario - Email: {0}, Error: {1}", 
                new Object[]{email, e.getMessage()});
            throw e;
        }
    }

    /**
     * Autentica un usuario con email y contraseña hasheada.
     * @param email Email del usuario.
     * @param passwordHash Contraseña hasheada.
     * @return Mapa con datos del usuario (id, nombre, email) o null si falla.
     * @throws SQLException Si hay error en la consulta SQL.
     */
    public Map<String, Object> autenticarUsuario(String email, String passwordHash) throws SQLException {
        String sql = "SELECT id, nombre, email FROM usuarios WHERE email = ? AND password_hash = ?";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, email);
            stmt.setString(2, passwordHash);
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> usuario = new HashMap<>();
                    usuario.put("id", rs.getInt("id"));
                    usuario.put("nombre", rs.getString("nombre"));
                    usuario.put("email", rs.getString("email"));
                    LOGGER.log(Level.INFO, "🔑 Usuario autenticado: {0}", email);
                    return usuario;
                }
            }
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "❌ Error al autenticar usuario - Email: {0}, Error: {1}", 
                new Object[]{email, e.getMessage()});
            throw e;
        }
        LOGGER.log(Level.WARNING, "⚠️ Autenticación fallida para: {0}", email);
        return null;
    }

    /**
     * Actualiza los datos de un usuario.
     * @param usuarioId ID del usuario.
     * @param nuevoNombre Nuevo nombre.
     * @param nuevaPassword Nueva contraseña hasheada.
     * @return true si se actualizó, false si no.
     * @throws SQLException Si hay error en la consulta SQL.
     */
    public boolean actualizarUsuario(int usuarioId, String nuevoNombre, String nuevaPassword) throws SQLException {
        String sql = "UPDATE usuarios SET nombre = ?, password_hash = ? WHERE id = ?";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, nuevoNombre);
            stmt.setString(2, nuevaPassword);
            stmt.setInt(3, usuarioId);
            
            int result = stmt.executeUpdate();
            if (result > 0) {
                LOGGER.log(Level.INFO, "🔄 Usuario actualizado - ID: {0}", usuarioId);
                return true;
            }
            return false;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "❌ Error al actualizar usuario - ID: {0}, Error: {1}", 
                new Object[]{usuarioId, e.getMessage()});
            throw e;
        }
    }

    /**
     * Elimina un usuario de la base de datos.
     * @param usuarioId ID del usuario.
     * @return true si se eliminó, false si no.
     * @throws SQLException Si hay error en la consulta SQL.
     */
    public boolean eliminarUsuario(int usuarioId) throws SQLException {
        String sql = "DELETE FROM usuarios WHERE id = ?";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, usuarioId);
            
            int result = stmt.executeUpdate();
            if (result > 0) {
                LOGGER.log(Level.INFO, "🗑️ Usuario eliminado - ID: {0}", usuarioId);
                return true;
            }
            return false;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "❌ Error al eliminar usuario - ID: {0}, Error: {1}", 
                new Object[]{usuarioId, e.getMessage()});
            throw e;
        }
    }

    // ============ MÉTODOS DE MAPAS MENTALES ============

    /**
     * Guarda un nuevo mapa mental en la base de datos.
     * @param usuarioId ID del usuario.
     * @param titulo Título del mapa.
     * @param datosJson Datos en formato JSON.
     * @return ID del mapa creado o -1 si falla.
     * @throws SQLException Si hay error en la consulta SQL.
     */
    public int guardarMapaMental(int usuarioId, String titulo, String datosJson) throws SQLException {
        String sql = "INSERT INTO mapas_mentales (usuario_id, titulo, datos_json) VALUES (?, ?, ?)";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            
            stmt.setInt(1, usuarioId);
            stmt.setString(2, titulo);
            stmt.setString(3, datosJson);
            
            stmt.executeUpdate();
            
            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    int idGenerado = rs.getInt(1);
                    LOGGER.log(Level.INFO, "🗺️ Mapa mental creado - ID: {0}, Usuario: {1}", 
                        new Object[]{idGenerado, usuarioId});
                    return idGenerado;
                }
            }
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "❌ Error al guardar mapa mental - Usuario: {0}, Error: {1}", 
                new Object[]{usuarioId, e.getMessage()});
            throw e;
        }
        return -1;
    }

    /**
     * Actualiza un mapa mental existente.
     * @param mapaId ID del mapa.
     * @param usuarioId ID del usuario.
     * @param titulo Nuevo título.
     * @param datosJson Nuevos datos en JSON.
     * @return true si se actualizó, false si no.
     * @throws SQLException Si hay error en la consulta SQL.
     */
    public boolean actualizarMapaMental(int mapaId, int usuarioId, String titulo, String datosJson) throws SQLException {
        String sql = "UPDATE mapas_mentales SET titulo = ?, datos_json = ?, ultima_modificacion = CURRENT_TIMESTAMP WHERE id = ? AND usuario_id = ?";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setString(1, titulo);
            stmt.setString(2, datosJson);
            stmt.setInt(3, mapaId);
            stmt.setInt(4, usuarioId);
            
            int result = stmt.executeUpdate();
            if (result > 0) {
                LOGGER.log(Level.INFO, "🔄 Mapa actualizado - ID: {0}", mapaId);
                return true;
            }
            return false;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "❌ Error al actualizar mapa - ID: {0}, Error: {1}", 
                new Object[]{mapaId, e.getMessage()});
            throw e;
        }
    }

    /**
     * Elimina un mapa mental.
     * @param mapaId ID del mapa.
     * @param usuarioId ID del usuario.
     * @return true si se eliminó, false si no.
     * @throws SQLException Si hay error en la consulta SQL.
     */
    public boolean eliminarMapaMental(int mapaId, int usuarioId) throws SQLException {
        String sql = "DELETE FROM mapas_mentales WHERE id = ? AND usuario_id = ?";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, mapaId);
            stmt.setInt(2, usuarioId);
            
            int result = stmt.executeUpdate();
            if (result > 0) {
                LOGGER.log(Level.INFO, "🗑️ Mapa eliminado - ID: {0}", mapaId);
                return true;
            }
            return false;
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "❌ Error al eliminar mapa - ID: {0}, Error: {1}", 
                new Object[]{mapaId, e.getMessage()});
            throw e;
        }
    }

    /**
     * Obtiene todos los mapas de un usuario ordenados por fecha de modificación.
     * @param usuarioId ID del usuario.
     * @return Lista de mapas (id, titulo, datos_json, fechas).
     * @throws SQLException Si hay error en la consulta SQL.
     */
    public List<Map<String, Object>> obtenerMapasPorUsuario(int usuarioId) throws SQLException {
        List<Map<String, Object>> mapas = new ArrayList<>();
        String sql = "SELECT id, titulo, datos_json, fecha_creacion, ultima_modificacion " +
                     "FROM mapas_mentales WHERE usuario_id = ? ORDER BY ultima_modificacion DESC";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, usuarioId);
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> mapa = new HashMap<>();
                    mapa.put("id", rs.getInt("id"));
                    mapa.put("titulo", rs.getString("titulo"));
                    mapa.put("datos_json", rs.getString("datos_json"));
                    mapa.put("fecha_creacion", rs.getTimestamp("fecha_creacion"));
                    mapa.put("ultima_modificacion", rs.getTimestamp("ultima_modificacion"));
                    mapas.add(mapa);
                }
            }
            LOGGER.log(Level.INFO, "📂 Obtenidos {0} mapas para usuario ID: {1}", 
                new Object[]{mapas.size(), usuarioId});
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "❌ Error al obtener mapas - Usuario: {0}, Error: {1}", 
                new Object[]{usuarioId, e.getMessage()});
            throw e;
        }
        return mapas;
    }

    /**
     * Obtiene un mapa específico de un usuario.
     * @param mapaId ID del mapa.
     * @param usuarioId ID del usuario.
     * @return Mapa con datos (id, titulo, datos_json, fechas) o null si no existe.
     * @throws SQLException Si hay error en la consulta SQL.
     */
    public Map<String, Object> obtenerMapa(int mapaId, int usuarioId) throws SQLException {
        String sql = "SELECT id, titulo, datos_json, fecha_creacion, ultima_modificacion " +
                     "FROM mapas_mentales WHERE id = ? AND usuario_id = ?";
        
        try (Connection conn = getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, mapaId);
            stmt.setInt(2, usuarioId);
            
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    Map<String, Object> mapa = new HashMap<>();
                    mapa.put("id", rs.getInt("id"));
                    mapa.put("titulo", rs.getString("titulo"));
                    mapa.put("datos_json", rs.getString("datos_json"));
                    mapa.put("fecha_creacion", rs.getTimestamp("fecha_creacion"));
                    mapa.put("ultima_modificacion", rs.getTimestamp("ultima_modificacion"));
                    LOGGER.log(Level.INFO, "📄 Mapa obtenido - ID: {0}", mapaId);
                    return mapa;
                }
            }
        } catch (SQLException e) {
            LOGGER.log(Level.SEVERE, "❌ Error al obtener mapa - ID: {0}, Error: {1}", 
                new Object[]{mapaId, e.getMessage()});
            throw e;
        }
        LOGGER.log(Level.WARNING, "⚠️ Mapa no encontrado - ID: {0}", mapaId);
        return null;
    }

}