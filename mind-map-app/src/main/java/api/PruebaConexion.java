package api;

import java.sql.Connection;
import java.sql.DriverManager;

public class PruebaConexion {
    public static void main(String[] args) {
        String url = "jdbc:mysql://localhost:3306/mapas_mentales?useSSL=false&serverTimezone=UTC";
        String user = "root";
        String password = "1234";

        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection con = DriverManager.getConnection(url, user, password);
            System.out.println("✅ Conexión exitosa a MySQL.");
            con.close();
        } catch (Exception e) {
            System.out.println("❌ Fallo de conexión:");
            e.printStackTrace();
        }
    }
}
