import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;
  private readonly fromAddress: string;

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = Number(this.configService.get<string>('SMTP_PORT', '587'));
    const user = this.configService.get<string>('SMTP_USER', '').trim();
    const pass = this.configService.get<string>('SMTP_PASS', '').trim();
    this.fromAddress = this.configService.get<string>(
      'SMTP_FROM',
      'AutoPart Pro Pasto <no-reply@autopartpro.co>',
    );

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.isConfigured = true;
      this.logger.log(`Servicio de correo SMTP configurado (${host}:${port} - ${user})`);
    } else {
      this.logger.warn(
        'Credenciales SMTP_USER / SMTP_PASS vacías en .env — Modo Resiliente Local activo (los correos y códigos OTP se mostrarán en consola).',
      );
    }
  }

  public isSmtpActive(): boolean {
    return this.isConfigured;
  }

  /**
   * Envía correo de bienvenida al registrarse en la plataforma
   */
  async sendWelcomeEmail(to: string, fullName: string): Promise<boolean> {
    const subject = '¡Bienvenido a AutoPart Pro Pasto! Tu cuenta está activa';
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: #0b1329; padding: 28px 32px; color: #ffffff;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #f97316; font-weight: 700; margin-bottom: 6px;">
            RED AUTOMOTRIZ DE PASTO, NARIÑO
          </div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800;">¡Bienvenido a AutoPart Pro, ${fullName}!</h1>
        </div>
        <div style="padding: 28px 32px; color: #334155; line-height: 1.6; font-size: 14px;">
          <p>Tu cuenta ha sido creada y vinculada exitosamente con el correo <strong>${to}</strong>.</p>
          <p>Con tu cuenta ahora puedes:</p>
          <ul style="padding-left: 20px; color: #1e293b;">
            <li>Buscar repuestos por marca, modelo, año o referencia OEM en almacenes reales de Pasto.</li>
            <li>Comparar repuestos lado a lado con precios COP y stock en mostrador.</li>
            <li>Reservar piezas con retiro en sede (Click &amp; Collect) o contactar por WhatsApp directo.</li>
            <li>Activar tu propio almacén en el Panel de Inventario si vendes autopartes en Pasto.</li>
          </ul>
          <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
            Si algún día olvidas tu contraseña, podrás recuperarla fácilmente usando este correo electrónico.
          </div>
        </div>
      </div>
    `;

    if (!this.isConfigured || !this.transporter) {
      this.logger.log(`📧 [BIENVENIDA LOCAL] Para: ${to} | Nombre: ${fullName}`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
      });
      this.logger.log(`✅ Correo de bienvenida enviado a ${to}`);
      return true;
    } catch (error) {
      this.logger.warn(`⚠️ No se pudo enviar correo SMTP de bienvenida a ${to}: ${(error as Error).message}`);
      return false;
    }
  }

  /**
   * Envía correo con código OTP de 6 dígitos para recuperación de contraseña
   */
  async sendPasswordResetEmail(to: string, fullName: string, otpCode: string): Promise<boolean> {
    const subject = `${otpCode} es tu código de recuperación de contraseña — AutoPart Pro`;
    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: #0b1329; padding: 28px 32px; color: #ffffff;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #f97316; font-weight: 700; margin-bottom: 6px;">
            SEGURIDAD Y ACCESO • AUTOPART PRO PASTO
          </div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Recuperación de Contraseña</h1>
        </div>
        <div style="padding: 28px 32px; color: #334155; line-height: 1.6; font-size: 14px;">
          <p>Hola <strong>${fullName}</strong>,</p>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta asociada a <strong>${to}</strong>.</p>
          <p>Ingresa el siguiente código de verificación de 6 dígitos en la pantalla de recuperación:</p>
          
          <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; text-align: center;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 6px; font-weight: 700;">
              CÓDIGO DE VERIFICACIÓN (VÁLIDO POR 15 MINUTOS)
            </div>
            <div style="font-family: monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #0b1329;">
              ${otpCode}
            </div>
          </div>

          <p style="font-size: 13px; color: #64748b;">
            Si tú no solicitaste este cambio, puedes ignorar este mensaje de forma segura. Tu contraseña actual seguirá funcionando sin cambios.
          </p>
        </div>
      </div>
    `;

    // Siempre mostrar en consola de desarrollo para facilitar pruebas
    this.logger.log(
      `\n============================================================\n` +
      `🔐 CÓDIGO DE RECUPERACIÓN DE CONTRASEÑA\n` +
      `📧 Usuario: ${to} (${fullName})\n` +
      `🔢 Código OTP (6 dígitos): ${otpCode}\n` +
      `⏱️ Validez: 15 minutos\n` +
      `============================================================`,
    );

    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
      });
      this.logger.log(`✅ Correo de recuperación enviado por SMTP a ${to}`);
      return true;
    } catch (error) {
      this.logger.warn(`⚠️ Falló envío SMTP a ${to} (usando código en consola): ${(error as Error).message}`);
      return false;
    }
  }
}
