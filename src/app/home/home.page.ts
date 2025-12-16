import { Component } from '@angular/core';
import { IonicModule, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Network } from '@capacitor/network';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, HttpClientModule],
})
export class HomePage {
  ticketInput = '';
  botonDeshabilitado = false;
  // Endpoint actualizado: Usa la ruta de canje de pavo
  apiUrl = 'https://mobileqa.liris.com.ec/delportal/wp-json/delportal/v1/Navidad_Pavos_Canje';

  constructor(private http: HttpClient, private alertCtrl: AlertController) {}

  // =============================
  // Validar código de barras solo online
  // =============================
  async validarTicket() {
    if (this.botonDeshabilitado) return;
    this.botonDeshabilitado = true;

    const codigo_barras = this.ticketInput.trim();

    if (!codigo_barras) {
      await this.mostrarAlerta('Atención', 'Por favor escanea o ingresa un código de barras.', 'warning');
      this.botonDeshabilitado = false;
      return;
    }

    try {
      // 1. ELIMINAMOS el parsing complejo (partes.split)
      // 2. Definimos el payload con el único parámetro que la nueva API espera: 'codigo_barras'
      const payload = { 
        codigo_barras: codigo_barras 
      };

      const status = await Network.getStatus();
      if (!status.connected) {
        await this.mostrarAlerta('Sin conexión', 'Necesitas internet para validar códigos.', 'danger');
      } else {
        await this.validarOnline(payload);
      }
    } catch (err) {
      console.error('Error validando código de barras:', err);
      await this.mostrarAlerta('Error', 'Ocurrió un error al validar el código.', 'danger');
    }

    this.botonDeshabilitado = false;
    this.ticketInput = '';
  }

  // =============================
  // Validación en servidor WP
  // =============================
  async validarOnline(payload: any) {
    try {
      // Usamos POST para la acción de canje
      const response: any = await this.http.post(this.apiUrl, payload).toPromise(); 
      
      // La lógica de respuesta de la API ya está configurada para devolver {success: true/false, message: ...}
      
      if (response.success) {
        // Muestra el mensaje de éxito (incluye "Canje exitoso" o el título del XML)
        await this.mostrarAlerta('Canje Exitoso', response.message || 'Pavo canjeado correctamente.', 'success');
      } else {
        // Muestra el mensaje de error (incluye "Código ya canjeado" o "Código no válido")
        await this.mostrarAlerta('Canje Fallido', response.message || 'Error desconocido al procesar el canje.', 'danger');
      }
    } catch (err: any) {
      console.error('Error conectando con API:', err);
      // Muestra el mensaje si la conexión HTTP falló completamente
      await this.mostrarAlerta('Error de Conexión', 'No se pudo conectar con el servidor de canje.', 'danger');
    }
  }

  // =============================
  // Input lector QR
  // =============================
  onInputChange(event: any) {
    const valor = event.target.value?.trim();
    if (valor && (valor.endsWith('\n') || valor.endsWith('\r'))) {
      this.ticketInput = valor.replace(/[\n\r]+$/, '');
      this.validarTicket();
    }
  }

  // =============================
  // Alertas visuales
  // =============================
  async mostrarAlerta(titulo: string, mensaje: string, tipo: 'success' | 'danger' | 'warning') {
    const alert = await this.alertCtrl.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK'],
      mode: 'ios',
      // Opcional: podrías cambiar el color/estilo de la alerta basado en 'tipo' si tu CSS lo permite
    });
    await alert.present();
  }
}